import { extname } from 'node:path';

import sharp from 'sharp';
import { GraphQLError } from 'graphql';

import type { DbClient } from '../db/DbClient.js';
import type { AssetStorageProvider } from './storage.js';

export type AssetPoiLink = {
  kind: 'internal' | 'external';
  url?: string;
  contentItemId?: number;
  routeSlug?: string;
  text?: string;
  target?: '_self' | '_blank';
  anchor?: string;
};

export type AssetPoiStyle = {
  color?: string;
  icon?: string;
  size?: number;
};

export type AssetPoi = {
  id: string;
  x: number;
  y: number;
  label?: string;
  link?: AssetPoiLink;
  style?: AssetPoiStyle;
  visible?: boolean;
};

export type AssetRenditionCrop = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type AssetRenditionMode = 'cover' | 'contain';
export type AssetRenditionFormat = 'webp' | 'jpeg' | 'png';

export type AssetRenditionPreset = {
  id: string;
  name: string;
  mode: AssetRenditionMode;
  width: number;
  height: number;
  quality?: number;
  format?: AssetRenditionFormat;
  crop?: AssetRenditionCrop;
  useFocalPoint?: boolean;
  background?: string;
};

export type AssetRecord = {
  id: number;
  siteId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  checksum: string | null;
  storageProvider: string;
  storagePath: string;
  cdnUrl: string | null;
  title: string | null;
  altText: string | null;
  description: string | null;
  tagsJson: string | null;
  folderId: number | null;
  focalX: number | null;
  focalY: number | null;
  poisJson: string | null;
  renditionPresetsJson: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

export type AssetListResult = {
  items: AssetRecord[];
  total: number;
};

export type AssetFolderRecord = {
  id: number;
  siteId: number;
  parentId: number | null;
  name: string;
  path: string;
  createdAt: string;
  createdBy: string;
};

export type AssetRenditionRecord = {
  id: number;
  assetId: number;
  kind: string;
  width: number;
  height: number;
  fitMode: AssetRenditionMode;
  mode: AssetRenditionMode;
  presetId: string | null;
  cropJson: string | null;
  focalX: number | null;
  focalY: number | null;
  format: AssetRenditionFormat | null;
  quality: number | null;
  storagePath: string;
  bytes: number;
  createdAt: string;
};

function invalid(message: string, code = 'BAD_USER_INPUT'): never {
  throw new GraphQLError(message, { extensions: { code } });
}

async function nextId(db: DbClient, table: string): Promise<number> {
  const row = await db.get<{ nextId: number }>(`SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM ${table}`);
  return row?.nextId ?? 1;
}

function parseTagsJson(tags?: string[] | null): string | null {
  if (!tags || tags.length === 0) {
    return null;
  }
  return JSON.stringify(tags.filter((entry) => entry.trim()));
}

function mapAssetSelect() {
  return `
SELECT
  id,
  site_id as siteId,
  filename,
  original_name as originalName,
  mime_type as mimeType,
  bytes,
  width,
  height,
  duration,
  checksum,
  storage_provider as storageProvider,
  storage_path as storagePath,
  cdn_url as cdnUrl,
  title,
  alt_text as altText,
  description,
  tags_json as tagsJson,
  folder_id as folderId,
  focal_x as focalX,
  focal_y as focalY,
  pois_json as poisJson,
  rendition_presets_json as renditionPresetsJson,
  CAST(created_at AS VARCHAR) as createdAt,
  created_by as createdBy,
  CAST(updated_at AS VARCHAR) as updatedAt,
  updated_by as updatedBy
FROM assets`;
}

function mapRenditionSelect() {
  return `
SELECT
  id,
  asset_id as assetId,
  kind,
  width,
  height,
  fit_mode as fitMode,
  COALESCE(mode, fit_mode) as mode,
  preset_id as presetId,
  crop_json as cropJson,
  focal_x as focalX,
  focal_y as focalY,
  format,
  quality,
  storage_path as storagePath,
  bytes,
  CAST(created_at AS VARCHAR) as createdAt
FROM asset_renditions`;
}

function clamp01(input: number): number {
  return Math.min(1, Math.max(0, input));
}

function toNumeric(input: unknown): number | null {
  if (typeof input !== 'number' || !Number.isFinite(input)) {
    return null;
  }
  return input;
}

function toInteger(input: unknown): number | null {
  const numeric = toNumeric(input);
  if (numeric == null) {
    return null;
  }
  return Math.round(numeric);
}

function toText(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }
  const trimmed = input.trim();
  return trimmed || null;
}

