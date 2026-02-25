import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import ReactFlow, { Background, Controls, MiniMap, type Connection, type Edge, type Node, type OnConnect } from 'reactflow';
import 'reactflow/dist/style.css';

import { formatErrorMessage } from '../lib/graphqlErrorUi';
import { createAdminSdk } from '../lib/sdk';
import { nodeRegistry, validateNodeConfig } from './workflows/nodeRegistry';
import { NodeInspector } from './workflows/NodeInspector';

const sdk = createAdminSdk(null);

type WorkflowDefinition = {
  id: number;
  name: string;
  version: number;
  graphJson: string;
  inputSchemaJson: string;
  permissionsJson: string;
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
  const navigate = useNavigate();
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [definitionId, setDefinitionId] = useState<number | null>(null);
  const [definitionName, setDefinitionName] = useState('Default Publishing Workflow');
  const [definitionVersion, setDefinitionVersion] = useState(1);
  const [inputSchemaJson, setInputSchemaJson] = useState('{"type":"object"}');
  const [permissionsJson, setPermissionsJson] = useState('{"roles":["admin"]}');

  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [runContextJson, setRunContextJson] = useState(
    JSON.stringify({ siteId, contentItemId: selectedItemId, variantSetId: selectedVariantSetId, marketCode: market, localeCode: locale }, null, 2)
  );
  const [advancedTabs, setAdvancedTabs] = useState<number[] | number | null>([]);

  const selectedNode = graphNodes.find((entry) => entry.id === selectedNodeId) ?? null;

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
  };

  useEffect(() => {
    refreshDefinitions().catch((error: unknown) => onStatus(formatErrorMessage(error)));
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
    const registry = nodeRegistry.find((entry) => entry.type === type);
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

  const startRun = async () => {
    if (!definitionId) {
      return;
    }
    await sdk.startWorkflowRun({ definitionId, contextJson: runContextJson, startedBy: 'admin' });
    navigate('/workflows/runs');
  };

  return (
    <section className="pageRoot">
      <div className="pageBodyFlex splitFill">
        <Splitter className="splitFill" style={{ width: '100%' }}>
          <SplitterPanel size={22} minSize={16}>
            <div className="paneRoot split-pane">
              <h3>Definitions</h3>
              <div className="paneScroll">
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
                  }}
                  placeholder="Select workflow"
                />
              </div>
              <div className="form-row">
                <InputText value={definitionName} onChange={(event) => setDefinitionName(event.target.value)} placeholder="Workflow name" />
                <InputNumber value={definitionVersion} min={1} onValueChange={(event) => setDefinitionVersion(event.value ?? 1)} />
              </div>
              <div className="inline-actions">
                <Button label="Save" onClick={() => saveDefinition().catch((error: unknown) => onStatus(formatErrorMessage(error)))} />
              </div>

              <h4>Node Palette</h4>
              <Accordion multiple activeIndex={[0]}>
                <AccordionTab header="All Nodes">
                  <div className="sample-list">
                    {nodeRegistry.map((entry) => (
                      <Button key={entry.type} text icon={entry.icon} label={entry.label} onClick={() => addNode(entry.type)} />
                    ))}
                  </div>
                </AccordionTab>
              </Accordion>

              <Accordion multiple activeIndex={advancedTabs} onTabChange={(event) => setAdvancedTabs(event.index)}>
                <AccordionTab header="Advanced: Input Schema JSON">
                  <InputTextarea rows={4} value={inputSchemaJson} onChange={(event) => setInputSchemaJson(event.target.value)} />
                </AccordionTab>
                <AccordionTab header="Advanced: Permissions JSON">
                  <InputTextarea rows={4} value={permissionsJson} onChange={(event) => setPermissionsJson(event.target.value)} />
                </AccordionTab>
                <AccordionTab header="Run Context JSON">
                  <InputTextarea rows={4} value={runContextJson} onChange={(event) => setRunContextJson(event.target.value)} />
                </AccordionTab>
              </Accordion>
              </div>
            </div>
          </SplitterPanel>

          <SplitterPanel size={54} minSize={30}>
            <div className="paneRoot split-pane">
              <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>Canvas</h3>
                <div className="inline-actions">
                  <Button label="Auto-layout" text onClick={() => setGraphNodes((prev) => [...prev])} />
                  <Button label="Run This Workflow" severity="success" onClick={() => startRun().catch((error: unknown) => onStatus(formatErrorMessage(error)))} />
                </div>
              </div>
              <div className="paneScroll">
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
                  <MiniMap />
                </ReactFlow>
              </div>
              <div className="inline-actions">
                <Button label="Remove Node" severity="danger" disabled={!selectedNodeId} onClick={removeSelectedNode} />
              </div>
            </div>
          </SplitterPanel>

          <SplitterPanel size={24} minSize={18}>
            <div className="paneRoot split-pane">
              <h3>Inspector</h3>
              <div className="paneScroll">
                <NodeInspector
                  node={selectedNode}
                  onChange={(nextConfig) => {
                    const errors = validateNodeConfig(selectedNode?.type ?? '', nextConfig);
                    if (errors.length > 0) {
                      onStatus(errors[0] ?? 'Invalid config');
                    }
                    if (!selectedNode) {
                      return;
                    }
                    setGraphNodes((prev) => prev.map((node) => (node.id === selectedNode.id ? { ...node, config: nextConfig } : node)));
                  }}
                />
              </div>
            </div>
          </SplitterPanel>
        </Splitter>
      </div>
    </section>
  );
}
