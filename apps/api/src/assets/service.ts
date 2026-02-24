import { extname } from 'node:path';

import sharp from 'sharp';
import { GraphQLError } from 'graphql';

import type { DbClient } from '../db/DbClient.js';
import type { AssetStorageProvider } from './storage.js';

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
  CAST(created_at AS VARCHAR) as createdAt,
  created_by as createdBy,
  CAST(updated_at AS VARCHAR) as updatedAt,
  updated_by as updatedBy
FROM assets`;
}

function normalizeAsset(record: AssetRecord): AssetRecord {
  return {
    ...record,
    bytes: Number(record.bytes),
    width: record.width == null ? null : Number(record.width),
    height: record.height == null ? null : Number(record.height),
    duration: record.duration == null ? null : Number(record.duration)
  };
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
    await ensureImageRendition(db, storage, id, 'thumb', 320);
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
  targetWidth: number
): Promise<AssetRenditionRecord | null> {
  const existing = await db.get<AssetRenditionRecord>(
    `
SELECT
  id,
  asset_id as assetId,
  kind,
  width,
  height,
  storage_path as storagePath,
  bytes,
  CAST(created_at AS VARCHAR) as createdAt
FROM asset_renditions
WHERE asset_id = ? AND kind = ?
`,
    [assetId, kind]
  );
  if (existing) {
    return existing;
  }

  const asset = await getAsset(db, assetId);
  if (!asset || !asset.mimeType.startsWith('image/')) {
    return null;
  }

  const original = await storage.read(asset.storagePath);
  const rendered = await sharp(original).resize({ width: targetWidth, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const key = asset.storagePath.replace(extname(asset.storagePath), `-${kind}.webp`);
  const saved = await storage.save(rendered, key);
  const metadata = await sharp(rendered).metadata();

  const id = await nextId(db, 'asset_renditions');
  await db.run(
    `
INSERT INTO asset_renditions(id, asset_id, kind, width, height, storage_path, bytes)
VALUES (?, ?, ?, ?, ?, ?, ?)
`,
    [id, assetId, kind, metadata.width ?? targetWidth, metadata.height ?? 1, saved.storagePath, saved.bytes]
  );

  return (
    (await db.get<AssetRenditionRecord>(
      `
SELECT
  id,
  asset_id as assetId,
  kind,
  width,
  height,
  storage_path as storagePath,
  bytes,
  CAST(created_at AS VARCHAR) as createdAt
FROM asset_renditions
WHERE id = ?
`,
      [id]
    )) ?? null
  );
}

export async function getAssetRendition(
  db: DbClient,
  assetId: number,
  kind: string
): Promise<AssetRenditionRecord | null> {
  return (
    (await db.get<AssetRenditionRecord>(
      `
SELECT
  id,
  asset_id as assetId,
  kind,
  width,
  height,
  storage_path as storagePath,
  bytes,
  CAST(created_at AS VARCHAR) as createdAt
FROM asset_renditions
WHERE asset_id = ? AND kind = ?
`,
      [assetId, kind]
    )) ?? null
  );
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
