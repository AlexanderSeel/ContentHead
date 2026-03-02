import { GraphQLError } from 'graphql';

import type { AssetStorageProvider } from '../assets/storage.js';
import type { DbClient } from './DbClient.js';

export type DbAdminColumn = {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  primaryKey: boolean;
  position: number;
  pkOrder?: number;
};

export type DbAdminIndex = {
  name: string;
  columns: string[];
  unique: boolean;
};

export type DbAdminTableDescription = {
  table: string;
  columns: DbAdminColumn[];
  primaryKey: string[];
  indexes: DbAdminIndex[];
};

export type DbAdminTableListItem = {
  name: string;
  schema: string;
  rowCount?: number | null;
};

export type DbAdminListResult = {
  total: number;
  rowsJson: string;
};

export type DbAdminMutationResult = {
  ok: boolean;
  affected: number;
};

export type DbAdminSqlResult = {
  readOnly: boolean;
  columns: string[];
  rowsJson: string;
  rowCount: number;
  message?: string | null;
  executedSql?: string | null;
};

export type DbAdminResetResult = {
  siteId: number;
  statementsExecuted: number;
  tablesTouched: string[];
  message: string;
};

export type DbAdminFilter = {
  column: string;
  op: string;
  value?: string | null | undefined;
  values?: string[] | null | undefined;
};

export type DbAdminListArgs = {
  table: string;
  paging?: { limit?: number | null | undefined; offset?: number | null | undefined } | null | undefined;
  sort?: { column?: string | null | undefined; direction?: string | null | undefined } | null | undefined;
  filter?: DbAdminFilter[] | null | undefined;
  dangerMode?: boolean | null | undefined;
};

const SAFE_TABLES = new Set([
  'assets',
  'asset_folders',
  'asset_renditions',
  'connectors',
  'content_items',
  'content_routes',
  'content_types',
  'content_versions',
  'forms',
  'form_fields',
  'form_steps',
  'form_submissions',
  'locales',
  'markets',
  'roles',
  'role_permissions',
  'sites',
  'site_locales',
  'site_locale_overrides',
  'site_markets',
  'site_market_locales',
  'templates',
  'user_roles',
  'users',
  'variant_sets',
  'variants',
  'workflow_definitions',
  'workflow_runs',
  'workflow_step_states'
]);

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

function badInput(message: string, code = 'BAD_USER_INPUT'): never {
  throw new GraphQLError(message, { extensions: { code } });
}

function escapeLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

function quoteIdent(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function ensureIdentifier(value: string): string {
  if (!value || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    badInput('Invalid identifier', 'DB_ADMIN_INVALID_IDENTIFIER');
  }
  return value;
}

async function listAllTables(db: DbClient): Promise<string[]> {
  const rows = await db.all<{ name: string }>(
    `
SELECT table_name as name
FROM information_schema.tables
WHERE table_schema = 'main' AND table_type = 'BASE TABLE'
ORDER BY table_name
`
  );
  return rows.map((row) => row.name);
}

async function listTableEntries(db: DbClient, showSystemTables: boolean): Promise<DbAdminTableListItem[]> {
  const rows = await db.all<{
    schema: string;
    name: string;
    internal: boolean;
    temporary: boolean;
  }>(
    `
SELECT
  schema_name as schema,
  table_name as name,
  internal,
  temporary
FROM duckdb_tables()
WHERE
  temporary = FALSE
  AND (
    schema_name = 'main'
    OR ?
  )
  AND (
    internal = FALSE
    OR ?
  )
ORDER BY
  CASE WHEN schema_name = 'main' THEN 0 ELSE 1 END,
  schema_name,
  table_name
`,
    [showSystemTables, showSystemTables]
  );

  const entries: DbAdminTableListItem[] = [];
  for (const row of rows) {
    if (!showSystemTables && row.schema === 'main' && !SAFE_TABLES.has(row.name)) {
      continue;
    }
    let rowCount: number | null = null;
    if (row.schema === 'main' && !row.internal) {
      try {
        const countRow = await db.get<{ total: number }>(
          `SELECT COUNT(*)::INTEGER as total FROM ${quoteIdent(row.schema)}.${quoteIdent(row.name)}`
        );
        rowCount = countRow?.total ?? 0;
      } catch {
        rowCount = null;
      }
    }
    entries.push({
      name: row.name,
      schema: row.schema,
      rowCount
    });
  }

  return entries;
}

async function ensureTableAllowed(db: DbClient, table: string, dangerMode?: boolean | null): Promise<void> {
  const normalized = ensureIdentifier(table);
  const tables = await listAllTables(db);
  if (!tables.includes(normalized)) {
    throw new GraphQLError(`Table ${table} not found`, { extensions: { code: 'DB_ADMIN_TABLE_NOT_FOUND' } });
  }
  if (!dangerMode && !SAFE_TABLES.has(normalized)) {
    throw new GraphQLError(`Table ${table} requires danger mode`, {
      extensions: { code: 'DB_ADMIN_DANGER_MODE_REQUIRED' }
    });
  }
}

async function loadColumns(db: DbClient, table: string): Promise<DbAdminColumn[]> {
  const rows = await db.all<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
    pk: number;
  }>(`PRAGMA table_info('${escapeLiteral(table)}')`);

  return rows.map((row) => ({
    name: row.name,
    type: row.type,
    nullable: !row.notnull,
    defaultValue: row.dflt_value ?? null,
    primaryKey: row.pk > 0,
    position: row.cid,
    pkOrder: row.pk
  }));
}

