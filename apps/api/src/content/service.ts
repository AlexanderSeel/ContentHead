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
  label: string | null;
  groupName: string | null;
  schemaJson: string | null;
  uiMetaJson: string | null;
  defaultPropsJson: string | null;
  updatedAt: string;
  updatedBy: string;
};

export type ContentItemRecord = {
  id: number;
  siteId: number;
  contentTypeId: number;
  parentId: number | null;
  sortOrder: number;
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

export type PageTreeNode = {
  id: number;
  title: string;
  slug: string;
  status: 'Draft' | 'Published' | 'New';
  children: PageTreeNode[];
  parentId: number | null;
  sortOrder: number;
  route: ContentRouteRecord | null;
};

export type UpdateDraftPatch = {
  fieldsJson?: string | null | undefined;
  compositionJson?: string | null | undefined;
  componentsJson?: string | null | undefined;
  metadataJson?: string | null | undefined;
  comment?: string | null | undefined;
  createdBy?: string | null | undefined;
};

export type ComponentInstanceRecord = {
  instanceId: string;
  componentTypeId: string;
  area: string;
  sortOrder: number;
  props: Record<string, unknown>;
};

const emptyObjectJson = '{}';
const emptyArrayJson = '[]';

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

function parseCompositionAreas(value: string): Array<{ name: string; components: string[] }> {
  const parsed = parseJsonAny(value, 'compositionJson');
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return [];
  }
  const areasRaw = (parsed as { areas?: unknown }).areas;
  if (!Array.isArray(areasRaw)) {
    return [];
  }
  return areasRaw
    .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
    .map((entry) => {
      const typed = entry as { name?: unknown; components?: unknown };
      return {
        name: typeof typed.name === 'string' && typed.name.trim() ? typed.name.trim() : 'main',
        components: Array.isArray(typed.components)
          ? typed.components.filter((componentId): componentId is string => typeof componentId === 'string')
          : []
      };
    });
}

function normalizeComponentInstances(
  componentsJson: string,
  compositionJson: string
): ComponentInstanceRecord[] {
  const parsed = parseJsonAny(componentsJson, 'componentsJson');
  if (Array.isArray(parsed)) {
    return parsed
      .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
      .map((entry) => {
        const typed = entry as Record<string, unknown>;
        const props = typed.props;
        return {
          instanceId:
            typeof typed.instanceId === 'string' && typed.instanceId.trim()
              ? typed.instanceId.trim()
              : '',
          componentTypeId:
            typeof typed.componentTypeId === 'string' && typed.componentTypeId.trim()
              ? typed.componentTypeId.trim()
              : 'text_block',
          area: typeof typed.area === 'string' && typed.area.trim() ? typed.area.trim() : 'main',
          sortOrder:
            typeof typed.sortOrder === 'number' && Number.isFinite(typed.sortOrder)
              ? Math.max(0, Math.floor(typed.sortOrder))
              : 0,
          props:
            props && typeof props === 'object' && !Array.isArray(props)
              ? (props as Record<string, unknown>)
              : {}
        };
      })
      .filter((entry) => entry.instanceId.length > 0);
  }

  if (!parsed || typeof parsed !== 'object') {
    return [];
  }

  const map = parsed as Record<string, { type?: unknown; props?: unknown }>;
  const areas = parseCompositionAreas(compositionJson);
  const areaLookup = new Map<string, { area: string; sortOrder: number }>();
  for (const area of areas) {
    area.components.forEach((instanceId, index) => {
      areaLookup.set(instanceId, { area: area.name, sortOrder: index });
    });
  }

  return Object.entries(map).map(([instanceId, value], fallbackIndex) => ({
    instanceId,
    componentTypeId:
      typeof value?.type === 'string' && value.type.trim() ? value.type.trim() : 'text_block',
    area: areaLookup.get(instanceId)?.area ?? 'main',
    sortOrder: areaLookup.get(instanceId)?.sortOrder ?? fallbackIndex,
    props:
      value?.props && typeof value.props === 'object' && !Array.isArray(value.props)
        ? (value.props as Record<string, unknown>)
        : {}
  }));
}

function sortAndNormalizeInstances(instances: ComponentInstanceRecord[]): ComponentInstanceRecord[] {
  const grouped = new Map<string, ComponentInstanceRecord[]>();
  for (const instance of instances) {
    const bucket = grouped.get(instance.area) ?? [];
    bucket.push(instance);
    grouped.set(instance.area, bucket);
  }

  const normalized: ComponentInstanceRecord[] = [];
  for (const [area, entries] of grouped.entries()) {
    entries
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((entry, index) => {
        normalized.push({ ...entry, area, sortOrder: index });
      });
  }
  return normalized;
}

function compositionFromInstances(instances: ComponentInstanceRecord[]): string {
  const grouped = new Map<string, string[]>();
  for (const instance of sortAndNormalizeInstances(instances)) {
    const bucket = grouped.get(instance.area) ?? [];
    bucket.push(instance.instanceId);
    grouped.set(instance.area, bucket);
  }
  return stringify({
    areas: Array.from(grouped.entries()).map(([name, components]) => ({ name, components }))
  });
}

async function writeDraftWithComponentInstances(db: DbClient, input: {
  base: ContentVersionRecord;
  instances: ComponentInstanceRecord[];
  comment: string;
  createdBy: string;
}): Promise<ContentVersionRecord> {
  const normalized = sortAndNormalizeInstances(input.instances);
  const next = await createVersion(db, {
    contentItemId: input.base.contentItemId,
    state: 'DRAFT',
    sourceVersionId: input.base.id,
    fieldsJson: input.base.fieldsJson,
    compositionJson: compositionFromInstances(normalized),
    componentsJson: stringify(normalized),
    metadataJson: input.base.metadataJson,
    comment: input.comment,
    createdBy: input.createdBy
  });
  await db.run('UPDATE content_items SET current_draft_version_id = ? WHERE id = ?', [
    next.id,
    input.base.contentItemId
  ]);
  return next;
}

