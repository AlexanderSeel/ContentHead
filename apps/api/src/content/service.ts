import { GraphQLError } from 'graphql';

import type { DbClient } from '../db/DbClient.js';
import { validateMarketLocale } from '../marketLocale/service.js';

export type VersionState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ContentTypeRecord = {
  id: number;
  siteId: number;
  name: string;
  description: string | null;
  fieldsJson: string;
  allowedComponentsJson: string;
  componentAreaRestrictionsJson: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

export type ComponentTypeSettingRecord = {
  siteId: number;
  componentTypeId: string;
  enabled: boolean;
  groupName: string | null;
  updatedAt: string;
  updatedBy: string;
};

export type ContentItemRecord = {
  id: number;
  siteId: number;
  contentTypeId: number;
  archived: boolean;
  createdAt: string;
  createdBy: string;
  currentDraftVersionId: number | null;
  currentPublishedVersionId: number | null;
};

export type ContentVersionRecord = {
  id: number;
  contentItemId: number;
  versionNumber: number;
  state: VersionState;
  sourceVersionId: number | null;
  fieldsJson: string;
  compositionJson: string;
  componentsJson: string;
  metadataJson: string;
  comment: string | null;
  createdAt: string;
  createdBy: string;
};

export type TemplateRecord = {
  id: number;
  siteId: number;
  name: string;
  compositionJson: string;
  componentsJson: string;
  constraintsJson: string;
  updatedAt: string;
};

export type ContentRouteRecord = {
  id: number;
  siteId: number;
  contentItemId: number;
  marketCode: string;
  localeCode: string;
  slug: string;
  isCanonical: boolean;
  createdAt: string;
};

export type DiffResult = {
  summary: string;
  changedPaths: string[];
  leftVersionId: number;
  rightVersionId: number;
};

export type ResolvedRoute = {
  route: ContentRouteRecord;
  contentItem: ContentItemRecord;
  contentType: ContentTypeRecord;
  version: ContentVersionRecord | null;
  mode: 'PUBLISHED' | 'PREVIEW_DRAFT';
};

export type UpdateDraftPatch = {
  fieldsJson?: string | null | undefined;
  compositionJson?: string | null | undefined;
  componentsJson?: string | null | undefined;
  metadataJson?: string | null | undefined;
  comment?: string | null | undefined;
  createdBy?: string | null | undefined;
};

const emptyObjectJson = '{}';

function notFound(message: string, code = 'NOT_FOUND'): never {
  throw new GraphQLError(message, { extensions: { code } });
}

function invalidInput(message: string, code = 'BAD_USER_INPUT'): never {
  throw new GraphQLError(message, { extensions: { code } });
}

function parseJsonObject(value: string, name: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    invalidInput(`${name} must be a JSON object`);
  } catch {
    invalidInput(`${name} must be valid JSON`);
  }
}

function parseJsonAny(value: string, name: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    invalidInput(`${name} must be valid JSON`);
  }
}

function stringify(value: unknown): string {
  return JSON.stringify(value ?? {});
}

function normalizeSlug(slug: string): string {
  const trimmed = slug.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed || 'index';
}

function buildDiffPaths(a: unknown, b: unknown, prefix = ''): string[] {
  if (Object.is(a, b)) {
    return [];
  }

  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return [prefix || '$'];
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    return [prefix || '$'];
  }

  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const diff: string[] = [];
  for (const key of keys) {
    const path = prefix ? `${prefix}.${key}` : key;
    diff.push(...buildDiffPaths((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], path));
  }

  return diff;
}

async function nextId(db: DbClient, table: string): Promise<number> {
  const row = await db.get<{ nextId: number }>(`SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM ${table}`);
  return row?.nextId ?? 1;
}

async function nowTimestamp(db: DbClient): Promise<string> {
  const row = await db.get<{ ts: string }>('SELECT CAST(current_timestamp AS VARCHAR) as ts');
  return row?.ts ?? new Date().toISOString();
}

async function getContentItem(db: DbClient, contentItemId: number): Promise<ContentItemRecord> {
  const row = await db.get<ContentItemRecord>(
    `
SELECT
  id,
  site_id as siteId,
  content_type_id as contentTypeId,
  archived,
  created_at as createdAt,
  created_by as createdBy,
  current_draft_version_id as currentDraftVersionId,
  current_published_version_id as currentPublishedVersionId
FROM content_items
WHERE id = ?
`,
    [contentItemId]
  );

  if (!row) {
    notFound(`Content item ${contentItemId} not found`, 'CONTENT_ITEM_NOT_FOUND');
  }

  return row;
}

