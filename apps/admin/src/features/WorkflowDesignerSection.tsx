import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Accordion, AccordionTab } from 'primereact/accordion';
import ReactFlow, { Background, Controls, type Connection, type Edge, type Node, type OnConnect } from 'reactflow';
import 'reactflow/dist/style.css';

import { createSdk } from '@contenthead/sdk';
import { getNodeRegistryEntry, nodeRegistry, validateNodeConfig } from './workflows/nodeRegistry';

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

type GraphNode = { id: string; type: string; config?: Record<string, unknown> };
type GraphEdge = { from: string; to: string };
type GraphPayload = { nodes: GraphNode[]; edges: GraphEdge[] };

function parseGraph(value: string): GraphPayload {
  try {
    const parsed = JSON.parse(value) as GraphPayload;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return { nodes: [], edges: [] };
    }
    return parsed;
  } catch {
    return { nodes: [], edges: [] };
  }
}

function autoLayout(nodes: GraphNode[]): Node[] {
  return nodes.map((node, index) => ({
    id: node.id,
    data: { label: `${node.type} (${node.id})` },
    position: { x: 80 + (index % 2) * 360, y: 40 + Math.floor(index / 2) * 120 }
  }));
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

  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeErrors, setNodeErrors] = useState<string[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [runContextJson, setRunContextJson] = useState(
    JSON.stringify({ siteId, contentItemId: selectedItemId, variantSetId: selectedVariantSetId, marketCode: market, localeCode: locale }, null, 2)
  );

  const selectedNode = graphNodes.find((entry) => entry.id === selectedNodeId) ?? null;
  const selectedNodeRegistry = selectedNode ? getNodeRegistryEntry(selectedNode.type) : null;

  const flowNodes = useMemo<Node[]>(
    () =>
      autoLayout(graphNodes).map((node) => ({
        ...node,
        style: {
          border: selectedNodeId === node.id ? '2px solid var(--primary-color)' : '1px solid var(--surface-border)',
          borderRadius: 8,
          padding: 4
        }
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
    setRunContextJson(JSON.stringify({ siteId, contentItemId: selectedItemId, variantSetId: selectedVariantSetId, marketCode: market, localeCode: locale }, null, 2));
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
    const registry = getNodeRegistryEntry(type);
    if (!registry) {
      return;
    }
    const id = `node_${Date.now()}`;
    const nextNode: GraphNode = { id, type, config: { ...registry.defaultConfig } };
    setGraphNodes((prev) => [...prev, nextNode]);
    setSelectedNodeId(id);
  };

  const removeSelectedNode = () => {
    if (!selectedNodeId) {
      return;
    }
    setGraphNodes((prev) => prev.filter((node) => node.id !== selectedNodeId));
    setGraphEdges((prev) => prev.filter((edge) => edge.from !== selectedNodeId && edge.to !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const onConnect: OnConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) {
      return;
    }
    const targetIncoming = graphEdges.filter((edge) => edge.to === connection.target);
    if (targetIncoming.length > 0) {
      onStatus('Connection blocked: only one incoming edge per node is allowed.');
      return;
    }
    setGraphEdges((prev) => [...prev, { from: connection.source!, to: connection.target! }]);
  };

  const updateNodeConfig = (key: string, value: unknown) => {
    if (!selectedNode) {
      return;
    }
    const nextConfig = { ...(selectedNode.config ?? {}), [key]: value };
    const errors = validateNodeConfig(selectedNode.type, nextConfig);
    setNodeErrors(errors);
    setGraphNodes((prev) => prev.map((node) => (node.id === selectedNode.id ? { ...node, config: nextConfig } : node)));
  };

  const startRun = async () => {
    if (!definitionId) {
      return;
    }
    await sdk.startWorkflowRun({ definitionId, contextJson: runContextJson, startedBy: 'admin' });
    await refreshRuns(definitionId);
  };

  const selectedRun = runs.find((entry) => entry.id === selectedRunId) ?? null;

  return (
    <section>
      <div className="form-grid" style={{ gridTemplateColumns: '320px 1fr 360px' }}>
        <div className="content-card">
          <h3>Definitions</h3>
          <div className="form-row">
            <Dropdown
              value={definitionId}
              options={definitions.map((entry) => ({ label: `${entry.name} v${entry.version}`, value: entry.id }))}
              onChange={(event) => {
                const id = Number(event.value);
                const picked = definitions.find((entry) => entry.id === id);
                if (!picked) {
                  return;
                }
                setDefinitionId(id);
                setDefinitionName(picked.name);
                setDefinitionVersion(picked.version);
                setInputSchemaJson(picked.inputSchemaJson);
                setPermissionsJson(picked.permissionsJson);
                const graph = parseGraph(picked.graphJson);
                setGraphNodes(graph.nodes);
                setGraphEdges(graph.edges);
                refreshRuns(id).catch((error: unknown) => onStatus(String(error)));
              }}
              placeholder="Select workflow"
            />
          </div>
          <div className="form-row">
            <InputText value={definitionName} onChange={(event) => setDefinitionName(event.target.value)} placeholder="Workflow name" />
            <InputNumber value={definitionVersion} min={1} onValueChange={(event) => setDefinitionVersion(event.value ?? 1)} />
          </div>
          <div className="inline-actions">
            <Button label="Save" onClick={() => saveDefinition().catch((error: unknown) => onStatus(String(error)))} />
            <Button label="Auto-layout" severity="secondary" onClick={() => setGraphNodes((prev) => [...prev])} />
          </div>
          <h4>Node Palette</h4>
          <div className="sample-list">
            {nodeRegistry.map((entry) => (
              <Button key={entry.type} text icon={entry.icon} label={entry.label} onClick={() => addNode(entry.type)} />
            ))}
          </div>
          <Accordion>
            <AccordionTab header="Advanced: Input Schema JSON">
              <InputTextarea rows={4} value={inputSchemaJson} onChange={(event) => setInputSchemaJson(event.target.value)} />
            </AccordionTab>
            <AccordionTab header="Advanced: Permissions JSON">
              <InputTextarea rows={4} value={permissionsJson} onChange={(event) => setPermissionsJson(event.target.value)} />
            </AccordionTab>
          </Accordion>
        </div>

        <div className="content-card">
          <div style={{ height: 520 }}>
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              fitView
              snapToGrid
              snapGrid={[20, 20]}
              onNodeClick={(_event, node) => setSelectedNodeId(node.id)}
              onConnect={onConnect}
              onEdgesChange={() => undefined}
              onNodesChange={() => undefined}
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>
          <div className="inline-actions">
            <Button label="Remove Node" severity="danger" disabled={!selectedNodeId} onClick={removeSelectedNode} />
          </div>
        </div>

        <div className="content-card">
          <h3>Inspector</h3>
          {!selectedNode ? <div className="status-panel">Select a node on the canvas.</div> : null}
          {selectedNode && selectedNodeRegistry ? (
            <>
              <div className="status-panel"><strong>{selectedNodeRegistry.label}</strong><div>{selectedNode.id}</div></div>
              {selectedNodeRegistry.fields.map((field) => (
                <div className="form-row" key={field.key}>
                  <label>{field.label}</label>
                  {field.type === 'number' ? (
                    <InputNumber value={Number(selectedNode.config?.[field.key] ?? 0)} onValueChange={(event) => updateNodeConfig(field.key, event.value ?? 0)} />
                  ) : (
                    <InputText value={String(selectedNode.config?.[field.key] ?? '')} onChange={(event) => updateNodeConfig(field.key, event.target.value)} />
                  )}
                </div>
              ))}
              {nodeErrors.length > 0 ? (
                <div className="status-panel">
                  {nodeErrors.map((entry) => <div key={entry} className="editor-error">{entry}</div>)}
                </div>
              ) : null}
              <Accordion>
                <AccordionTab header="Advanced JSON">
                  <InputTextarea
                    rows={10}
                    value={JSON.stringify(selectedNode.config ?? {}, null, 2)}
                    onChange={(event) => {
                      try {
                        const parsed = JSON.parse(event.target.value) as Record<string, unknown>;
                        const errors = validateNodeConfig(selectedNode.type, parsed);
                        setNodeErrors(errors);
                        setGraphNodes((prev) => prev.map((node) => (node.id === selectedNode.id ? { ...node, config: parsed } : node)));
                      } catch (error) {
                        setNodeErrors([error instanceof Error ? error.message : 'Invalid JSON']);
                      }
                    }}
                  />
                </AccordionTab>
              </Accordion>
            </>
          ) : null}
        </div>
      </div>

      <div className="content-card">
        <h3>Run Workflow</h3>
        <div className="form-row">
          <label>Run context</label>
          <InputTextarea rows={4} value={runContextJson} onChange={(event) => setRunContextJson(event.target.value)} />
        </div>
        <div className="inline-actions">
          <Button label="Start Run" onClick={() => startRun().catch((error: unknown) => onStatus(String(error)))} />
        </div>
        <DataTable value={runs} size="small" selectionMode="single" selection={selectedRun} onSelectionChange={(event) => setSelectedRunId((event.value as WorkflowRun | null)?.id ?? null)}>
          <Column field="id" header="Run ID" />
          <Column field="status" header="Status" />
          <Column field="currentNodeId" header="Current Node" />
          <Column
            header="Approve"
            body={(row: WorkflowRun) => (
              <Button text size="small" disabled={row.status !== 'PAUSED' || !row.currentNodeId} label="Approve" onClick={() => sdk.approveStep({ runId: row.id, nodeId: row.currentNodeId!, approvedBy: 'admin' }).then(() => refreshRuns(row.definitionId))} />
            )}
          />
          <Column
            header="Retry"
            body={(row: WorkflowRun) => (
              <Button text size="small" disabled={row.status !== 'FAILED'} label="Retry" onClick={() => sdk.retryFailed({ runId: row.id }).then(() => refreshRuns(row.definitionId))} />
            )}
          />
        </DataTable>
        {selectedRun ? <pre>{selectedRun.logsJson}</pre> : null}
      </div>
    </section>
  );
}