function generateInstanceId(componentTypeId: string): string {
  const salt = Math.random().toString(36).slice(2, 8);
  return `${componentTypeId}_${Date.now()}_${salt}`;
}

async function findDraftVersionByInstanceId(
  db: DbClient,
  instanceId: string
): Promise<{ version: ContentVersionRecord; instances: ComponentInstanceRecord[] } | null> {
  const draftRows = await db.all<{
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
  }>(
    `
SELECT
  cv.id,
  cv.content_item_id as contentItemId,
  cv.version_number as versionNumber,
  cv.state,
  cv.source_version_id as sourceVersionId,
  cv.fields_json as fieldsJson,
  cv.composition_json as compositionJson,
  cv.components_json as componentsJson,
  cv.metadata_json as metadataJson,
  cv.comment,
  cv.created_at as createdAt,
  cv.created_by as createdBy
FROM content_versions cv
INNER JOIN content_items ci ON ci.current_draft_version_id = cv.id
WHERE cv.state = 'DRAFT'
ORDER BY cv.id DESC
`
  );

  for (const row of draftRows) {
    const instances = normalizeComponentInstances(row.componentsJson, row.compositionJson);
    if (instances.some((entry) => entry.instanceId === instanceId)) {
      return { version: row, instances };
    }
  }
  return null;
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

function readTitleFromVersion(version: ContentVersionRecord | null): string {
  if (!version) {
    return '';
  }
  try {
    const parsed = JSON.parse(version.fieldsJson) as Record<string, unknown>;
    if (typeof parsed.title === 'string' && parsed.title.trim()) {
      return parsed.title.trim();
    }
    if (typeof parsed.name === 'string' && parsed.name.trim()) {
      return parsed.name.trim();
    }
    if (typeof parsed.headline === 'string' && parsed.headline.trim()) {
      return parsed.headline.trim();
    }
    return '';
  } catch {
    return '';
  }
}

function contentStatusOf(item: ContentItemRecord): 'Draft' | 'Published' | 'New' {
  if (item.currentDraftVersionId) {
    return 'Draft';
  }
  if (item.currentPublishedVersionId) {
    return 'Published';
  }
  return 'New';
}

async function getNextSiblingSortOrder(db: DbClient, siteId: number, parentId: number | null): Promise<number> {
  const row = await db.get<{ nextSort: number }>(
    `
SELECT COALESCE(MAX(sort_order), -1) + 1 as nextSort
FROM content_items
WHERE site_id = ?
  AND (
    (parent_id IS NULL AND ? IS NULL)
    OR parent_id = ?
  )
`,
    [siteId, parentId, parentId]
  );
  return row?.nextSort ?? 0;
}

async function ensureValidParent(
  db: DbClient,
  siteId: number,
  pageId: number,
  candidateParentId: number | null
): Promise<void> {
  if (candidateParentId == null) {
    return;
  }
  if (candidateParentId === pageId) {
    invalidInput('A page cannot be its own parent', 'INVALID_PARENT');
  }

  const parent = await getContentItem(db, candidateParentId);
  if (parent.siteId !== siteId) {
    invalidInput('newParentId does not belong to the same site', 'CONTENT_ITEM_SITE_MISMATCH');
  }

  let cursor: ContentItemRecord | null = parent;
  while (cursor) {
    if (cursor.parentId === pageId) {
      invalidInput('Cannot move a page into its own descendant', 'INVALID_PARENT');
    }
    cursor = cursor.parentId ? await getContentItem(db, cursor.parentId) : null;
  }
}

async function getContentItem(db: DbClient, contentItemId: number): Promise<ContentItemRecord> {
  const row = await db.get<ContentItemRecord>(
    `
SELECT
  id,
  site_id as siteId,
  content_type_id as contentTypeId,
  parent_id as parentId,
  COALESCE(sort_order, 0) as sortOrder,
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

type ComponentPreset = {
  componentTypeId: string;
  label: string;
  groupName: string;
  enabled: boolean;
  schema: Array<{
    key: string;
    label: string;
    type: string;
    required?: boolean;
    defaultValue?: unknown;
    control?: string;
    options?: Array<{ label: string; value: string }>;
    itemLabelKey?: string;
    fields?: Array<{
      key: string;
      label: string;
      type: string;
      required?: boolean;
      defaultValue?: unknown;
      control?: string;
      options?: Array<{ label: string; value: string }>;
      refComponentTypes?: string[];
    }>;
    refComponentTypes?: string[];
  }>;
  defaultProps: Record<string, unknown>;
};

const COMPONENT_PRESETS: ComponentPreset[] = [
  {
    componentTypeId: 'hero',
    label: 'Hero',
    groupName: 'Marketing',
    enabled: true,
    schema: [
      { key: 'title', label: 'Title', type: 'text', required: true, defaultValue: 'Ship faster with ContentHead' },
      { key: 'subtitle', label: 'Subtitle', type: 'multiline', defaultValue: 'Compose pages visually, localize, personalize, and deploy with confidence.' },
      { key: 'primaryCta', label: 'Primary CTA', type: 'contentLink', control: 'LinkPicker' },
      { key: 'secondaryCta', label: 'Secondary CTA', type: 'contentLink', control: 'LinkPicker' },
      { key: 'backgroundAssetRef', label: 'Background Asset', type: 'assetRef', control: 'AssetPicker' }
    ],
    defaultProps: {
      title: 'Ship faster with ContentHead',
      subtitle: 'Compose pages visually, localize, personalize, and deploy with confidence.',
      primaryCta: { kind: 'internal', url: '/demo#pricing', text: 'View Pricing', target: '_self' },
      secondaryCta: { kind: 'external', url: 'https://example.com/docs', text: 'Read Docs', target: '_blank' },
      backgroundAssetRef: null
    }
  },
  {
    componentTypeId: 'feature_grid_item',
    label: 'Feature Grid Item',
    groupName: 'Marketing',
    enabled: true,
    schema: [
      { key: 'icon', label: 'Icon', type: 'text', defaultValue: 'pi-bolt' },
      { key: 'title', label: 'Title', type: 'text', required: true, defaultValue: 'Feature title' },
      { key: 'description', label: 'Description', type: 'multiline', required: true, defaultValue: 'Feature description' }
    ],
    defaultProps: {
      icon: 'pi-bolt',
      title: 'Feature title',
      description: 'Feature description'
    }
  },
  {
    componentTypeId: 'feature_grid',
    label: 'Feature Grid',
    groupName: 'Marketing',
    enabled: true,
    schema: [
      { key: 'title', label: 'Title', type: 'text', defaultValue: 'Why teams choose ContentHead' },
      {
        key: 'items',
        label: 'Items',
        type: 'objectList',
        itemLabelKey: 'item',
        fields: [
          { key: 'item', label: 'Item Component', type: 'componentRef', refComponentTypes: ['feature_grid_item'] }
        ]
      }
    ],
    defaultProps: {
      title: 'Why teams choose ContentHead',
      items: []
    }
  },
  {
    componentTypeId: 'image_text',
    label: 'Image + Text',
    groupName: 'Marketing',
    enabled: true,
    schema: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'body', label: 'Body', type: 'multiline' },
      { key: 'imageAssetRef', label: 'Image Asset', type: 'assetRef', control: 'AssetPicker' },
      { key: 'invert', label: 'Invert Layout', type: 'boolean', defaultValue: false },
      { key: 'cta', label: 'CTA', type: 'contentLink', control: 'LinkPicker' }
    ],
    defaultProps: {
      title: 'Composable sections',
      body: 'Use reusable blocks with field-level validation and smart defaults.',
      imageAssetRef: null,
      invert: false,
      cta: { kind: 'internal', url: '/demo#faq', text: 'Learn more', target: '_self' }
    }
  },
  {
    componentTypeId: 'pricing',
    label: 'Pricing',
    groupName: 'Marketing',
    enabled: true,
    schema: [
      { key: 'title', label: 'Title', type: 'text', defaultValue: 'Pricing' },
      {
        key: 'tiers',
        label: 'Tiers',
        type: 'objectList',
        itemLabelKey: 'name',
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'price', label: 'Price', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'multiline' },
          { key: 'features', label: 'Features', type: 'stringList' },
          { key: 'cta', label: 'CTA', type: 'contentLink', control: 'LinkPicker' }
        ]
      }
    ],
    defaultProps: {
      title: 'Pricing',
      tiers: [
        { name: 'Starter', price: '$0', description: 'For experiments', features: ['1 site', 'Core CMS'], cta: { kind: 'internal', url: '/demo#newsletter', text: 'Start free', target: '_self' } },
        { name: 'Growth', price: '$149', description: 'For teams', features: ['Multi-market', 'Variants', 'Forms'], cta: { kind: 'external', url: 'https://example.com/sales', text: 'Talk to sales', target: '_blank' } },
        { name: 'Enterprise', price: 'Custom', description: 'For scale', features: ['SSO', 'Advanced workflows'], cta: { kind: 'external', url: 'https://example.com/contact', text: 'Contact', target: '_blank' } }
      ]
    }
  },
  {
    componentTypeId: 'faq',
    label: 'FAQ',
    groupName: 'Marketing',
    enabled: true,
    schema: [
      { key: 'title', label: 'Title', type: 'text', defaultValue: 'Frequently asked questions' },
      {
        key: 'items',
        label: 'Items',
        type: 'objectList',
        itemLabelKey: 'question',
        fields: [
          { key: 'question', label: 'Question', type: 'text', required: true },
          { key: 'answer', label: 'Answer', type: 'multiline', required: true }
        ]
      }
    ],
    defaultProps: {
      title: 'Frequently asked questions',
      items: [
        { question: 'Can I preview before publishing?', answer: 'Yes, use preview tokens and on-page bridge integration.' },
        { question: 'Can I run A/B tests?', answer: 'Yes, variant sets support targeted or traffic-based variants.' }
      ]
    }
  },
  {
    componentTypeId: 'newsletter_form',
    label: 'Newsletter Form',
    groupName: 'Forms',
    enabled: true,
    schema: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'multiline' },
      { key: 'formId', label: 'Form', type: 'formRef' },
      { key: 'submitLabel', label: 'Submit Label', type: 'text' }
    ],
    defaultProps: { title: 'Stay in the loop', description: 'Get monthly product updates and release notes.', formId: null, submitLabel: 'Subscribe' }
  },
  {
    componentTypeId: 'footer',
    label: 'Footer',
    groupName: 'Layout',
    enabled: true,
    schema: [
      { key: 'copyright', label: 'Copyright', type: 'text' },
      {
        key: 'linkGroups',
        label: 'Link Groups',
        type: 'objectList',
        itemLabelKey: 'title',
        fields: [
          { key: 'title', label: 'Group Title', type: 'text', required: true },
          { key: 'links', label: 'Links', type: 'contentLinkList' }
        ]
      },
      { key: 'socialLinks', label: 'Social Links', type: 'contentLinkList' }
    ],
    defaultProps: {
      copyright: '© ContentHead',
      linkGroups: [
        { title: 'Product', links: [{ kind: 'internal', url: '/demo#features', text: 'Features' }, { kind: 'internal', url: '/demo#pricing', text: 'Pricing' }] },
        { title: 'Company', links: [{ kind: 'external', url: 'https://example.com/about', text: 'About', target: '_blank' }] }
      ],
      socialLinks: [
        { kind: 'external', url: 'https://x.com', text: 'X', target: '_blank' },
        { kind: 'external', url: 'https://linkedin.com', text: 'LinkedIn', target: '_blank' }
      ]
    }
  },
  {
    componentTypeId: 'text_block',
    label: 'Text Block',
    groupName: 'Content',
    enabled: true,
    schema: [
      { key: 'body', label: 'Body', type: 'richtext', control: 'Editor', required: true, defaultValue: '<p>Lorem ipsum</p>' },
      { key: 'columns', label: 'Columns', type: 'number', defaultValue: 1 }
    ],
    defaultProps: { body: '<p>Lorem ipsum</p>', columns: 1 }
  },
  {
    componentTypeId: 'cta',
    label: 'CTA Button',
    groupName: 'Content',
    enabled: true,
    schema: [
      { key: 'text', label: 'Label', type: 'text', required: true, defaultValue: 'Learn more' },
      { key: 'href', label: 'URL', type: 'text', required: true, defaultValue: '/learn-more' },
      {
        key: 'style',
        label: 'Style',
        type: 'select',
        control: 'Dropdown',
        defaultValue: 'primary',
        options: [
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' }
        ]
      }
    ],
    defaultProps: { text: 'Learn more', href: '/learn-more', style: 'primary' }
  }
];

async function ensureComponentTypePresets(db: DbClient, siteId: number): Promise<void> {
  for (const preset of COMPONENT_PRESETS) {
    let exists: { id: string; enabled: boolean; updatedBy: string | null } | null | undefined;
    try {
      exists = await db.get<{ id: string; enabled: boolean; updatedBy: string | null }>(
        `
SELECT
  component_type_id as id,
  enabled,
  updated_by as updatedBy
FROM component_type_settings
WHERE site_id = ? AND component_type_id = ?
`,
        [siteId, preset.componentTypeId]
      );
    } catch {
      try {
        exists = await db.get<{ id: string; enabled: boolean; updatedBy: string | null }>(
          `
SELECT
  component_type as id,
  enabled,
  updated_by as updatedBy
FROM component_type_settings
WHERE site_id = ? AND component_type = ?
`,
          [siteId, preset.componentTypeId]
        );
      } catch {
        exists = undefined;
      }
    }
    if (!exists?.id) {
      await upsertComponentTypeSetting(db, {
        siteId,
        componentTypeId: preset.componentTypeId,
        enabled: preset.enabled,
        label: preset.label,
        groupName: preset.groupName,
        schemaJson: JSON.stringify(preset.schema),
        uiMetaJson: null,
        defaultPropsJson: JSON.stringify(preset.defaultProps),
        by: 'system'
      });
      continue;
    }
    if ((exists.updatedBy ?? 'system') !== 'system') {
      continue;
    }
    await upsertComponentTypeSetting(db, {
      siteId,
      componentTypeId: preset.componentTypeId,
      enabled: Boolean(exists.enabled),
      label: preset.label,
      groupName: preset.groupName,
      schemaJson: JSON.stringify(preset.schema),
      uiMetaJson: null,
      defaultPropsJson: JSON.stringify(preset.defaultProps),
      by: 'system'
    });
  }
}

export async function listComponentTypeSettings(
  db: DbClient,
  siteId: number
): Promise<ComponentTypeSettingRecord[]> {
  await ensureComponentTypeSettingsTable(db);
  await ensureComponentTypePresets(db, siteId);
  try {
    return await db.all<ComponentTypeSettingRecord>(
      `
SELECT
  site_id as siteId,
  component_type_id as componentTypeId,
  enabled,
  label,
  group_name as groupName,
  schema_json as schemaJson,
  ui_meta_json as uiMetaJson,
  default_props_json as defaultPropsJson,
  updated_at as updatedAt,
  updated_by as updatedBy
FROM component_type_settings
WHERE site_id = ?
ORDER BY component_type_id
`,
      [siteId]
    );
  } catch {
    try {
      return await db.all<ComponentTypeSettingRecord>(
        `
SELECT
  site_id as siteId,
  component_type_id as componentTypeId,
  enabled,
  NULL as label,
  NULL as groupName,
  NULL as schemaJson,
  NULL as uiMetaJson,
  NULL as defaultPropsJson,
  CAST(current_timestamp AS VARCHAR) as updatedAt,
  'system' as updatedBy
FROM component_type_settings
WHERE site_id = ?
ORDER BY component_type_id
`,
        [siteId]
      );
    } catch {
      try {
        return await db.all<ComponentTypeSettingRecord>(
          `
SELECT
  site_id as siteId,
  component_type as componentTypeId,
  enabled,
  NULL as label,
  NULL as groupName,
  NULL as schemaJson,
  NULL as uiMetaJson,
  NULL as defaultPropsJson,
  CAST(current_timestamp AS VARCHAR) as updatedAt,
  'system' as updatedBy
FROM component_type_settings
WHERE site_id = ?
ORDER BY component_type
`,
          [siteId]
        );
      } catch {
        return [];
      }
    }
  }
}

export async function upsertComponentTypeSetting(
  db: DbClient,
  input: {
    siteId: number;
    componentTypeId: string;
    enabled: boolean;
    label?: string | null | undefined;
    groupName?: string | null | undefined;
    schemaJson?: string | null | undefined;
    uiMetaJson?: string | null | undefined;
    defaultPropsJson?: string | null | undefined;
    by: string;
  }
): Promise<ComponentTypeSettingRecord> {
  const normalizedTypeId = input.componentTypeId.trim();
  if (!normalizedTypeId) {
    invalidInput('componentTypeId is required');
  }

  await ensureComponentTypeSettingsTable(db);
  const updatedAt = new Date().toISOString();

  try {
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
  label,
  group_name,
  schema_json,
  ui_meta_json,
  default_props_json,
  updated_at,
  updated_by
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
      [
        input.siteId,
        normalizedTypeId,
        input.enabled,
        input.label ?? null,
        input.groupName ?? null,
        input.schemaJson ?? null,
        input.uiMetaJson ?? null,
        input.defaultPropsJson ?? null,
        updatedAt,
        input.by
      ]
    );
  } catch {
    // Legacy DBs can still use component_type instead of component_type_id.
    try {
      await db.run(
        `
DELETE FROM component_type_settings
WHERE site_id = ? AND component_type = ?
`,
        [input.siteId, normalizedTypeId]
      );
    } catch {
      // Ignore and continue with insert fallback.
    }

    try {
      await db.run(
        `
INSERT INTO component_type_settings(
  site_id,
  component_type,
  enabled,
  label,
  group_name,
  schema_json,
  ui_meta_json,
  default_props_json,
  updated_at,
  updated_by
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
        [
          input.siteId,
          normalizedTypeId,
          input.enabled,
          input.label ?? null,
          input.groupName ?? null,
          input.schemaJson ?? null,
          input.uiMetaJson ?? null,
          input.defaultPropsJson ?? null,
          updatedAt,
          input.by
        ]
      );
    } catch {
      // Minimal fallback for the oldest table layout.
      await db.run(
        `
INSERT INTO component_type_settings(
  site_id,
  component_type,
  enabled,
  group_name,
  updated_at,
  updated_by
)
VALUES (?, ?, ?, ?, ?, ?)
`,
        [input.siteId, normalizedTypeId, input.enabled, input.groupName ?? null, updatedAt, input.by]
      );
    }
  }

  const readQueries: Array<{ sql: string; params: Array<number | string> }> = [
    {
      sql: `
SELECT
  site_id as siteId,
  component_type_id as componentTypeId,
  enabled,
  label,
  group_name as groupName,
  schema_json as schemaJson,
  ui_meta_json as uiMetaJson,
  default_props_json as defaultPropsJson,
  updated_at as updatedAt,
  updated_by as updatedBy
FROM component_type_settings
WHERE site_id = ? AND component_type_id = ?
`,
      params: [input.siteId, normalizedTypeId]
    },
    {
      sql: `
SELECT
  site_id as siteId,
  component_type as componentTypeId,
  enabled,
  label,
  group_name as groupName,
  schema_json as schemaJson,
  ui_meta_json as uiMetaJson,
  default_props_json as defaultPropsJson,
  updated_at as updatedAt,
  updated_by as updatedBy
FROM component_type_settings
WHERE site_id = ? AND component_type = ?
`,
      params: [input.siteId, normalizedTypeId]
    },
    {
      sql: `
SELECT
  site_id as siteId,
  component_type_id as componentTypeId,
  enabled,
  NULL as label,
  group_name as groupName,
  NULL as schemaJson,
  NULL as uiMetaJson,
  NULL as defaultPropsJson,
  CAST(updated_at AS VARCHAR) as updatedAt,
  updated_by as updatedBy
FROM component_type_settings
WHERE site_id = ? AND component_type_id = ?
`,
      params: [input.siteId, normalizedTypeId]
    },
    {
      sql: `
SELECT
  site_id as siteId,
  component_type as componentTypeId,
  enabled,
  NULL as label,
  group_name as groupName,
  NULL as schemaJson,
  NULL as uiMetaJson,
  NULL as defaultPropsJson,
  CAST(updated_at AS VARCHAR) as updatedAt,
  updated_by as updatedBy
FROM component_type_settings
WHERE site_id = ? AND component_type = ?
`,
      params: [input.siteId, normalizedTypeId]
    }
  ];

  for (const query of readQueries) {
    try {
      const row = await db.get<ComponentTypeSettingRecord>(query.sql, query.params);
      if (row) {
        return row;
      }
    } catch {
      // Continue to next read fallback.
    }
  }

  return {
    siteId: input.siteId,
    componentTypeId: normalizedTypeId,
    enabled: input.enabled,
    label: input.label ?? null,
    groupName: input.groupName ?? null,
    schemaJson: input.schemaJson ?? null,
    uiMetaJson: input.uiMetaJson ?? null,
    defaultPropsJson: input.defaultPropsJson ?? null,
    updatedAt,
    updatedBy: input.by
  };
}

