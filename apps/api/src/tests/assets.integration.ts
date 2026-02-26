import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';

import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';
import { LocalFileStorageProvider } from '../assets/storage.js';
import {
  createAssetFromUpload,
  generateAssetRenditionFromPreset,
  getAsset,
  getAssetRenditionByPreset,
  listAssets,
  upsertAssetPois,
  upsertAssetRenditionPresets,
  updateAssetFocalPoint
} from '../assets/service.js';

async function main() {
  const baseDir = resolve('.data', 'test-assets', `${Date.now()}`);
  const dbPath = resolve(baseDir, 'contenthead-test.duckdb');
  const storagePath = resolve(baseDir, 'assets');
  await mkdir(baseDir, { recursive: true });

  const db = await DuckDbClient.create(dbPath);
  await runMigrations(db);

  const storage = new LocalFileStorageProvider(storagePath);
  const image = await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 3,
      background: '#4B5563'
    }
  })
    .png()
    .toBuffer();

  const hero = await createAssetFromUpload(db, storage, {
    siteId: 1,
    filename: 'demo-hero.png',
    originalName: 'demo-hero.png',
    mimeType: 'image/png',
    data: image,
    createdBy: 'test'
  });

  await createAssetFromUpload(db, storage, {
    siteId: 1,
    filename: 'demo-section.png',
    originalName: 'demo-section.png',
    mimeType: 'image/png',
    data: image,
    createdBy: 'test'
  });

  const list = await listAssets(db, { siteId: 1, limit: 10, offset: 0 });
  assert.ok(list.total >= 2, 'Expected at least two assets from demo seed');
  assert.ok(list.items.some((entry) => entry.filename === 'demo-hero.png'), 'Expected demo-hero.png in asset list');

  const fetched = await getAsset(db, hero.id);
  assert.ok(fetched, 'Expected getAsset to return a record');
  assert.equal(fetched.filename, 'demo-hero.png');
  assert.equal(fetched.originalName, 'demo-hero.png');
  assert.equal(fetched.mimeType, 'image/png');
  assert.ok(typeof fetched.bytes === 'number');

  await updateAssetFocalPoint(db, {
    assetId: hero.id,
    x: 0.2,
    y: 0.75,
    by: 'test'
  });
  const withFocal = await getAsset(db, hero.id);
  assert.ok(withFocal, 'Expected focal update to keep asset record');
  assert.ok(Math.abs((withFocal.focalX ?? 0) - 0.2) < 0.001, 'Expected focalX persisted');
  assert.ok(Math.abs((withFocal.focalY ?? 0) - 0.75) < 0.001, 'Expected focalY persisted');

  await upsertAssetPois(db, {
    assetId: hero.id,
    by: 'test',
    pois: [
      {
        id: 'poi-home',
        x: 0.6,
        y: 0.4,
        label: 'Homepage',
        visible: true,
        link: {
          kind: 'internal',
          contentItemId: 123,
          routeSlug: 'home',
          text: 'Go home',
          target: '_self'
        }
      }
    ]
  });

  await upsertAssetRenditionPresets(db, {
    assetId: hero.id,
    by: 'test',
    presets: [
      {
        id: 'hero-16-9',
        name: 'Hero 16:9',
        mode: 'cover',
        width: 1280,
        height: 720,
        quality: 80,
        format: 'webp',
        useFocalPoint: true
      }
    ]
  });

  const withImageMeta = await getAsset(db, hero.id);
  assert.ok(withImageMeta?.poisJson?.includes('poi-home'), 'Expected POIs JSON persisted');
  assert.ok(withImageMeta?.renditionPresetsJson?.includes('hero-16-9'), 'Expected presets JSON persisted');

  const generated = await generateAssetRenditionFromPreset(db, storage, {
    assetId: hero.id,
    presetId: 'hero-16-9'
  });
  assert.equal(generated.assetId, hero.id);
  assert.equal(generated.presetId, 'hero-16-9');
  assert.ok(generated.bytes > 0);

  const presetRendition = await getAssetRenditionByPreset(db, hero.id, 'hero-16-9');
  assert.ok(presetRendition, 'Expected preset rendition to be queryable');
  const rendered = await storage.read(generated.storagePath);
  assert.ok(rendered.byteLength > 0, 'Expected rendition file to be readable');

  await db.close();
  console.log('assets.integration ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