async function loadIndexes(db: DbClient, table: string): Promise<DbAdminIndex[]> {
  try {
    const rows = await db.all<Record<string, unknown>>(
      'SELECT * FROM duckdb_indexes() WHERE table_name = ?',
      [table]
    );
    return rows
      .map((row) => {
        const nameRaw = row.index_name ?? row.indexName ?? row.name ?? row.index;
        const name = nameRaw ? String(nameRaw) : '';
        const unique = Boolean(row.is_unique ?? row.unique ?? row.isUnique ?? false);
        const columnRaw =
          row.column_names ??
          row.columnNames ??
          row.columns ??
          row.column_name ??
          row.columnName ??
          row.column ??
          row.columnName;
        let columns: string[] = [];
        if (Array.isArray(columnRaw)) {
          columns = columnRaw.map((entry) => String(entry));
        } else if (typeof columnRaw === 'string') {
          columns = columnRaw
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);
        }
        return name ? { name, columns, unique } : null;
      })
      .filter((entry): entry is DbAdminIndex => Boolean(entry));
  } catch {
    return [];
  }
}

function toJsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'bigint') {
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return Buffer.from(value).toString('base64');
  }
  if (Array.isArray(value)) {
    return value.map((entry) => toJsonSafe(entry));
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(obj)) {
      next[key] = toJsonSafe(entry);
    }
    return next;
  }
  return value;
}

function normalizeDbValue(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return Buffer.from(value);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}

function parseJsonObject(value: string, name: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      badInput(`${name} must be a JSON object`);
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    badInput(`${name} must be valid JSON`);
  }
}

function parseJsonArray(value: string | null | undefined, name: string): unknown[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      badInput(`${name} must be a JSON array`);
    }
    return parsed as unknown[];
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    badInput(`${name} must be valid JSON`);
  }
}

export async function dbAdminTables(db: DbClient, dangerMode?: boolean | null): Promise<DbAdminTableListItem[]> {
  return listTableEntries(db, Boolean(dangerMode));
}

export async function dbAdminDescribe(
  db: DbClient,
  table: string,
  dangerMode?: boolean | null
): Promise<DbAdminTableDescription> {
  await ensureTableAllowed(db, table, dangerMode);
  const columns = await loadColumns(db, table);
  const indexes = await loadIndexes(db, table);
  const primaryKey = columns
    .filter((column) => column.primaryKey)
    .sort((a, b) => {
      const orderA = a.pkOrder ?? a.position;
      const orderB = b.pkOrder ?? b.position;
      if (orderA === orderB) {
        return 0;
      }
      return orderA - orderB;
    })
    .map((column) => column.name);

  return {
    table,
    columns,
    primaryKey,
    indexes
  };
}

function normalizeLimit(limit?: number | null): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_LIMIT;
  }
  return Math.max(1, Math.min(MAX_LIMIT, Math.trunc(limit ?? DEFAULT_LIMIT)));
}

function normalizeOffset(offset?: number | null): number {
  if (!Number.isFinite(offset)) {
    return 0;
  }
  return Math.max(0, Math.trunc(offset ?? 0));
}

function buildFilterClause(
  filters: DbAdminFilter[] | null | undefined,
  columns: string[]
): { sql: string; params: unknown[] } {
  if (!filters || filters.length === 0) {
    return { sql: '', params: [] };
  }
  const allowedColumns = new Set(columns);
  const params: unknown[] = [];
  const clauses: string[] = [];
  for (const filter of filters) {
    const column = ensureIdentifier(filter.column);
    if (!allowedColumns.has(column)) {
      badInput(`Unknown column ${filter.column}`);
    }
    const op = filter.op?.toLowerCase() ?? 'eq';
    const colSql = quoteIdent(column);
    switch (op) {
      case 'eq':
        clauses.push(`${colSql} = ?`);
        params.push(filter.value ?? null);
        break;
      case 'neq':
        clauses.push(`${colSql} <> ?`);
        params.push(filter.value ?? null);
        break;
      case 'contains':
        clauses.push(`${colSql} ILIKE ?`);
        params.push(`%${filter.value ?? ''}%`);
        break;
      case 'starts_with':
        clauses.push(`${colSql} ILIKE ?`);
        params.push(`${filter.value ?? ''}%`);
        break;
      case 'ends_with':
        clauses.push(`${colSql} ILIKE ?`);
        params.push(`%${filter.value ?? ''}`);
        break;
      case 'gt':
        clauses.push(`${colSql} > ?`);
        params.push(filter.value ?? null);
        break;
      case 'gte':
        clauses.push(`${colSql} >= ?`);
        params.push(filter.value ?? null);
        break;
      case 'lt':
        clauses.push(`${colSql} < ?`);
        params.push(filter.value ?? null);
        break;
      case 'lte':
        clauses.push(`${colSql} <= ?`);
        params.push(filter.value ?? null);
        break;
      case 'in': {
        const values = filter.values?.filter((value) => value !== null && value !== undefined) ?? [];
        if (values.length === 0) {
          clauses.push('1 = 0');
          break;
        }
        clauses.push(`${colSql} IN (${values.map(() => '?').join(', ')})`);
        params.push(...values);
        break;
      }
      case 'is_null':
        clauses.push(`${colSql} IS NULL`);
        break;
      case 'not_null':
        clauses.push(`${colSql} IS NOT NULL`);
        break;
      default:
        badInput(`Unsupported filter op ${filter.op}`);
    }
  }

  if (clauses.length === 0) {
    return { sql: '', params: [] };
  }
  return {
    sql: `WHERE ${clauses.join(' AND ')}`,
    params
  };
}

