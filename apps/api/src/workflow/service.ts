import { GraphQLError } from 'graphql';

import type { DbClient } from '../db/DbClient.js';
import { aiGenerateContent, aiGenerateContentType, aiGenerateVariants, aiTranslateVersion } from '../ai/service.js';
import { createDraftVersion, getContentItemDetail, publishVersion } from '../content/service.js';
import { upsertVariant } from '../content/variantService.js';

export type WorkflowDefinitionRecord = {
  id: number;
  name: string;
  version: number;
  graphJson: string;
  inputSchemaJson: string;
  permissionsJson: string;
  createdAt: string;
  createdBy: string;
};

export type WorkflowRunRecord = {
  id: number;
  definitionId: number;
  status: string;
  contextJson: string;
  currentNodeId: string | null;
  logsJson: string;
  startedAt: string;
  startedBy: string;
  updatedAt: string;
};

type WorkflowNode = {
  id: string;
  type: string;
  config?: Record<string, unknown>;
};

type WorkflowEdge = {
  from: string;
  to: string;
};

type WorkflowGraph = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

type RunLog = {
  at: string;
  level: 'info' | 'error';
  nodeId: string;
  message: string;
};

async function nextId(db: DbClient, table: string): Promise<number> {
  const row = await db.get<{ nextId: number }>(`SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM ${table}`);
  return row?.nextId ?? 1;
}

function parseGraph(graphJson: string): WorkflowGraph {
  try {
    const parsed = JSON.parse(graphJson) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Invalid graph payload');
    }
    const graph = parsed as { nodes?: unknown; edges?: unknown };
    const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
    const edges = Array.isArray(graph.edges) ? graph.edges : [];

    return {
      nodes: nodes
        .filter((entry): entry is WorkflowNode => {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            return false;
          }
          const candidate = entry as { id?: unknown; type?: unknown; config?: unknown };
          return typeof candidate.id === 'string' && typeof candidate.type === 'string';
        })
        .map((entry) => {
          const config =
            entry.config && typeof entry.config === 'object' && !Array.isArray(entry.config)
              ? (entry.config as Record<string, unknown>)
              : undefined;
          return config ? { id: entry.id, type: entry.type, config } : { id: entry.id, type: entry.type };
        }),
      edges: edges
        .filter((entry): entry is WorkflowEdge => {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            return false;
          }
          const candidate = entry as { from?: unknown; to?: unknown };
          return typeof candidate.from === 'string' && typeof candidate.to === 'string';
        })
        .map((entry) => ({ from: entry.from, to: entry.to }))
    };
  } catch {
    throw new GraphQLError('graphJson must be valid workflow graph JSON', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }
}

function parseJsonObject(value: string, name: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // handled below
  }

  throw new GraphQLError(`${name} must be a JSON object`, { extensions: { code: 'BAD_USER_INPUT' } });
}

function pickFirstNode(graph: WorkflowGraph): string {
  if (graph.nodes.length === 0) {
    throw new GraphQLError('Workflow graph must have nodes', { extensions: { code: 'BAD_USER_INPUT' } });
  }
  const inbound = new Set(graph.edges.map((edge) => edge.to));
  return graph.nodes.find((node) => !inbound.has(node.id))?.id ?? graph.nodes[0]!.id;
}

function nextNode(graph: WorkflowGraph, currentNodeId: string): string | null {
  return graph.edges.find((edge) => edge.from === currentNodeId)?.to ?? null;
}

async function getDefinition(db: DbClient, definitionId: number): Promise<WorkflowDefinitionRecord> {
  const row = await db.get<WorkflowDefinitionRecord>(
    `
SELECT
  id,
  name,
  version,
  graph_json as graphJson,
  input_schema_json as inputSchemaJson,
  permissions_json as permissionsJson,
  created_at as createdAt,
  created_by as createdBy
FROM workflow_definitions
WHERE id = ?
`,
    [definitionId]
  );

  if (!row) {
    throw new GraphQLError(`Workflow definition ${definitionId} not found`, {
      extensions: { code: 'WORKFLOW_DEFINITION_NOT_FOUND' }
    });
  }

  return row;
}

