import { config } from '../config.js';
import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';

async function main(): Promise<void> {
  const db = await DuckDbClient.create(config.dbPath);
  await runMigrations(db);
  await db.close();
  console.log('Migrations applied.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});