export async function dbAdminList(db: DbClient, args: DbAdminListArgs): Promise<DbAdminListResult> {
  await ensureTableAllowed(db, args.table, args.dangerMode);
  const columns = await loadColumns(db, args.table);
  const columnNames = columns.map((column) => column.name);
  const limit = normalizeLimit(args.paging?.limit);
  const offset = normalizeOffset(args.paging?.offset);

  let orderSql = '';
  if (args.sort?.column) {
    const sortColumn = ensureIdentifier(args.sort.column);
    if (!columnNames.includes(sortColumn)) {
      badInput(`Unknown sort column ${sortColumn}`);
    }
    const direction = args.sort.direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    orderSql = `ORDER BY ${quoteIdent(sortColumn)} ${direction}`;
  }

  const { sql: filterSql, params } = buildFilterClause(args.filter ?? null, columnNames);
  const tableSql = quoteIdent(args.table);

  const totalRow = await db.get<{ total: number }>(
    `SELECT COUNT(*)::INTEGER as total FROM ${tableSql} ${filterSql}`,
    params
  );
  const total = totalRow?.total ?? 0;
  const rows = await db.all<Record<string, unknown>>(
    `SELECT * FROM ${tableSql} ${filterSql} ${orderSql} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const safeRows = rows.map((row) => {
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      next[key] = toJsonSafe(value);
    }
    return next;
  });

  return {
    total,
    rowsJson: JSON.stringify(safeRows)
  };
}

export async function dbAdminInsert(
  db: DbClient,
  table: string,
  rowJson: string,
  dangerMode?: boolean | null
): Promise<DbAdminMutationResult> {
  await ensureTableAllowed(db, table, dangerMode);
  const row = parseJsonObject(rowJson, 'rowJson');
  const columns = await loadColumns(db, table);
  const allowedColumns = new Set(columns.map((column) => column.name));
  const entries = Object.entries(row).filter(([key, value]) => allowedColumns.has(key) && value !== undefined);
  if (entries.length === 0) {
    badInput('Row must include at least one column');
  }

  const colSql = entries.map(([key]) => quoteIdent(key)).join(', ');
  const placeholders = entries.map(() => '?').join(', ');
  const values = entries.map(([, value]) => normalizeDbValue(value));
  await db.run(`INSERT INTO ${quoteIdent(table)} (${colSql}) VALUES (${placeholders})`, values);
  return { ok: true, affected: 1 };
}

export async function dbAdminUpdate(
  db: DbClient,
  table: string,
  pkJson: string,
  patchJson: string,
  dangerMode?: boolean | null
): Promise<DbAdminMutationResult> {
  await ensureTableAllowed(db, table, dangerMode);
  const columns = await loadColumns(db, table);
  const pkColumns = columns.filter((column) => column.primaryKey).map((column) => column.name);
  if (pkColumns.length === 0) {
    throw new GraphQLError(`Table ${table} has no primary key`, { extensions: { code: 'DB_ADMIN_NO_PRIMARY_KEY' } });
  }

  const pk = parseJsonObject(pkJson, 'pkJson');
  const patch = parseJsonObject(patchJson, 'patchJson');
  const allowedColumns = new Set(columns.map((column) => column.name));
  const pkValues: unknown[] = [];
  const pkClause = pkColumns
    .map((column) => {
      if (!(column in pk)) {
        badInput(`Missing primary key column ${column}`);
      }
      pkValues.push(normalizeDbValue(pk[column]));
      return `${quoteIdent(column)} = ?`;
    })
    .join(' AND ');

  const entries = Object.entries(patch).filter(
    ([key, value]) => allowedColumns.has(key) && !pkColumns.includes(key) && value !== undefined
  );
  if (entries.length === 0) {
    badInput('Patch must include at least one non-primary-key column');
  }

  const setSql = entries.map(([key]) => `${quoteIdent(key)} = ?`).join(', ');
  const values = entries.map(([, value]) => normalizeDbValue(value));
  await db.run(`UPDATE ${quoteIdent(table)} SET ${setSql} WHERE ${pkClause}`, [...values, ...pkValues]);
  return { ok: true, affected: 1 };
}

export async function dbAdminDelete(
  db: DbClient,
  table: string,
  pkJson: string,
  dangerMode?: boolean | null
): Promise<DbAdminMutationResult> {
  await ensureTableAllowed(db, table, dangerMode);
  const columns = await loadColumns(db, table);
  const pkColumns = columns.filter((column) => column.primaryKey).map((column) => column.name);
  if (pkColumns.length === 0) {
    throw new GraphQLError(`Table ${table} has no primary key`, { extensions: { code: 'DB_ADMIN_NO_PRIMARY_KEY' } });
  }
  const pk = parseJsonObject(pkJson, 'pkJson');
  const pkValues: unknown[] = [];
  const pkClause = pkColumns
    .map((column) => {
      if (!(column in pk)) {
        badInput(`Missing primary key column ${column}`);
      }
      pkValues.push(normalizeDbValue(pk[column]));
      return `${quoteIdent(column)} = ?`;
    })
    .join(' AND ');

  await db.run(`DELETE FROM ${quoteIdent(table)} WHERE ${pkClause}`, pkValues);
  return { ok: true, affected: 1 };
}

export async function dbAdminSql(
  db: DbClient,
  query: string,
  paramsJson?: string | null | undefined,
  allowWrites?: boolean | null | undefined
): Promise<DbAdminSqlResult> {
  const trimmed = query.trim().replace(/;$/, '');
  if (!trimmed) {
    badInput('Query is required');
  }
  if (trimmed.includes(';')) {
    badInput('Multiple statements are not allowed');
  }

  const lower = trimmed.toLowerCase();
  const readOnly = /^(select|with|explain)\b/.test(lower);
  const writeKeyword = /\b(insert|update|delete|create|drop|alter|attach|detach|copy|export|import|pragma|call|vacuum|set)\b/.test(
    lower
  );

  if (!readOnly && !allowWrites) {
    throw new GraphQLError('Only SELECT queries are allowed', { extensions: { code: 'DB_ADMIN_READ_ONLY' } });
  }
  if (writeKeyword && !allowWrites) {
    throw new GraphQLError('Write operations require write access', {
      extensions: { code: 'DB_ADMIN_WRITE_REQUIRED' }
    });
  }

  const params = parseJsonArray(paramsJson, 'paramsJson');
  if (readOnly) {
    let execSql = trimmed;
    if (!/\blimit\b/i.test(execSql) && /^(select|with)\b/.test(lower)) {
      execSql = `${execSql} LIMIT ${MAX_LIMIT}`;
    }
    const rows = await db.all<Record<string, unknown>>(execSql, params);
    const safeRows = rows.map((row) => {
      const next: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        next[key] = toJsonSafe(value);
      }
      return next;
    });
    const columns = safeRows[0] ? Object.keys(safeRows[0]) : [];
    return {
      readOnly: true,
      columns,
      rowsJson: JSON.stringify(safeRows),
      rowCount: safeRows.length,
      executedSql: execSql
    };
  }

  await db.run(trimmed, params);
  return {
    readOnly: false,
    columns: [],
    rowsJson: '[]',
    rowCount: 0,
    message: 'Statement executed',
    executedSql: trimmed
  };
}

export async function dbAdminResetSiteData(
  db: DbClient,
  siteId: number,
  assetStorage?: AssetStorageProvider | null
): Promise<DbAdminResetResult> {
  const site = await db.get<{ id: number }>('SELECT id FROM sites WHERE id = ?', [siteId]);
  if (!site) {
    throw new GraphQLError(`Site ${siteId} not found`, { extensions: { code: 'SITE_NOT_FOUND' } });
  }

  const availableTables = new Set(await listAllTables(db));
  const touchedTables = new Set<string>();
  let statementsExecuted = 0;

  const run = async (sql: string, params: unknown[] = [], requiredTables: string[] = []): Promise<void> => {
    if (requiredTables.some((table) => !availableTables.has(table))) {
      return;
    }
    await db.run(sql, params);
    statementsExecuted += 1;
    requiredTables.forEach((table) => touchedTables.add(table));
  };
  const hasTables = (...tables: string[]): boolean => tables.every((table) => availableTables.has(table));
  const placeholders = (count: number): string => Array.from({ length: count }, () => '?').join(', ');
  const deleteRowsReferencing = async (
    parentTable: string,
    parentColumn: string,
    ids: number[]
  ): Promise<void> => {
    if (ids.length === 0) {
      return;
    }
    const inSql = placeholders(ids.length);
    for (const childTable of availableTables) {
      if (childTable === parentTable) {
        continue;
      }
      let fkRows: Array<{ table?: string; from?: string; to?: string }> = [];
      try {
        fkRows = await db.all<Array<{ table?: string; from?: string; to?: string }>[number]>(
          `PRAGMA foreign_key_list('${escapeLiteral(childTable)}')`
        );
      } catch {
        continue;
      }
      for (const fk of fkRows) {
        const fkParent = (fk.table ?? '').trim().toLowerCase();
        const fkChildColumn = (fk.from ?? '').trim();
        const fkParentColumn = (fk.to ?? '').trim().toLowerCase();
        if (!fkChildColumn) {
          continue;
        }
        if (fkParent !== parentTable.toLowerCase() || fkParentColumn !== parentColumn.toLowerCase()) {
          continue;
        }
        await run(
          `DELETE FROM ${quoteIdent(childTable)} WHERE ${quoteIdent(fkChildColumn)} IN (${inSql})`,
          ids,
          [childTable, parentTable]
        );
      }
    }
  };
  const normalizeStringList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry));
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return [];
      }
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map((entry) => String(entry));
        }
      } catch {
        // fall through
      }
      return trimmed
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((entry) => entry.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
    return [];
  };
  const fkReferencesFromConstraints = async (
    parentTable: string,
    parentColumn: string
  ): Promise<Array<{ childTable: string; childColumn: string }>> => {
    const rows = await db.all<{
      tableName: string;
      constraintColumnNames: unknown;
      referencedColumnNames: unknown;
    }>(
      `
SELECT
  table_name as tableName,
  constraint_column_names as constraintColumnNames,
  referenced_column_names as referencedColumnNames
FROM duckdb_constraints()
WHERE constraint_type = 'FOREIGN KEY' AND lower(referenced_table) = lower(?)
`,
      [parentTable]
    );
    const refs: Array<{ childTable: string; childColumn: string }> = [];
    for (const row of rows) {
      const childColumns = normalizeStringList(row.constraintColumnNames);
      const referencedColumns = normalizeStringList(row.referencedColumnNames).map((entry) => entry.toLowerCase());
      if (childColumns.length === 0 || referencedColumns.length === 0) {
        continue;
      }
      const index = referencedColumns.indexOf(parentColumn.toLowerCase());
      if (index < 0 || !childColumns[index]) {
        continue;
      }
      refs.push({ childTable: row.tableName, childColumn: childColumns[index]! });
    }
    return refs;
  };
  const siteContentItemRows = hasTables('content_items')
    ? await db.all<{ id: number }>('SELECT id FROM content_items WHERE site_id = ?', [siteId])
    : [];
  const siteContentItemIds = siteContentItemRows.map((entry) => entry.id);
  const siteContentItemInSql = siteContentItemIds.length > 0 ? placeholders(siteContentItemIds.length) : '';
  const siteContentTypeRows = hasTables('content_types')
    ? await db.all<{ id: number }>('SELECT id FROM content_types WHERE site_id = ?', [siteId])
    : [];
  const siteContentTypeIds = siteContentTypeRows.map((entry) => entry.id);
  const siteContentTypeInSql = siteContentTypeIds.length > 0 ? placeholders(siteContentTypeIds.length) : '';
  const siteFormRows = hasTables('forms') ? await db.all<{ id: number }>('SELECT id FROM forms WHERE site_id = ?', [siteId]) : [];
  const siteFormIds = siteFormRows.map((entry) => entry.id);
  const siteFormInSql = siteFormIds.length > 0 ? placeholders(siteFormIds.length) : '';
  const siteFormStepRows =
    hasTables('form_steps') && siteFormIds.length > 0
      ? await db.all<{ id: number }>(`SELECT id FROM form_steps WHERE form_id IN (${siteFormInSql})`, siteFormIds)
      : [];
  const siteFormStepIds = siteFormStepRows.map((entry) => entry.id);
  const siteFormStepInSql = siteFormStepIds.length > 0 ? placeholders(siteFormStepIds.length) : '';
  const siteAssetRows = hasTables('assets') ? await db.all<{ id: number }>('SELECT id FROM assets WHERE site_id = ?', [siteId]) : [];
  const siteAssetIds = siteAssetRows.map((entry) => entry.id);
  const siteAssetInSql = siteAssetIds.length > 0 ? placeholders(siteAssetIds.length) : '';
  const storagePathsToDelete = new Set<string>();
  if (assetStorage && siteAssetIds.length > 0) {
    const assetRows = await db.all<{ storagePath: string }>(
      `SELECT storage_path as storagePath FROM assets WHERE id IN (${siteAssetInSql})`,
      siteAssetIds
    );
    for (const row of assetRows) {
      if (row.storagePath?.trim()) {
        storagePathsToDelete.add(row.storagePath.trim());
      }
    }
    if (hasTables('asset_renditions')) {
      const renditionRows = await db.all<{ storagePath: string }>(
        `SELECT storage_path as storagePath FROM asset_renditions WHERE asset_id IN (${siteAssetInSql})`,
        siteAssetIds
      );
      for (const row of renditionRows) {
        if (row.storagePath?.trim()) {
          storagePathsToDelete.add(row.storagePath.trim());
        }
      }
    }
  }

  await db.run('BEGIN TRANSACTION');
  try {
    await run(
      'DELETE FROM form_submissions WHERE site_id = ? OR form_id IN (SELECT id FROM forms WHERE site_id = ?)',
      [siteId, siteId],
      ['form_submissions', 'forms']
    );

    await run(
      `DELETE FROM entity_acls
       WHERE entity_type = 'PAGE'
         AND entity_id IN (
           SELECT CAST(id AS VARCHAR)
           FROM content_items
           WHERE site_id = ?
         )`,
      [siteId],
      ['entity_acls', 'content_items']
    );
    await run(
      `DELETE FROM page_targeting
       WHERE content_item_id IN (SELECT id FROM content_items WHERE site_id = ?)
          OR fallback_content_item_id IN (SELECT id FROM content_items WHERE site_id = ?)`,
      [siteId, siteId],
      ['page_targeting', 'content_items']
    );
    await run(
      'DELETE FROM page_acl_settings WHERE content_item_id IN (SELECT id FROM content_items WHERE site_id = ?)',
      [siteId],
      ['page_acl_settings', 'content_items']
    );

    if (hasTables('variant_sets')) {
      const variantSetRows =
        siteContentItemIds.length > 0
          ? await db.all<{ id: number }>(
              `SELECT id
               FROM variant_sets
               WHERE site_id = ?
                  OR content_item_id IN (${siteContentItemInSql})`,
              [siteId, ...siteContentItemIds]
            )
          : await db.all<{ id: number }>('SELECT id FROM variant_sets WHERE site_id = ?', [siteId]);
      const variantSetIds = variantSetRows.map((entry) => entry.id);
      if (variantSetIds.length > 0) {
        const inSql = placeholders(variantSetIds.length);
        const constraintRefs = await fkReferencesFromConstraints('variant_sets', 'id');
        for (const ref of constraintRefs) {
          if (!availableTables.has(ref.childTable)) {
            continue;
          }
          if (ref.childTable === 'variant_sets') {
            await run(
              `UPDATE ${quoteIdent(ref.childTable)} SET ${quoteIdent(ref.childColumn)} = NULL WHERE ${quoteIdent(ref.childColumn)} IN (${inSql})`,
              variantSetIds,
              [ref.childTable]
            );
            continue;
          }
          await run(
            `DELETE FROM ${quoteIdent(ref.childTable)} WHERE ${quoteIdent(ref.childColumn)} IN (${inSql})`,
            variantSetIds,
            [ref.childTable]
          );
        }
        await deleteRowsReferencing('variant_sets', 'id', variantSetIds);
        for (const childTable of availableTables) {
          if (childTable === 'variant_sets') {
            continue;
          }
          const cols = await loadColumns(db, childTable).catch(() => []);
          const colNames = new Set(cols.map((col) => col.name.toLowerCase()));
          if (colNames.has('variant_set_id')) {
            await run(
              `DELETE FROM ${quoteIdent(childTable)} WHERE ${quoteIdent('variant_set_id')} IN (${inSql})`,
              variantSetIds,
              [childTable]
            );
          }
          if (colNames.has('fallback_variant_set_id')) {
            await run(
              `UPDATE ${quoteIdent(childTable)} SET ${quoteIdent('fallback_variant_set_id')} = NULL WHERE ${quoteIdent('fallback_variant_set_id')} IN (${inSql})`,
              variantSetIds,
              [childTable]
            );
          }
        }
        if (hasTables('variants')) {
          await run(`DELETE FROM variants WHERE variant_set_id IN (${inSql})`, variantSetIds, ['variants']);
        }
        await run(
          `UPDATE variant_sets
           SET fallback_variant_set_id = NULL
           WHERE fallback_variant_set_id IN (${inSql})`,
          variantSetIds,
          ['variant_sets']
        );
        // DuckDB FK checks can still see stale references within one long transaction.
        // Commit child cleanup first, then delete parent rows in a fresh transaction.
        await db.run('COMMIT');
        await db.run('BEGIN TRANSACTION');
        for (const variantSetId of variantSetIds) {
          const blockers: string[] = [];
          for (const childTable of availableTables) {
            if (childTable === 'variant_sets') {
              continue;
            }
            const cols = await loadColumns(db, childTable).catch(() => []);
            const colNames = new Set(cols.map((col) => col.name.toLowerCase()));
            if (colNames.has('variant_set_id')) {
              const row = await db.get<{ total: number }>(
                `SELECT COUNT(*)::INTEGER as total FROM ${quoteIdent(childTable)} WHERE ${quoteIdent('variant_set_id')} = ?`,
                [variantSetId]
              );
              if ((row?.total ?? 0) > 0) {
                blockers.push(`${childTable}.variant_set_id=${row?.total ?? 0}`);
              }
            }
            if (colNames.has('fallback_variant_set_id')) {
              const row = await db.get<{ total: number }>(
                `SELECT COUNT(*)::INTEGER as total FROM ${quoteIdent(childTable)} WHERE ${quoteIdent('fallback_variant_set_id')} = ?`,
                [variantSetId]
              );
              if ((row?.total ?? 0) > 0) {
                blockers.push(`${childTable}.fallback_variant_set_id=${row?.total ?? 0}`);
              }
            }
          }
          if (blockers.length > 0) {
            throw new GraphQLError(
              `Cannot reset site ${siteId}: variant_set ${variantSetId} still referenced by ${blockers.join(', ')}`,
              { extensions: { code: 'DB_ADMIN_RESET_FK_BLOCKED' } }
            );
          }
          await run('DELETE FROM variant_sets WHERE id = ?', [variantSetId], ['variant_sets']);
        }
      }
    }
    await run(
      `DELETE FROM variants
       WHERE content_version_id IN (
         SELECT id
         FROM content_versions
         WHERE content_item_id IN (SELECT id FROM content_items WHERE site_id = ?)
       )`,
      [siteId],
      ['variants', 'content_versions', 'content_items']
    );

    if (siteContentItemIds.length > 0) {
      await run(
        `DELETE FROM content_routes
         WHERE site_id = ?
            OR content_item_id IN (${siteContentItemInSql})`,
        [siteId, ...siteContentItemIds],
        ['content_routes']
      );
    } else {
      await run('DELETE FROM content_routes WHERE site_id = ?', [siteId], ['content_routes']);
    }

    await run(
      `UPDATE content_items
       SET current_draft_version_id = NULL
       WHERE current_draft_version_id IN (
         SELECT id
         FROM content_versions
         WHERE content_item_id IN (SELECT id FROM content_items WHERE site_id = ?)
       )`,
      [siteId],
      ['content_items', 'content_versions']
    );
    await run(
      `UPDATE content_items
       SET current_published_version_id = NULL
       WHERE current_published_version_id IN (
         SELECT id
         FROM content_versions
         WHERE content_item_id IN (SELECT id FROM content_items WHERE site_id = ?)
       )`,
      [siteId],
      ['content_items', 'content_versions']
    );
    await run(
      'DELETE FROM content_versions WHERE content_item_id IN (SELECT id FROM content_items WHERE site_id = ?)',
      [siteId],
      ['content_versions', 'content_items']
    );
    if (siteContentItemIds.length > 0) {
      const refs = await fkReferencesFromConstraints('content_items', 'id');
      for (const ref of refs) {
        if (!availableTables.has(ref.childTable)) {
          continue;
        }
        if (ref.childTable === 'content_items' && ref.childColumn.toLowerCase() === 'id') {
          continue;
        }
        const childColumns = await loadColumns(db, ref.childTable).catch(() => []);
        const childColumn = childColumns.find((column) => column.name.toLowerCase() === ref.childColumn.toLowerCase());
        if (!childColumn) {
          continue;
        }
        if (childColumn.nullable) {
          await run(
            `UPDATE ${quoteIdent(ref.childTable)}
             SET ${quoteIdent(ref.childColumn)} = NULL
             WHERE ${quoteIdent(ref.childColumn)} IN (${siteContentItemInSql})`,
            siteContentItemIds,
            [ref.childTable]
          );
          continue;
        }
        await run(
          `DELETE FROM ${quoteIdent(ref.childTable)}
           WHERE ${quoteIdent(ref.childColumn)} IN (${siteContentItemInSql})`,
          siteContentItemIds,
          [ref.childTable]
        );
      }
    }
    // Split into a fresh transaction before deleting parent content_items rows.
    await db.run('COMMIT');
    await db.run('BEGIN TRANSACTION');
    await run('DELETE FROM content_items WHERE site_id = ?', [siteId], ['content_items']);
    await run('DELETE FROM templates WHERE site_id = ?', [siteId], ['templates']);
    if (siteContentTypeIds.length > 0) {
      await run(
        `DELETE FROM content_items WHERE content_type_id IN (${siteContentTypeInSql})`,
        siteContentTypeIds,
        ['content_items']
      );
      const refs = await fkReferencesFromConstraints('content_types', 'id');
      for (const ref of refs) {
        if (!availableTables.has(ref.childTable)) {
          continue;
        }
        if (ref.childTable === 'content_types' && ref.childColumn.toLowerCase() === 'id') {
          continue;
        }
        const childColumns = await loadColumns(db, ref.childTable).catch(() => []);
        const childColumn = childColumns.find((column) => column.name.toLowerCase() === ref.childColumn.toLowerCase());
        if (!childColumn) {
          continue;
        }
        if (childColumn.nullable) {
          await run(
            `UPDATE ${quoteIdent(ref.childTable)}
             SET ${quoteIdent(ref.childColumn)} = NULL
             WHERE ${quoteIdent(ref.childColumn)} IN (${siteContentTypeInSql})`,
            siteContentTypeIds,
            [ref.childTable]
          );
          continue;
        }
        await run(
          `DELETE FROM ${quoteIdent(ref.childTable)}
           WHERE ${quoteIdent(ref.childColumn)} IN (${siteContentTypeInSql})`,
          siteContentTypeIds,
          [ref.childTable]
        );
      }
    }
    await db.run('COMMIT');
    await db.run('BEGIN TRANSACTION');
    await run('DELETE FROM content_types WHERE site_id = ?', [siteId], ['content_types']);

    if (siteFormIds.length > 0 && siteFormStepIds.length > 0) {
      await run(
        `DELETE FROM form_fields
         WHERE form_id IN (${siteFormInSql})
            OR step_id IN (${siteFormStepInSql})`,
        [...siteFormIds, ...siteFormStepIds],
        ['form_fields', 'forms', 'form_steps']
      );
    } else {
      await run('DELETE FROM form_fields WHERE form_id IN (SELECT id FROM forms WHERE site_id = ?)', [siteId], ['form_fields', 'forms']);
    }
    if (siteFormStepIds.length > 0) {
      const refs = await fkReferencesFromConstraints('form_steps', 'id');
      for (const ref of refs) {
        if (!availableTables.has(ref.childTable)) {
          continue;
        }
        if (ref.childTable === 'form_steps' && ref.childColumn.toLowerCase() === 'id') {
          continue;
        }
        const childColumns = await loadColumns(db, ref.childTable).catch(() => []);
        const childColumn = childColumns.find((column) => column.name.toLowerCase() === ref.childColumn.toLowerCase());
        if (!childColumn) {
          continue;
        }
        if (childColumn.nullable) {
          await run(
            `UPDATE ${quoteIdent(ref.childTable)}
             SET ${quoteIdent(ref.childColumn)} = NULL
             WHERE ${quoteIdent(ref.childColumn)} IN (${siteFormStepInSql})`,
            siteFormStepIds,
            [ref.childTable]
          );
          continue;
        }
        await run(
          `DELETE FROM ${quoteIdent(ref.childTable)}
           WHERE ${quoteIdent(ref.childColumn)} IN (${siteFormStepInSql})`,
          siteFormStepIds,
          [ref.childTable]
        );
      }
    }
    await db.run('COMMIT');
    await db.run('BEGIN TRANSACTION');
    if (siteFormStepIds.length > 0) {
      await run(`DELETE FROM form_steps WHERE id IN (${siteFormStepInSql})`, siteFormStepIds, ['form_steps']);
    } else {
      await run('DELETE FROM form_steps WHERE form_id IN (SELECT id FROM forms WHERE site_id = ?)', [siteId], ['form_steps', 'forms']);
    }
    if (siteFormIds.length > 0) {
      const refs = await fkReferencesFromConstraints('forms', 'id');
      for (const ref of refs) {
        if (!availableTables.has(ref.childTable)) {
          continue;
        }
        if (ref.childTable === 'forms' && ref.childColumn.toLowerCase() === 'id') {
          continue;
        }
        const childColumns = await loadColumns(db, ref.childTable).catch(() => []);
        const childColumn = childColumns.find((column) => column.name.toLowerCase() === ref.childColumn.toLowerCase());
        if (!childColumn) {
          continue;
        }
        if (childColumn.nullable) {
          await run(
            `UPDATE ${quoteIdent(ref.childTable)}
             SET ${quoteIdent(ref.childColumn)} = NULL
             WHERE ${quoteIdent(ref.childColumn)} IN (${siteFormInSql})`,
            siteFormIds,
            [ref.childTable]
          );
          continue;
        }
        await run(
          `DELETE FROM ${quoteIdent(ref.childTable)}
           WHERE ${quoteIdent(ref.childColumn)} IN (${siteFormInSql})`,
          siteFormIds,
          [ref.childTable]
        );
      }
    }
    await db.run('COMMIT');
    await db.run('BEGIN TRANSACTION');
    await run('DELETE FROM forms WHERE site_id = ?', [siteId], ['forms']);

    await run('DELETE FROM ext_bookings WHERE site_id = ?', [siteId], ['ext_bookings']);
    await run('DELETE FROM ext_customers WHERE site_id = ?', [siteId], ['ext_customers']);
    await run('DELETE FROM ext_organisations WHERE site_id = ?', [siteId], ['ext_organisations']);

    if (siteAssetIds.length > 0) {
      await run(`DELETE FROM asset_renditions WHERE asset_id IN (${siteAssetInSql})`, siteAssetIds, ['asset_renditions']);
      const refs = await fkReferencesFromConstraints('assets', 'id');
      for (const ref of refs) {
        if (!availableTables.has(ref.childTable)) {
          continue;
        }
        if (ref.childTable === 'assets' && ref.childColumn.toLowerCase() === 'id') {
          continue;
        }
        const childColumns = await loadColumns(db, ref.childTable).catch(() => []);
        const childColumn = childColumns.find((column) => column.name.toLowerCase() === ref.childColumn.toLowerCase());
        if (!childColumn) {
          continue;
        }
        if (childColumn.nullable) {
          await run(
            `UPDATE ${quoteIdent(ref.childTable)}
             SET ${quoteIdent(ref.childColumn)} = NULL
             WHERE ${quoteIdent(ref.childColumn)} IN (${siteAssetInSql})`,
            siteAssetIds,
            [ref.childTable]
          );
          continue;
        }
        await run(
          `DELETE FROM ${quoteIdent(ref.childTable)}
           WHERE ${quoteIdent(ref.childColumn)} IN (${siteAssetInSql})`,
          siteAssetIds,
          [ref.childTable]
        );
      }
    } else {
      await run(
        'DELETE FROM asset_renditions WHERE asset_id IN (SELECT id FROM assets WHERE site_id = ?)',
        [siteId],
        ['asset_renditions', 'assets']
      );
    }
    await db.run('COMMIT');
    await db.run('BEGIN TRANSACTION');
    if (siteAssetIds.length > 0) {
      await run(`DELETE FROM assets WHERE id IN (${siteAssetInSql})`, siteAssetIds, ['assets']);
    } else {
      await run('DELETE FROM assets WHERE site_id = ?', [siteId], ['assets']);
    }
    await run('DELETE FROM asset_folders WHERE site_id = ?', [siteId], ['asset_folders']);

    await run('DELETE FROM visitor_groups WHERE site_id = ?', [siteId], ['visitor_groups']);
    await run('DELETE FROM component_type_settings WHERE site_id = ?', [siteId], ['component_type_settings']);

    await run('DELETE FROM site_locale_overrides WHERE site_id = ?', [siteId], ['site_locale_overrides']);
    await run('DELETE FROM site_market_locales WHERE site_id = ?', [siteId], ['site_market_locales']);
    // Split transaction before deleting site_locales/site_markets to avoid DuckDB FK visibility issues
    // on composite keys (site_market_locales -> site_locales/site_markets) in long transactions.
    await db.run('COMMIT');
    await db.run('BEGIN TRANSACTION');
    await run('DELETE FROM site_locales WHERE site_id = ?', [siteId], ['site_locales']);
    await run('DELETE FROM site_markets WHERE site_id = ?', [siteId], ['site_markets']);

    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  let storageDeleteFailures = 0;
  if (assetStorage && storagePathsToDelete.size > 0) {
    for (const storagePath of storagePathsToDelete) {
      try {
        await assetStorage.delete(storagePath);
      } catch {
        storageDeleteFailures += 1;
      }
    }
  }

  return {
    siteId,
    statementsExecuted,
    tablesTouched: Array.from(touchedTables).sort(),
    message:
      storageDeleteFailures > 0
        ? `Reset complete for site ${siteId}. Removed previous site data. File cleanup had ${storageDeleteFailures} warning(s).`
        : `Reset complete for site ${siteId}. Removed previous site data.`
  };
}
