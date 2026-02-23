import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';

type WorkflowRun = { id: number; definitionId: number; status: string; currentNodeId?: string | null; logsJson: string; contextJson: string };

export function WorkflowRunsPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selected, setSelected] = useState<WorkflowRun | null>(null);

  const refresh = async () => {
    const list = await sdk.listWorkflowRuns({ definitionId: null });
    setRuns((list.listWorkflowRuns ?? []) as WorkflowRun[]);
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  return (
    <div>
      <PageHeader title="Workflow Runs" subtitle="Run status, approvals and logs" actions={<Button label="Refresh" onClick={() => refresh().catch(() => undefined)} />} />
      <DataTable value={runs} size="small" selectionMode="single" selection={selected} onSelectionChange={(event) => setSelected(event.value as WorkflowRun)}>
        <Column field="id" header="Run ID" />
        <Column field="definitionId" header="Definition" />
        <Column field="status" header="Status" />
        <Column field="currentNodeId" header="Current Node" />
        <Column
          header="Approve"
          body={(row: WorkflowRun) => (
            <Button
              text
              label="Approve"
              disabled={row.status !== 'PAUSED' || !row.currentNodeId}
              onClick={() => sdk.approveStep({ runId: row.id, nodeId: row.currentNodeId ?? '', approvedBy: 'admin' }).then(() => refresh())}
            />
          )}
        />
      </DataTable>
      {selected ? <pre>{JSON.stringify({ context: JSON.parse(selected.contextJson || '{}'), logs: JSON.parse(selected.logsJson || '[]') }, null, 2)}</pre> : null}
    </div>
  );
}