async function getVersion(db: DbClient, versionId: number): Promise<ContentVersionRecord> {
  const row = await db.get<ContentVersionRecord>(
    `
SELECT
  id,
  content_item_id as contentItemId,
  version_number as versionNumber,
  state,
  source_version_id as sourceVersionId,
  fields_json as fieldsJson,
  composition_json as compositionJson,
  components_json as componentsJson,
  metadata_json as metadataJson,
  comment,
  created_at as createdAt,
  created_by as createdBy
FROM content_versions
WHERE id = ?
`,
    [versionId]
  );

  if (!row) {
    notFound(`Version ${versionId} not found`, 'CONTENT_VERSION_NOT_FOUND');
  }

  return row;
}

async function getContentType(db: DbClient, contentTypeId: number): Promise<ContentTypeRecord> {
  try {
    const row = await db.get<ContentTypeRecord>(
      `
SELECT
  id,
  site_id as siteId,
  name,
  description,
  fields_json as fieldsJson,
  allowed_components_json as allowedComponentsJson,
  component_area_restrictions_json as componentAreaRestrictionsJson,
  created_at as createdAt,
  created_by as createdBy,
  updated_at as updatedAt,
  updated_by as updatedBy
FROM content_types
WHERE id = ?
`,
      [contentTypeId]
    );

    if (!row) {
      notFound(`Content type ${contentTypeId} not found`, 'CONTENT_TYPE_NOT_FOUND');
    }

    return row;
  } catch {
    const legacyRow = await db.get<
      Omit<ContentTypeRecord, 'allowedComponentsJson' | 'componentAreaRestrictionsJson'>
    >(
      `
SELECT
  id,
  site_id as siteId,
  name,
  description,
  fields_json as fieldsJson,
  created_at as createdAt,
  created_by as createdBy,
  updated_at as updatedAt,
  updated_by as updatedBy
FROM content_types
WHERE id = ?
`,
      [contentTypeId]
    );

    if (!legacyRow) {
      notFound(`Content type ${contentTypeId} not found`, 'CONTENT_TYPE_NOT_FOUND');
    }

    return {
      ...legacyRow,
      allowedComponentsJson: '[]',
      componentAreaRestrictionsJson: '{}'
    };
  }
}

async function nextVersionNumber(db: DbClient, contentItemId: number): Promise<number> {
  const row = await db.get<{ nextVersion: number }>(
    'SELECT COALESCE(MAX(version_number), 0) + 1 as nextVersion FROM content_versions WHERE content_item_id = ?',
    [contentItemId]
  );
  return row?.nextVersion ?? 1;
}

