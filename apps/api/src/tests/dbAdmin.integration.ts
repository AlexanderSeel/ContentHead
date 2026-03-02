import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { SignOptions } from 'jsonwebtoken';

import { InternalAuthProvider } from '../auth/InternalAuthProvider.js';
import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';
import { dbAdminResetSiteData, dbAdminTables } from '../db/dbAdminService.js';
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

  // Create inconsistent cross-site FK data (site 2 item points to site 1 content type).
  await db.run('INSERT INTO sites(id, name, active) VALUES (2, ?, TRUE)', ['Secondary Site']);
  await db.run(
    `INSERT INTO content_types(id, site_id, name, description, fields_json, created_by, updated_by)
     VALUES (1, 1, 'Landing', NULL, '{}', 'system', 'system')`
  );
  await db.run(
    `INSERT INTO content_items(
      id,
      site_id,
      content_type_id,
      parent_id,
      sort_order,
      archived,
      created_by
    ) VALUES (1, 2, 1, NULL, 0, FALSE, 'system')`
  );

  const resetResult = await dbAdminResetSiteData(db, 1);
  assert.equal(resetResult.siteId, 1, 'Expected reset to complete for site 1');

  const removedType = await db.get<{ total: number }>('SELECT COUNT(*)::INTEGER as total FROM content_types WHERE id = 1');
  assert.equal(removedType?.total ?? 0, 0, 'Expected site 1 content type to be deleted');

  const removedCrossSiteItem = await db.get<{ total: number }>(
    'SELECT COUNT(*)::INTEGER as total FROM content_items WHERE id = 1'
  );
  assert.equal(
    removedCrossSiteItem?.total ?? 0,
    0,
    'Expected inconsistent cross-site content item reference to be cleaned during reset'
  );

  // Create inconsistent form/step reference (site 2 field points to a site 1 step).
  await db.run(
    `INSERT INTO forms(id, site_id, name, description, active)
     VALUES (1, 1, 'Site1 Form', NULL, TRUE)`
  );
  await db.run(
    `INSERT INTO forms(id, site_id, name, description, active)
     VALUES (2, 2, 'Site2 Form', NULL, TRUE)`
  );
  await db.run(
    `INSERT INTO form_steps(id, form_id, name, position)
     VALUES (1, 1, 'Step A', 0)`
  );
  await db.run(
    `INSERT INTO form_fields(
      id,
      step_id,
      form_id,
      key,
      label,
      field_type,
      position,
      conditions_json,
      validations_json,
      ui_config_json,
      active
    ) VALUES (1, 1, 2, 'email', 'Email', 'text', 0, '{}', '{}', '{}', TRUE)`
  );

  const formsResetResult = await dbAdminResetSiteData(db, 1);
  assert.equal(formsResetResult.siteId, 1, 'Expected reset to complete for form cleanup case');

  const removedSite1Forms = await db.get<{ total: number }>(
    'SELECT COUNT(*)::INTEGER as total FROM forms WHERE site_id = 1'
  );
  assert.equal(removedSite1Forms?.total ?? 0, 0, 'Expected site 1 forms to be deleted');

  const removedSite1Steps = await db.get<{ total: number }>(
    'SELECT COUNT(*)::INTEGER as total FROM form_steps WHERE id = 1'
  );
  assert.equal(removedSite1Steps?.total ?? 0, 0, 'Expected site 1 form steps to be deleted');

  const removedCrossSiteField = await db.get<{ total: number }>(
    'SELECT COUNT(*)::INTEGER as total FROM form_fields WHERE id = 1'
  );
  assert.equal(
    removedCrossSiteField?.total ?? 0,
    0,
    'Expected inconsistent cross-site form field reference to be cleaned during reset'
  );

  // Asset + rendition cleanup should also survive DuckDB FK ordering constraints.
  await db.run(
    `INSERT INTO assets(
      id,
      site_id,
      filename,
      original_name,
      mime_type,
      bytes,
      width,
      height,
      storage_provider,
      storage_path,
      created_by,
      updated_by
    ) VALUES (1, 1, 'hero.png', 'hero.png', 'image/png', 1024, 100, 100, 'local', 'test/hero.png', 'system', 'system')`
  );
  await db.run(
    `INSERT INTO asset_renditions(
      id,
      asset_id,
      kind,
      width,
      height,
      fit_mode,
      storage_path,
      bytes
    ) VALUES (1, 1, 'thumb', 80, 80, 'cover', 'test/hero-thumb.png', 512)`
  );

  const assetsResetResult = await dbAdminResetSiteData(db, 1);
  assert.equal(assetsResetResult.siteId, 1, 'Expected reset to complete for asset cleanup case');

  const removedAssets = await db.get<{ total: number }>('SELECT COUNT(*)::INTEGER as total FROM assets WHERE site_id = 1');
  assert.equal(removedAssets?.total ?? 0, 0, 'Expected site 1 assets to be deleted');

  const removedRenditions = await db.get<{ total: number }>('SELECT COUNT(*)::INTEGER as total FROM asset_renditions WHERE id = 1');
  assert.equal(removedRenditions?.total ?? 0, 0, 'Expected asset renditions for removed assets to be deleted');

  // Composite FK cleanup: site_market_locales(site_id, locale_code) -> site_locales(site_id, locale_code).
  await db.run("INSERT INTO locales(code, name, active, fallback_locale_code) VALUES ('en-US', 'English (US)', TRUE, NULL)");
  await db.run("INSERT INTO markets(code, name, currency, timezone, active) VALUES ('US', 'United States', 'USD', 'America/New_York', TRUE)");
  await db.run("INSERT INTO site_locales(site_id, locale_code, is_default, active) VALUES (1, 'en-US', TRUE, TRUE)");
  await db.run("INSERT INTO site_markets(site_id, market_code, is_default, active) VALUES (1, 'US', TRUE, TRUE)");
  await db.run(
    "INSERT INTO site_market_locales(site_id, market_code, locale_code, active, is_default_for_market) VALUES (1, 'US', 'en-US', TRUE, TRUE)"
  );

  const localeResetResult = await dbAdminResetSiteData(db, 1);
  assert.equal(localeResetResult.siteId, 1, 'Expected reset to complete for locale/market cleanup case');

  const removedSiteLocales = await db.get<{ total: number }>(
    'SELECT COUNT(*)::INTEGER as total FROM site_locales WHERE site_id = 1'
  );
  assert.equal(removedSiteLocales?.total ?? 0, 0, 'Expected site 1 locales to be deleted');

  const removedSiteMarketLocales = await db.get<{ total: number }>(
    'SELECT COUNT(*)::INTEGER as total FROM site_market_locales WHERE site_id = 1'
  );
  assert.equal(removedSiteMarketLocales?.total ?? 0, 0, 'Expected site 1 site-market-locales to be deleted');

  await db.close();
  console.log('dbAdmin.integration ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