function parseJsonValue(value: string | null | undefined): unknown {
  if (!value?.trim()) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeAsset(record: AssetRecord): AssetRecord {
  return {
    ...record,
    bytes: Number(record.bytes),
    width: record.width == null ? null : Number(record.width),
    height: record.height == null ? null : Number(record.height),
    duration: record.duration == null ? null : Number(record.duration),
    focalX: record.focalX == null ? null : Number(record.focalX),
    focalY: record.focalY == null ? null : Number(record.focalY)
  };
}

function normalizeRendition(record: AssetRenditionRecord): AssetRenditionRecord {
  const fitMode = record.fitMode === 'contain' ? 'contain' : 'cover';
  const mode = record.mode === 'contain' ? 'contain' : 'cover';
  const format: AssetRenditionFormat | null =
    record.format === 'jpeg' || record.format === 'png' || record.format === 'webp' ? record.format : null;
  return {
    ...record,
    width: Number(record.width),
    height: Number(record.height),
    bytes: Number(record.bytes),
    quality: record.quality == null ? null : Number(record.quality),
    focalX: record.focalX == null ? null : Number(record.focalX),
    focalY: record.focalY == null ? null : Number(record.focalY),
    fitMode,
    mode,
    format
  };
}

function normalizeLink(value: unknown): AssetPoiLink | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const kind = record.kind === 'internal' || record.kind === 'external' ? record.kind : null;
  if (!kind) {
    return null;
  }
  const contentItemId = toInteger(record.contentItemId);
  const normalized: AssetPoiLink = {
    kind,
    target: record.target === '_blank' ? '_blank' : '_self'
  };
  const url = toText(record.url);
  const routeSlug = toText(record.routeSlug);
  const text = toText(record.text);
  const anchor = toText(record.anchor);
  if (url) {
    normalized.url = url;
  }
  if (contentItemId != null) {
    normalized.contentItemId = contentItemId;
  }
  if (routeSlug) {
    normalized.routeSlug = routeSlug;
  }
  if (text) {
    normalized.text = text;
  }
  if (anchor) {
    normalized.anchor = anchor;
  }
  return normalized;
}

function normalizePoiStyle(value: unknown): AssetPoiStyle | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const sizeRaw = toNumeric(record.size);
  const size = sizeRaw == null ? null : Math.max(0.5, Math.min(4, sizeRaw));
  const normalized: AssetPoiStyle = {};
  const color = toText(record.color);
  const icon = toText(record.icon);
  if (color) {
    normalized.color = color;
  }
  if (icon) {
    normalized.icon = icon;
  }
  if (size != null) {
    normalized.size = size;
  }
  if (!normalized.color && !normalized.icon && normalized.size == null) {
    return null;
  }
  return normalized;
}

function normalizePoi(value: unknown): AssetPoi | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const id = toText(record.id);
  const x = toNumeric(record.x);
  const y = toNumeric(record.y);
  if (!id || x == null || y == null) {
    return null;
  }
  const normalized: AssetPoi = {
    id,
    x: clamp01(x),
    y: clamp01(y),
    visible: record.visible === false ? false : true
  };
  const label = toText(record.label);
  const link = normalizeLink(record.link);
  const style = normalizePoiStyle(record.style);
  if (label) {
    normalized.label = label;
  }
  if (link) {
    normalized.link = link;
  }
  if (style) {
    normalized.style = style;
  }
  return normalized;
}

