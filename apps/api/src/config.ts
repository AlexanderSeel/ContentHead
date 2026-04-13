import { config as loadEnv } from 'dotenv';

loadEnv();

export const config = {
  apiPort: Number(process.env.API_PORT ?? 4000),
  apiHost: process.env.API_HOST ?? '0.0.0.0',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  dbPath: process.env.DB_PATH ?? './data/contenthead.duckdb',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:3200')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  seedAdminUsername: process.env.SEED_ADMIN_USERNAME ?? 'admin',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'admin123!',
  seedAdminDisplayName: process.env.SEED_ADMIN_DISPLAY_NAME ?? 'Administrator',
  assetsBasePath: process.env.ASSETS_BASE_PATH ?? './.data/assets',
  connectorSecretKey: process.env.CONNECTOR_SECRET_KEY ?? process.env.JWT_SECRET ?? 'change-me',
  enableIntrospection:
    (process.env.GRAPHQL_INTROSPECTION ?? '').toLowerCase() === 'true' ||
    (process.env.NODE_ENV ?? 'development') === 'development'
};
