import { GraphQLError } from 'graphql';

import type { DbClient } from '../db/DbClient.js';

export type ConnectorDomain = 'auth' | 'db' | 'dam' | 'ai';

export type ConnectorRecord = {
  id: number;
  domain: ConnectorDomain;
  type: string;
  name: string;
  enabled: boolean;
  isDefault: boolean;
  configJson: string;
  createdAt: string;
  updatedAt: string;
};

function invalid(message: string, code = 'BAD_USER_INPUT'): never {
  throw new GraphQLError(message, { extensions: { code } });
}

async function nextId(db: DbClient, table: string): Promise<number> {
  const row = await db.get<{ nextId: number }>(`SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM ${table}`);
  return row?.nextId ?? 1;
}

function parseObjectJson(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      invalid('configJson must be a JSON object');
    }
    return parsed as Record<string, unknown>;
  } catch {
    invalid('configJson must be valid JSON');
  }
}

export function maskConnectorConfig(type: string, configJson: string): string {
  const secretHints = ['secret', 'password', 'token', 'apikey', 'api_key', 'accesskey'];
  const parsed = parseObjectJson(configJson);
  const masked = Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => {
      const lower = key.toLowerCase();
      if (secretHints.some((entry) => lower.includes(entry)) && typeof value === 'string' && value.length > 0) {
        return [key, '********'];
      }
      return [key, value];
    })
  );
  return JSON.stringify(masked);
}

export async function listConnectors(db: DbClient, domain: ConnectorDomain): Promise<ConnectorRecord[]> {
  return db.all<ConnectorRecord>(
    `
SELECT
  id,
  domain,
  type,
  name,
  enabled,
  is_default as isDefault,
  config_json as configJson,
  CAST(created_at AS VARCHAR) as createdAt,
  CAST(updated_at AS VARCHAR) as updatedAt
FROM connectors
WHERE domain = ?
ORDER BY is_default DESC, name
`,
    [domain]
  );
}

export async function getConnector(db: DbClient, id: number): Promise<ConnectorRecord | null> {
  const row = await db.get<ConnectorRecord>(
    `
SELECT
  id,
  domain,
  type,
  name,
  enabled,
  is_default as isDefault,
  config_json as configJson,
  CAST(created_at AS VARCHAR) as createdAt,
  CAST(updated_at AS VARCHAR) as updatedAt
FROM connectors
WHERE id = ?
`,
    [id]
  );

  return row ?? null;
}

export async function upsertConnector(
  db: DbClient,
  input: {
    id?: number | null | undefined;
    domain: ConnectorDomain;
    type: string;
    name: string;
    enabled: boolean;
    isDefault: boolean;
    configJson: string;
  }
): Promise<ConnectorRecord> {
  parseObjectJson(input.configJson);

  const id = input.id ?? (await nextId(db, 'connectors'));

  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(
      `
INSERT INTO connectors(id, domain, type, name, enabled, is_default, config_json)
VALUES (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  domain = excluded.domain,
  type = excluded.type,
  name = excluded.name,
  enabled = excluded.enabled,
  is_default = excluded.is_default,
  config_json = excluded.config_json,
  updated_at = now()
`,
      [id, input.domain, input.type, input.name, input.enabled, input.isDefault, input.configJson]
    );

    if (input.isDefault) {
      await db.run(
        'UPDATE connectors SET is_default = FALSE, updated_at = now() WHERE domain = ? AND id <> ?',
        [input.domain, id]
      );
    }

    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  const row = await getConnector(db, id);
  if (!row) {
    throw new Error(`Connector ${id} not found after upsert`);
  }
  return row;
}

export async function deleteConnector(db: DbClient, id: number): Promise<boolean> {
  await db.run('DELETE FROM connectors WHERE id = ?', [id]);
  return true;
}

export async function setDefaultConnector(db: DbClient, domain: ConnectorDomain, id: number): Promise<ConnectorRecord> {
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('UPDATE connectors SET is_default = FALSE, updated_at = now() WHERE domain = ?', [domain]);
    await db.run(
      'UPDATE connectors SET is_default = TRUE, updated_at = now() WHERE id = ? AND domain = ?',
      [id, domain]
    );
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  const connector = await getConnector(db, id);
  if (!connector) {
    throw new GraphQLError(`Connector ${id} not found`, { extensions: { code: 'CONNECTOR_NOT_FOUND' } });
  }

  return connector;
}

export async function resolveDefaultConnector(
  db: DbClient,
  domain: ConnectorDomain
): Promise<ConnectorRecord | null> {
  const direct = await db.get<ConnectorRecord>(
    `
SELECT
  id,
  domain,
  type,
  name,
  enabled,
  is_default as isDefault,
  config_json as configJson,
  CAST(created_at AS VARCHAR) as createdAt,
  CAST(updated_at AS VARCHAR) as updatedAt
FROM connectors
WHERE domain = ? AND enabled = TRUE AND is_default = TRUE
LIMIT 1
`,
    [domain]
  );

  if (direct) {
    return direct;
  }

  return (
    (await db.get<ConnectorRecord>(
      `
SELECT
  id,
  domain,
  type,
  name,
  enabled,
  is_default as isDefault,
  config_json as configJson,
  CAST(created_at AS VARCHAR) as createdAt,
  CAST(updated_at AS VARCHAR) as updatedAt
FROM connectors
WHERE domain = ? AND enabled = TRUE
ORDER BY id
LIMIT 1
`,
      [domain]
    )) ?? null
  );
}

export async function testConnector(db: DbClient, id: number): Promise<string> {
  const connector = await getConnector(db, id);
  if (!connector) {
    throw new GraphQLError(`Connector ${id} not found`, { extensions: { code: 'CONNECTOR_NOT_FOUND' } });
  }

  const config = parseObjectJson(connector.configJson);

  if (connector.domain === 'auth' && connector.type === 'oidc') {
    if (!config.issuerUrl || !config.clientId) {
      return 'OIDC missing required issuerUrl/clientId';
    }
  }

  if (connector.domain === 'dam' && connector.type === 's3') {
    if (!config.bucket || !config.region) {
      return 'S3 missing required bucket/region';
    }
  }

  if (connector.domain === 'ai' && connector.type === 'openai_compatible') {
    if (!config.baseUrl || !config.model) {
      return 'OpenAI-compatible missing baseUrl/model';
    }
  }

  return 'Connector configuration looks valid';
}

export async function ensureBaselineConnectors(db: DbClient): Promise<void> {
  const defaults: Array<{
    domain: ConnectorDomain;
    type: string;
    name: string;
    config: Record<string, unknown>;
  }> = [
    { domain: 'auth', type: 'internal', name: 'Internal Auth', config: {} },
    { domain: 'db', type: 'duckdb', name: 'DuckDB', config: { path: 'data/contenthead.duckdb' } },
    { domain: 'dam', type: 'localfs', name: 'Local Files', config: {} },
    { domain: 'ai', type: 'mock', name: 'Mock AI', config: {} }
  ];

  for (const connector of defaults) {
    const existing = await db.get<{ id: number }>(
      'SELECT id FROM connectors WHERE domain = ? AND type = ? LIMIT 1',
      [connector.domain, connector.type]
    );
    if (existing) {
      continue;
    }
    await upsertConnector(db, {
      domain: connector.domain,
      type: connector.type,
      name: connector.name,
      enabled: true,
      isDefault: true,
      configJson: JSON.stringify(connector.config)
    });
  }
}
