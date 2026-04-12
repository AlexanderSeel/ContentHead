import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';
import { InternalAuthProvider } from '../auth/InternalAuthProvider.js';
import { ensureBaselineSecurity, setUserRoles } from '../security/service.js';
import { checkPermission } from '../security/permissionEvaluator.js';

async function main() {
  const baseDir = resolve('.data', 'test-permissions', `${Date.now()}`);
  const dbPath = resolve(baseDir, 'permissions.duckdb');
  await mkdir(baseDir, { recursive: true });

  const db = await DuckDbClient.create(dbPath);
  await runMigrations(db);
  await ensureBaselineSecurity(db);

  const auth = new InternalAuthProvider(db, 'test-secret', '1d');

  const seedAdmin = await auth.createUser({ username: 'admin', password: 'admin123!', displayName: 'Seed Admin' });
  const admin = await auth.createUser({ username: 'admin-user', password: 'admin123!', displayName: 'Admin User' });
  const editor = await auth.createUser({ username: 'editor-user', password: 'editor123!', displayName: 'Editor User' });

  const adminRole = await db.get<{ id: number }>("SELECT id FROM roles WHERE lower(name) = 'admin'");
  const editorRole = await db.get<{ id: number }>("SELECT id FROM roles WHERE lower(name) = 'editor'");
  assert.ok(adminRole?.id, 'admin role should exist');
  assert.ok(editorRole?.id, 'editor role should exist');

  await setUserRoles(db, admin.id, [adminRole.id]);
  await setUserRoles(db, editor.id, [editorRole.id]);

  const adminEval = await checkPermission(db, { userId: admin.id, action: 'SECURITY_MANAGE' });
  assert.equal(adminEval.allowed, true, 'admin role should always be allowed');

  const healedSeedAdminEval = await checkPermission(db, { userId: seedAdmin.id, action: 'CONTENT_READ' });
  assert.equal(healedSeedAdminEval.allowed, true, 'configured seed admin should self-heal missing admin role');
  assert.equal(healedSeedAdminEval.roles.includes('admin'), true, 'configured seed admin should resolve admin role');

  const healedRoleLink = await db.get<{ roleCount: number }>(
    `
SELECT COUNT(*) as roleCount
FROM user_roles ur
INNER JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = ? AND lower(r.name) = 'admin'
`,
    [seedAdmin.id]
  );
  assert.equal(Number(healedRoleLink?.roleCount ?? 0), 1, 'configured seed admin should be linked to admin role');

  const editorAllowed = await checkPermission(db, { userId: editor.id, action: 'CONTENT_READ' });
  assert.equal(editorAllowed.allowed, true, 'editor should retain CONTENT_READ');

  await db.run('INSERT INTO role_permissions(role_id, permission_key) VALUES (?, ?)', [editorRole.id, 'DENY:CONTENT_READ']);

  const editorDenied = await checkPermission(db, { userId: editor.id, action: 'CONTENT_READ' });
  assert.equal(editorDenied.allowed, false, 'explicit DENY should win over allow for non-admin');

  const dbFallback = await checkPermission(db, {
    userId: editor.id,
    action: 'DB_ADMIN',
    fallbackActions: ['DB_ADMIN_READ']
  });
  assert.equal(dbFallback.allowed, false, 'editor should not get DB admin access by fallback');

  await db.close();
  console.log('permissionEvaluator.integration ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