async function createVersion(db: DbClient, input: {
  contentItemId: number;
  state: VersionState;
  sourceVersionId?: number | null;
  fieldsJson: string;
  compositionJson: string;
  componentsJson: string;
  metadataJson: string;
  comment?: string | null;
  createdBy: string;
}): Promise<ContentVersionRecord> {
  const id = await nextId(db, 'content_versions');
  const versionNumber = await nextVersionNumber(db, input.contentItemId);

  await db.run(
    `
INSERT INTO content_versions(
  id,
  content_item_id,
  version_number,
  state,
  source_version_id,
  fields_json,
  composition_json,
  components_json,
  metadata_json,
  comment,
  created_by
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
    [
      id,
      input.contentItemId,
      versionNumber,
      input.state,
      input.sourceVersionId ?? null,
      input.fieldsJson,
      input.compositionJson,
      input.componentsJson,
      input.metadataJson,
      input.comment ?? null,
      input.createdBy
    ]
  );

  return getVersion(db, id);
}

export async function listContentTypes(db: DbClient, siteId: number): Promise<ContentTypeRecord[]> {
  try {
    return await db.all<ContentTypeRecord>(
      `
SELECT
  id,
  site_id as siteId,
  name,
  description,
  fields_json as fieldsJson,
  allowed_components_json as allowedComponentsJson,
  component_area_restrictions_json as componentAreaRestrictionsJson,
  created_at as createdAt,
  created_by as createdBy,
  updated_at as updatedAt,
  updated_by as updatedBy
FROM content_types
WHERE site_id = ?
ORDER BY name
`,
      [siteId]
    );
  } catch {
    const legacyRows = await db.all<
      Omit<ContentTypeRecord, 'allowedComponentsJson' | 'componentAreaRestrictionsJson'>
    >(
      `
SELECT
  id,
  site_id as siteId,
  name,
  description,
  fields_json as fieldsJson,
  created_at as createdAt,
  created_by as createdBy,
  updated_at as updatedAt,
  updated_by as updatedBy
FROM content_types
WHERE site_id = ?
ORDER BY name
`,
      [siteId]
    );
    return legacyRows.map((entry) => ({
      ...entry,
      allowedComponentsJson: '[]',
      componentAreaRestrictionsJson: '{}'
    }));
  }
}

export async function createContentType(db: DbClient, input: {
  siteId: number;
  name: string;
  description?: string | null | undefined;
  fieldsJson: string;
  allowedComponentsJson?: string | null | undefined;
  componentAreaRestrictionsJson?: string | null | undefined;
  by: string;
}): Promise<ContentTypeRecord> {
  parseJsonAny(input.fieldsJson, 'fieldsJson');
  parseJsonAny(input.allowedComponentsJson ?? '[]', 'allowedComponentsJson');
  parseJsonAny(input.componentAreaRestrictionsJson ?? '{}', 'componentAreaRestrictionsJson');
  const id = await nextId(db, 'content_types');

  await db.run(
    `
INSERT INTO content_types(
  id,
  site_id,
  name,
  description,
  fields_json,
  allowed_components_json,
  component_area_restrictions_json,
  created_by,
  updated_by
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
    [
      id,
      input.siteId,
      input.name,
      input.description ?? null,
      input.fieldsJson,
      input.allowedComponentsJson ?? '[]',
      input.componentAreaRestrictionsJson ?? '{}',
      input.by,
      input.by
    ]
  ).catch(async () => {
    await db.run(
      `
INSERT INTO content_types(id, site_id, name, description, fields_json, created_by, updated_by)
VALUES (?, ?, ?, ?, ?, ?, ?)
`,
      [id, input.siteId, input.name, input.description ?? null, input.fieldsJson, input.by, input.by]
    );
  });

  return getContentType(db, id);
}

export async function updateContentType(db: DbClient, input: {
  id: number;
  name: string;
  description?: string | null | undefined;
  fieldsJson: string;
  allowedComponentsJson?: string | null | undefined;
  componentAreaRestrictionsJson?: string | null | undefined;
  by: string;
}): Promise<ContentTypeRecord> {
  parseJsonAny(input.fieldsJson, 'fieldsJson');
  parseJsonAny(input.allowedComponentsJson ?? '[]', 'allowedComponentsJson');
  parseJsonAny(input.componentAreaRestrictionsJson ?? '{}', 'componentAreaRestrictionsJson');
  await getContentType(db, input.id);

  await db.run(
    `
UPDATE content_types
SET
  name = ?,
  description = ?,
  fields_json = ?,
  allowed_components_json = ?,
  component_area_restrictions_json = ?,
  updated_at = current_timestamp,
  updated_by = ?
WHERE id = ?
`,
    [
      input.name,
      input.description ?? null,
      input.fieldsJson,
      input.allowedComponentsJson ?? '[]',
      input.componentAreaRestrictionsJson ?? '{}',
      input.by,
      input.id
    ]
  ).catch(async () => {
    await db.run(
      `
UPDATE content_types
SET
  name = ?,
  description = ?,
  fields_json = ?,
  updated_at = current_timestamp,
  updated_by = ?
WHERE id = ?
`,
      [input.name, input.description ?? null, input.fieldsJson, input.by, input.id]
    );
  });

  return getContentType(db, input.id);
}

export async function listComponentTypeSettings(
  db: DbClient,
  siteId: number
): Promise<ComponentTypeSettingRecord[]> {
  await ensureComponentTypeSettingsTable(db);
  return db.all<ComponentTypeSettingRecord>(
    `
SELECT
  site_id as siteId,
  component_type_id as componentTypeId,
  enabled,
  group_name as groupName,
  updated_at as updatedAt,
  updated_by as updatedBy
FROM component_type_settings
WHERE site_id = ?
ORDER BY component_type_id
`,
    [siteId]
  );
}

export async function upsertComponentTypeSetting(
  db: DbClient,
  input: {
    siteId: number;
    componentTypeId: string;
    enabled: boolean;
    groupName?: string | null | undefined;
    by: string;
  }
): Promise<ComponentTypeSettingRecord> {
  const normalizedTypeId = input.componentTypeId.trim();
  if (!normalizedTypeId) {
    invalidInput('componentTypeId is required');
  }

  await ensureComponentTypeSettingsTable(db);
  const updatedAt = new Date().toISOString();

  await db.run(
    `
DELETE FROM component_type_settings
WHERE site_id = ? AND component_type_id = ?
`,
    [input.siteId, normalizedTypeId]
  );

  await db.run(
    `
INSERT INTO component_type_settings(
  site_id,
  component_type_id,
  enabled,
  group_name,
  updated_at,
  updated_by
)
VALUES (?, ?, ?, ?, ?, ?)
`,
    [input.siteId, normalizedTypeId, input.enabled, input.groupName ?? null, updatedAt, input.by]
  );

  const row = await db.get<ComponentTypeSettingRecord>(
    `
SELECT
  site_id as siteId,
  component_type_id as componentTypeId,
  enabled,
  group_name as groupName,
  updated_at as updatedAt,
  updated_by as updatedBy
FROM component_type_settings
WHERE site_id = ? AND component_type_id = ?
`,
    [input.siteId, normalizedTypeId]
  );

  if (!row) {
    notFound(
      `Component type setting not found for site ${input.siteId} and type ${normalizedTypeId}`,
      'COMPONENT_TYPE_SETTING_NOT_FOUND'
    );
  }

  return row;
}

async function ensureComponentTypeSettingsTable(db: DbClient): Promise<void> {
  await db.run(`
CREATE TABLE IF NOT EXISTS component_type_settings (
  site_id INTEGER,
  component_type_id VARCHAR,
  enabled BOOLEAN DEFAULT TRUE,
  group_name VARCHAR,
  updated_at TIMESTAMP,
  updated_by VARCHAR
);
`);

  await db.run('ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS component_type_id VARCHAR');
  await db.run('ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE');
  await db.run('ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS group_name VARCHAR');
  await db.run('ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP');
  await db.run('ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS updated_by VARCHAR');
}

export async function deleteContentType(db: DbClient, id: number): Promise<boolean> {
  const referenced = await db.get<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM content_items WHERE content_type_id = ?',
    [id]
  );
  if ((referenced?.cnt ?? 0) > 0) {
    invalidInput(`Content type ${id} is in use and cannot be deleted`, 'CONTENT_TYPE_IN_USE');
  }

  await db.run('DELETE FROM content_types WHERE id = ?', [id]);
  return true;
}