function normalizeCrop(value: unknown): AssetRenditionCrop | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const x = toNumeric(record.x);
  const y = toNumeric(record.y);
  const w = toNumeric(record.w);
  const h = toNumeric(record.h);
  if (x == null || y == null || w == null || h == null) {
    return null;
  }
  const normalized: AssetRenditionCrop = {
    x: clamp01(x),
    y: clamp01(y),
    w: Math.min(1, Math.max(0, w)),
    h: Math.min(1, Math.max(0, h))
  };
  if (normalized.w <= 0 || normalized.h <= 0) {
    return null;
  }
  const maxW = 1 - normalized.x;
  const maxH = 1 - normalized.y;
  return {
    x: normalized.x,
    y: normalized.y,
    w: Math.min(normalized.w, maxW),
    h: Math.min(normalized.h, maxH)
  };
}

function normalizePreset(value: unknown): AssetRenditionPreset | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const id = toText(record.id);
  const name = toText(record.name);
  const width = toInteger(record.width);
  const height = toInteger(record.height);
  if (!id || !name || width == null || height == null || width <= 0 || height <= 0) {
    return null;
  }
  const qualityRaw = toInteger(record.quality);
  const quality = qualityRaw == null ? 80 : Math.max(1, Math.min(100, qualityRaw));
  const format = record.format === 'jpeg' || record.format === 'png' || record.format === 'webp' ? record.format : null;
  const mode: AssetRenditionMode = record.mode === 'contain' ? 'contain' : 'cover';
  const useFocalPoint = record.useFocalPoint === false ? false : true;
  const normalized: AssetRenditionPreset = {
    id,
    name,
    mode,
    width,
    height,
    quality,
    useFocalPoint
  };
  const crop = normalizeCrop(record.crop);
  const background = toText(record.background);
  if (format) {
    normalized.format = format;
  }
  if (crop) {
    normalized.crop = crop;
  }
  if (background) {
    normalized.background = background;
  }
  return normalized;
}

function serializeOrNull<T>(value: T[]): string | null {
  if (value.length === 0) {
    return null;
  }
  return JSON.stringify(value);
}

export function parseAssetPois(record: Pick<AssetRecord, 'poisJson'>): AssetPoi[] {
  const parsed = parseJsonValue(record.poisJson);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.map((entry) => normalizePoi(entry)).filter((entry): entry is AssetPoi => Boolean(entry));
}

export function parseAssetRenditionPresets(
  record: Pick<AssetRecord, 'renditionPresetsJson'>
): AssetRenditionPreset[] {
  const parsed = parseJsonValue(record.renditionPresetsJson);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed
    .map((entry) => normalizePreset(entry))
    .filter((entry): entry is AssetRenditionPreset => Boolean(entry));
}

function buildAssetFilters(input: {
  siteId: number;
  search?: string | null | undefined;
  folderId?: number | null | undefined;
  tags?: string[] | null | undefined;
}) {
  const clauses = ['site_id = ?'];
  const params: unknown[] = [input.siteId];

  if (input.search?.trim()) {
    clauses.push("(LOWER(filename) LIKE ? OR LOWER(COALESCE(title, '')) LIKE ? OR LOWER(COALESCE(description, '')) LIKE ?)");
    const q = `%${input.search.trim().toLowerCase()}%`;
    params.push(q, q, q);
  }

  if (input.folderId != null) {
    clauses.push('folder_id = ?');
    params.push(input.folderId);
  }

  if (input.tags && input.tags.length > 0) {
    for (const tag of input.tags) {
      clauses.push('tags_json LIKE ?');
      params.push(`%${tag}%`);
    }
  }

  return { clauses, params };
}

