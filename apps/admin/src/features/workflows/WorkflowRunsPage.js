import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
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
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Workflow Runs", subtitle: "Run status, approvals and logs", actions: _jsx(Button, { label: "Refresh", onClick: () => refresh().catch(() => undefined) }) }), _jsxs(DataTable, { value: runs, size: "small", selectionMode: "single", selection: selected, onSelectionChange: (event) => setSelected(event.value), children: [_jsx(Column, { field: "id", header: "Run ID" }), _jsx(Column, { field: "definitionId", header: "Definition" }), _jsx(Column, { field: "status", header: "Status" }), _jsx(Column, { field: "currentNodeId", header: "Current Node" }), _jsx(Column, { header: "Approve", body: (row) => (_jsx(Button, { text: true, label: "Approve", disabled: row.status !== 'PAUSED' || !row.currentNodeId, onClick: () => sdk.approveStep({ runId: row.id, nodeId: row.currentNodeId ?? '', approvedBy: 'admin' }).then(() => refresh()) })) })] }), selected ? _jsx("pre", { children: JSON.stringify({ context: JSON.parse(selected.contextJson || '{}'), logs: JSON.parse(selected.logsJson || '[]') }, null, 2) }) : null] }));
}
