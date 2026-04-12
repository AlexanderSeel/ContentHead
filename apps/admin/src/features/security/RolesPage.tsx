import { useEffect, useMemo, useState } from 'react';

import { Button, MultiSelect, Tag, Textarea, TextInput } from '../../ui/atoms';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { formatErrorMessage, isForbiddenError } from '../../lib/graphqlErrorUi';
import { ForbiddenState, WorkspaceActionBar, WorkspaceBody, WorkspaceGrid, WorkspaceHeader, WorkspacePage, WorkspacePaneLayout } from '../../ui/molecules';

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
            <WorkspacePaneLayout
              workspaceId="security-roles"
              left={{
                id: 'roles-list',
                label: 'Roles',
                defaultSize: 45,
                minSize: 28,
                collapsible: true,
                content: (
                  <WorkspaceGrid
                    data={roles}
                    rowKey="id"
                    selectedRow={selected}
                    onRowSelect={(row) => setSelected(row)}
                    columns={[
                      { key: 'name', header: 'Role' },
                      { key: 'permissions', header: 'Permissions', cell: (row) => row.permissions.join(', ') }
                    ]}
                  />
                )
              }}
              center={{
                id: 'role-editor',
                label: 'Editor',
                defaultSize: 55,
                minSize: 28,
                collapsible: false,
                content: !selected ? (
                  <p className="muted">Select a role.</p>
                ) : (
                  <div className="form-row">
                    <label>Name</label>
                    <TextInput value={selected.name} onChange={(next) => setSelected({ ...selected, name: next })} />
                    <label>Description</label>
                    <Textarea rows={3} value={selected.description ?? ''} onChange={(next) => setSelected({ ...selected, description: next })} />
                    <label>Permissions</label>
                    <MultiSelect
                      value={selected.permissions}
                      options={permissions.map((entry) => ({ label: entry, value: entry }))}
                      onChange={(next) => setSelected({ ...selected, permissions: next })}
                    />
                  </div>
                )
              }}
            />
          </WorkspaceBody>
          {status ? <div className="status-panel" role="alert">{status}</div> : null}
        </>
      )}
    </WorkspacePage>
  );
}
