import { access, mkdir, rename } from 'node:fs/promises';
import { constants } from 'node:fs';
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
    try {
      const instance = await DuckDBInstance.create(filePath);
      const connection = await instance.connect();
      return new DuckDbClient(instance, connection);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const walPath = `${filePath}.wal`;
      const looksLikeWalReplayFailure =
        message.includes('Failure while replaying WAL') ||
        message.includes('GetDefaultDatabase with no default database set');

      if (!looksLikeWalReplayFailure) {
        throw error;
      }

      try {
        await access(walPath, constants.F_OK);
      } catch {
        throw error;
      }

      const quarantinePath = `${walPath}.corrupt.${Date.now()}`;
      await rename(walPath, quarantinePath);
      console.warn(`DuckDB WAL replay failed. Quarantined WAL file: ${quarantinePath}. Retrying database open.`);

      const instance = await DuckDBInstance.create(filePath);
      const connection = await instance.connect();
      return new DuckDbClient(instance, connection);
    }
  }

  run(sql: string, params: unknown[] = []): Promise<void> {
    return this.connection.run(sql, params as never[]).then(() => undefined).catch((error) => {
      throw enrichDbError(error, sql, params);
    });
  }

  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    try {
      const result = await this.connection.runAndReadAll(sql, params as never[]);
      return result.getRowObjectsJS() as T[];
    } catch (error) {
      throw enrichDbError(error, sql, params);
    }
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

function enrichDbError(error: unknown, sql: string, params: unknown[]): Error {
  const normalized = sql.replace(/\s+/g, ' ').trim();
  const preview = normalized.length > 220 ? `${normalized.slice(0, 220)}...` : normalized;
  const paramsPreview = JSON.stringify(params).slice(0, 300);
  const baseMessage = error instanceof Error ? error.message : String(error);
  return new Error(
    `DuckDB query failed: ${baseMessage}; sql="${preview}"; params=${paramsPreview}`,
    { cause: error instanceof Error ? error : undefined }
  );
}