export async function createContentItem(db: DbClient, input: {
  siteId: number;
  contentTypeId: number;
  by: string;
  initialFieldsJson?: string | null | undefined;
  initialCompositionJson?: string | null | undefined;
  initialComponentsJson?: string | null | undefined;
  metadataJson?: string | null | undefined;
  comment?: string | null | undefined;
}): Promise<ContentItemRecord> {
  const type = await getContentType(db, input.contentTypeId);
  if (type.siteId !== input.siteId) {
    invalidInput('contentTypeId does not belong to siteId', 'CONTENT_TYPE_SITE_MISMATCH');
  }

  const id = await nextId(db, 'content_items');

  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(
      `
INSERT INTO content_items(id, site_id, content_type_id, archived, created_by)
VALUES (?, ?, ?, FALSE, ?)
`,
      [id, input.siteId, input.contentTypeId, input.by]
    );

    const draft = await createVersion(db, {
      contentItemId: id,
      state: 'DRAFT',
      sourceVersionId: null,
      fieldsJson: input.initialFieldsJson ?? emptyObjectJson,
      compositionJson: input.initialCompositionJson ?? stringify({ areas: [{ name: 'main', components: [] }] }),
      componentsJson: input.initialComponentsJson ?? emptyObjectJson,
      metadataJson: input.metadataJson ?? emptyObjectJson,
      comment: input.comment ?? 'Initial draft',
      createdBy: input.by
    });

    await db.run('UPDATE content_items SET current_draft_version_id = ? WHERE id = ?', [draft.id, id]);

    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  return getContentItem(db, id);
}

export async function listContentItems(db: DbClient, siteId: number): Promise<ContentItemRecord[]> {
  return db.all<ContentItemRecord>(
    `
SELECT
  id,
  site_id as siteId,
  content_type_id as contentTypeId,
  archived,
  created_at as createdAt,
  created_by as createdBy,
  current_draft_version_id as currentDraftVersionId,
  current_published_version_id as currentPublishedVersionId
FROM content_items
WHERE site_id = ?
ORDER BY id DESC
`,
    [siteId]
  );
}

