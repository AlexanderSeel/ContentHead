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
  generateAssetRenditionFromPreset,
  getAssetRendition,
  getAssetRenditionByPreset
} from './assets/service.js';
import { LocalFileStorageProvider } from './assets/storage.js';
import { config } from './config.js';
import { resolveDefaultConnector, ensureBaselineConnectors } from './connectors/service.js';
import { getRequestContext } from './context.js';
import { DuckDbClient } from './db/DuckDbClient.js';
import { runMigrations } from './db/migrate.js';
import { schema } from './graphql/schema.js';
import { ensureBaselineSecurity } from './security/service.js';
import { ensureUserHasRole } from './security/permissionEvaluator.js';

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

  // Ensure the configured seed admin user always has the admin role.
  // This is idempotent (INSERT … WHERE NOT EXISTS) and guards against the
  // case where the DB was migrated or reset without re-running the seed script.
  const adminUserRow = await db.get<{ id: number }>(
    'SELECT id FROM users WHERE lower(username) = lower(?)',
    [config.seedAdminUsername]
  );
  if (adminUserRow?.id) {
    await ensureUserHasRole(db, adminUserRow.id, 'admin');
  }

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
    try {
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
        res.setHeader('cache-control', 'public, max-age=0, must-revalidate');
        res.end(file);
        return;
      }

      const presetRenditionMatch = /^\/assets\/(\d+)\/rendition\/preset\/([^/]+)$/.exec(url.pathname);
      if (req.method === 'GET' && presetRenditionMatch) {
        const assetId = Number(presetRenditionMatch[1]);
        const presetId = decodeURIComponent(presetRenditionMatch[2] ?? '').trim();
        if (!presetId) {
          res.statusCode = 400;
          res.end('Preset id is required');
          return;
        }

        const storage = await resolveAssetStorage();
        let rendition = await getAssetRenditionByPreset(db, assetId, presetId);
        if (!rendition) {
          rendition = await generateAssetRenditionFromPreset(db, storage, { assetId, presetId });
        }

        const file = await storage.read(rendition.storagePath);
        const etag = `"${createHash('sha1').update(`${rendition.id}:${rendition.bytes}:${rendition.createdAt}`).digest('hex')}"`;
        if (req.headers['if-none-match'] === etag) {
          res.statusCode = 304;
          res.end();
          return;
        }
        const contentType =
          rendition.format === 'jpeg'
            ? 'image/jpeg'
            : rendition.format === 'png'
              ? 'image/png'
              : 'image/webp';
        res.statusCode = 200;
        res.setHeader('content-type', contentType);
        res.setHeader('etag', etag);
        res.setHeader('last-modified', new Date(rendition.createdAt).toUTCString());
        res.setHeader('cache-control', 'public, max-age=0, must-revalidate');
        res.end(file);
        return;
      }

      const renditionMatch = /^\/assets\/(\d+)\/rendition\/(thumb|small|medium|large|original)$/.exec(url.pathname);
      if (req.method === 'GET' && renditionMatch) {
        const assetId = Number(renditionMatch[1]);
        const kind = renditionMatch[2] as 'thumb' | 'small' | 'medium' | 'large' | 'original';
        const presetId = url.searchParams.get('presetId')?.trim() ?? '';
        if (presetId) {
          const storage = await resolveAssetStorage();
          let presetRendition = await getAssetRenditionByPreset(db, assetId, presetId);
          if (!presetRendition) {
            presetRendition = await generateAssetRenditionFromPreset(db, storage, { assetId, presetId });
          }
          const file = await storage.read(presetRendition.storagePath);
          const etag = `"${createHash('sha1').update(`${presetRendition.id}:${presetRendition.bytes}:${presetRendition.createdAt}`).digest('hex')}"`;
          if (req.headers['if-none-match'] === etag) {
            res.statusCode = 304;
            res.end();
            return;
          }
          const contentType =
            presetRendition.format === 'jpeg'
              ? 'image/jpeg'
              : presetRendition.format === 'png'
                ? 'image/png'
                : 'image/webp';
          res.statusCode = 200;
          res.setHeader('content-type', contentType);
          res.setHeader('etag', etag);
          res.setHeader('last-modified', new Date(presetRendition.createdAt).toUTCString());
          res.setHeader('cache-control', 'public, max-age=0, must-revalidate');
          res.end(file);
          return;
        }
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
        const etag = `"${createHash('sha1').update(`${rendition.id}:${rendition.bytes}:${rendition.createdAt}`).digest('hex')}"`;
        if (req.headers['if-none-match'] === etag) {
          res.statusCode = 304;
          res.end();
          return;
        }
        res.statusCode = 200;
        res.setHeader('content-type', rendition.format === 'png' ? 'image/png' : rendition.format === 'jpeg' ? 'image/jpeg' : 'image/webp');
        res.setHeader('etag', etag);
        res.setHeader('last-modified', new Date(rendition.createdAt).toUTCString());
        res.setHeader('cache-control', 'public, max-age=0, must-revalidate');
        res.end(file);
        return;
      }

      return yoga(req, res);
    } catch (error) {
      console.error('[api] request failed', error);
      if (res.headersSent) {
        res.end();
        return;
      }
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Internal server error',
          detail: config.nodeEnv === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
        })
      );
    }
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
