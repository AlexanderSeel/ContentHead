import { useEffect, useMemo, useState } from 'react';

import { Button, Textarea, TextInput } from '../../ui/atoms';

import { useAuth } from '../../app/AuthContext';
import { createAdminSdk } from '../../lib/sdk';
import { formatErrorMessage, isForbiddenError } from '../../lib/graphqlErrorUi';
import { DataGrid, ForbiddenState, WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

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
              <DataGrid
                data={rows}
                rowKey="id"
                selectedRow={selected}
                onRowSelect={(row) => setSelected(row)}
                columns={[
                  { key: 'name', header: 'Group' },
                  { key: 'description', header: 'Description' }
                ]}
              />
              {selected ? (
                <div className="form-row mt-3">
                  <label>Name</label>
                  <TextInput value={selected.name} onChange={(next) => setSelected({ ...selected, name: next })} />
                  <label>Description</label>
                  <Textarea rows={3} value={selected.description ?? ''} onChange={(next) => setSelected({ ...selected, description: next })} />
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

