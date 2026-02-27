import { GraphQLError } from 'graphql';

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
