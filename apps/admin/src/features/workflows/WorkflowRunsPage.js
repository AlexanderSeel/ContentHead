import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Panel } from 'primereact/panel';
import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
export function WorkflowRunsPage() {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const [runs, setRuns] = useState([]);
    const [selected, setSelected] = useState(null);
    const refresh = async () => {
        const list = await sdk.listWorkflowRuns({ definitionId: null });
        setRuns((list.listWorkflowRuns ?? []));
    };
    useEffect(() => {
        refresh().catch(() => undefined);
    }, []);
    return (_jsxs("div", { className: "pageRoot", children: [_jsx(PageHeader, { title: "Workflow Runs", subtitle: "Run status, approvals and logs", helpTopicKey: "workflows", askAiContext: "workflows", askAiPayload: { selectedRun: selected, runCount: runs.length }, actions: _jsx(Button, { label: "Refresh", onClick: () => refresh().catch(() => undefined) }) }), _jsx("div", { className: "pageBodyFlex splitFill", children: _jsxs(Splitter, { className: "splitFill", style: { width: '100%' }, children: [_jsx(SplitterPanel, { size: 48, minSize: 28, children: _jsx("div", { className: "pane paneScroll", children: _jsxs(DataTable, { value: runs, size: "small", selectionMode: "single", selection: selected, onSelectionChange: (event) => setSelected(event.value), children: [_jsx(Column, { field: "id", header: "Run ID" }), _jsx(Column, { field: "definitionId", header: "Definition" }), _jsx(Column, { field: "status", header: "Status" }), _jsx(Column, { field: "currentNodeId", header: "Current Node" }), _jsx(Column, { header: "Approve", body: (row) => (_jsx(Button, { text: true, label: "Approve", disabled: row.status !== 'PAUSED' || !row.currentNodeId, onClick: () => sdk.approveStep({ runId: row.id, nodeId: row.currentNodeId ?? '', approvedBy: 'admin' }).then(() => refresh()) })) }), _jsx(Column, { header: "Retry", body: (row) => (_jsx(Button, { text: true, label: "Retry", disabled: row.status !== 'FAILED', onClick: () => sdk.retryFailed({ runId: row.id }).then(() => refresh()) })) })] }) }) }), _jsx(SplitterPanel, { size: 52, minSize: 30, children: _jsx("div", { className: "pane paneScroll", children: !selected ? _jsx(Panel, { header: "Run Details", children: "Select a run to inspect context and logs." }) : (_jsxs(_Fragment, { children: [_jsx(Panel, { header: `Run #${selected.id} Context`, children: _jsx("pre", { children: JSON.stringify(JSON.parse(selected.contextJson || '{}'), null, 2) }) }), _jsx(Panel, { header: "Timeline / Logs", toggleable: true, children: _jsx("pre", { children: JSON.stringify(JSON.parse(selected.logsJson || '[]'), null, 2) }) })] })) }) })] }) })] }));
}