export async function archiveContentItem(db: DbClient, id: number, archived: boolean): Promise<ContentItemRecord> {
  await getContentItem(db, id);
  await db.run('UPDATE content_items SET archived = ? WHERE id = ?', [archived, id]);
  return getContentItem(db, id);
}

export async function listVersions(db: DbClient, contentItemId: number): Promise<ContentVersionRecord[]> {
  await getContentItem(db, contentItemId);
  return db.all<ContentVersionRecord>(
    `
SELECT
  id,
  content_item_id as contentItemId,
  version_number as versionNumber,
  state,
  source_version_id as sourceVersionId,
  fields_json as fieldsJson,
  composition_json as compositionJson,
  components_json as componentsJson,
  metadata_json as metadataJson,
  comment,
  created_at as createdAt,
  created_by as createdBy
FROM content_versions
WHERE content_item_id = ?
ORDER BY version_number DESC
`,
    [contentItemId]
  );
}

export async function createDraftVersion(db: DbClient, input: {
  contentItemId: number;
  fromVersionId?: number | null | undefined;
  comment?: string | null | undefined;
  by: string;
}): Promise<ContentVersionRecord> {
  const item = await getContentItem(db, input.contentItemId);

  const baseVersionId =
    input.fromVersionId ?? item.currentDraftVersionId ?? item.currentPublishedVersionId ?? null;

  let fieldsJson = emptyObjectJson;
  let compositionJson = stringify({ areas: [{ name: 'main', components: [] }] });
  let componentsJson = emptyObjectJson;
  let metadataJson = emptyObjectJson;

  if (baseVersionId) {
    const base = await getVersion(db, baseVersionId);
    if (base.contentItemId !== input.contentItemId) {
      invalidInput('fromVersionId does not belong to contentItemId', 'VERSION_ITEM_MISMATCH');
    }
    fieldsJson = base.fieldsJson;
    compositionJson = base.compositionJson;
    componentsJson = base.componentsJson;
    metadataJson = base.metadataJson;
  }

  const draft = await createVersion(db, {
    contentItemId: input.contentItemId,
    state: 'DRAFT',
    sourceVersionId: baseVersionId,
    fieldsJson,
    compositionJson,
    componentsJson,
    metadataJson,
    comment: input.comment ?? 'Create draft',
    createdBy: input.by
  });

  await db.run('UPDATE content_items SET current_draft_version_id = ? WHERE id = ?', [draft.id, input.contentItemId]);
  return draft;
}

export async function updateDraftVersion(db: DbClient, input: {
  versionId: number;
  patch: UpdateDraftPatch;
  expectedVersionNumber: number;
}): Promise<ContentVersionRecord> {
  const base = await getVersion(db, input.versionId);
  if (base.state !== 'DRAFT') {
    invalidInput('Only DRAFT versions can be updated', 'INVALID_VERSION_STATE');
  }

  if (base.versionNumber !== input.expectedVersionNumber) {
    invalidInput('Version conflict detected', 'VERSION_CONFLICT');
  }

  const fields = parseJsonObject(base.fieldsJson, 'fieldsJson');
  const composition = parseJsonObject(base.compositionJson, 'compositionJson');
  const components = parseJsonObject(base.componentsJson, 'componentsJson');
  const metadata = parseJsonObject(base.metadataJson, 'metadataJson');

  const fieldsPatch = input.patch.fieldsJson ? parseJsonObject(input.patch.fieldsJson, 'patch.fieldsJson') : {};
  const compositionPatch = input.patch.compositionJson
    ? parseJsonObject(input.patch.compositionJson, 'patch.compositionJson')
    : {};
  const componentsPatch = input.patch.componentsJson
    ? parseJsonObject(input.patch.componentsJson, 'patch.componentsJson')
    : {};
  const metadataPatch = input.patch.metadataJson
    ? parseJsonObject(input.patch.metadataJson, 'patch.metadataJson')
    : {};

  const nextComponents = input.patch.componentsJson ? componentsPatch : components;

  const next = await createVersion(db, {
    contentItemId: base.contentItemId,
    state: 'DRAFT',
    sourceVersionId: base.id,
    fieldsJson: stringify({ ...fields, ...fieldsPatch }),
    compositionJson: stringify({ ...composition, ...compositionPatch }),
    componentsJson: stringify(nextComponents),
    metadataJson: stringify({ ...metadata, ...metadataPatch }),
    comment: input.patch.comment ?? 'Update draft',
    createdBy: input.patch.createdBy ?? base.createdBy
  });

  await db.run('UPDATE content_items SET current_draft_version_id = ? WHERE id = ?', [next.id, base.contentItemId]);
  return next;
}

