import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { SignOptions } from 'jsonwebtoken';
import { graphql } from 'graphql';

import { InternalAuthProvider } from '../auth/InternalAuthProvider.js';
import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';
import { schema } from '../graphql/schema.js';
import { ensureBaselineSecurity, setUserRoles } from '../security/service.js';
import { ensureUserHasRole } from '../security/permissionEvaluator.js';

async function execQuery(source: string, contextValue: Record<string, unknown>) {
  return graphql({ schema, source, contextValue });
}

async function main() {
  const baseDir = resolve('.data', 'test-security-seed', `${Date.now()}`);
  const dbPath = resolve(baseDir, 'security-seed.duckdb');
  await mkdir(baseDir, { recursive: true });

  const db = await DuckDbClient.create(dbPath);
  await runMigrations(db);
  await ensureBaselineSecurity(db);

  const auth = new InternalAuthProvider(db, 'test-secret', '7d' as NonNullable<SignOptions['expiresIn']>);

  const admin = await auth.createUser({ username: 'admin', password: 'admin123!', displayName: 'Admin' });
  await ensureUserHasRole(db, admin.id, 'admin');

  const devDiagnosticsResult = await execQuery(
    `query { devDiagnostics { roles permissions seedStatus { adminRoleExists adminPermissionCoverage adminUserHasRole } } }`,
    { db, auth, currentUser: admin }
  );
  assert.equal(devDiagnosticsResult.errors, undefined, 'devDiagnostics should resolve for admin');
  const diagnostics = (devDiagnosticsResult.data as any)?.devDiagnostics;
  assert.equal(diagnostics.seedStatus.adminRoleExists, true);
  assert.equal(diagnostics.seedStatus.adminPermissionCoverage, true);
  assert.equal(diagnostics.seedStatus.adminUserHasRole, true);
  assert.equal((diagnostics.roles as string[]).includes('admin'), true);

  const editor = await auth.createUser({ username: 'editor', password: 'editor123!', displayName: 'Editor' });
  const editorRole = await db.get<{ id: number }>("SELECT id FROM roles WHERE lower(name) = 'editor'");
  assert.ok(editorRole?.id, 'editor role should exist');
  await setUserRoles(db, editor.id, [editorRole.id]);

  const dbAdminResult = await execQuery(`query { dbAdminTables(dangerMode:false) { name } }`, {
    db,
    auth,
    currentUser: editor
  });
  assert.ok(dbAdminResult.errors && dbAdminResult.errors.length > 0, 'editor should not have DB admin access');
  assert.equal(dbAdminResult.errors?.[0]?.extensions?.code, 'FORBIDDEN');

  const securityAdminResult = await execQuery(`query { listInternalUsers { id username } }`, {
    db,
    auth,
    currentUser: editor
  });
  assert.ok(securityAdminResult.errors && securityAdminResult.errors.length > 0, 'editor should not access security admin');
  assert.equal(securityAdminResult.errors?.[0]?.extensions?.code, 'FORBIDDEN');

  await db.close();
  console.log('securitySeed.integration ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
