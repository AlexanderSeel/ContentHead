import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { SignOptions } from 'jsonwebtoken';
import { graphql } from 'graphql';

import { InternalAuthProvider } from '../auth/InternalAuthProvider.js';
import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';
import { schema } from '../graphql/schema.js';
import { ensureBaselineConnectors } from '../connectors/service.js';
import { ensureBaselineSecurity, setUserRoles } from '../security/service.js';
import { ensureUserHasRole } from '../security/permissionEvaluator.js';

async function main() {
  const baseDir = resolve('.data', 'test-connector-permissions', `${Date.now()}`);
  const dbPath = resolve(baseDir, 'connectors.duckdb');
  await mkdir(baseDir, { recursive: true });

  const db = await DuckDbClient.create(dbPath);
  await runMigrations(db);
  await ensureBaselineConnectors(db);
  await ensureBaselineSecurity(db);

  const auth = new InternalAuthProvider(db, 'test-secret', '7d' as NonNullable<SignOptions['expiresIn']>);
  const admin = await auth.createUser({ username: 'admin', password: 'admin123!', displayName: 'Admin' });
  await ensureUserHasRole(db, admin.id, 'admin');

  const adminList = await graphql({
    schema,
    source: 'query { listConnectors(domain:"db") { id domain type name } }',
    contextValue: { db, auth, currentUser: admin }
  });
  assert.equal(adminList.errors, undefined, JSON.stringify(adminList.errors));

  const editor = await auth.createUser({ username: 'editor', password: 'editor123!', displayName: 'Editor' });
  const editorRole = await db.get<{ id: number }>("SELECT id FROM roles WHERE lower(name) = 'editor'");
  assert.ok(editorRole?.id);
  await setUserRoles(db, editor.id, [editorRole!.id]);

  const deniedQuery = await graphql({
    schema,
    source: 'query { listConnectors(domain:"db") { id } }',
    contextValue: { db, auth, currentUser: editor }
  });
  assert.ok(deniedQuery.errors && deniedQuery.errors.length > 0);
  assert.equal(deniedQuery.errors?.[0]?.extensions?.code, 'FORBIDDEN');

  const deniedMutation = await graphql({
    schema,
    source: 'mutation { testConnector(id:1) }',
    contextValue: { db, auth, currentUser: editor }
  });
  assert.ok(deniedMutation.errors && deniedMutation.errors.length > 0);
  assert.equal(deniedMutation.errors?.[0]?.extensions?.code, 'FORBIDDEN');

  await db.close();
  console.log('connectorPermissions.integration ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