export async function listAssets(
  db: DbClient,
  input: {
    siteId: number;
    limit?: number | null | undefined;
    offset?: number | null | undefined;
    search?: string | null | undefined;
    folderId?: number | null | undefined;
    tags?: string[] | null | undefined;
  }
): Promise<AssetListResult> {
  const { clauses, params } = buildAssetFilters(input);
  const limit = Math.max(1, Math.min(200, input.limit ?? 50));
  const offset = Math.max(0, input.offset ?? 0);
  const whereClause = `WHERE ${clauses.join(' AND ')}`;

  const rows = await db.all<AssetRecord>(
    `${mapAssetSelect()} ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const countRow = await db.get<{ total: number }>(`SELECT COUNT(*) as total FROM assets ${whereClause}`, params);

  return {
    items: rows.map((row) => normalizeAsset(row)),
    total: Number(countRow?.total ?? 0)
  };
}

export async function getAsset(db: DbClient, id: number): Promise<AssetRecord | null> {
  const row = await db.get<AssetRecord>(`${mapAssetSelect()} WHERE id = ?`, [id]);
  return row ? normalizeAsset(row) : null;
}

export async function listAssetRenditions(db: DbClient, assetId: number): Promise<AssetRenditionRecord[]> {
  const rows = await db.all<AssetRenditionRecord>(
    `${mapRenditionSelect()} WHERE asset_id = ? ORDER BY created_at DESC, id DESC`,
    [assetId]
  );
  return rows.map((row) => normalizeRendition(row));
}

export async function listAssetFolders(db: DbClient, siteId: number): Promise<AssetFolderRecord[]> {
  return db.all<AssetFolderRecord>(
    `
SELECT
  id,
  site_id as siteId,
  parent_id as parentId,
  name,
  path,
  CAST(created_at AS VARCHAR) as createdAt,
  created_by as createdBy
FROM asset_folders
WHERE site_id = ?
ORDER BY path
`,
    [siteId]
  );
}

export async function createAssetFolder(
  db: DbClient,
  input: {
    siteId: number;
    name: string;
    parentId?: number | null | undefined;
    by: string;
  }
): Promise<AssetFolderRecord> {
  const name = input.name.trim();
  if (!name) {
    invalid('Folder name is required');
  }

  let path = `/${name}`;
  if (input.parentId) {
    const parent = await db.get<{ path: string }>('SELECT path FROM asset_folders WHERE id = ?', [input.parentId]);
    if (!parent) {
      invalid(`Parent folder ${input.parentId} not found`, 'ASSET_FOLDER_NOT_FOUND');
    }
    path = `${parent.path}/${name}`;
  }

  const id = await nextId(db, 'asset_folders');
  await db.run(
    'INSERT INTO asset_folders(id, site_id, parent_id, name, path, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [id, input.siteId, input.parentId ?? null, name, path, input.by]
  );

  const row = await db.get<AssetFolderRecord>(
    `
SELECT
  id,
  site_id as siteId,
  parent_id as parentId,
  name,
  path,
  CAST(created_at AS VARCHAR) as createdAt,
  created_by as createdBy
FROM asset_folders
WHERE id = ?
`,
    [id]
  );

  if (!row) {
    throw new Error('Failed to create asset folder');
  }

  return row;
}

export async function createAssetFromUpload(
  db: DbClient,
  storage: AssetStorageProvider,
  input: {
    siteId: number;
    filename: string;
    originalName: string;
    mimeType: string;
    data: Buffer;
    createdBy: string;
    folderId?: number | null | undefined;
  }
): Promise<AssetRecord> {
  const id = await nextId(db, 'assets');
  const now = new Date();
  const yyyy = `${now.getUTCFullYear()}`;
  const mm = `${now.getUTCMonth() + 1}`.padStart(2, '0');
  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  const key = `${input.siteId}/${yyyy}/${mm}/${safeName}`;
  const saved = await storage.save(input.data, key);

  let width: number | null = null;
  let height: number | null = null;

  if (input.mimeType.startsWith('image/')) {
    try {
      const metadata = await sharp(input.data).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
    } catch {
      width = null;
      height = null;
    }
  }

  await db.run(
    `
INSERT INTO assets(
  id, site_id, filename, original_name, mime_type, bytes, width, height, duration,
  checksum, storage_provider, storage_path, cdn_url, title, alt_text, description,
  tags_json, folder_id, created_by, updated_by
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'local', ?, NULL, ?, ?, NULL, NULL, ?, ?, ?)
`,
    [
      id,
      input.siteId,
      input.filename,
      input.originalName,
      input.mimeType,
      saved.bytes,
      width,
      height,
      null,
      saved.checksum,
      saved.storagePath,
      input.originalName,
      input.originalName,
      input.folderId ?? null,
      input.createdBy,
      input.createdBy
    ]
  );

  if (input.mimeType.startsWith('image/')) {
    await ensureImageRendition(db, storage, id, 'thumb', 320, 'cover');
    await ensureImageRendition(db, storage, id, 'small', 640, 'cover');
    await ensureImageRendition(db, storage, id, 'medium', 1024, 'cover');
    await ensureImageRendition(db, storage, id, 'large', 1600, 'cover');
  }

  const created = await getAsset(db, id);
  if (!created) {
    throw new Error('Failed to create asset record');
  }

  return created;
}

export async function ensureImageRendition(
  db: DbClient,
  storage: AssetStorageProvider,
  assetId: number,
  kind: 'thumb' | 'small' | 'medium' | 'large',
  targetWidth: number,
  fitMode: AssetRenditionMode = 'cover'
): Promise<AssetRenditionRecord | null> {
  const findExisting = (width: number) =>
    db.get<AssetRenditionRecord>(
      `${mapRenditionSelect()} WHERE asset_id = ? AND kind = ? AND fit_mode = ? AND width = ?`,
      [assetId, kind, fitMode, width]
    );

  const existing = await findExisting(targetWidth);
  if (existing) {
    return normalizeRendition(existing);
  }

  const asset = await getAsset(db, assetId);
  if (!asset || !asset.mimeType.startsWith('image/')) {
    return null;
  }

  const requestedWidth =
    typeof asset.width === 'number' && asset.width > 0 ? Math.min(targetWidth, asset.width) : targetWidth;

  if (requestedWidth !== targetWidth) {
    const existingAtRequestedWidth = await findExisting(requestedWidth);
    if (existingAtRequestedWidth) {
      return normalizeRendition(existingAtRequestedWidth);
    }
  }

  const original = await storage.read(asset.storagePath);
  const rendered = await sharp(original)
    .resize({ width: requestedWidth, withoutEnlargement: true, fit: fitMode })
    .webp({ quality: 82 })
    .toBuffer();
  const metadata = await sharp(rendered).metadata();
  const effectiveWidth = metadata.width ?? requestedWidth;

  const existingAtEffectiveWidth = await findExisting(effectiveWidth);
  if (existingAtEffectiveWidth) {
    return normalizeRendition(existingAtEffectiveWidth);
  }

  const key = asset.storagePath.replace(extname(asset.storagePath), `-${kind}-${fitMode}-${effectiveWidth}.webp`);
  const saved = await storage.save(rendered, key);

  const id = await nextId(db, 'asset_renditions');
  try {
    await db.run(
      `
INSERT INTO asset_renditions(id, asset_id, kind, width, height, fit_mode, mode, format, quality, storage_path, bytes)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
      [id, assetId, kind, effectiveWidth, metadata.height ?? 1, fitMode, fitMode, 'webp', 82, saved.storagePath, saved.bytes]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const duplicateConflict =
      message.toLowerCase().includes('duplicate key') || message.toLowerCase().includes('unique constraint');
    if (!duplicateConflict) {
      throw error;
    }
    await storage.delete(saved.storagePath).catch(() => undefined);
    const conflicted = await findExisting(effectiveWidth);
    if (conflicted) {
      return normalizeRendition(conflicted);
    }
    throw error;
  }

  const row = await db.get<AssetRenditionRecord>(`${mapRenditionSelect()} WHERE id = ?`, [id]);
  return row ? normalizeRendition(row) : null;
}

