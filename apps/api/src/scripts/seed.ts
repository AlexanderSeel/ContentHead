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

  const workflowGraph = JSON.stringify({
    nodes: [
      { id: 'n1', type: 'AI.GenerateContent', config: { prompt: 'Generate homepage content for demo' } },
      { id: 'n2', type: 'CreateDraftVersion', config: {} },
      { id: 'n3', type: 'ManualApproval', config: {} },
      { id: 'n4', type: 'PublishVersion', config: {} },
      { id: 'n5', type: 'ActivateVariant', config: { key: 'default', trafficAllocation: 100 } }
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n4', to: 'n5' }
    ]
  });

  await db.run(
    `INSERT INTO workflow_definitions(
      id,
      name,
      version,
      graph_json,
      input_schema_json,
      permissions_json,
      created_by
    )
    SELECT
      COALESCE((SELECT MAX(id) + 1 FROM workflow_definitions), 1),
      'Default Publish Flow',
      1,
      ?,
      '{"type":"object"}',
      '{"roles":["admin"]}',
      'seed'
    WHERE NOT EXISTS (
      SELECT 1 FROM workflow_definitions WHERE name = 'Default Publish Flow' AND version = 1
    )`,
    [workflowGraph]
  );

  console.log('Seeded default site market/locale matrix (if missing).');
  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
