import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';

export type StoredAsset = {
  storagePath: string;
  bytes: number;
  checksum: string;
};

export type AssetStorageProvider = {
  save(data: Buffer, key: string): Promise<StoredAsset>;
  read(storagePath: string): Promise<Buffer>;
  delete(storagePath: string): Promise<void>;
};

export class LocalFileStorageProvider implements AssetStorageProvider {
  constructor(private readonly basePath: string) {}

  async save(data: Buffer, key: string): Promise<StoredAsset> {
    const normalized = key.replace(/\\/g, '/').replace(/\.{2,}/g, '').replace(/^\/+/, '');
    const ext = extname(normalized);
    const withoutExt = ext ? normalized.slice(0, -ext.length) : normalized;
    const finalPath = `${withoutExt}-${randomUUID()}${ext}`;
    const absPath = join(this.basePath, finalPath);
    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, data);
    const checksum = createHash('sha256').update(data).digest('hex');
    return {
      storagePath: finalPath,
      bytes: data.byteLength,
      checksum
    };
  }

  async read(storagePath: string): Promise<Buffer> {
    return readFile(join(this.basePath, storagePath));
  }

  async delete(storagePath: string): Promise<void> {
    await rm(join(this.basePath, storagePath), { force: true });
  }
}