export async function publishVersion(db: DbClient, input: {
  versionId: number;
  expectedVersionNumber: number;
  by: string;
  comment?: string | null | undefined;
}): Promise<ContentVersionRecord> {
  const base = await getVersion(db, input.versionId);
  if (base.versionNumber !== input.expectedVersionNumber) {
    invalidInput('Version conflict detected', 'VERSION_CONFLICT');
  }

  const published = await createVersion(db, {
    contentItemId: base.contentItemId,
    state: 'PUBLISHED',
    sourceVersionId: base.id,
    fieldsJson: base.fieldsJson,
    compositionJson: base.compositionJson,
    componentsJson: base.componentsJson,
    metadataJson: base.metadataJson,
    comment: input.comment ?? 'Publish version',
    createdBy: input.by
  });

  await db.run(
    'UPDATE content_items SET current_published_version_id = ?, current_draft_version_id = ? WHERE id = ?',
    [published.id, base.id, base.contentItemId]
  );

  return published;
}

export async function diffVersions(db: DbClient, leftVersionId: number, rightVersionId: number): Promise<DiffResult> {
  const left = await getVersion(db, leftVersionId);
  const right = await getVersion(db, rightVersionId);

  if (left.contentItemId !== right.contentItemId) {
    invalidInput('Versions must belong to the same content item', 'VERSION_ITEM_MISMATCH');
  }

  const leftPayload = {
    fields: parseJsonAny(left.fieldsJson, 'left.fieldsJson'),
    composition: parseJsonAny(left.compositionJson, 'left.compositionJson'),
    components: parseJsonAny(left.componentsJson, 'left.componentsJson'),
    metadata: parseJsonAny(left.metadataJson, 'left.metadataJson')
  };
  const rightPayload = {
    fields: parseJsonAny(right.fieldsJson, 'right.fieldsJson'),
    composition: parseJsonAny(right.compositionJson, 'right.compositionJson'),
    components: parseJsonAny(right.componentsJson, 'right.componentsJson'),
    metadata: parseJsonAny(right.metadataJson, 'right.metadataJson')
  };

  const changedPaths = buildDiffPaths(leftPayload, rightPayload);

  return {
    summary: changedPaths.length === 0 ? 'No differences' : `${changedPaths.length} changed paths`,
    changedPaths,
    leftVersionId,
    rightVersionId
  };
}

export async function rollbackToVersion(db: DbClient, input: {
  contentItemId: number;
  versionId: number;
  by: string;
}): Promise<ContentVersionRecord> {
  const source = await getVersion(db, input.versionId);
  if (source.contentItemId !== input.contentItemId) {
    invalidInput('Rollback source version does not belong to content item', 'VERSION_ITEM_MISMATCH');
  }

  const draft = await createVersion(db, {
    contentItemId: input.contentItemId,
    state: 'DRAFT',
    sourceVersionId: source.id,
    fieldsJson: source.fieldsJson,
    compositionJson: source.compositionJson,
    componentsJson: source.componentsJson,
    metadataJson: source.metadataJson,
    comment: `Rollback to version ${source.versionNumber}`,
    createdBy: input.by
  });

  await db.run('UPDATE content_items SET current_draft_version_id = ? WHERE id = ?', [
    draft.id,
    input.contentItemId
  ]);

  return draft;
}

export async function listTemplates(db: DbClient, siteId: number): Promise<TemplateRecord[]> {
  return db.all<TemplateRecord>(
    `
SELECT
  id,
  site_id as siteId,
  name,
  composition_json as compositionJson,
  components_json as componentsJson,
  constraints_json as constraintsJson,
  updated_at as updatedAt
FROM templates
WHERE site_id = ?
ORDER BY name
`,
    [siteId]
  );
}

