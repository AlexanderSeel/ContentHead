import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { SignOptions } from 'jsonwebtoken';

import { InternalAuthProvider } from '../auth/InternalAuthProvider.js';
import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';
import { dbAdminTables } from '../db/dbAdminService.js';
import { ensureBaselineSecurity } from '../security/service.js';

async function main() {
  const baseDir = resolve('.data', 'test-db-admin', `${Date.now()}`);
  const dbPath = resolve(baseDir, 'contenthead-db-admin-test.duckdb');
  await mkdir(baseDir, { recursive: true });

  const db = await DuckDbClient.create(dbPath);
  await runMigrations(db);
  await ensureBaselineSecurity(db);

  const auth = new InternalAuthProvider(db, 'test-secret', '7d' as NonNullable<SignOptions['expiresIn']>);
  await auth.createUser({
    username: 'admin',
    password: 'admin123!',
    displayName: 'Administrator'
  });

  const tables = await dbAdminTables(db, false);
  assert.ok(tables.length > 0, 'Expected dbAdminTables to return at least one table');

  const usersTable = tables.find((entry) => entry.name === 'users');
  assert.ok(usersTable, 'Expected users table to be present in dbAdminTables');
  assert.equal(usersTable.schema, 'main');
  assert.ok(usersTable.rowCount !== undefined, 'Expected rowCount metadata on main tables');

  await db.close();
  console.log('dbAdmin.integration ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