export async function getAssetRendition(
  db: DbClient,
  assetId: number,
  kind: string,
  fitMode: AssetRenditionMode = 'cover',
  width?: number
): Promise<AssetRenditionRecord | null> {
  const widthClause = width ? ' AND width = ?' : '';
  const params = width ? [assetId, kind, fitMode, width] : [assetId, kind, fitMode];
  const row = await db.get<AssetRenditionRecord>(
    `${mapRenditionSelect()} WHERE asset_id = ? AND kind = ? AND fit_mode = ?${widthClause} ORDER BY created_at DESC, id DESC`,
    params
  );
  return row ? normalizeRendition(row) : null;
}

export async function getAssetRenditionByPreset(
  db: DbClient,
  assetId: number,
  presetId: string
): Promise<AssetRenditionRecord | null> {
  const row = await db.get<AssetRenditionRecord>(
    `${mapRenditionSelect()} WHERE asset_id = ? AND preset_id = ? ORDER BY created_at DESC, id DESC`,
    [assetId, presetId]
  );
  return row ? normalizeRendition(row) : null;
}

function normalizeFocalPoint(x: number, y: number): { x: number; y: number } {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    invalid('Focal point must be finite numeric values');
  }
  return { x: clamp01(x), y: clamp01(y) };
}

async function ensureAssetExists(db: DbClient, assetId: number): Promise<AssetRecord> {
  const asset = await getAsset(db, assetId);
  if (!asset) {
    throw new GraphQLError(`Asset ${assetId} not found`, { extensions: { code: 'ASSET_NOT_FOUND' } });
  }
  return asset;
}

