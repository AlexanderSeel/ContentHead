import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';
import { createContentType, createContentItem, upsertRoute } from '../content/service.js';

async function main() {
  const baseDir = resolve('.data', 'test-route-upsert', `${Date.now()}`);
  const dbPath = resolve(baseDir, 'route-upsert.duckdb');
  await mkdir(baseDir, { recursive: true });
  const db = await DuckDbClient.create(dbPath);

  await runMigrations(db);
  await db.run("INSERT INTO markets(code, name, active) VALUES ('US', 'United States', TRUE)");
  await db.run("INSERT INTO locales(code, name, active) VALUES ('en-US', 'English (US)', TRUE)");
  await db.run("INSERT INTO site_markets(site_id, market_code, is_default, active) VALUES (1, 'US', TRUE, TRUE)");
  await db.run("INSERT INTO site_locales(site_id, locale_code, is_default, active) VALUES (1, 'en-US', TRUE, TRUE)");
  await db.run(
    "INSERT INTO site_market_locales(site_id, market_code, locale_code, active, is_default_for_market) VALUES (1, 'US', 'en-US', TRUE, TRUE)"
  );

  const type = await createContentType(db, {
    siteId: 1,
    name: 'RouteType',
    fieldsJson: '[]',
    allowedComponentsJson: '[]',
    componentAreaRestrictionsJson: '{}',
    by: 'test'
  });

  const item = await createContentItem(db, {
    siteId: 1,
    contentTypeId: type.id,
    by: 'test'
  });

  const first = await upsertRoute(db, {
    siteId: 1,
    contentItemId: item.id,
    marketCode: 'US',
    localeCode: 'en-US',
    slug: 'demo',
    isCanonical: true
  });

  const second = await upsertRoute(db, {
    siteId: 1,
    contentItemId: item.id,
    marketCode: 'US',
    localeCode: 'en-US',
    slug: 'demo',
    isCanonical: true
  });

  assert.equal(first.id, second.id, 'upsertRoute should reuse existing route for unique slug tuple');

  const count = await db.get<{ total: number }>(
    "SELECT COUNT(*) as total FROM content_routes WHERE site_id = 1 AND market_code = 'US' AND locale_code = 'en-US' AND slug = 'demo'"
  );
  assert.equal(Number(count?.total ?? 0), 1);

  await db.close();
  console.log('routeUpsert.integration ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
