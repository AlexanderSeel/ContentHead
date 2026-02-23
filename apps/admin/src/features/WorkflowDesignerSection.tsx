import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import ReactFlow, { Background, Controls, type Edge, type Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { createSdk } from '@contenthead/sdk';

const sdk = createSdk({ endpoint: 'http://localhost:4000/graphql' });

type WorkflowDefinition = {
  id: number;
  name: string;
  version: number;
  graphJson: string;
  inputSchemaJson: string;
  permissionsJson: string;
};

type WorkflowRun = {
  id: number;
  definitionId: number;
  status: string;
  contextJson: string;
  currentNodeId?: string | null;
  logsJson: string;
};

type GraphPayload = {
  nodes: Array<{ id: string; type: string; config?: Record<string, unknown> }>;
  edges: Array<{ from: string; to: string }>;
};

const NODE_TYPES = [
  'FetchContent',
  'CreateDraftVersion',
  'ManualApproval',
  'PublishVersion',
  'ActivateVariant',
  'AI.GenerateType',
  'AI.GenerateContent',
  'AI.GenerateVariants',
  'AI.Translate',
  'Notify'
];

function parseGraph(value: string): GraphPayload {
  try {
    const parsed = JSON.parse(value) as GraphPayload;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error('bad graph');
    }
    return parsed;
  } catch {
    return { nodes: [], edges: [] };
  }
}

