import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { createSdk } from '@contenthead/sdk';
import { nodeRegistry, validateNodeConfig } from './workflows/nodeRegistry';
import { NodeInspector } from './workflows/NodeInspector';
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
    const navigate = useNavigate();
    const [definitions, setDefinitions] = useState([]);
    const [definitionId, setDefinitionId] = useState(null);
    const [definitionName, setDefinitionName] = useState('Default Publishing Workflow');
    const [definitionVersion, setDefinitionVersion] = useState(1);
    const [inputSchemaJson, setInputSchemaJson] = useState('{"type":"object"}');
    const [permissionsJson, setPermissionsJson] = useState('{"roles":["admin"]}');
    const [graphNodes, setGraphNodes] = useState([]);
    const [graphEdges, setGraphEdges] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [runContextJson, setRunContextJson] = useState(JSON.stringify({ siteId, contentItemId: selectedItemId, variantSetId: selectedVariantSetId, marketCode: market, localeCode: locale }, null, 2));
    const selectedNode = graphNodes.find((entry) => entry.id === selectedNodeId) ?? null;
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
        const registry = nodeRegistry.find((entry) => entry.type === type);
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
    const startRun = async () => {
        if (!definitionId) {
            return;
        }
        await sdk.startWorkflowRun({ definitionId, contextJson: runContextJson, startedBy: 'admin' });
        navigate('/workflows/runs');
    };
    return (_jsx("section", { className: "pageRoot", children: _jsx("div", { className: "pageBodyFlex splitFill", children: _jsxs(Splitter, { className: "splitFill", style: { width: '100%' }, children: [_jsx(SplitterPanel, { size: 22, minSize: 16, children: _jsxs("div", { className: "content-card pane paneScroll", children: [_jsx("h3", { children: "Definitions" }), _jsx("div", { className: "form-row", children: _jsx(Dropdown, { value: definitionId, options: definitions.map((entry) => ({ label: `${entry.name} v${entry.version}`, value: entry.id })), onChange: (event) => {
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
                                        }, placeholder: "Select workflow" }) }), _jsxs("div", { className: "form-row", children: [_jsx(InputText, { value: definitionName, onChange: (event) => setDefinitionName(event.target.value), placeholder: "Workflow name" }), _jsx(InputNumber, { value: definitionVersion, min: 1, onValueChange: (event) => setDefinitionVersion(event.value ?? 1) })] }), _jsx("div", { className: "inline-actions", children: _jsx(Button, { label: "Save", onClick: () => saveDefinition().catch((error) => onStatus(String(error))) }) }), _jsx("h4", { children: "Node Palette" }), _jsx(Accordion, { multiple: true, activeIndex: [0], children: _jsx(AccordionTab, { header: "All Nodes", children: _jsx("div", { className: "sample-list", children: nodeRegistry.map((entry) => (_jsx(Button, { text: true, icon: entry.icon, label: entry.label, onClick: () => addNode(entry.type) }, entry.type))) }) }) }), _jsxs(Accordion, { children: [_jsx(AccordionTab, { header: "Advanced: Input Schema JSON", children: _jsx(InputTextarea, { rows: 4, value: inputSchemaJson, onChange: (event) => setInputSchemaJson(event.target.value) }) }), _jsx(AccordionTab, { header: "Advanced: Permissions JSON", children: _jsx(InputTextarea, { rows: 4, value: permissionsJson, onChange: (event) => setPermissionsJson(event.target.value) }) }), _jsx(AccordionTab, { header: "Run Context JSON", children: _jsx(InputTextarea, { rows: 4, value: runContextJson, onChange: (event) => setRunContextJson(event.target.value) }) })] })] }) }), _jsx(SplitterPanel, { size: 54, minSize: 30, children: _jsxs("div", { className: "content-card pane splitFill", children: [_jsxs("div", { className: "inline-actions", style: { justifyContent: 'space-between' }, children: [_jsx("h3", { style: { margin: 0 }, children: "Canvas" }), _jsxs("div", { className: "inline-actions", children: [_jsx(Button, { label: "Auto-layout", text: true, onClick: () => setGraphNodes((prev) => [...prev]) }), _jsx(Button, { label: "Run This Workflow", severity: "success", onClick: () => startRun().catch((error) => onStatus(String(error))) })] })] }), _jsx("div", { className: "paneScroll", children: _jsxs(ReactFlow, { nodes: flowNodes, edges: flowEdges, fitView: true, snapToGrid: true, snapGrid: [20, 20], onNodeClick: (_event, node) => setSelectedNodeId(node.id), onConnect: onConnect, onEdgesChange: () => undefined, onNodesChange: () => undefined, children: [_jsx(Background, {}), _jsx(Controls, {}), _jsx(MiniMap, {})] }) }), _jsx("div", { className: "inline-actions", children: _jsx(Button, { label: "Remove Node", severity: "danger", disabled: !selectedNodeId, onClick: removeSelectedNode }) })] }) }), _jsx(SplitterPanel, { size: 24, minSize: 18, children: _jsxs("div", { className: "content-card pane paneScroll", children: [_jsx("h3", { children: "Inspector" }), _jsx(NodeInspector, { node: selectedNode, onChange: (nextConfig) => {
                                        const errors = validateNodeConfig(selectedNode?.type ?? '', nextConfig);
                                        if (errors.length > 0) {
                                            onStatus(errors[0] ?? 'Invalid config');
                                        }
                                        if (!selectedNode) {
                                            return;
                                        }
                                        setGraphNodes((prev) => prev.map((node) => (node.id === selectedNode.id ? { ...node, config: nextConfig } : node)));
                                    } })] }) })] }) }) }));
}