export async function updateAssetFocalPoint(
  db: DbClient,
  input: { assetId: number; x: number; y: number; by: string }
): Promise<AssetRecord> {
  const focal = normalizeFocalPoint(input.x, input.y);
  await ensureAssetExists(db, input.assetId);
  await db.run(
    `
UPDATE assets
SET focal_x = ?, focal_y = ?, updated_at = current_timestamp, updated_by = ?
WHERE id = ?
`,
    [focal.x, focal.y, input.by, input.assetId]
  );
  return ensureAssetExists(db, input.assetId);
}

export async function upsertAssetPois(
  db: DbClient,
  input: { assetId: number; pois: AssetPoi[]; by: string }
): Promise<AssetRecord> {
  const normalized = (input.pois ?? [])
    .map((entry) => normalizePoi(entry))
    .filter((entry): entry is AssetPoi => Boolean(entry));
  await ensureAssetExists(db, input.assetId);
  await db.run(
    `
UPDATE assets
SET pois_json = ?, updated_at = current_timestamp, updated_by = ?
WHERE id = ?
`,
    [serializeOrNull(normalized), input.by, input.assetId]
  );
  return ensureAssetExists(db, input.assetId);
}

export async function upsertAssetRenditionPresets(
  db: DbClient,
  input: { assetId: number; presets: AssetRenditionPreset[]; by: string }
): Promise<AssetRecord> {
  const normalized = (input.presets ?? [])
    .map((entry) => normalizePreset(entry))
    .filter((entry): entry is AssetRenditionPreset => Boolean(entry));
  await ensureAssetExists(db, input.assetId);
  await db.run(
    `
UPDATE assets
SET rendition_presets_json = ?, updated_at = current_timestamp, updated_by = ?
WHERE id = ?
`,
    [serializeOrNull(normalized), input.by, input.assetId]
  );
  return ensureAssetExists(db, input.assetId);
}

function focalCoverRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  focalX: number,
  focalY: number
) {
  const targetRatio = targetWidth / targetHeight;
  let cropWidth: number;
  let cropHeight: number;
  if (sourceWidth / sourceHeight > targetRatio) {
    cropHeight = sourceHeight;
    cropWidth = Math.round(sourceHeight * targetRatio);
  } else {
    cropWidth = sourceWidth;
    cropHeight = Math.round(sourceWidth / targetRatio);
  }
  cropWidth = Math.min(sourceWidth, Math.max(1, cropWidth));
  cropHeight = Math.min(sourceHeight, Math.max(1, cropHeight));
  const centerX = clamp01(focalX) * sourceWidth;
  const centerY = clamp01(focalY) * sourceHeight;
  const left = Math.round(Math.min(Math.max(centerX - cropWidth / 2, 0), sourceWidth - cropWidth));
  const top = Math.round(Math.min(Math.max(centerY - cropHeight / 2, 0), sourceHeight - cropHeight));
  return { left, top, width: cropWidth, height: cropHeight };
}

function normalizedCropRect(crop: AssetRenditionCrop, sourceWidth: number, sourceHeight: number) {
  const left = Math.round(clamp01(crop.x) * sourceWidth);
  const top = Math.round(clamp01(crop.y) * sourceHeight);
  const width = Math.round(Math.min(1 - clamp01(crop.x), Math.max(0, crop.w)) * sourceWidth);
  const height = Math.round(Math.min(1 - clamp01(crop.y), Math.max(0, crop.h)) * sourceHeight);
  const safeWidth = Math.max(1, Math.min(sourceWidth - left, width));
  const safeHeight = Math.max(1, Math.min(sourceHeight - top, height));
  return { left, top, width: safeWidth, height: safeHeight };
}

