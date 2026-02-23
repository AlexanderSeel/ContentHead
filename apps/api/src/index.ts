import { createServer } from 'node:http';

import { createYoga } from 'graphql-yoga';
import type { SignOptions } from 'jsonwebtoken';

import { InternalAuthProvider } from './auth/InternalAuthProvider.js';
import { config } from './config.js';
import { getRequestContext } from './context.js';
import { DuckDbClient } from './db/DuckDbClient.js';
import { runMigrations } from './db/migrate.js';
import { schema } from './graphql/schema.js';

async function bootstrap(): Promise<void> {
  const db = await DuckDbClient.create(config.dbPath);
  await runMigrations(db);

  const auth = new InternalAuthProvider(
    db,
    config.jwtSecret,
    config.jwtExpiresIn as NonNullable<SignOptions['expiresIn']>
  );

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
        db
      };
    }
  });

  const server = createServer(yoga);

  server.listen(config.apiPort, config.apiHost, () => {
    console.log(`GraphQL API running at http://${config.apiHost}:${config.apiPort}/graphql`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
