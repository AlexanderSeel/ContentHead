import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { SignOptions } from 'jsonwebtoken';
import { graphql } from 'graphql';

import { InternalAuthProvider } from '../auth/InternalAuthProvider.js';
import { LocalFileStorageProvider } from '../assets/storage.js';
import { createAssetFolder, createAssetFromUpload } from '../assets/service.js';
import { createContentItem, createContentType, publishVersion, upsertComponentTypeSetting, upsertRoute } from '../content/service.js';
import { runMigrations } from '../db/migrate.js';
import { DuckDbClient } from '../db/DuckDbClient.js';
import { upsertForm } from '../forms/service.js';
import { submitForm } from '../forms/submissionService.js';
import { schema } from '../graphql/schema.js';
import { ensureBaselineConnectors } from '../connectors/service.js';
import { setUserRoles, ensureBaselineSecurity } from '../security/service.js';
import { upsertWorkflowDefinition, startWorkflowRun } from '../workflow/service.js';

async function main() {
  const baseDir = resolve('.data', 'test-graphql-smoke', `${Date.now()}`);
  const dbPath = resolve(baseDir, 'contenthead-graphql-smoke.duckdb');
  const assetsBasePath = resolve(baseDir, 'assets');
  await mkdir(baseDir, { recursive: true });

  const db = await DuckDbClient.create(dbPath);
  await runMigrations(db);
  await ensureBaselineConnectors(db);
  await ensureBaselineSecurity(db);

  const auth = new InternalAuthProvider(db, 'test-secret', '7d' as NonNullable<SignOptions['expiresIn']>);
  const user = await auth.createUser({
    username: 'admin',
    password: 'admin123!',
    displayName: 'Administrator'
  });
  const adminRole = await db.get<{ id: number }>("SELECT id FROM roles WHERE name = 'admin'");
  assert.ok(adminRole?.id, 'Expected admin role to exist');
  await setUserRoles(db, user.id, [adminRole.id]);

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
  await db.run(
    `INSERT INTO site_market_locales(site_id, market_code, locale_code, active, is_default_for_market)
     VALUES (1, 'US', 'en-US', TRUE, TRUE)
     ON CONFLICT(site_id, market_code, locale_code) DO UPDATE SET active = TRUE, is_default_for_market = TRUE`
  );

  const contentType = await createContentType(db, {
    siteId: 1,
    name: 'SmokeType',
    description: 'GraphQL smoke test type',
    fieldsJson: '[]',
    allowedComponentsJson: '[]',
    componentAreaRestrictionsJson: '{}',
    by: 'smoke'
  });
  const item = await createContentItem(db, {
    siteId: 1,
    contentTypeId: contentType.id,
    by: 'smoke',
    initialFieldsJson: '{}',
    initialCompositionJson: '{"areas":[{"name":"main","components":[]}]}',
    initialComponentsJson: '{}',
    metadataJson: '{}',
    comment: 'smoke'
  });
  const draft = await db.get<{ id: number; versionNumber: number }>(
    `SELECT id, version_number as versionNumber
     FROM content_versions
     WHERE id = (SELECT current_draft_version_id FROM content_items WHERE id = ?)`,
    [item.id]
  );
  assert.ok(draft, 'Expected draft version for content item');
  await publishVersion(db, {
    versionId: draft.id,
    expectedVersionNumber: draft.versionNumber,
    by: 'smoke'
  });
  await upsertRoute(db, {
    siteId: 1,
    contentItemId: item.id,
    marketCode: 'US',
    localeCode: 'en-US',
    slug: 'smoke',
    isCanonical: true
  });
  await upsertComponentTypeSetting(db, {
    siteId: 1,
    componentTypeId: 'hero',
    enabled: true,
    groupName: 'Core',
    by: 'smoke'
  });

  const storage = new LocalFileStorageProvider(assetsBasePath);
  const folder = await createAssetFolder(db, { siteId: 1, name: 'Smoke', by: 'smoke' });
  const asset = await createAssetFromUpload(db, storage, {
    siteId: 1,
    filename: 'smoke.svg',
    originalName: 'smoke.svg',
    mimeType: 'image/svg+xml',
    data: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"></svg>'),
    createdBy: 'smoke',
    folderId: folder.id
  });

  const form = await upsertForm(db, {
    siteId: 1,
    name: 'Smoke Form',
    description: 'for graphql smoke',
    active: true
  });
  await submitForm(db, {
    siteId: 1,
    formId: form.id,
    marketCode: 'US',
    localeCode: 'en-US',
    answersJson: '{}',
    contextJson: '{}',
    metaJson: '{}'
  });

  const definition = await upsertWorkflowDefinition(db, {
    name: 'Smoke Definition',
    version: 1,
    graphJson: JSON.stringify({ nodes: [{ id: 'start', type: 'ManualApproval', config: {} }], edges: [] }),
    inputSchemaJson: '{"type":"object"}',
    permissionsJson: '{"roles":["admin"]}',
    createdBy: 'smoke'
  });
  await startWorkflowRun(db, {
    definitionId: definition.id,
    contextJson: '{"siteId":1}',
    startedBy: 'smoke'
  });

  const contextValue = {
    db,
    auth,
    currentUser: user,
    assetStorage: storage
  };

  const execute = async (source: string, variableValues: Record<string, unknown> = {}) => {
    const result = await graphql({
      schema,
      source,
      variableValues,
      contextValue
    });
    assert.equal(result.errors, undefined, `GraphQL errors: ${JSON.stringify(result.errors)}`);
    return result.data;
  };

  await execute(`query { listSites { id name } me { id username } }`);
  await execute(`query($siteId:Int!){ getSiteMarketLocaleMatrix(siteId:$siteId){ siteId combinations { marketCode localeCode } } }`, {
    siteId: 1
  });
  await execute(`query($siteId:Int!){ listRoutes(siteId:$siteId, marketCode:null, localeCode:null){ id slug } }`, { siteId: 1 });
  await execute(
    `query($siteId:Int!,$marketCode:String!,$localeCode:String!,$slug:String!){ resolveRoute(siteId:$siteId,marketCode:$marketCode,localeCode:$localeCode,slug:$slug){ mode route { id } } }`,
    { siteId: 1, marketCode: 'US', localeCode: 'en-US', slug: 'smoke' }
  );
  await execute(
    `query($siteId:Int!,$marketCode:String!,$localeCode:String!,$slug:String!){ getPageByRoute(siteId:$siteId,marketCode:$marketCode,localeCode:$localeCode,slug:$slug){ selectionReason base { route { id } } } }`,
    { siteId: 1, marketCode: 'US', localeCode: 'en-US', slug: 'smoke' }
  );
  await execute(`query($siteId:Int!){ listContentTypes(siteId:$siteId){ id name } }`, { siteId: 1 });
  await execute(`query($contentItemId:Int!){ getContentItemDetail(contentItemId:$contentItemId){ item { id } contentType { id } } }`, {
    contentItemId: item.id
  });
  await execute(`query($siteId:Int!){ listComponentTypeSettings(siteId:$siteId){ componentTypeId enabled } }`, { siteId: 1 });
  await execute(`query($siteId:Int!){ listAssets(siteId:$siteId){ total items { id } } }`, { siteId: 1 });
  await execute(`query($id:Int!){ getAsset(id:$id){ id filename } }`, { id: asset.id });
  await execute(`query($siteId:Int!){ listAssetFolders(siteId:$siteId){ id name } }`, { siteId: 1 });
  await execute(`query($siteId:Int!){ listForms(siteId:$siteId){ id name } }`, { siteId: 1 });
  await execute(`query($siteId:Int!){ listFormSubmissions(siteId:$siteId){ total rows { id status } } }`, { siteId: 1 });
  await execute(`query { listWorkflowDefinitions { id name } }`);
  await execute(`query { listWorkflowRuns(definitionId:null) { id status } }`);
  await execute(`query { dbAdminTables(dangerMode:false) { name schema } }`);
  await execute(`query { dbAdminDescribe(table:"users", dangerMode:false) { table columns { name type } } }`);
  await execute(
    `query { dbAdminList(table:"users", paging:{limit:10, offset:0}, sort:{column:"id", direction:"ASC"}, filter:[], dangerMode:false) { total rowsJson } }`
  );

  await db.close();
  console.log('graphqlSmoke.integration ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