export function WorkflowDesignerSection({
  siteId,
  selectedItemId,
  selectedVariantSetId,
  market,
  locale,
  onStatus
}: {
  siteId: number;
  selectedItemId: number | null;
  selectedVariantSetId: number | null;
  market: string;
  locale: string;
  onStatus: (value: string) => void;
}) {
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [definitionId, setDefinitionId] = useState<number | null>(null);
  const [definitionName, setDefinitionName] = useState('Default Publishing Workflow');
  const [definitionVersion, setDefinitionVersion] = useState(1);
  const [inputSchemaJson, setInputSchemaJson] = useState('{"type":"object"}');
  const [permissionsJson, setPermissionsJson] = useState('{"roles":["admin"]}');

  const [graphNodes, setGraphNodes] = useState<Array<{ id: string; type: string; config?: Record<string, unknown> }>>([
    {
      id: 'node_1',
      type: 'AI.GenerateContent',
      config: {
        siteId,
        contentItemId: selectedItemId ?? null,
        prompt: 'Generate publishable content'
      }
    },
    { id: 'node_2', type: 'CreateDraftVersion', config: {} },
    { id: 'node_3', type: 'ManualApproval', config: {} },
    { id: 'node_4', type: 'PublishVersion', config: {} },
    {
      id: 'node_5',
      type: 'ActivateVariant',
      config: {
        variantSetId: selectedVariantSetId,
        key: 'default',
        marketCode: market,
        localeCode: locale
      }
    }
  ]);
  const [graphEdges, setGraphEdges] = useState<Array<{ from: string; to: string }>>([
    { from: 'node_1', to: 'node_2' },
    { from: 'node_2', to: 'node_3' },
    { from: 'node_3', to: 'node_4' },
    { from: 'node_4', to: 'node_5' }
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeConfigJson, setNodeConfigJson] = useState('{}');

  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [runContextJson, setRunContextJson] = useState(
    JSON.stringify(
      {
        siteId,
        contentItemId: selectedItemId,
        variantSetId: selectedVariantSetId,
        marketCode: market,
        localeCode: locale
      },
      null,
      2
    )
  );

  const flowNodes = useMemo<Node[]>(
    () =>
      graphNodes.map((node, index) => ({
        id: node.id,
        data: { label: `${node.type} (${node.id})` },
        position: { x: 120 + (index % 3) * 250, y: 50 + Math.floor(index / 3) * 120 },
        style: { border: selectedNodeId === node.id ? '2px solid #0ea5e9' : '1px solid #94a3b8', borderRadius: 8 }
      })),
    [graphNodes, selectedNodeId]
  );

  const flowEdges = useMemo<Edge[]>(
    () => graphEdges.map((edge) => ({ id: `${edge.from}-${edge.to}`, source: edge.from, target: edge.to })),
    [graphEdges]
  );

  const refreshDefinitions = async () => {
    const res = await sdk.listWorkflowDefinitions();
    const all = (res.listWorkflowDefinitions ?? []) as WorkflowDefinition[];
    setDefinitions(all);
    const activeId = definitionId ?? all[0]?.id ?? null;
    setDefinitionId(activeId);
    if (activeId) {
      await refreshRuns(activeId);
    }
  };

  const refreshRuns = async (defId: number) => {
    const runsRes = await sdk.listWorkflowRuns({ definitionId: defId });
    setRuns((runsRes.listWorkflowRuns ?? []) as WorkflowRun[]);
  };

  useEffect(() => {
    refreshDefinitions().catch((error: unknown) => onStatus(String(error)));
  }, []);

  useEffect(() => {
    setRunContextJson(
      JSON.stringify(
        {
          siteId,
          contentItemId: selectedItemId,
          variantSetId: selectedVariantSetId,
          marketCode: market,
          localeCode: locale
        },
        null,
        2
      )
    );
  }, [siteId, selectedItemId, selectedVariantSetId, market, locale]);

  const saveDefinition = async () => {
    const graphJson = JSON.stringify({ nodes: graphNodes, edges: graphEdges });
    const saved = await sdk.upsertWorkflowDefinition({
      id: definitionId,
      name: definitionName,
      version: definitionVersion,
      graphJson,
      inputSchemaJson,
      permissionsJson,
      createdBy: 'admin'
    });
    setDefinitionId(saved.upsertWorkflowDefinition?.id ?? null);
    await refreshDefinitions();
    onStatus('Workflow definition saved');
  };

  const addNode = (type: string) => {
    const id = `node_${Date.now()}`;
    const nextNode = { id, type, config: {} as Record<string, unknown> };
    setGraphNodes((prev) => {
      const previous = prev[prev.length - 1];
      if (previous) {
        setGraphEdges((edgePrev) => [...edgePrev, { from: previous.id, to: id }]);
      }
      return [...prev, nextNode];
    });
    setSelectedNodeId(id);
    setNodeConfigJson('{}');
  };

  const applyNodeConfig = () => {
    if (!selectedNodeId) {
      return;
    }
    try {
      const config = JSON.parse(nodeConfigJson) as Record<string, unknown>;
      setGraphNodes((prev) => prev.map((node) => (node.id === selectedNodeId ? { ...node, config } : node)));
      onStatus('Node config updated');
    } catch (error) {
      onStatus(String(error));
    }
  };

  const startRun = async () => {
    if (!definitionId) {
      return;
    }
    await sdk.startWorkflowRun({ definitionId, contextJson: runContextJson, startedBy: 'admin' });
    await refreshRuns(definitionId);
    onStatus('Workflow run started');
  };

  const approveRun = async (run: WorkflowRun) => {
    if (!run.currentNodeId) {
      return;
    }
    await sdk.approveStep({ runId: run.id, nodeId: run.currentNodeId, approvedBy: 'admin' });
    await refreshRuns(run.definitionId);
    onStatus(`Approved run #${run.id}`);
  };

  const retryRun = async (run: WorkflowRun) => {
    await sdk.retryFailed({ runId: run.id });
    await refreshRuns(run.definitionId);
    onStatus(`Retried run #${run.id}`);
  };

  return (
    <section>
      <h3>Workflow Designer</h3>
      <div className="form-grid">
        <Dropdown
          value={definitionId}
          options={definitions.map((entry) => ({ label: `${entry.name} v${entry.version}`, value: entry.id }))}
          onChange={(event) => {
            const id = Number(event.value);
            const picked = definitions.find((entry) => entry.id === id);
            setDefinitionId(id);
            setDefinitionName(picked?.name ?? '');
            setDefinitionVersion(picked?.version ?? 1);
            setInputSchemaJson(picked?.inputSchemaJson ?? '{"type":"object"}');
            setPermissionsJson(picked?.permissionsJson ?? '{"roles":["admin"]}');

            const graph = parseGraph(picked?.graphJson ?? '{"nodes":[],"edges":[]}');
            setGraphNodes(graph.nodes);
            setGraphEdges(graph.edges);
            refreshRuns(id).catch((error: unknown) => onStatus(String(error)));
          }}
          placeholder="Select workflow"
        />
        <InputText value={definitionName} onChange={(event) => setDefinitionName(event.target.value)} placeholder="Name" />
        <InputText value={String(definitionVersion)} onChange={(event) => setDefinitionVersion(Number(event.target.value || '1'))} placeholder="Version" />
        <Button label="Save Definition" onClick={() => saveDefinition().catch((error: unknown) => onStatus(String(error)))} />
      </div>

      <div className="form-row">
        <label>Input Schema JSON</label>
        <InputTextarea rows={2} value={inputSchemaJson} onChange={(event) => setInputSchemaJson(event.target.value)} />
      </div>
      <div className="form-row">
        <label>Permissions JSON</label>
        <InputTextarea rows={2} value={permissionsJson} onChange={(event) => setPermissionsJson(event.target.value)} />
      </div>

      <div className="inline-actions">
        {NODE_TYPES.map((type) => (
          <Button key={type} size="small" text label={type} onClick={() => addNode(type)} />
        ))}
      </div>

      <div style={{ height: 360, border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: '1rem' }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          fitView
          onNodeClick={(_event, node) => {
            setSelectedNodeId(node.id);
            const selected = graphNodes.find((entry) => entry.id === node.id);
            setNodeConfigJson(JSON.stringify(selected?.config ?? {}, null, 2));
          }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <div className="form-row">
        <label>Node Config JSON ({selectedNodeId ?? 'none'})</label>
        <InputTextarea rows={4} value={nodeConfigJson} onChange={(event) => setNodeConfigJson(event.target.value)} />
      </div>
      <div className="inline-actions">
        <Button label="Apply Node Config" onClick={applyNodeConfig} />
      </div>

      <h4>Run Viewer</h4>
      <div className="form-row">
        <label>Run Context JSON</label>
        <InputTextarea rows={4} value={runContextJson} onChange={(event) => setRunContextJson(event.target.value)} />
      </div>
      <div className="inline-actions">
        <Button label="Start Run" onClick={() => startRun().catch((error: unknown) => onStatus(String(error)))} />
      </div>

      <DataTable value={runs} size="small">
        <Column field="id" header="Run ID" />
        <Column field="status" header="Status" />
        <Column field="currentNodeId" header="Current Node" />
        <Column
          header="Logs"
          body={(row: WorkflowRun) => (
            <Button
              text
              label="Show"
              size="small"
              onClick={() => onStatus(`Run #${row.id} logs:\n${row.logsJson}`)}
            />
          )}
        />
        <Column
          header="Approve"
          body={(row: WorkflowRun) => (
            <Button
              text
              size="small"
              disabled={row.status !== 'PAUSED' || !row.currentNodeId}
              label="Approve"
              onClick={() => approveRun(row).catch((error: unknown) => onStatus(String(error)))}
            />
          )}
        />
        <Column
          header="Retry"
          body={(row: WorkflowRun) => (
            <Button
              text
              size="small"
              disabled={row.status !== 'FAILED'}
              label="Retry"
              onClick={() => retryRun(row).catch((error: unknown) => onStatus(String(error)))}
            />
          )}
        />
      </DataTable>
    </section>
  );
}
