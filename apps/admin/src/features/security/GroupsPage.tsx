import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

import { useAuth } from '../../app/AuthContext';
import { createAdminSdk } from '../../lib/sdk';
import { WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

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

  const refresh = async () => {
    const res = await sdk.listPrincipalGroups();
    const nextRows = (res.listPrincipalGroups ?? []) as GroupRow[];
    setRows(nextRows);
    setSelected((prev) => nextRows.find((entry) => entry.id === prev?.id) ?? nextRows[0] ?? null);
  };

  useEffect(() => {
    refresh().catch((error: unknown) => setStatus(String(error)));
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
      <WorkspaceActionBar
        primary={(
          <>
            <Button label="New Group" onClick={() => setSelected({ id: 0, name: '', description: '' })} />
            <Button label="Save" onClick={() => save().catch((error: unknown) => setStatus(String(error)))} disabled={!selected || !selected.name.trim()} />
            <Button label="Delete" severity="danger" onClick={() => remove().catch((error: unknown) => setStatus(String(error)))} disabled={!selected?.id} />
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
            <div className="form-row" style={{ marginTop: '0.75rem' }}>
              <label>Name</label>
              <InputText value={selected.name} onChange={(event) => setSelected({ ...selected, name: event.target.value })} />
              <label>Description</label>
              <InputTextarea rows={3} value={selected.description ?? ''} onChange={(event) => setSelected({ ...selected, description: event.target.value })} />
            </div>
          ) : (
            <p className="muted" style={{ marginTop: '0.75rem' }}>Select or create a group.</p>
          )}
        </div>
      </WorkspaceBody>
      {status ? <div className="status-panel"><pre>{status}</pre></div> : null}
    </WorkspacePage>
  );
}