async function ensureComponentTypeSettingsTable(db: DbClient): Promise<void> {
  try {
    await db.run(`
CREATE TABLE IF NOT EXISTS component_type_settings (
  site_id INTEGER,
  component_type_id VARCHAR,
  enabled BOOLEAN DEFAULT TRUE,
  label VARCHAR,
  group_name VARCHAR,
  schema_json VARCHAR,
  ui_meta_json VARCHAR,
  default_props_json VARCHAR,
  updated_at TIMESTAMP,
  updated_by VARCHAR
);
`);
  } catch {
    // Some managed/legacy DB setups reject CREATE TABLE IF NOT EXISTS here.
    // The list/read paths below degrade gracefully.
  }

  const alters = [
    'ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS component_type_id VARCHAR',
    'ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE',
    'ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS label VARCHAR',
    'ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS group_name VARCHAR',
    'ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS schema_json VARCHAR',
    'ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS ui_meta_json VARCHAR',
    'ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS default_props_json VARCHAR',
    'ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP',
    'ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS updated_by VARCHAR'
  ];
  for (const statement of alters) {
    try {
      await db.run(statement);
    } catch {
      // Legacy/managed DBs can reject ALTER variants; reads/writes handle fallback.
    }
  }
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
  parentId?: number | null | undefined;
  sortOrder?: number | null | undefined;
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

  const parentId = input.parentId ?? null;
  await ensureValidParent(db, input.siteId, -1, parentId);
  const sortOrder =
    input.sortOrder != null
      ? Math.max(0, Math.trunc(input.sortOrder))
      : await getNextSiblingSortOrder(db, input.siteId, parentId);

  const id = await nextId(db, 'content_items');

  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(
      `
INSERT INTO content_items(id, site_id, content_type_id, parent_id, sort_order, archived, created_by)
VALUES (?, ?, ?, ?, ?, FALSE, ?)
`,
      [id, input.siteId, input.contentTypeId, parentId, sortOrder, input.by]
    );

    const draft = await createVersion(db, {
      contentItemId: id,
      state: 'DRAFT',
      sourceVersionId: null,
      fieldsJson: input.initialFieldsJson ?? emptyObjectJson,
      compositionJson: input.initialCompositionJson ?? stringify({ areas: [{ name: 'main', components: [] }] }),
      componentsJson: input.initialComponentsJson ?? emptyArrayJson,
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
  parent_id as parentId,
  COALESCE(sort_order, 0) as sortOrder,
  archived,
  created_at as createdAt,
  created_by as createdBy,
  current_draft_version_id as currentDraftVersionId,
  current_published_version_id as currentPublishedVersionId
FROM content_items
WHERE site_id = ?
ORDER BY COALESCE(sort_order, 0), id
`,
    [siteId]
  );
}

export async function archiveContentItem(db: DbClient, id: number, archived: boolean): Promise<ContentItemRecord> {
  await getContentItem(db, id);
  await db.run('UPDATE content_items SET archived = ? WHERE id = ?', [archived, id]);
  return getContentItem(db, id);
}

export async function getPageTree(db: DbClient, input: {
  siteId: number;
  marketCode: string;
  localeCode: string;
}): Promise<PageTreeNode[]> {
  await validateMarketLocale(db, input.siteId, input.marketCode, input.localeCode);

  const items = await db.all<ContentItemRecord>(
    `
SELECT
  id,
  site_id as siteId,
  content_type_id as contentTypeId,
  parent_id as parentId,
  COALESCE(sort_order, 0) as sortOrder,
  archived,
  created_at as createdAt,
  created_by as createdBy,
  current_draft_version_id as currentDraftVersionId,
  current_published_version_id as currentPublishedVersionId
FROM content_items
WHERE site_id = ?
ORDER BY COALESCE(sort_order, 0), id
`,
    [input.siteId]
  );

  const routes = await listRoutes(db, {
    siteId: input.siteId,
    marketCode: input.marketCode,
    localeCode: input.localeCode
  });
  const routeByItemId = new Map<number, ContentRouteRecord>();
  for (const route of routes) {
    if (!routeByItemId.has(route.contentItemId)) {
      routeByItemId.set(route.contentItemId, route);
    }
  }

  const versionIds = Array.from(
    new Set(
      items
        .flatMap((item) => [item.currentDraftVersionId, item.currentPublishedVersionId])
        .filter((id): id is number => typeof id === 'number' && id > 0)
    )
  );

  const versionById = new Map<number, ContentVersionRecord>();
  if (versionIds.length > 0) {
    const versions = await db.all<ContentVersionRecord>(
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
WHERE id IN (${versionIds.map(() => '?').join(',')})
`,
      versionIds
    );
    for (const version of versions) {
      versionById.set(version.id, version);
    }
  }

  const byId = new Map<number, PageTreeNode>();
  for (const item of items) {
    const route = routeByItemId.get(item.id) ?? null;
    const titleVersion =
      (item.currentDraftVersionId ? versionById.get(item.currentDraftVersionId) : null) ??
      (item.currentPublishedVersionId ? versionById.get(item.currentPublishedVersionId) : null) ??
      null;
    const title = readTitleFromVersion(titleVersion) || (route?.slug ? route.slug : `Item #${item.id}`);
    byId.set(item.id, {
      id: item.id,
      title,
      slug: route?.slug ?? '',
      status: contentStatusOf(item),
      children: [],
      parentId: item.parentId ?? null,
      sortOrder: item.sortOrder,
      route
    });
  }

  const roots: PageTreeNode[] = [];
  const allNodes = Array.from(byId.values()).sort((a, b) => (a.sortOrder - b.sortOrder) || (a.id - b.id));
  for (const node of allNodes) {
    if (node.parentId == null) {
      roots.push(node);
      continue;
    }
    const parent = byId.get(node.parentId);
    if (!parent) {
      roots.push(node);
      continue;
    }
    parent.children.push(node);
  }

  const sortRecursively = (nodes: PageTreeNode[]) => {
    nodes.sort((a, b) => (a.sortOrder - b.sortOrder) || (a.id - b.id));
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortRecursively(node.children);
      }
    }
  };

  sortRecursively(roots);
  return roots;
}

