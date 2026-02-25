import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { SignOptions } from 'jsonwebtoken';
import { graphql } from 'graphql';

import { InternalAuthProvider } from '../auth/InternalAuthProvider.js';
import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';
import { ensureBaselineSecurity, setUserRoles } from '../security/service.js';
import { ensureUserHasRole } from '../security/permissionEvaluator.js';
import { schema } from '../graphql/schema.js';

async function main() {
  const baseDir = resolve('.data', 'test-forms-permissions', `${Date.now()}`);
  const dbPath = resolve(baseDir, 'forms-permissions.duckdb');
  await mkdir(baseDir, { recursive: true });

  const db = await DuckDbClient.create(dbPath);
  await runMigrations(db);
  await db.run(
    `INSERT INTO markets(code, name, currency, timezone, active)
     VALUES ('US', 'United States', 'USD', 'America/New_York', TRUE)
     ON CONFLICT(code) DO UPDATE SET active = TRUE`
  );
  await db.run(
    `INSERT INTO locales(code, name, active, fallback_locale_code)
     VALUES ('en-US', 'English (US)', TRUE, NULL)
     ON CONFLICT(code) DO UPDATE SET active = TRUE`
  );
  await db.run(
    `INSERT INTO site_markets(site_id, market_code, is_default, active)
     VALUES (1, 'US', TRUE, TRUE)
     ON CONFLICT(site_id, market_code) DO UPDATE SET active = TRUE, is_default = TRUE`
  );
  await db.run(
    `INSERT INTO site_locales(site_id, locale_code, is_default, active)
     VALUES (1, 'en-US', TRUE, TRUE)
     ON CONFLICT(site_id, locale_code) DO UPDATE SET active = TRUE, is_default = TRUE`
  );
  await ensureBaselineSecurity(db);

  const auth = new InternalAuthProvider(db, 'test-secret', '7d' as NonNullable<SignOptions['expiresIn']>);
  const admin = await auth.createUser({ username: 'admin', password: 'admin123!', displayName: 'Admin' });
  await ensureUserHasRole(db, admin.id, 'admin');

  const editor = await auth.createUser({ username: 'editor', password: 'editor123!', displayName: 'Editor' });
  const editorRole = await db.get<{ id: number }>("SELECT id FROM roles WHERE lower(name) = 'editor'");
  assert.ok(editorRole?.id);
  await setUserRoles(db, editor.id, [editorRole!.id]);

  const viewer = await auth.createUser({ username: 'viewer', password: 'viewer123!', displayName: 'Viewer' });

  const anonList = await graphql({
    schema,
    source: 'query { listForms(siteId: 1) { id } }',
    contextValue: { db, auth, currentUser: null }
  });
  assert.ok(anonList.errors && anonList.errors.length > 0);
  assert.equal(anonList.errors?.[0]?.extensions?.code, 'UNAUTHORIZED');

  const editorList = await graphql({
    schema,
    source: 'query { listForms(siteId: 1) { id name } }',
    contextValue: { db, auth, currentUser: editor }
  });
  assert.equal(editorList.errors, undefined, JSON.stringify(editorList.errors));

  const editorWriteDenied = await graphql({
    schema,
    source: 'mutation { upsertForm(siteId: 1, name: "Feedback", active: true) { id } }',
    contextValue: { db, auth, currentUser: viewer }
  });
  assert.ok(editorWriteDenied.errors && editorWriteDenied.errors.length > 0);
  assert.equal(editorWriteDenied.errors?.[0]?.extensions?.code, 'FORBIDDEN');

  const adminCreate = await graphql({
    schema,
    source: 'mutation { upsertForm(siteId: 1, name: "Feedback", active: true) { id } }',
    contextValue: { db, auth, currentUser: admin }
  });
  assert.equal(adminCreate.errors, undefined, JSON.stringify(adminCreate.errors));
  const formId = Number((adminCreate.data as { upsertForm?: { id: number } }).upsertForm?.id);
  assert.ok(formId > 0);

  const editorUpdateStatusDenied = await graphql({
    schema,
    source: 'mutation { updateSubmissionStatus(id: 1, status: "REVIEWED") { id status } }',
    contextValue: { db, auth, currentUser: viewer }
  });
  assert.ok(editorUpdateStatusDenied.errors && editorUpdateStatusDenied.errors.length > 0);
  assert.equal(editorUpdateStatusDenied.errors?.[0]?.extensions?.code, 'FORBIDDEN');

  const publicSubmit = await graphql({
    schema,
    source:
      'mutation { submitForm(siteId:1, formId:' +
      formId +
      ', marketCode:"US", localeCode:"en-US", answersJson:"{}") { id status } }',
    contextValue: { db, auth, currentUser: null }
  });
  assert.equal(publicSubmit.errors, undefined, JSON.stringify(publicSubmit.errors));

  await db.close();
  console.log('formsPermissions.integration ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
