import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { SignOptions } from 'jsonwebtoken';
import { graphql } from 'graphql';

import { InternalAuthProvider } from '../auth/InternalAuthProvider.js';
import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';
import { ensureBaselineSecurity, setUserRoles } from '../security/service.js';
import { ensureUserHasRole } from '../security/permissionEvaluator.js';
import { schema } from '../graphql/schema.js';

async function main() {
  const baseDir = resolve('.data', 'test-site-settings-permissions', `${Date.now()}`);
  const dbPath = resolve(baseDir, 'site-settings-permissions.duckdb');
  await mkdir(baseDir, { recursive: true });

  const db = await DuckDbClient.create(dbPath);
  await runMigrations(db);
  await ensureBaselineSecurity(db);

  const auth = new InternalAuthProvider(db, 'test-secret', '7d' as NonNullable<SignOptions['expiresIn']>);
  const admin = await auth.createUser({ username: 'admin', password: 'admin123!', displayName: 'Admin' });
  await ensureUserHasRole(db, admin.id, 'admin');

  const editor = await auth.createUser({ username: 'editor', password: 'editor123!', displayName: 'Editor' });
  const editorRole = await db.get<{ id: number }>("SELECT id FROM roles WHERE lower(name) = 'editor'");
  assert.ok(editorRole?.id);
  await setUserRoles(db, editor.id, [editorRole!.id]);

  const viewer = await auth.createUser({ username: 'viewer', password: 'viewer123!', displayName: 'Viewer' });


  const anonQuery = await graphql({
    schema,
    source: 'query { listSites { id name } }',
    contextValue: { db, auth, currentUser: null }
  });
  assert.ok(anonQuery.errors && anonQuery.errors.length > 0);
  assert.equal(anonQuery.errors?.[0]?.extensions?.code, 'UNAUTHORIZED');

  const editorQuery = await graphql({
    schema,
    source: 'query { listSites { id name } }',
    contextValue: { db, auth, currentUser: editor }
  });
  assert.equal(editorQuery.errors, undefined, JSON.stringify(editorQuery.errors));

  const anonMutation = await graphql({
    schema,
    source: 'mutation { setSiteName(siteId:1, name:"Anonymous") { id name } }',
    contextValue: { db, auth, currentUser: null }
  });
  assert.ok(anonMutation.errors && anonMutation.errors.length > 0);
  assert.equal(anonMutation.errors?.[0]?.extensions?.code, 'UNAUTHORIZED');

  const viewerMutation = await graphql({
    schema,
    source: 'mutation { upsertMarket(siteId:1, code:"CA", name:"Canada", active:true, isDefault:false) { code } }',
    contextValue: { db, auth, currentUser: viewer }
  });
  assert.ok(viewerMutation.errors && viewerMutation.errors.length > 0);
  assert.equal(viewerMutation.errors?.[0]?.extensions?.code, 'FORBIDDEN');

  const editorMutation = await graphql({
    schema,
    source: 'mutation { setSiteName(siteId:1, name:"Editor Updated") { id name } }',
    contextValue: { db, auth, currentUser: editor }
  });
  assert.equal(editorMutation.errors, undefined, JSON.stringify(editorMutation.errors));

  const adminMarketMutation = await graphql({
    schema,
    source: 'mutation { upsertMarket(siteId:1, code:"US", name:"United States", active:true, isDefault:true) { code active isDefault } }',
    contextValue: { db, auth, currentUser: admin }
  });
  assert.equal(adminMarketMutation.errors, undefined, JSON.stringify(adminMarketMutation.errors));

  await db.close();
  console.log('siteSettingsPermissions.integration ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
