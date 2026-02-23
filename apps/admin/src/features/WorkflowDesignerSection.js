import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { createSdk } from '@contenthead/sdk';
const sdk = createSdk({ endpoint: 'http://localhost:4000/graphql' });
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
function parseGraph(value) {
    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
            throw new Error('bad graph');
        }
        return parsed;
    }
    catch {
        return { nodes: [], edges: [] };
    }
}
export function WorkflowDesignerSection({ siteId, selectedItemId, selectedVariantSetId, market, locale, onStatus }) {
    const [definitions, setDefinitions] = useState([]);
    const [definitionId, setDefinitionId] = useState(null);
    const [definitionName, setDefinitionName] = useState('Default Publishing Workflow');
    const [definitionVersion, setDefinitionVersion] = useState(1);
    const [inputSchemaJson, setInputSchemaJson] = useState('{"type":"object"}');
    const [permissionsJson, setPermissionsJson] = useState('{"roles":["admin"]}');
    const [graphNodes, setGraphNodes] = useState([
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
    const [graphEdges, setGraphEdges] = useState([
        { from: 'node_1', to: 'node_2' },
        { from: 'node_2', to: 'node_3' },
        { from: 'node_3', to: 'node_4' },
        { from: 'node_4', to: 'node_5' }
    ]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [nodeConfigJson, setNodeConfigJson] = useState('{}');
    const [runs, setRuns] = useState([]);
    const [runContextJson, setRunContextJson] = useState(JSON.stringify({
        siteId,
        contentItemId: selectedItemId,
        variantSetId: selectedVariantSetId,
        marketCode: market,
        localeCode: locale
    }, null, 2));
    const flowNodes = useMemo(() => graphNodes.map((node, index) => ({
        id: node.id,
        data: { label: `${node.type} (${node.id})` },
        position: { x: 120 + (index % 3) * 250, y: 50 + Math.floor(index / 3) * 120 },
        style: { border: selectedNodeId === node.id ? '2px solid #0ea5e9' : '1px solid #94a3b8', borderRadius: 8 }
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
        setRunContextJson(JSON.stringify({
            siteId,
            contentItemId: selectedItemId,
            variantSetId: selectedVariantSetId,
            marketCode: market,
            localeCode: locale
        }, null, 2));
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
        const id = `node_${Date.now()}`;
        const nextNode = { id, type, config: {} };
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
            const config = JSON.parse(nodeConfigJson);
            setGraphNodes((prev) => prev.map((node) => (node.id === selectedNodeId ? { ...node, config } : node)));
            onStatus('Node config updated');
        }
        catch (error) {
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
    const approveRun = async (run) => {
        if (!run.currentNodeId) {
            return;
        }
        await sdk.approveStep({ runId: run.id, nodeId: run.currentNodeId, approvedBy: 'admin' });
        await refreshRuns(run.definitionId);
        onStatus(`Approved run #${run.id}`);
    };
    const retryRun = async (run) => {
        await sdk.retryFailed({ runId: run.id });
        await refreshRuns(run.definitionId);
        onStatus(`Retried run #${run.id}`);
    };
    return (_jsxs("section", { children: [_jsx("h3", { children: "Workflow Designer" }), _jsxs("div", { className: "form-grid", children: [_jsx(Dropdown, { value: definitionId, options: definitions.map((entry) => ({ label: `${entry.name} v${entry.version}`, value: entry.id })), onChange: (event) => {
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
                            refreshRuns(id).catch((error) => onStatus(String(error)));
                        }, placeholder: "Select workflow" }), _jsx(InputText, { value: definitionName, onChange: (event) => setDefinitionName(event.target.value), placeholder: "Name" }), _jsx(InputText, { value: String(definitionVersion), onChange: (event) => setDefinitionVersion(Number(event.target.value || '1')), placeholder: "Version" }), _jsx(Button, { label: "Save Definition", onClick: () => saveDefinition().catch((error) => onStatus(String(error))) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Input Schema JSON" }), _jsx(InputTextarea, { rows: 2, value: inputSchemaJson, onChange: (event) => setInputSchemaJson(event.target.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Permissions JSON" }), _jsx(InputTextarea, { rows: 2, value: permissionsJson, onChange: (event) => setPermissionsJson(event.target.value) })] }), _jsx("div", { className: "inline-actions", children: NODE_TYPES.map((type) => (_jsx(Button, { size: "small", text: true, label: type, onClick: () => addNode(type) }, type))) }), _jsx("div", { style: { height: 360, border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: '1rem' }, children: _jsxs(ReactFlow, { nodes: flowNodes, edges: flowEdges, fitView: true, onNodeClick: (_event, node) => {
                        setSelectedNodeId(node.id);
                        const selected = graphNodes.find((entry) => entry.id === node.id);
                        setNodeConfigJson(JSON.stringify(selected?.config ?? {}, null, 2));
                    }, children: [_jsx(Background, {}), _jsx(Controls, {})] }) }), _jsxs("div", { className: "form-row", children: [_jsxs("label", { children: ["Node Config JSON (", selectedNodeId ?? 'none', ")"] }), _jsx(InputTextarea, { rows: 4, value: nodeConfigJson, onChange: (event) => setNodeConfigJson(event.target.value) })] }), _jsx("div", { className: "inline-actions", children: _jsx(Button, { label: "Apply Node Config", onClick: applyNodeConfig }) }), _jsx("h4", { children: "Run Viewer" }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Run Context JSON" }), _jsx(InputTextarea, { rows: 4, value: runContextJson, onChange: (event) => setRunContextJson(event.target.value) })] }), _jsx("div", { className: "inline-actions", children: _jsx(Button, { label: "Start Run", onClick: () => startRun().catch((error) => onStatus(String(error))) }) }), _jsxs(DataTable, { value: runs, size: "small", children: [_jsx(Column, { field: "id", header: "Run ID" }), _jsx(Column, { field: "status", header: "Status" }), _jsx(Column, { field: "currentNodeId", header: "Current Node" }), _jsx(Column, { header: "Logs", body: (row) => (_jsx(Button, { text: true, label: "Show", size: "small", onClick: () => onStatus(`Run #${row.id} logs:\n${row.logsJson}`) })) }), _jsx(Column, { header: "Approve", body: (row) => (_jsx(Button, { text: true, size: "small", disabled: row.status !== 'PAUSED' || !row.currentNodeId, label: "Approve", onClick: () => approveRun(row).catch((error) => onStatus(String(error))) })) }), _jsx(Column, { header: "Retry", body: (row) => (_jsx(Button, { text: true, size: "small", disabled: row.status !== 'FAILED', label: "Retry", onClick: () => retryRun(row).catch((error) => onStatus(String(error))) })) })] })] }));
}
