import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { SignOptions } from 'jsonwebtoken';
import { graphql } from 'graphql';

import { InternalAuthProvider } from '../auth/InternalAuthProvider.js';
import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';
import { schema } from '../graphql/schema.js';
import { ensureBaselineSecurity } from '../security/service.js';

async function main() {
  const baseDir = resolve('.data', 'test-auth', `${Date.now()}`);
  const dbPath = resolve(baseDir, 'auth.duckdb');
  await mkdir(baseDir, { recursive: true });

  const db = await DuckDbClient.create(dbPath);
  await runMigrations(db);
  await ensureBaselineSecurity(db);

  const auth = new InternalAuthProvider(db, 'test-secret', '7d' as NonNullable<SignOptions['expiresIn']>);
  await auth.createUser({ username: 'admin', password: 'admin123!', displayName: 'Administrator' });

  const unauthorized = await graphql({
    schema,
    source: 'query { me { id username } }',
    contextValue: { db, auth, currentUser: null }
  });
  assert.equal(unauthorized.errors, undefined);
  assert.equal((unauthorized.data as any)?.me, null, 'me should be null when unauthenticated');

  const login = await graphql({
    schema,
    source: 'mutation($username:String!, $password:String!){ login(username:$username, password:$password){ token user { id username displayName } } }',
    variableValues: { username: 'admin', password: 'admin123!' },
    contextValue: { db, auth, currentUser: null }
  });
  assert.equal(login.errors, undefined, `login failed: ${JSON.stringify(login.errors)}`);
  const token = (login.data as any)?.login?.token;
  assert.ok(typeof token === 'string' && token.length > 10, 'login should return token');

  const claims = auth.verifyToken(token);
  assert.ok(claims, 'token should verify');
  const user = await auth.getUserById(Number(claims?.sub));
  assert.ok(user, 'token subject should resolve to user');

  const me = await graphql({
    schema,
    source: 'query { me { id username displayName } }',
    contextValue: { db, auth, currentUser: user }
  });
  assert.equal(me.errors, undefined);
  assert.equal((me.data as any)?.me?.username, 'admin');

  await db.close();
  console.log('auth.integration ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