export async function createTemplate(db: DbClient, input: {
  siteId: number;
  name: string;
  compositionJson: string;
  componentsJson: string;
  constraintsJson: string;
}): Promise<TemplateRecord> {
  parseJsonAny(input.compositionJson, 'compositionJson');
  parseJsonAny(input.componentsJson, 'componentsJson');
  parseJsonAny(input.constraintsJson, 'constraintsJson');

  const id = await nextId(db, 'templates');

  await db.run(
    `
INSERT INTO templates(id, site_id, name, composition_json, components_json, constraints_json)
VALUES (?, ?, ?, ?, ?, ?)
`,
    [id, input.siteId, input.name, input.compositionJson, input.componentsJson, input.constraintsJson]
  );

  const row = await db.get<TemplateRecord>(
    `
SELECT
  id,
  site_id as siteId,
  name,
  composition_json as compositionJson,
  components_json as componentsJson,
  constraints_json as constraintsJson,
  updated_at as updatedAt
FROM templates
WHERE id = ?
`,
    [id]
  );

  if (!row) {
    notFound(`Template ${id} not found after create`, 'TEMPLATE_NOT_FOUND');
  }

  return row;
}

export async function updateTemplate(db: DbClient, input: {
  id: number;
  name: string;
  compositionJson: string;
  componentsJson: string;
  constraintsJson: string;
}): Promise<TemplateRecord> {
  parseJsonAny(input.compositionJson, 'compositionJson');
  parseJsonAny(input.componentsJson, 'componentsJson');
  parseJsonAny(input.constraintsJson, 'constraintsJson');

  await db.run(
    `
UPDATE templates
SET
  name = ?,
  composition_json = ?,
  components_json = ?,
  constraints_json = ?,
  updated_at = current_timestamp
WHERE id = ?
`,
    [input.name, input.compositionJson, input.componentsJson, input.constraintsJson, input.id]
  );

  const row = await db.get<TemplateRecord>(
    `
SELECT
  id,
  site_id as siteId,
  name,
  composition_json as compositionJson,
  components_json as componentsJson,
  constraints_json as constraintsJson,
  updated_at as updatedAt
FROM templates
WHERE id = ?
`,
    [input.id]
  );

  if (!row) {
    notFound(`Template ${input.id} not found`, 'TEMPLATE_NOT_FOUND');
  }

  return row;
}

export async function deleteTemplate(db: DbClient, id: number): Promise<boolean> {
  await db.run('DELETE FROM templates WHERE id = ?', [id]);
  return true;
}

export async function reconcileTemplate(db: DbClient, templateId: number): Promise<DiffResult> {
  const template = await db.get<TemplateRecord>(
    `
SELECT
  id,
  site_id as siteId,
  name,
  composition_json as compositionJson,
  components_json as componentsJson,
  constraints_json as constraintsJson,
  updated_at as updatedAt
FROM templates
WHERE id = ?
`,
    [templateId]
  );

  if (!template) {
    notFound(`Template ${templateId} not found`, 'TEMPLATE_NOT_FOUND');
  }

  const constraints = parseJsonObject(template.constraintsJson, 'constraintsJson');
  const requiredFields = Array.isArray(constraints.requiredFields)
    ? constraints.requiredFields.filter((entry): entry is string => typeof entry === 'string')
    : [];
  const composition = parseJsonAny(template.compositionJson, 'compositionJson');
  const changedPaths = requiredFields.map((field) => `required.${field}`);

  return {
    summary:
      requiredFields.length === 0
        ? 'No template constraints to reconcile'
        : `Suggested ${requiredFields.length} required field checks`,
    changedPaths: [...changedPaths, 'composition'],
    leftVersionId: templateId,
    rightVersionId: templateId
  };
}

export async function listRoutes(db: DbClient, input: {
  siteId: number;
  marketCode?: string | null | undefined;
  localeCode?: string | null | undefined;
}): Promise<ContentRouteRecord[]> {
  const clauses = ['site_id = ?'];
  const params: unknown[] = [input.siteId];

  if (input.marketCode) {
    clauses.push('market_code = ?');
    params.push(input.marketCode);
  }

  if (input.localeCode) {
    clauses.push('locale_code = ?');
    params.push(input.localeCode);
  }

  return db.all<ContentRouteRecord>(
    `
SELECT
  id,
  site_id as siteId,
  content_item_id as contentItemId,
  market_code as marketCode,
  locale_code as localeCode,
  slug,
  is_canonical as isCanonical,
  created_at as createdAt
FROM content_routes
WHERE ${clauses.join(' AND ')}
ORDER BY slug
`,
    params
  );
}

