import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Tag } from 'primereact/tag';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { formatErrorMessage, isForbiddenError } from '../../lib/graphqlErrorUi';
import { ForbiddenState, WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

type RoleRow = {
  id: number;
  name: string;
  description?: string | null;
  permissions: string[];
};

export function RolesPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [selected, setSelected] = useState<RoleRow | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
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
    const [rolesRes, permsRes] = await Promise.all([sdk.listInternalRoles(), sdk.internalPermissions()]);
    const nextRoles = (rolesRes.listInternalRoles ?? []) as RoleRow[];
    setRoles(nextRoles);
    setPermissions((permsRes.internalPermissions ?? []) as string[]);
    setSelected((prev) => nextRoles.find((entry) => entry.id === prev?.id) ?? nextRoles[0] ?? null);
    setStatus('');
  };

  useEffect(() => {
    refresh().catch(handleError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveRole = async () => {
    if (!selected) {
      return;
    }
    await sdk.upsertInternalRole({
      id: selected.id || null,
      name: selected.name,
      description: selected.description ?? null,
      permissions: selected.permissions
    });
    await refresh();
  };

  const deleteRole = async () => {
    if (!selected?.id) {
      return;
    }
    await sdk.deleteInternalRole({ id: selected.id });
    await refresh();
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Roles"
        subtitle="Internal RBAC roles and permissions."
        helpTopicKey="site_overview"
        badges={selected ? <Tag value={`Selected: ${selected.name || 'New role'}`} /> : null}
      />
      {forbiddenReason ? (
        <WorkspaceBody>
          <ForbiddenState title="Role management unavailable" reason={forbiddenReason} />
        </WorkspaceBody>
      ) : (
        <>
          <WorkspaceActionBar
            primary={(
              <>
                <Button
                  label="New Role"
                  onClick={() => setSelected({ id: 0, name: '', description: '', permissions: ['CONTENT_READ', 'CONTENT_WRITE'] })}
                />
                <Button label="Save" onClick={() => saveRole().catch(handleError)} disabled={!selected || selected.name.trim().length < 2} />
                <Button label="Delete" severity="danger" onClick={() => deleteRole().catch(handleError)} disabled={!selected?.id} />
              </>
            )}
          />
          <WorkspaceBody>
            <Splitter className="splitFill" style={{ width: '100%' }}>
              <SplitterPanel size={45} minSize={28}>
                <div className="paneRoot">
                  <div className="paneScroll">
                    <DataTable value={roles} size="small" selectionMode="single" selection={selected} onSelectionChange={(event) => setSelected((event.value as RoleRow) ?? null)}>
                      <Column field="name" header="Role" />
                      <Column field="permissions" header="Permissions" body={(row: RoleRow) => row.permissions.join(', ')} />
                    </DataTable>
                  </div>
                </div>
              </SplitterPanel>
              <SplitterPanel size={55} minSize={28}>
                <div className="paneRoot">
                  <div className="paneScroll">
                    {!selected ? (
                      <p className="muted">Select a role.</p>
                    ) : (
                      <div className="form-row">
                        <label>Name</label>
                        <InputText value={selected.name} onChange={(event) => setSelected({ ...selected, name: event.target.value })} />
                        <label>Description</label>
                        <InputTextarea rows={3} value={selected.description ?? ''} onChange={(event) => setSelected({ ...selected, description: event.target.value })} />
                        <label>Permissions</label>
                        <MultiSelect
                          value={selected.permissions}
                          options={permissions.map((entry) => ({ label: entry, value: entry }))}
                          onChange={(event) => setSelected({ ...selected, permissions: event.value as string[] })}
                          display="chip"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </SplitterPanel>
            </Splitter>
          </WorkspaceBody>
          {status ? <div className="status-panel" role="alert">{status}</div> : null}
        </>
      )}
    </WorkspacePage>
  );
}