async function getRun(db: DbClient, runId: number): Promise<WorkflowRunRecord> {
  const row = await db.get<WorkflowRunRecord>(
    `
SELECT
  id,
  definition_id as definitionId,
  status,
  context_json as contextJson,
  current_node_id as currentNodeId,
  logs_json as logsJson,
  started_at as startedAt,
  started_by as startedBy,
  updated_at as updatedAt
FROM workflow_runs
WHERE id = ?
`,
    [runId]
  );

  if (!row) {
    throw new GraphQLError(`Workflow run ${runId} not found`, { extensions: { code: 'WORKFLOW_RUN_NOT_FOUND' } });
  }

  return row;
}

async function appendRunLog(db: DbClient, runId: number, entry: RunLog): Promise<void> {
  const run = await getRun(db, runId);
  const logs = (() => {
    try {
      const parsed = JSON.parse(run.logsJson) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  logs.push(entry);

  await db.run(
    'UPDATE workflow_runs SET logs_json = ?, updated_at = current_timestamp WHERE id = ?',
    [JSON.stringify(logs), runId]
  );
}

async function upsertStepState(
  db: DbClient,
  runId: number,
  nodeId: string,
  status: string,
  payload: Record<string, unknown>
): Promise<void> {
  const id = await nextId(db, 'workflow_step_states');
  await db.run(
    `
INSERT INTO workflow_step_states(id, run_id, node_id, status, payload_json)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT(run_id, node_id) DO UPDATE SET
  status = excluded.status,
  payload_json = excluded.payload_json,
  updated_at = now()
`,
    [id, runId, nodeId, status, JSON.stringify(payload)]
  );
}

async function stepState(db: DbClient, runId: number, nodeId: string): Promise<{ status: string } | null> {
  const row = await db.get<{ status: string }>(
    'SELECT status FROM workflow_step_states WHERE run_id = ? AND node_id = ?',
    [runId, nodeId]
  );

  return row ?? null;
}

async function executeNode(
  db: DbClient,
  run: WorkflowRunRecord,
  node: WorkflowNode,
  context: Record<string, unknown>
): Promise<{ outcome: 'next' | 'pause' | 'fail'; context: Record<string, unknown>; error?: string }> {
  const config = node.config ?? {};

  try {
    switch (node.type) {
      case 'FetchContent': {
        const contentItemId = Number(config.contentItemId ?? context.contentItemId);
        if (!Number.isFinite(contentItemId)) {
          throw new Error('FetchContent requires contentItemId');
        }
        const detail = await getContentItemDetail(db, contentItemId);
        return {
          outcome: 'next',
          context: {
            ...context,
            contentItemId,
            currentDraftVersionId: detail.currentDraftVersion?.id ?? null,
            currentPublishedVersionId: detail.currentPublishedVersion?.id ?? null
          }
        };
      }

      case 'CreateDraftVersion': {
        const contentItemId = Number(config.contentItemId ?? context.contentItemId);
        if (!Number.isFinite(contentItemId)) {
          throw new Error('CreateDraftVersion requires contentItemId');
        }
        const draft = await createDraftVersion(db, {
          contentItemId,
          fromVersionId: config.fromVersionId ? Number(config.fromVersionId) : null,
          by: typeof config.by === 'string' ? config.by : run.startedBy,
          comment: 'Workflow CreateDraftVersion'
        });

        return {
          outcome: 'next',
          context: {
            ...context,
            contentItemId,
            draftVersionId: draft.id
          }
        };
      }

      case 'ManualApproval': {
        const state = await stepState(db, run.id, node.id);
        if (!state || state.status !== 'APPROVED') {
          await upsertStepState(db, run.id, node.id, 'AWAITING_APPROVAL', {});
          return { outcome: 'pause', context };
        }

        await upsertStepState(db, run.id, node.id, 'APPROVED', {});
        return { outcome: 'next', context };
      }

      case 'PublishVersion': {
        const versionId = Number(config.versionId ?? context.draftVersionId);
        if (!Number.isFinite(versionId)) {
          throw new Error('PublishVersion requires draft version');
        }

        const version = await db.get<{ versionNumber: number }>(
          'SELECT version_number as versionNumber FROM content_versions WHERE id = ?',
          [versionId]
        );
        if (!version) {
          throw new Error(`Version ${versionId} not found`);
        }

        const published = await publishVersion(db, {
          versionId,
          expectedVersionNumber: version.versionNumber,
          by: typeof config.by === 'string' ? config.by : run.startedBy,
          comment: 'Workflow publish'
        });

        return {
          outcome: 'next',
          context: {
            ...context,
            publishedVersionId: published.id
          }
        };
      }

      case 'ActivateVariant': {
        const variantSetId = Number(config.variantSetId ?? context.variantSetId);
        const key = typeof config.key === 'string' ? config.key : 'default';
        const contentVersionId = Number(config.contentVersionId ?? context.publishedVersionId ?? context.draftVersionId);

        if (!Number.isFinite(variantSetId) || !Number.isFinite(contentVersionId)) {
          throw new Error('ActivateVariant requires variantSetId and contentVersionId');
        }

        const saved = await upsertVariant(db, {
          variantSetId,
          key,
          priority: Number(config.priority ?? 0),
          ruleJson: JSON.stringify(config.rule ?? {}),
          state: 'ACTIVE',
          trafficAllocation: Number(config.trafficAllocation ?? 100),
          contentVersionId
        });

        return {
          outcome: 'next',
          context: {
            ...context,
            activeVariantId: saved.id,
            activeVariantKey: saved.key
          }
        };
      }

      case 'AI.GenerateType': {
        const siteId = Number(config.siteId ?? context.siteId);
        if (!Number.isFinite(siteId)) {
          throw new Error('AI.GenerateType requires siteId');
        }

        const created = await aiGenerateContentType(db, {
          siteId,
          prompt: String(config.prompt ?? context.prompt ?? 'Generate content type'),
          nameHint: typeof config.nameHint === 'string' ? config.nameHint : null,
          by: run.startedBy
        });

        return {
          outcome: 'next',
          context: {
            ...context,
            generatedContentTypeId: created.id
          }
        };
      }

      case 'AI.GenerateContent': {
        const result = await aiGenerateContent(db, {
          contentItemId: Number(config.contentItemId ?? context.contentItemId) || null,
          siteId: Number(config.siteId ?? context.siteId) || null,
          contentTypeId: Number(config.contentTypeId ?? context.contentTypeId) || null,
          prompt: String(config.prompt ?? context.prompt ?? 'Generate content'),
          by: run.startedBy
        });

        return {
          outcome: 'next',
          context: {
            ...context,
            contentItemId: result.contentItemId,
            draftVersionId: result.draftVersionId
          }
        };
      }

      case 'AI.GenerateVariants': {
        const result = await aiGenerateVariants(db, {
          siteId: Number(config.siteId ?? context.siteId),
          contentItemId: Number(config.contentItemId ?? context.contentItemId),
          marketCode: String(config.marketCode ?? context.marketCode),
          localeCode: String(config.localeCode ?? context.localeCode),
          variantSetId: Number(config.variantSetId ?? context.variantSetId) || null,
          targetVersionId: Number(config.targetVersionId ?? context.publishedVersionId ?? context.draftVersionId),
          prompt: String(config.prompt ?? context.prompt ?? 'Generate variants')
        });

        return {
          outcome: 'next',
          context: {
            ...context,
            variantSetId: result.variantSetId,
            generatedVariantKeys: result.createdKeys
          }
        };
      }

      case 'AI.Translate': {
        const result = await aiTranslateVersion(db, {
          versionId: Number(config.versionId ?? context.publishedVersionId ?? context.draftVersionId),
          targetMarketCode: String(config.targetMarketCode ?? context.marketCode),
          targetLocaleCode: String(config.targetLocaleCode ?? context.localeCode),
          by: run.startedBy
        });

        return {
          outcome: 'next',
          context: {
            ...context,
            contentItemId: result.contentItemId,
            draftVersionId: result.draftVersionId
          }
        };
      }

      case 'Notify': {
        return {
          outcome: 'next',
          context: {
            ...context,
            notify: {
              message: String(config.message ?? 'Notify stub executed'),
              at: new Date().toISOString()
            }
          }
        };
      }

      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  } catch (error) {
    return {
      outcome: 'fail',
      context,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function listWorkflowDefinitions(db: DbClient): Promise<WorkflowDefinitionRecord[]> {
  return db.all<WorkflowDefinitionRecord>(
    `
SELECT
  id,
  name,
  version,
  graph_json as graphJson,
  input_schema_json as inputSchemaJson,
  permissions_json as permissionsJson,
  created_at as createdAt,
  created_by as createdBy
FROM workflow_definitions
ORDER BY name, version DESC
`
  );
}

export async function upsertWorkflowDefinition(
  db: DbClient,
  input: {
    id?: number | null | undefined;
    name: string;
    version: number;
    graphJson: string;
    inputSchemaJson: string;
    permissionsJson: string;
    createdBy: string;
  }
): Promise<WorkflowDefinitionRecord> {
  parseGraph(input.graphJson);
  parseJsonObject(input.inputSchemaJson, 'inputSchemaJson');
  parseJsonObject(input.permissionsJson, 'permissionsJson');

  const id = input.id ?? (await nextId(db, 'workflow_definitions'));
  await db.run(
    `
INSERT INTO workflow_definitions(
  id,
  name,
  version,
  graph_json,
  input_schema_json,
  permissions_json,
  created_by
)
VALUES (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  version = excluded.version,
  graph_json = excluded.graph_json,
  input_schema_json = excluded.input_schema_json,
  permissions_json = excluded.permissions_json,
  created_by = excluded.created_by
`,
    [
      id,
      input.name,
      input.version,
      input.graphJson,
      input.inputSchemaJson,
      input.permissionsJson,
      input.createdBy
    ]
  );

  return getDefinition(db, id);
}

export async function deleteWorkflowDefinition(db: DbClient, id: number): Promise<boolean> {
  await db.run('DELETE FROM workflow_definitions WHERE id = ?', [id]);
  return true;
}

export async function startWorkflowRun(
  db: DbClient,
  input: {
    definitionId: number;
    contextJson: string;
    startedBy: string;
  }
): Promise<WorkflowRunRecord> {
  const definition = await getDefinition(db, input.definitionId);
  parseJsonObject(input.contextJson, 'contextJson');
  const id = await nextId(db, 'workflow_runs');
  const graph = parseGraph(definition.graphJson);
  const firstNode = pickFirstNode(graph);

  await db.run(
    `
INSERT INTO workflow_runs(
  id,
  definition_id,
  status,
  context_json,
  current_node_id,
  logs_json,
  started_by
)
VALUES (?, ?, 'RUNNING', ?, ?, '[]', ?)
`,
    [id, input.definitionId, input.contextJson, firstNode, input.startedBy]
  );

  return executeWorkflowRun(db, id);
}

export async function executeWorkflowRun(db: DbClient, runId: number): Promise<WorkflowRunRecord> {
  let run = await getRun(db, runId);
  const definition = await getDefinition(db, run.definitionId);
  const graph = parseGraph(definition.graphJson);
  let context = parseJsonObject(run.contextJson, 'contextJson');
  let nodeId: string | null = run.currentNodeId ?? pickFirstNode(graph);

  let iterations = 0;
  while (nodeId && iterations < 200) {
    iterations += 1;
    const node = graph.nodes.find((entry) => entry.id === nodeId);
    if (!node) {
      await db.run('UPDATE workflow_runs SET status = ?, updated_at = current_timestamp WHERE id = ?', [
        'FAILED',
        run.id
      ]);
      await appendRunLog(db, run.id, {
        at: new Date().toISOString(),
        level: 'error',
        nodeId,
        message: `Node ${nodeId} missing in graph`
      });
      return getRun(db, run.id);
    }

    await db.run(
      'UPDATE workflow_runs SET status = ?, current_node_id = ?, updated_at = current_timestamp WHERE id = ?',
      ['RUNNING', nodeId, run.id]
    );

    await appendRunLog(db, run.id, {
      at: new Date().toISOString(),
      level: 'info',
      nodeId,
      message: `Executing ${node.type}`
    });

    const result = await executeNode(db, run, node, context);
    context = result.context;

    if (result.outcome === 'fail') {
      await db.run(
        'UPDATE workflow_runs SET status = ?, context_json = ?, updated_at = current_timestamp WHERE id = ?',
        ['FAILED', JSON.stringify(context), run.id]
      );
      await upsertStepState(db, run.id, nodeId, 'FAILED', { error: result.error ?? 'Unknown error' });
      await appendRunLog(db, run.id, {
        at: new Date().toISOString(),
        level: 'error',
        nodeId,
        message: result.error ?? 'Node failed'
      });
      return getRun(db, run.id);
    }

    if (result.outcome === 'pause') {
      await db.run(
        'UPDATE workflow_runs SET status = ?, context_json = ?, current_node_id = ?, updated_at = current_timestamp WHERE id = ?',
        ['PAUSED', JSON.stringify(context), nodeId, run.id]
      );
      await appendRunLog(db, run.id, {
        at: new Date().toISOString(),
        level: 'info',
        nodeId,
        message: 'Paused for manual approval'
      });
      return getRun(db, run.id);
    }

    await upsertStepState(db, run.id, nodeId, 'DONE', {});
    const next = nextNode(graph, nodeId);

    await db.run(
      'UPDATE workflow_runs SET context_json = ?, current_node_id = ?, updated_at = current_timestamp WHERE id = ?',
      [JSON.stringify(context), next, run.id]
    );

    nodeId = next;
    run = await getRun(db, run.id);
  }

  await db.run(
    'UPDATE workflow_runs SET status = ?, current_node_id = NULL, context_json = ?, updated_at = current_timestamp WHERE id = ?',
    ['COMPLETED', JSON.stringify(context), run.id]
  );

  await appendRunLog(db, run.id, {
    at: new Date().toISOString(),
    level: 'info',
    nodeId: run.currentNodeId ?? nodeId ?? 'end',
    message: 'Workflow completed'
  });

  return getRun(db, run.id);
}

export async function approveWorkflowStep(
  db: DbClient,
  input: { runId: number; nodeId: string; approvedBy: string }
): Promise<WorkflowRunRecord> {
  const run = await getRun(db, input.runId);
  if (run.status !== 'PAUSED') {
    throw new GraphQLError(`Run ${run.id} is not paused`, { extensions: { code: 'WORKFLOW_NOT_PAUSED' } });
  }

  await upsertStepState(db, run.id, input.nodeId, 'APPROVED', { approvedBy: input.approvedBy });
  await appendRunLog(db, run.id, {
    at: new Date().toISOString(),
    level: 'info',
    nodeId: input.nodeId,
    message: `Approved by ${input.approvedBy}`
  });

  await db.run('UPDATE workflow_runs SET status = ?, updated_at = current_timestamp WHERE id = ?', [
    'RUNNING',
    run.id
  ]);

  return executeWorkflowRun(db, run.id);
}

export async function retryFailedWorkflowRun(db: DbClient, runId: number): Promise<WorkflowRunRecord> {
  const run = await getRun(db, runId);
  if (run.status !== 'FAILED') {
    throw new GraphQLError(`Run ${run.id} is not failed`, { extensions: { code: 'WORKFLOW_NOT_FAILED' } });
  }

  await db.run('UPDATE workflow_runs SET status = ?, updated_at = current_timestamp WHERE id = ?', [
    'RUNNING',
    run.id
  ]);

  return executeWorkflowRun(db, run.id);
}

export async function listWorkflowRuns(db: DbClient, definitionId?: number | null): Promise<WorkflowRunRecord[]> {
  if (definitionId) {
    return db.all<WorkflowRunRecord>(
      `
SELECT
  id,
  definition_id as definitionId,
  status,
  context_json as contextJson,
  current_node_id as currentNodeId,
  logs_json as logsJson,
  started_at as startedAt,
  started_by as startedBy,
  updated_at as updatedAt
FROM workflow_runs
WHERE definition_id = ?
ORDER BY id DESC
`,
      [definitionId]
    );
  }

  return db.all<WorkflowRunRecord>(
    `
SELECT
  id,
  definition_id as definitionId,
  status,
  context_json as contextJson,
  current_node_id as currentNodeId,
  logs_json as logsJson,
  started_at as startedAt,
  started_by as startedBy,
  updated_at as updatedAt
FROM workflow_runs
ORDER BY id DESC
`
  );
}

export async function getWorkflowRun(db: DbClient, runId: number): Promise<WorkflowRunRecord> {
  return getRun(db, runId);
}