export async function upsertRoute(db: DbClient, input: {
  id?: number | null | undefined;
  siteId: number;
  contentItemId: number;
  marketCode: string;
  localeCode: string;
  slug: string;
  isCanonical: boolean;
}): Promise<ContentRouteRecord> {
  await validateMarketLocale(db, input.siteId, input.marketCode, input.localeCode);

  const item = await getContentItem(db, input.contentItemId);
  if (item.siteId !== input.siteId) {
    invalidInput('contentItemId does not belong to siteId', 'CONTENT_ITEM_SITE_MISMATCH');
  }

  const slug = normalizeSlug(input.slug);
  const id = input.id ?? (await nextId(db, 'content_routes'));

  await db.run(
    `
INSERT INTO content_routes(id, site_id, content_item_id, market_code, locale_code, slug, is_canonical)
VALUES (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  site_id = excluded.site_id,
  content_item_id = excluded.content_item_id,
  market_code = excluded.market_code,
  locale_code = excluded.locale_code,
  slug = excluded.slug,
  is_canonical = excluded.is_canonical
`,
    [id, input.siteId, input.contentItemId, input.marketCode, input.localeCode, slug, input.isCanonical]
  );

  const row = await db.get<ContentRouteRecord>(
    `
SELECT
  id,
  site_id as siteId,
  content_item_id as contentItemId,
  market_code as marketCode,
  locale_code as localeCode,
  slug,
  is_canonical as isCanonical,
  created_at as createdAt
FROM content_routes
WHERE id = ?
`,
    [id]
  );

  if (!row) {
    notFound(`Route ${id} not found`, 'ROUTE_NOT_FOUND');
  }

  return row;
}

export async function deleteRoute(db: DbClient, id: number): Promise<boolean> {
  await db.run('DELETE FROM content_routes WHERE id = ?', [id]);
  return true;
}

export async function resolveRoute(db: DbClient, input: {
  siteId: number;
  marketCode: string;
  localeCode: string;
  slug: string;
  previewAllowed: boolean;
}): Promise<ResolvedRoute | null> {
  await validateMarketLocale(db, input.siteId, input.marketCode, input.localeCode);

  const row = await db.get<ContentRouteRecord>(
    `
SELECT
  id,
  site_id as siteId,
  content_item_id as contentItemId,
  market_code as marketCode,
  locale_code as localeCode,
  slug,
  is_canonical as isCanonical,
  created_at as createdAt
FROM content_routes
WHERE site_id = ?
  AND market_code = ?
  AND locale_code = ?
  AND slug = ?
LIMIT 1
`,
    [input.siteId, input.marketCode, input.localeCode, normalizeSlug(input.slug)]
  );

  if (!row) {
    return null;
  }

  const item = await getContentItem(db, row.contentItemId);
  const contentType = await getContentType(db, item.contentTypeId);

  const selectedVersionId =
    input.previewAllowed && item.currentDraftVersionId
      ? item.currentDraftVersionId
      : item.currentPublishedVersionId;

  const version = selectedVersionId ? await getVersion(db, selectedVersionId) : null;

  return {
    route: row,
    contentItem: item,
    contentType,
    version,
    mode: input.previewAllowed && item.currentDraftVersionId ? 'PREVIEW_DRAFT' : 'PUBLISHED'
  };
}

export async function getContentItemDetail(db: DbClient, contentItemId: number): Promise<{
  item: ContentItemRecord;
  contentType: ContentTypeRecord;
  currentDraftVersion: ContentVersionRecord | null;
  currentPublishedVersion: ContentVersionRecord | null;
}> {
  const item = await getContentItem(db, contentItemId);
  const contentType = await getContentType(db, item.contentTypeId);
  const currentDraftVersion = item.currentDraftVersionId ? await getVersion(db, item.currentDraftVersionId) : null;
  const currentPublishedVersion = item.currentPublishedVersionId
    ? await getVersion(db, item.currentPublishedVersionId)
    : null;

  return {
    item,
    contentType,
    currentDraftVersion,
    currentPublishedVersion
  };
}

export async function issuePreviewTokenPayload(db: DbClient, contentItemId: number): Promise<{
  contentItemId: number;
  issuedAt: string;
}> {
  await getContentItem(db, contentItemId);
  return {
    contentItemId,
    issuedAt: await nowTimestamp(db)
  };
}
