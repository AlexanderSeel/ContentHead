import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

import Busboy from 'busboy';
import { createYoga } from 'graphql-yoga';
import type { SignOptions } from 'jsonwebtoken';

import { InternalAuthProvider } from './auth/InternalAuthProvider.js';
import {
  createAssetFromUpload,
  ensureImageRendition,
  getAsset,
  getAssetRendition
} from './assets/service.js';
import { LocalFileStorageProvider } from './assets/storage.js';
import { config } from './config.js';
import { resolveDefaultConnector, ensureBaselineConnectors } from './connectors/service.js';
import { getRequestContext } from './context.js';
import { DuckDbClient } from './db/DuckDbClient.js';
import { runMigrations } from './db/migrate.js';
import { schema } from './graphql/schema.js';
import { ensureBaselineSecurity } from './security/service.js';

async function bootstrap(): Promise<void> {
  const db = await DuckDbClient.create(config.dbPath);
  await runMigrations(db);
  await ensureBaselineConnectors(db);
  await ensureBaselineSecurity(db);

  const auth = new InternalAuthProvider(
    db,
    config.jwtSecret,
    config.jwtExpiresIn as NonNullable<SignOptions['expiresIn']>
  );

  const resolveAssetStorage = async () => {
    const connector = await resolveDefaultConnector(db, 'dam');
    if (connector?.type === 'localfs') {
      try {
        const parsed = JSON.parse(connector.configJson) as { basePath?: string | null | undefined };
        const base = parsed.basePath?.trim() ? parsed.basePath.trim() : config.assetsBasePath;
        await mkdir(resolve(base), { recursive: true });
        return new LocalFileStorageProvider(resolve(base));
      } catch {
        return new LocalFileStorageProvider(resolve(config.assetsBasePath));
      }
    }
    return new LocalFileStorageProvider(resolve(config.assetsBasePath));
  };

  const yoga = createYoga({
    schema,
    graphiql: config.nodeEnv === 'development',
    cors: {
      origin: config.corsOrigin,
      credentials: true
    },
    context: async ({ request }) => {
      const authHeader = request.headers.get('authorization');
      const requestContext = await getRequestContext(auth, authHeader);
      return {
        ...requestContext,
        db,
        assetStorage: await resolveAssetStorage()
      };
    }
  });

  const server = createServer(async (req, res) => {
    if (!req.url) {
      res.statusCode = 400;
      res.end('Bad request');
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? `${config.apiHost}:${config.apiPort}`}`);

    if (req.method === 'POST' && url.pathname === '/api/assets/upload') {
      const requestContext = await getRequestContext(auth, req.headers.authorization ?? null);
      if (!requestContext.currentUser) {
        res.statusCode = 401;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      const siteId = Number(url.searchParams.get('siteId') ?? '1');
      const folderIdRaw = url.searchParams.get('folderId');
      const folderId = folderIdRaw ? Number(folderIdRaw) : null;
      const storage = await resolveAssetStorage();

      const busboy = Busboy({ headers: req.headers });
      let uploadedBuffer: Buffer | undefined;
      let originalName = 'upload.bin';
      let mimeType = 'application/octet-stream';

      await new Promise<void>((resolvePromise, rejectPromise) => {
        busboy.on('file', (_name, stream, info) => {
          originalName = info.filename || originalName;
          mimeType = info.mimeType || mimeType;
          const chunks: Buffer[] = [];
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('error', rejectPromise);
          stream.on('end', () => {
            uploadedBuffer = Buffer.concat(chunks);
          });
        });
        busboy.on('error', rejectPromise);
        busboy.on('finish', () => resolvePromise());
        req.pipe(busboy);
      });

      if (!uploadedBuffer || uploadedBuffer.byteLength === 0) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'No file uploaded' }));
        return;
      }

      const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
      const created = await createAssetFromUpload(db, storage, {
        siteId,
        filename: safeName,
        originalName,
        mimeType,
        data: uploadedBuffer,
        folderId,
        createdBy: requestContext.currentUser.username
      });

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ id: created.id }));
      return;
    }

    const assetMatch = /^\/assets\/(\d+)$/.exec(url.pathname);
    if (req.method === 'GET' && assetMatch) {
      const assetId = Number(assetMatch[1]);
      const asset = await getAsset(db, assetId);
      if (!asset) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }

      const storage = await resolveAssetStorage();
      const file = await storage.read(asset.storagePath);
      const etag = `"${createHash('sha1').update(`${asset.id}:${asset.updatedAt}:${asset.bytes}`).digest('hex')}"`;
      if (req.headers['if-none-match'] === etag) {
        res.statusCode = 304;
        res.end();
        return;
      }
      res.statusCode = 200;
      res.setHeader('content-type', asset.mimeType || 'application/octet-stream');
      res.setHeader('etag', etag);
      res.setHeader('last-modified', new Date(asset.updatedAt).toUTCString());
      res.setHeader('cache-control', 'public, max-age=3600');
      res.end(file);
      return;
    }

    const renditionMatch = /^\/assets\/(\d+)\/rendition\/(thumb|small|medium|large|original)$/.exec(url.pathname);
    if (req.method === 'GET' && renditionMatch) {
      const assetId = Number(renditionMatch[1]);
      const kind = renditionMatch[2] as 'thumb' | 'small' | 'medium' | 'large' | 'original';
      const fit = url.searchParams.get('fit') === 'contain' ? 'contain' : 'cover';
      const widthParam = Number(url.searchParams.get('width') ?? '0');
      const widths: Record<typeof kind, number> = {
        thumb: 320,
        small: 640,
        medium: 1024,
        large: 1600,
        original: 0
      };
      const width = Math.max(1, Math.min(2400, widthParam || widths[kind] || 1024));

      if (kind === 'original') {
        const asset = await getAsset(db, assetId);
        if (!asset) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        const storage = await resolveAssetStorage();
        const file = await storage.read(asset.storagePath);
        res.statusCode = 200;
        res.setHeader('content-type', asset.mimeType || 'application/octet-stream');
        res.setHeader('cache-control', 'public, max-age=3600');
        res.end(file);
        return;
      }

      const storage = await resolveAssetStorage();
      let rendition = await getAssetRendition(db, assetId, kind, fit, width);
      if (!rendition) {
        rendition = await ensureImageRendition(db, storage, assetId, kind, width, fit);
      }

      if (!rendition) {
        res.statusCode = 404;
        res.end('Rendition not found');
        return;
      }

      const file = await storage.read(rendition.storagePath);
      res.statusCode = 200;
      res.setHeader('content-type', 'image/webp');
      res.setHeader('cache-control', 'public, max-age=86400, immutable');
      res.end(file);
      return;
    }

    return yoga(req, res);
  });

  server.listen(config.apiPort, config.apiHost, () => {
    console.log(`GraphQL API running at http://${config.apiHost}:${config.apiPort}/graphql`);
  });

  const shutdown = async () => {
    await new Promise<void>((resolveShutdown) => server.close(() => resolveShutdown()));
    await db.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
