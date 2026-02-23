import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Accordion, AccordionTab } from 'primereact/accordion';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { createSdk } from '@contenthead/sdk';
import { getNodeRegistryEntry, nodeRegistry, validateNodeConfig } from './workflows/nodeRegistry';
const sdk = createSdk({ endpoint: 'http://localhost:4000/graphql' });
function parseGraph(value) {
    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
            return { nodes: [], edges: [] };
        }
        return parsed;
    }
    catch {
        return { nodes: [], edges: [] };
    }
}
function autoLayout(nodes) {
    return nodes.map((node, index) => ({
        id: node.id,
        data: { label: `${node.type} (${node.id})` },
        position: { x: 80 + (index % 2) * 360, y: 40 + Math.floor(index / 2) * 120 }
    }));
}
export function WorkflowDesignerSection({ siteId, selectedItemId, selectedVariantSetId, market, locale, onStatus }) {
    const [definitions, setDefinitions] = useState([]);
    const [definitionId, setDefinitionId] = useState(null);
    const [definitionName, setDefinitionName] = useState('Default Publishing Workflow');
    const [definitionVersion, setDefinitionVersion] = useState(1);
    const [inputSchemaJson, setInputSchemaJson] = useState('{"type":"object"}');
    const [permissionsJson, setPermissionsJson] = useState('{"roles":["admin"]}');
    const [graphNodes, setGraphNodes] = useState([]);
    const [graphEdges, setGraphEdges] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [nodeErrors, setNodeErrors] = useState([]);
    const [runs, setRuns] = useState([]);
    const [selectedRunId, setSelectedRunId] = useState(null);
    const [runContextJson, setRunContextJson] = useState(JSON.stringify({ siteId, contentItemId: selectedItemId, variantSetId: selectedVariantSetId, marketCode: market, localeCode: locale }, null, 2));
    const selectedNode = graphNodes.find((entry) => entry.id === selectedNodeId) ?? null;
    const selectedNodeRegistry = selectedNode ? getNodeRegistryEntry(selectedNode.type) : null;
    const flowNodes = useMemo(() => autoLayout(graphNodes).map((node) => ({
        ...node,
        style: {
            border: selectedNodeId === node.id ? '2px solid var(--primary-color)' : '1px solid var(--surface-border)',
            borderRadius: 8,
            padding: 4
        }
    })), [graphNodes, selectedNodeId]);
    const flowEdges = useMemo(() => graphEdges.map((edge) => ({ id: `${edge.from}-${edge.to}`, source: edge.from, target: edge.to })), [graphEdges]);
    const refreshDefinitions = async () => {
        const res = await sdk.listWorkflowDefinitions();
        const all = (res.listWorkflowDefinitions ?? []);
        setDefinitions(all);
        const activeId = definitionId ?? all[0]?.id ?? null;
        setDefinitionId(activeId);
        if (activeId) {
            await refreshRuns(activeId);
        }
    };
    const refreshRuns = async (defId) => {
        const runsRes = await sdk.listWorkflowRuns({ definitionId: defId });
        setRuns((runsRes.listWorkflowRuns ?? []));
    };
    useEffect(() => {
        refreshDefinitions().catch((error) => onStatus(String(error)));
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
    const addNode = (type) => {
        const registry = getNodeRegistryEntry(type);
        if (!registry) {
            return;
        }
        const id = `node_${Date.now()}`;
        const nextNode = { id, type, config: { ...registry.defaultConfig } };
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
    const onConnect = (connection) => {
        if (!connection.source || !connection.target) {
            return;
        }
        const targetIncoming = graphEdges.filter((edge) => edge.to === connection.target);
        if (targetIncoming.length > 0) {
            onStatus('Connection blocked: only one incoming edge per node is allowed.');
            return;
        }
        setGraphEdges((prev) => [...prev, { from: connection.source, to: connection.target }]);
    };
    const updateNodeConfig = (key, value) => {
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
    return (_jsxs("section", { children: [_jsxs("div", { className: "form-grid", style: { gridTemplateColumns: '320px 1fr 360px' }, children: [_jsxs("div", { className: "content-card", children: [_jsx("h3", { children: "Definitions" }), _jsx("div", { className: "form-row", children: _jsx(Dropdown, { value: definitionId, options: definitions.map((entry) => ({ label: `${entry.name} v${entry.version}`, value: entry.id })), onChange: (event) => {
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
                                        refreshRuns(id).catch((error) => onStatus(String(error)));
                                    }, placeholder: "Select workflow" }) }), _jsxs("div", { className: "form-row", children: [_jsx(InputText, { value: definitionName, onChange: (event) => setDefinitionName(event.target.value), placeholder: "Workflow name" }), _jsx(InputNumber, { value: definitionVersion, min: 1, onValueChange: (event) => setDefinitionVersion(event.value ?? 1) })] }), _jsxs("div", { className: "inline-actions", children: [_jsx(Button, { label: "Save", onClick: () => saveDefinition().catch((error) => onStatus(String(error))) }), _jsx(Button, { label: "Auto-layout", severity: "secondary", onClick: () => setGraphNodes((prev) => [...prev]) })] }), _jsx("h4", { children: "Node Palette" }), _jsx("div", { className: "sample-list", children: nodeRegistry.map((entry) => (_jsx(Button, { text: true, icon: entry.icon, label: entry.label, onClick: () => addNode(entry.type) }, entry.type))) }), _jsxs(Accordion, { children: [_jsx(AccordionTab, { header: "Advanced: Input Schema JSON", children: _jsx(InputTextarea, { rows: 4, value: inputSchemaJson, onChange: (event) => setInputSchemaJson(event.target.value) }) }), _jsx(AccordionTab, { header: "Advanced: Permissions JSON", children: _jsx(InputTextarea, { rows: 4, value: permissionsJson, onChange: (event) => setPermissionsJson(event.target.value) }) })] })] }), _jsxs("div", { className: "content-card", children: [_jsx("div", { style: { height: 520 }, children: _jsxs(ReactFlow, { nodes: flowNodes, edges: flowEdges, fitView: true, snapToGrid: true, snapGrid: [20, 20], onNodeClick: (_event, node) => setSelectedNodeId(node.id), onConnect: onConnect, onEdgesChange: () => undefined, onNodesChange: () => undefined, children: [_jsx(Background, {}), _jsx(Controls, {})] }) }), _jsx("div", { className: "inline-actions", children: _jsx(Button, { label: "Remove Node", severity: "danger", disabled: !selectedNodeId, onClick: removeSelectedNode }) })] }), _jsxs("div", { className: "content-card", children: [_jsx("h3", { children: "Inspector" }), !selectedNode ? _jsx("div", { className: "status-panel", children: "Select a node on the canvas." }) : null, selectedNode && selectedNodeRegistry ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: selectedNodeRegistry.label }), _jsx("div", { children: selectedNode.id })] }), selectedNodeRegistry.fields.map((field) => (_jsxs("div", { className: "form-row", children: [_jsx("label", { children: field.label }), field.type === 'number' ? (_jsx(InputNumber, { value: Number(selectedNode.config?.[field.key] ?? 0), onValueChange: (event) => updateNodeConfig(field.key, event.value ?? 0) })) : (_jsx(InputText, { value: String(selectedNode.config?.[field.key] ?? ''), onChange: (event) => updateNodeConfig(field.key, event.target.value) }))] }, field.key))), nodeErrors.length > 0 ? (_jsx("div", { className: "status-panel", children: nodeErrors.map((entry) => _jsx("div", { className: "editor-error", children: entry }, entry)) })) : null, _jsx(Accordion, { children: _jsx(AccordionTab, { header: "Advanced JSON", children: _jsx(InputTextarea, { rows: 10, value: JSON.stringify(selectedNode.config ?? {}, null, 2), onChange: (event) => {
                                                    try {
                                                        const parsed = JSON.parse(event.target.value);
                                                        const errors = validateNodeConfig(selectedNode.type, parsed);
                                                        setNodeErrors(errors);
                                                        setGraphNodes((prev) => prev.map((node) => (node.id === selectedNode.id ? { ...node, config: parsed } : node)));
                                                    }
                                                    catch (error) {
                                                        setNodeErrors([error instanceof Error ? error.message : 'Invalid JSON']);
                                                    }
                                                } }) }) })] })) : null] })] }), _jsxs("div", { className: "content-card", children: [_jsx("h3", { children: "Run Workflow" }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Run context" }), _jsx(InputTextarea, { rows: 4, value: runContextJson, onChange: (event) => setRunContextJson(event.target.value) })] }), _jsx("div", { className: "inline-actions", children: _jsx(Button, { label: "Start Run", onClick: () => startRun().catch((error) => onStatus(String(error))) }) }), _jsxs(DataTable, { value: runs, size: "small", selectionMode: "single", selection: selectedRun, onSelectionChange: (event) => setSelectedRunId(event.value?.id ?? null), children: [_jsx(Column, { field: "id", header: "Run ID" }), _jsx(Column, { field: "status", header: "Status" }), _jsx(Column, { field: "currentNodeId", header: "Current Node" }), _jsx(Column, { header: "Approve", body: (row) => (_jsx(Button, { text: true, size: "small", disabled: row.status !== 'PAUSED' || !row.currentNodeId, label: "Approve", onClick: () => sdk.approveStep({ runId: row.id, nodeId: row.currentNodeId, approvedBy: 'admin' }).then(() => refreshRuns(row.definitionId)) })) }), _jsx(Column, { header: "Retry", body: (row) => (_jsx(Button, { text: true, size: "small", disabled: row.status !== 'FAILED', label: "Retry", onClick: () => sdk.retryFailed({ runId: row.id }).then(() => refreshRuns(row.definitionId)) })) })] }), selectedRun ? _jsx("pre", { children: selectedRun.logsJson }) : null] })] }));
}
