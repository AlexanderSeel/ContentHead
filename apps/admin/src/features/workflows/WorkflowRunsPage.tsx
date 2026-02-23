import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Panel } from 'primereact/panel';

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
    <div className="pageRoot">
      <PageHeader
        title="Workflow Runs"
        subtitle="Run status, approvals and logs"
        helpTopicKey="workflows"
        askAiContext="workflows"
        askAiPayload={{ selectedRun: selected, runCount: runs.length }}
        actions={<Button label="Refresh" onClick={() => refresh().catch(() => undefined)} />}
      />
      <div className="pageBodyFlex splitFill">
        <Splitter className="splitFill" style={{ width: '100%' }}>
          <SplitterPanel size={48} minSize={28}>
            <div className="pane paneScroll">
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
                <Column
                  header="Retry"
                  body={(row: WorkflowRun) => (
                    <Button
                      text
                      label="Retry"
                      disabled={row.status !== 'FAILED'}
                      onClick={() => sdk.retryFailed({ runId: row.id }).then(() => refresh())}
                    />
                  )}
                />
              </DataTable>
            </div>
          </SplitterPanel>
          <SplitterPanel size={52} minSize={30}>
            <div className="pane paneScroll">
              {!selected ? <Panel header="Run Details">Select a run to inspect context and logs.</Panel> : (
                <>
                  <Panel header={`Run #${selected.id} Context`}>
                    <pre>{JSON.stringify(JSON.parse(selected.contextJson || '{}'), null, 2)}</pre>
                  </Panel>
                  <Panel header="Timeline / Logs" toggleable>
                    <pre>{JSON.stringify(JSON.parse(selected.logsJson || '[]'), null, 2)}</pre>
                  </Panel>
                </>
              )}
            </div>
          </SplitterPanel>
        </Splitter>
      </div>
    </div>
  );
}