function isDuplicateError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('duplicate key') || message.includes('unique constraint');
}

export async function generateAssetRenditionFromPreset(
  db: DbClient,
  storage: AssetStorageProvider,
  input: { assetId: number; presetId: string }
): Promise<AssetRenditionRecord> {
  const asset = await ensureAssetExists(db, input.assetId);
  if (!asset.mimeType.startsWith('image/')) {
    invalid('Only image assets support renditions', 'ASSET_NOT_IMAGE');
  }

  const presets = parseAssetRenditionPresets(asset);
  const preset = presets.find((entry) => entry.id === input.presetId);
  if (!preset) {
    throw new GraphQLError(`Preset ${input.presetId} not found for asset ${input.assetId}`, {
      extensions: { code: 'ASSET_PRESET_NOT_FOUND' }
    });
  }

  const sourceBuffer = await storage.read(asset.storagePath);
  const sourceMeta = await sharp(sourceBuffer).metadata();
  const sourceWidth = sourceMeta.width ?? asset.width ?? 0;
  const sourceHeight = sourceMeta.height ?? asset.height ?? 0;
  if (!sourceWidth || !sourceHeight) {
    throw new GraphQLError(`Could not read source dimensions for asset ${input.assetId}`, {
      extensions: { code: 'ASSET_DIMENSIONS_UNAVAILABLE' }
    });
  }

  const mode: AssetRenditionMode = preset.mode === 'contain' ? 'contain' : 'cover';
  const quality = Math.max(1, Math.min(100, preset.quality ?? 80));
  const format: AssetRenditionFormat = preset.format ?? (asset.mimeType === 'image/png' ? 'png' : 'webp');
  const useFocalPoint = preset.useFocalPoint !== false;
  const focalX = asset.focalX ?? 0.5;
  const focalY = asset.focalY ?? 0.5;

  let extraction: { left: number; top: number; width: number; height: number } | null = null;
  if (preset.crop) {
    extraction = normalizedCropRect(preset.crop, sourceWidth, sourceHeight);
  } else if (mode === 'cover' && useFocalPoint) {
    extraction = focalCoverRect(sourceWidth, sourceHeight, preset.width, preset.height, focalX, focalY);
  }

  let pipeline = sharp(sourceBuffer);
  if (extraction) {
    pipeline = pipeline.extract(extraction);
    pipeline = pipeline.resize({ width: preset.width, height: preset.height, fit: 'fill' });
  } else if (mode === 'contain') {
    pipeline = pipeline.resize({
      width: preset.width,
      height: preset.height,
      fit: 'contain',
      background: preset.background?.trim() || (format === 'png' ? 'rgba(255,255,255,0)' : '#ffffff')
    });
  } else {
    pipeline = pipeline.resize({ width: preset.width, height: preset.height, fit: 'cover', position: 'centre' });
  }

  if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  } else if (format === 'png') {
    pipeline = pipeline.png({ quality });
  } else {
    pipeline = pipeline.webp({ quality });
  }

  const rendered = await pipeline.toBuffer();
  const renderedMeta = await sharp(rendered).metadata();
  const width = renderedMeta.width ?? preset.width;
  const height = renderedMeta.height ?? preset.height;

  const extension = format === 'jpeg' ? 'jpg' : format;
  const key = asset.storagePath.replace(extname(asset.storagePath), `-preset-${preset.id}.${extension}`);
  const saved = await storage.save(rendered, key);

  const existing = await getAssetRenditionByPreset(db, input.assetId, preset.id);
  const cropJson = preset.crop ? JSON.stringify(preset.crop) : null;
  const focalXToStore = mode === 'cover' && useFocalPoint ? focalX : null;
  const focalYToStore = mode === 'cover' && useFocalPoint ? focalY : null;
  const kind = `preset:${preset.id}`;

  if (existing) {
    const oldPath = existing.storagePath;
    await db.run(
      `
UPDATE asset_renditions
SET
  kind = ?,
  width = ?,
  height = ?,
  fit_mode = ?,
  mode = ?,
  preset_id = ?,
  crop_json = ?,
  focal_x = ?,
  focal_y = ?,
  format = ?,
  quality = ?,
  storage_path = ?,
  bytes = ?
WHERE id = ? AND asset_id = ?
`,
      [
        kind,
        width,
        height,
        mode,
        mode,
        preset.id,
        cropJson,
        focalXToStore,
        focalYToStore,
        format,
        quality,
        saved.storagePath,
        saved.bytes,
        existing.id,
        input.assetId
      ]
    );
    if (oldPath !== saved.storagePath) {
      await storage.delete(oldPath).catch(() => undefined);
    }
    const row = await db.get<AssetRenditionRecord>(`${mapRenditionSelect()} WHERE id = ?`, [existing.id]);
    if (row) {
      return normalizeRendition(row);
    }
    throw new Error('Failed to load updated rendition');
  }

  const id = await nextId(db, 'asset_renditions');
  try {
    await db.run(
      `
INSERT INTO asset_renditions(
  id, asset_id, kind, width, height, fit_mode, mode, preset_id, crop_json, focal_x, focal_y, format, quality, storage_path, bytes
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
      [
        id,
        input.assetId,
        kind,
        width,
        height,
        mode,
        mode,
        preset.id,
        cropJson,
        focalXToStore,
        focalYToStore,
        format,
        quality,
        saved.storagePath,
        saved.bytes
      ]
    );
  } catch (error) {
    if (!isDuplicateError(error)) {
      throw error;
    }
    await storage.delete(saved.storagePath).catch(() => undefined);
    const conflicted = await getAssetRenditionByPreset(db, input.assetId, preset.id);
    if (conflicted) {
      return conflicted;
    }
    throw error;
  }

  const row = await db.get<AssetRenditionRecord>(`${mapRenditionSelect()} WHERE id = ?`, [id]);
  if (!row) {
    throw new Error('Failed to load generated rendition');
  }
  return normalizeRendition(row);
}

export async function deleteAssetRendition(
  db: DbClient,
  storage: AssetStorageProvider,
  input: { assetId: number; renditionId: number }
): Promise<boolean> {
  const rendition = await db.get<{ id: number; storagePath: string }>(
    'SELECT id, storage_path as storagePath FROM asset_renditions WHERE id = ? AND asset_id = ?',
    [input.renditionId, input.assetId]
  );
  if (!rendition) {
    return false;
  }
  await db.run('DELETE FROM asset_renditions WHERE id = ? AND asset_id = ?', [input.renditionId, input.assetId]);
  await storage.delete(rendition.storagePath).catch(() => undefined);
  return true;
}

export async function updateAssetMetadata(
  db: DbClient,
  input: {
    id: number;
    title?: string | null | undefined;
    altText?: string | null | undefined;
    description?: string | null | undefined;
    tags?: string[] | null | undefined;
    folderId?: number | null | undefined;
    by: string;
  }
): Promise<AssetRecord> {
  await db.run(
    `
UPDATE assets
SET
  title = ?,
  alt_text = ?,
  description = ?,
  tags_json = ?,
  folder_id = ?,
  updated_at = current_timestamp,
  updated_by = ?
WHERE id = ?
`,
    [
      input.title ?? null,
      input.altText ?? null,
      input.description ?? null,
      parseTagsJson(input.tags),
      input.folderId ?? null,
      input.by,
      input.id
    ]
  );

  const asset = await getAsset(db, input.id);
  if (!asset) {
    throw new GraphQLError(`Asset ${input.id} not found`, { extensions: { code: 'ASSET_NOT_FOUND' } });
  }

  return asset;
}

export async function deleteAsset(
  db: DbClient,
  storage: AssetStorageProvider,
  id: number
): Promise<boolean> {
  const asset = await getAsset(db, id);
  if (!asset) {
    return true;
  }

  const renditions = await db.all<{ storagePath: string }>(
    'SELECT storage_path as storagePath FROM asset_renditions WHERE asset_id = ?',
    [id]
  );

  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('DELETE FROM asset_renditions WHERE asset_id = ?', [id]);
    await db.run('DELETE FROM assets WHERE id = ?', [id]);
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  await storage.delete(asset.storagePath);
  for (const rendition of renditions) {
    await storage.delete(rendition.storagePath);
  }

  return true;
}
