import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';
import { LocalFileStorageProvider } from '../assets/storage.js';
import { createAssetFromUpload, getAsset, listAssets } from '../assets/service.js';

async function main() {
  const baseDir = resolve('.data', 'test-assets', `${Date.now()}`);
  const dbPath = resolve(baseDir, 'contenthead-test.duckdb');
  const storagePath = resolve(baseDir, 'assets');
  await mkdir(baseDir, { recursive: true });

  const db = await DuckDbClient.create(dbPath);
  await runMigrations(db);

  const storage = new LocalFileStorageProvider(storagePath);
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#4B5563"/></svg>`
  );

  const hero = await createAssetFromUpload(db, storage, {
    siteId: 1,
    filename: 'demo-hero.svg',
    originalName: 'demo-hero.svg',
    mimeType: 'image/svg+xml',
    data: svg,
    createdBy: 'test'
  });

  await createAssetFromUpload(db, storage, {
    siteId: 1,
    filename: 'demo-section.svg',
    originalName: 'demo-section.svg',
    mimeType: 'image/svg+xml',
    data: svg,
    createdBy: 'test'
  });

  const list = await listAssets(db, { siteId: 1, limit: 10, offset: 0 });
  assert.ok(list.total >= 2, 'Expected at least two assets from demo seed');
  assert.ok(list.items.some((entry) => entry.filename === 'demo-hero.svg'), 'Expected demo-hero.svg in asset list');

  const fetched = await getAsset(db, hero.id);
  assert.ok(fetched, 'Expected getAsset to return a record');
  assert.equal(fetched.filename, 'demo-hero.svg');
  assert.equal(fetched.originalName, 'demo-hero.svg');
  assert.equal(fetched.mimeType, 'image/svg+xml');
  assert.ok(typeof fetched.bytes === 'number');

  await db.close();
  console.log('assets.integration ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
