import { config } from '../config.js';
import { InternalAuthProvider } from '../auth/InternalAuthProvider.js';
import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';
import type { SignOptions } from 'jsonwebtoken';

async function main(): Promise<void> {
  const db = await DuckDbClient.create(config.dbPath);
  await runMigrations(db);

  const auth = new InternalAuthProvider(
    db,
    config.jwtSecret,
    config.jwtExpiresIn as NonNullable<SignOptions['expiresIn']>
  );
  const existing = await auth.validateCredentials(config.seedAdminUsername, config.seedAdminPassword);

  if (!existing) {
    await auth.createUser({
      username: config.seedAdminUsername,
      password: config.seedAdminPassword,
      displayName: config.seedAdminDisplayName
    });
    console.log(`Seeded admin user: ${config.seedAdminUsername}`);
  } else {
    console.log(`Seed user already exists: ${config.seedAdminUsername}`);
  }

  await db.run(
    `INSERT INTO markets(code, name, currency, timezone, active)
     SELECT 'US', 'United States', 'USD', 'America/New_York', TRUE
     WHERE NOT EXISTS (SELECT 1 FROM markets WHERE code = 'US')`
  );
  await db.run(
    `INSERT INTO locales(code, name, active, fallback_locale_code)
     SELECT 'en-US', 'English (US)', TRUE, NULL
     WHERE NOT EXISTS (SELECT 1 FROM locales WHERE code = 'en-US')`
  );
  await db.run(
    `INSERT INTO site_markets(site_id, market_code, is_default, active)
     SELECT 1, 'US', TRUE, TRUE
     WHERE NOT EXISTS (SELECT 1 FROM site_markets WHERE site_id = 1 AND market_code = 'US')`
  );
  await db.run(
    `INSERT INTO site_locales(site_id, locale_code, is_default, active)
     SELECT 1, 'en-US', TRUE, TRUE
     WHERE NOT EXISTS (SELECT 1 FROM site_locales WHERE site_id = 1 AND locale_code = 'en-US')`
  );
  await db.run(
    `INSERT INTO site_market_locales(site_id, market_code, locale_code, active, is_default_for_market)
     SELECT 1, 'US', 'en-US', TRUE, TRUE
     WHERE NOT EXISTS (
       SELECT 1 FROM site_market_locales WHERE site_id = 1 AND market_code = 'US' AND locale_code = 'en-US'
     )`
  );

  console.log('Seeded default site market/locale matrix (if missing).');
  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