export async function movePage(db: DbClient, input: {
  pageId: number;
  newParentId?: number | null | undefined;
  newSortOrder?: number | null | undefined;
}): Promise<ContentItemRecord> {
  const item = await getContentItem(db, input.pageId);
  const newParentId = input.newParentId ?? null;

  await ensureValidParent(db, item.siteId, item.id, newParentId);

  const siblings = await db.all<{ id: number }>(
    `
SELECT id
FROM content_items
WHERE site_id = ?
  AND id <> ?
  AND (
    (parent_id IS NULL AND ? IS NULL)
    OR parent_id = ?
  )
ORDER BY COALESCE(sort_order, 0), id
`,
    [item.siteId, item.id, newParentId, newParentId]
  );

  const insertIndexRaw = input.newSortOrder == null ? siblings.length : Math.trunc(input.newSortOrder);
  const insertIndex = Math.max(0, Math.min(siblings.length, insertIndexRaw));
  const orderedIds = siblings.map((entry) => entry.id);
  orderedIds.splice(insertIndex, 0, item.id);

  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('UPDATE content_items SET parent_id = ? WHERE id = ?', [newParentId, item.id]);
    for (let index = 0; index < orderedIds.length; index += 1) {
      await db.run('UPDATE content_items SET sort_order = ? WHERE id = ?', [index, orderedIds[index]]);
    }

    if ((item.parentId ?? null) !== newParentId) {
      const previousSiblings = await db.all<{ id: number }>(
        `
SELECT id
FROM content_items
WHERE site_id = ?
  AND (
    (parent_id IS NULL AND ? IS NULL)
    OR parent_id = ?
  )
ORDER BY COALESCE(sort_order, 0), id
`,
        [item.siteId, item.parentId ?? null, item.parentId ?? null]
      );
      for (let index = 0; index < previousSiblings.length; index += 1) {
        await db.run('UPDATE content_items SET sort_order = ? WHERE id = ?', [index, previousSiblings[index]!.id]);
      }
    }

    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  return getContentItem(db, item.id);
}

