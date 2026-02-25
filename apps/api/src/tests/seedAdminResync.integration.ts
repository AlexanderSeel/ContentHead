import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

import bcrypt from 'bcryptjs';

import { DuckDbClient } from '../db/DuckDbClient.js';

function runSeed(env: Record<string, string>): void {
  const result = spawnSync('pnpm', ['--filter', '@contenthead/api', 'seed'], {
    cwd: resolve(process.cwd(), '../..'),
    env: { ...process.env, ...env },
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    throw new Error(`seed failed: ${result.stderr || result.stdout}`);
  }
}

async function main() {
  const baseDir = resolve('.data', 'test-seed-resync', `${Date.now()}`);
  await mkdir(baseDir, { recursive: true });
  const dbPath = resolve(baseDir, 'seed-resync.duckdb');
  const assetsPath = resolve(baseDir, 'assets');

  const commonEnv = {
    DB_PATH: dbPath,
    ASSETS_BASE_PATH: assetsPath,
    SEED_ADMIN_USERNAME: 'admin',
    SEED_ADMIN_DISPLAY_NAME: 'Administrator'
  };

  runSeed({ ...commonEnv, SEED_ADMIN_PASSWORD: 'first-pass-123!' });
  runSeed({ ...commonEnv, SEED_ADMIN_PASSWORD: 'second-pass-456!' });

  const db = await DuckDbClient.create(dbPath);
  const user = await db.get<{ passwordHash: string; active: boolean }>(
    'SELECT password_hash as passwordHash, COALESCE(active, TRUE) as active FROM users WHERE lower(username) = lower(?)',
    ['admin']
  );
  assert.ok(user, 'seed user should exist');
  assert.equal(user?.active, true);
  assert.equal(await bcrypt.compare('second-pass-456!', user?.passwordHash ?? ''), true, 'password should be updated');
  await db.close();

  console.log('seedAdminResync.integration ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
