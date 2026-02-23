import { config as loadEnv } from 'dotenv';

loadEnv();

export const config = {
  apiPort: Number(process.env.API_PORT ?? 4000),
  apiHost: process.env.API_HOST ?? '0.0.0.0',
  dbPath: process.env.DB_PATH ?? './data/contenthead.duckdb',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  seedAdminUsername: process.env.SEED_ADMIN_USERNAME ?? 'admin',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'admin123!',
  seedAdminDisplayName: process.env.SEED_ADMIN_DISPLAY_NAME ?? 'Administrator'
};