import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';

import type { DbClient } from './DbClient.js';

export class DuckDbClient implements DbClient {
  private constructor(
    private readonly instance: DuckDBInstance,
    private readonly connection: DuckDBConnection
  ) {}

  static async create(filePath: string): Promise<DuckDbClient> {
    await mkdir(dirname(filePath), { recursive: true });
    const instance = await DuckDBInstance.create(filePath);
    const connection = await instance.connect();
    return new DuckDbClient(instance, connection);
  }

  run(sql: string, params: unknown[] = []): Promise<void> {
    return this.connection.run(sql, params as never[]).then(() => undefined);
  }

  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.connection.runAndReadAll(sql, params as never[]);
    return result.getRowObjectsJS() as T[];
  }

  async get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const rows = await this.all<T>(sql, params);
    return rows[0];
  }

  async close(): Promise<void> {
    this.connection.closeSync();
    this.instance.closeSync();
  }
}
