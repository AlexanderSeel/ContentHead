import type { DbClient } from './DbClient.js';
import { migrations } from './migrations/index.js';

export async function runMigrations(db: DbClient): Promise<void> {
  await db.run(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  id VARCHAR PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);
`);

  for (const migration of migrations) {
    const row = await db.get<{ id: string }>('SELECT id FROM schema_migrations WHERE id = ?', [migration.id]);
    if (row) {
      continue;
    }

    await db.run('BEGIN TRANSACTION');
    try {
      await db.run(migration.sql);
      await db.run('INSERT INTO schema_migrations(id) VALUES (?)', [migration.id]);
      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }
}