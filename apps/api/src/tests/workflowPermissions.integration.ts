import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { SignOptions } from 'jsonwebtoken';
import { graphql } from 'graphql';

import { InternalAuthProvider } from '../auth/InternalAuthProvider.js';
import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';
import { schema } from '../graphql/schema.js';
import { ensureBaselineSecurity, setUserRoles } from '../security/service.js';
import { ensureUserHasRole } from '../security/permissionEvaluator.js';

async function main() {
  const baseDir = resolve('.data', 'test-workflow-permissions', `${Date.now()}`);
  const dbPath = resolve(baseDir, 'workflow-permissions.duckdb');
  await mkdir(baseDir, { recursive: true });

  const db = await DuckDbClient.create(dbPath);
  await runMigrations(db);
  await ensureBaselineSecurity(db);

  const auth = new InternalAuthProvider(db, 'test-secret', '7d' as NonNullable<SignOptions['expiresIn']>);
  const admin = await auth.createUser({ username: 'admin', password: 'admin123!', displayName: 'Admin' });
  await ensureUserHasRole(db, admin.id, 'admin');

  const createDef = await graphql({
    schema,
    source:
      'mutation($name:String!, $graphJson:String!, $inputSchemaJson:String!, $permissionsJson:String!){ upsertWorkflowDefinition(name:$name, version:1, graphJson:$graphJson, inputSchemaJson:$inputSchemaJson, permissionsJson:$permissionsJson) { id name } }',
    variableValues: {
      name: 'Approval Flow',
      graphJson: JSON.stringify({ nodes: [{ id: 'approve', type: 'ManualApproval', config: {} }], edges: [] }),
      inputSchemaJson: JSON.stringify({ type: 'object' }),
      permissionsJson: JSON.stringify({ roles: ['admin'] })
    },
    contextValue: { db, auth, currentUser: admin }
  });
  assert.equal(createDef.errors, undefined, JSON.stringify(createDef.errors));
  const definitionId = (createDef.data as any)?.upsertWorkflowDefinition?.id;
  assert.ok(definitionId, 'workflow definition should be created');

  const startRun = await graphql({
    schema,
    source: 'mutation($definitionId:Int!){ startWorkflowRun(definitionId:$definitionId, contextJson:"{}") { id status } }',
    variableValues: { definitionId },
    contextValue: { db, auth, currentUser: admin }
  });
  assert.equal(startRun.errors, undefined, JSON.stringify(startRun.errors));
  const runId = (startRun.data as any)?.startWorkflowRun?.id;
  assert.ok(runId, 'workflow run should be started');

  const approve = await graphql({
    schema,
    source: 'mutation($runId:Int!){ approveStep(runId:$runId, nodeId:"approve") { id status } }',
    variableValues: { runId },
    contextValue: { db, auth, currentUser: admin }
  });
  assert.equal(approve.errors, undefined, JSON.stringify(approve.errors));
  assert.equal((approve.data as any)?.approveStep?.status, 'COMPLETED');

  const editor = await auth.createUser({ username: 'editor', password: 'editor123!', displayName: 'Editor' });
  const editorRole = await db.get<{ id: number }>("SELECT id FROM roles WHERE lower(name) = 'editor'");
  assert.ok(editorRole?.id);
  await setUserRoles(db, editor.id, [editorRole!.id]);

  const denied = await graphql({
    schema,
    source: 'query { listWorkflowDefinitions { id name } }',
    contextValue: { db, auth, currentUser: editor }
  });
  assert.ok(denied.errors && denied.errors.length > 0, 'editor should be denied for workflow admin list');
  assert.equal(denied.errors?.[0]?.extensions?.code, 'FORBIDDEN');

  await db.close();
  console.log('workflowPermissions.integration ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