export async function reorderSiblings(db: DbClient, input: {
  parentId?: number | null | undefined;
  orderedIds: number[];
}): Promise<boolean> {
  const uniqueIds = Array.from(new Set(input.orderedIds.map((id) => Math.trunc(id)).filter((id) => id > 0)));
  if (uniqueIds.length === 0) {
    return true;
  }

  const rows = await db.all<ContentItemRecord>(
    `
SELECT
  id,
  site_id as siteId,
  content_type_id as contentTypeId,
  parent_id as parentId,
  COALESCE(sort_order, 0) as sortOrder,
  archived,
  created_at as createdAt,
  created_by as createdBy,
  current_draft_version_id as currentDraftVersionId,
  current_published_version_id as currentPublishedVersionId
FROM content_items
WHERE id IN (${uniqueIds.map(() => '?').join(',')})
`,
    uniqueIds
  );

  if (rows.length !== uniqueIds.length) {
    invalidInput('orderedIds contains unknown page ids', 'CONTENT_ITEM_NOT_FOUND');
  }

  const siteId = rows[0]!.siteId;
  const expectedParentId = input.parentId ?? null;
  for (const row of rows) {
    if (row.siteId !== siteId) {
      invalidInput('orderedIds must belong to the same site', 'CONTENT_ITEM_SITE_MISMATCH');
    }
    if ((row.parentId ?? null) !== expectedParentId) {
      invalidInput('orderedIds must all belong to the provided parentId', 'INVALID_PARENT');
    }
  }

  const existing = await db.all<{ id: number }>(
    `
SELECT id
FROM content_items
WHERE site_id = ?
  AND (
    (parent_id IS NULL AND ? IS NULL)
    OR parent_id = ?
  )
ORDER BY COALESCE(sort_order, 0), id
`,
    [siteId, expectedParentId, expectedParentId]
  );

  const remaining = existing.map((entry) => entry.id).filter((id) => !uniqueIds.includes(id));
  const finalOrder = [...uniqueIds, ...remaining];

  await db.run('BEGIN TRANSACTION');
  try {
    for (let index = 0; index < finalOrder.length; index += 1) {
      await db.run('UPDATE content_items SET sort_order = ? WHERE id = ?', [index, finalOrder[index]]);
    }
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  return true;
}

export async function deletePage(db: DbClient, pageId: number): Promise<boolean> {
  const page = await getContentItem(db, pageId);
  const child = await db.get<{ id: number }>('SELECT id FROM content_items WHERE parent_id = ? LIMIT 1', [page.id]);
  if (child) {
    invalidInput('Cannot delete a page that still has child pages', 'PAGE_HAS_CHILDREN');
  }

  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('UPDATE content_items SET archived = TRUE WHERE id = ?', [page.id]);
    await db.run('DELETE FROM content_routes WHERE content_item_id = ?', [page.id]);
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  return true;
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
  let componentsJson = emptyArrayJson;
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
  const components = parseJsonAny(base.componentsJson, 'componentsJson');
  const metadata = parseJsonObject(base.metadataJson, 'metadataJson');

  const fieldsPatch = input.patch.fieldsJson ? parseJsonObject(input.patch.fieldsJson, 'patch.fieldsJson') : {};
  const compositionPatch = input.patch.compositionJson
    ? parseJsonObject(input.patch.compositionJson, 'patch.compositionJson')
    : {};
  const componentsPatch = input.patch.componentsJson
    ? parseJsonAny(input.patch.componentsJson, 'patch.componentsJson')
    : null;
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

export async function addComponent(db: DbClient, input: {
  contentVersionId: number;
  componentTypeId: string;
  area: string;
  initialProps?: Record<string, unknown> | null | undefined;
  by: string;
}): Promise<ContentVersionRecord> {
  const base = await getVersion(db, input.contentVersionId);
  if (base.state !== 'DRAFT') {
    invalidInput('Components can only be added to DRAFT versions', 'INVALID_VERSION_STATE');
  }

  const area = input.area.trim() || 'main';
  const instances = normalizeComponentInstances(base.componentsJson, base.compositionJson);
  const maxSort = instances
    .filter((entry) => entry.area === area)
    .reduce((acc, entry) => Math.max(acc, entry.sortOrder), -1);

  instances.push({
    instanceId: generateInstanceId(input.componentTypeId),
    componentTypeId: input.componentTypeId,
    area,
    sortOrder: maxSort + 1,
    props: input.initialProps ?? {}
  });

  return writeDraftWithComponentInstances(db, {
    base,
    instances,
    comment: 'Add component',
    createdBy: input.by
  });
}

export async function updateComponentProps(db: DbClient, input: {
  instanceId: string;
  patch: Record<string, unknown>;
  by: string;
}): Promise<ContentVersionRecord> {
  const located = await findDraftVersionByInstanceId(db, input.instanceId);
  if (!located) {
    notFound(`Component instance ${input.instanceId} not found in active drafts`, 'COMPONENT_INSTANCE_NOT_FOUND');
  }

  const nextInstances = located.instances.map((entry) =>
    entry.instanceId === input.instanceId
      ? {
          ...entry,
          props: {
            ...entry.props,
            ...input.patch
          }
        }
      : entry
  );

  return writeDraftWithComponentInstances(db, {
    base: located.version,
    instances: nextInstances,
    comment: 'Update component props',
    createdBy: input.by
  });
}

export async function removeComponent(db: DbClient, input: {
  instanceId: string;
  by: string;
}): Promise<ContentVersionRecord> {
  const located = await findDraftVersionByInstanceId(db, input.instanceId);
  if (!located) {
    notFound(`Component instance ${input.instanceId} not found in active drafts`, 'COMPONENT_INSTANCE_NOT_FOUND');
  }

  const nextInstances = located.instances.filter((entry) => entry.instanceId !== input.instanceId);
  return writeDraftWithComponentInstances(db, {
    base: located.version,
    instances: nextInstances,
    comment: 'Remove component',
    createdBy: input.by
  });
}

export async function moveComponent(db: DbClient, input: {
  instanceId: string;
  newArea: string;
  newSortOrder: number;
  by: string;
}): Promise<ContentVersionRecord> {
  const located = await findDraftVersionByInstanceId(db, input.instanceId);
  if (!located) {
    notFound(`Component instance ${input.instanceId} not found in active drafts`, 'COMPONENT_INSTANCE_NOT_FOUND');
  }

  const targetArea = input.newArea.trim() || 'main';
  const targetSortOrder = Math.max(0, Math.floor(input.newSortOrder));
  const withoutTarget = located.instances.filter((entry) => entry.instanceId !== input.instanceId);
  const target = located.instances.find((entry) => entry.instanceId === input.instanceId);
  if (!target) {
    notFound(`Component instance ${input.instanceId} not found`, 'COMPONENT_INSTANCE_NOT_FOUND');
  }

  const inTargetArea = withoutTarget
    .filter((entry) => entry.area === targetArea)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const insertAt = Math.min(targetSortOrder, inTargetArea.length);
  inTargetArea.splice(insertAt, 0, { ...target, area: targetArea, sortOrder: insertAt });

  const others = withoutTarget.filter((entry) => entry.area !== targetArea);
  const nextInstances = [...others, ...inTargetArea];

  return writeDraftWithComponentInstances(db, {
    base: located.version,
    instances: nextInstances,
    comment: 'Move component',
    createdBy: input.by
  });
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

export async function archiveVersion(db: DbClient, input: {
  versionId: number;
  by: string;
}): Promise<ContentVersionRecord> {
  void input.by;
  const base = await getVersion(db, input.versionId);
  if (base.state === 'ARCHIVED') {
    return base;
  }

  const item = await getContentItem(db, base.contentItemId);
  const [nextDraftRow, nextPublishedRow] = await Promise.all([
    item.currentDraftVersionId === base.id
      ? db.get<{ id: number }>(
          `
SELECT id
FROM content_versions
WHERE content_item_id = ?
  AND state = 'DRAFT'
  AND id <> ?
ORDER BY version_number DESC
LIMIT 1
`,
          [base.contentItemId, base.id]
        )
      : Promise.resolve<{ id: number } | null>(null),
    item.currentPublishedVersionId === base.id
      ? db.get<{ id: number }>(
          `
SELECT id
FROM content_versions
WHERE content_item_id = ?
  AND state = 'PUBLISHED'
  AND id <> ?
ORDER BY version_number DESC
LIMIT 1
`,
          [base.contentItemId, base.id]
        )
      : Promise.resolve<{ id: number } | null>(null)
  ]);

  await db.run('UPDATE content_versions SET state = ? WHERE id = ?', ['ARCHIVED', base.id]);
  await db.run(
    `
UPDATE content_items
SET
  current_draft_version_id = ?,
  current_published_version_id = ?
WHERE id = ?
`,
    [
      item.currentDraftVersionId === base.id ? (nextDraftRow?.id ?? null) : item.currentDraftVersionId,
      item.currentPublishedVersionId === base.id ? (nextPublishedRow?.id ?? null) : item.currentPublishedVersionId,
      base.contentItemId
    ]
  );

  return getVersion(db, base.id);
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
  await ensureTemplatesTable(db);
  try {
    return await db.all<TemplateRecord>(
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
  } catch {
    const legacyRows = await db.all<
      Omit<TemplateRecord, 'compositionJson' | 'componentsJson' | 'constraintsJson' | 'updatedAt'>
    >(
      `
SELECT
  id,
  site_id as siteId,
  name
FROM templates
WHERE site_id = ?
ORDER BY name
`,
      [siteId]
    );
    const updatedAt = await nowTimestamp(db);
    return legacyRows.map((entry) => ({
      ...entry,
      compositionJson: stringify({ areas: [{ name: 'main', components: [] }] }),
      componentsJson: '[]',
      constraintsJson: '{}',
      updatedAt
    }));
  }
}

export async function createTemplate(db: DbClient, input: {
  siteId: number;
  name: string;
  compositionJson: string;
  componentsJson: string;
  constraintsJson: string;
}): Promise<TemplateRecord> {
  await ensureTemplatesTable(db);
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
  await ensureTemplatesTable(db);
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
  await ensureTemplatesTable(db);
  await db.run('DELETE FROM templates WHERE id = ?', [id]);
  return true;
}

export async function reconcileTemplate(db: DbClient, templateId: number): Promise<DiffResult> {
  await ensureTemplatesTable(db);
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

async function ensureTemplatesTable(db: DbClient): Promise<void> {
  await db.run(`
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL,
  name VARCHAR NOT NULL,
  composition_json VARCHAR NOT NULL,
  components_json VARCHAR NOT NULL,
  constraints_json VARCHAR NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);
`);

  await db.run('ALTER TABLE templates ADD COLUMN IF NOT EXISTS composition_json VARCHAR');
  await db.run('ALTER TABLE templates ADD COLUMN IF NOT EXISTS components_json VARCHAR');
  await db.run('ALTER TABLE templates ADD COLUMN IF NOT EXISTS constraints_json VARCHAR');
  await db.run('ALTER TABLE templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP');
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
  const existingRoute =
    input.id == null
      ? await db.get<{ id: number }>(
          'SELECT id FROM content_routes WHERE site_id = ? AND market_code = ? AND locale_code = ? AND slug = ?',
          [input.siteId, input.marketCode, input.localeCode, slug]
        )
      : null;
  const id = input.id ?? existingRoute?.id ?? (await nextId(db, 'content_routes'));

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
