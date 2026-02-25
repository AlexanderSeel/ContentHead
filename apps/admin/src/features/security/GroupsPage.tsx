import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

import { useAuth } from '../../app/AuthContext';
import { createAdminSdk } from '../../lib/sdk';
import { formatErrorMessage, isForbiddenError } from '../../lib/graphqlErrorUi';
import { ForbiddenState, WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

type GroupRow = {
  id: number;
  name: string;
  description?: string | null;
};

export function GroupsPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);

  const [rows, setRows] = useState<GroupRow[]>([]);
  const [selected, setSelected] = useState<GroupRow | null>(null);
  const [status, setStatus] = useState('');
  const [forbiddenReason, setForbiddenReason] = useState('');

  const handleError = (error: unknown) => {
    const message = formatErrorMessage(error);
    if (isForbiddenError(error)) {
      setForbiddenReason(message);
      return;
    }
    setStatus(message);
  };

  const refresh = async () => {
    const res = await sdk.listPrincipalGroups();
    const nextRows = (res.listPrincipalGroups ?? []) as GroupRow[];
    setRows(nextRows);
    setSelected((prev) => nextRows.find((entry) => entry.id === prev?.id) ?? nextRows[0] ?? null);
    setStatus('');
  };

  useEffect(() => {
    refresh().catch(handleError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!selected) {
      return;
    }
    await sdk.upsertPrincipalGroup({
      id: selected.id || null,
      name: selected.name,
      description: selected.description ?? null
    });
    await refresh();
  };

  const remove = async () => {
    if (!selected?.id) {
      return;
    }
    await sdk.deletePrincipalGroup({ id: selected.id });
    await refresh();
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Groups"
        subtitle="User groups for ACL grants and assignments."
        helpTopicKey="site_overview"
      />
      {forbiddenReason ? (
        <WorkspaceBody>
          <ForbiddenState title="Group management unavailable" reason={forbiddenReason} />
        </WorkspaceBody>
      ) : (
        <>
          <WorkspaceActionBar
            primary={(
              <>
                <Button label="New Group" onClick={() => setSelected({ id: 0, name: '', description: '' })} />
                <Button label="Save" onClick={() => save().catch(handleError)} disabled={!selected || !selected.name.trim()} />
                <Button label="Delete" severity="danger" onClick={() => remove().catch(handleError)} disabled={!selected?.id} />
              </>
            )}
          />
          <WorkspaceBody>
            <div className="paneRoot paneScroll">
              <DataTable
                value={rows}
                size="small"
                selectionMode="single"
                selection={selected}
                onSelectionChange={(event) => setSelected((event.value as GroupRow) ?? null)}
              >
                <Column field="name" header="Group" />
                <Column field="description" header="Description" />
              </DataTable>
              {selected ? (
                <div className="form-row mt-3">
                  <label>Name</label>
                  <InputText value={selected.name} onChange={(event) => setSelected({ ...selected, name: event.target.value })} />
                  <label>Description</label>
                  <InputTextarea rows={3} value={selected.description ?? ''} onChange={(event) => setSelected({ ...selected, description: event.target.value })} />
                </div>
              ) : (
                <p className="muted mt-3">Select or create a group.</p>
              )}
            </div>
          </WorkspaceBody>
          {status ? <div className="status-panel" role="alert">{status}</div> : null}
        </>
      )}
    </WorkspacePage>
  );
}

