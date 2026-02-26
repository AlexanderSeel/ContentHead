import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { formatErrorMessage, isForbiddenError } from '../../lib/graphqlErrorUi';
import { ForbiddenState, WorkspaceActionBar, WorkspaceBody, WorkspaceGrid, WorkspaceHeader, WorkspacePage, WorkspacePaneLayout } from '../../ui/molecules';

type UserRow = {
  id: number;
  username: string;
  displayName: string;
  active: boolean;
  roleIds: number[];
  groupIds?: number[];
};

type RoleRow = {
  id: number;
  name: string;
};

type GroupRow = {
  id: number;
  name: string;
};

export function UsersPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [newUser, setNewUser] = useState({ username: '', displayName: '', password: '', active: true });
  const [resetPassword, setResetPassword] = useState('');
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
    const [usersRes, rolesRes, groupsRes] = await Promise.all([
      sdk.listInternalUsers(),
      sdk.listInternalRoles(),
      sdk.listPrincipalGroups()
    ]);
    const nextUsers = (usersRes.listInternalUsers ?? []) as UserRow[];
    setUsers(nextUsers);
    setRoles((rolesRes.listInternalRoles ?? []) as RoleRow[]);
    setGroups((groupsRes.listPrincipalGroups ?? []) as GroupRow[]);
    setSelected((prev) => nextUsers.find((entry) => entry.id === prev?.id) ?? nextUsers[0] ?? null);
    setStatus('');
  };

  useEffect(() => {
    refresh().catch(handleError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createUser = async () => {
    await sdk.createInternalUser(newUser);
    setNewUser({ username: '', displayName: '', password: '', active: true });
    await refresh();
  };

  const saveUser = async () => {
    if (!selected) {
      return;
    }
    await sdk.updateInternalUser({ id: selected.id, displayName: selected.displayName, active: selected.active });
    await sdk.setUserRoles({ userId: selected.id, roleIds: selected.roleIds });
    await sdk.setUserGroups({
      userId: selected.id,
      groupIds: selected.groupIds ?? []
    });
    await refresh();
  };

  const resetSelectedPassword = async () => {
    if (!selected) {
      return;
    }
    await sdk.resetInternalUserPassword({ userId: selected.id, password: resetPassword });
    setResetPassword('');
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Users"
        subtitle="Internal provider users CRUD, roles, activation and password reset."
        helpTopicKey="site_overview"
        badges={selected ? <Tag value={`Selected: ${selected.username}`} /> : null}
      />
      {forbiddenReason ? (
        <WorkspaceBody>
          <ForbiddenState title="Users management unavailable" reason={forbiddenReason} />
        </WorkspaceBody>
      ) : (
        <>
          <WorkspaceActionBar
            primary={(
              <>
                <Button
                  label="Create User"
                  onClick={() => createUser().catch(handleError)}
                  disabled={newUser.username.trim().length < 3 || newUser.password.length < 8}
                />
                <Button label="Save Changes" onClick={() => saveUser().catch(handleError)} disabled={!selected} />
                <Button
                  label="Reset Password"
                  severity="secondary"
                  onClick={() => resetSelectedPassword().catch(handleError)}
                  disabled={!selected || resetPassword.length < 8}
                />
              </>
            )}
          />
          <WorkspaceBody>
            <WorkspacePaneLayout
              workspaceId="security-users"
              left={{
                id: 'users-list',
                label: 'Users',
                defaultSize: 45,
                minSize: 28,
                collapsible: true,
                content: (
                  <div className="form-row">
                    <h3 className="m-0">Create user</h3>
                    <label>Username</label>
                    <InputText value={newUser.username} onChange={(event) => setNewUser({ ...newUser, username: event.target.value })} />
                    <label>Display name</label>
                    <InputText value={newUser.displayName} onChange={(event) => setNewUser({ ...newUser, displayName: event.target.value })} />
                    <label>Password</label>
                    <Password value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} feedback={false} toggleMask />
                    <label>
                      <Checkbox checked={newUser.active} onChange={(event) => setNewUser({ ...newUser, active: Boolean(event.checked) })} /> Active
                    </label>
                    <WorkspaceGrid
                      value={users}
                      tableProps={{
                        selectionMode: 'single',
                        selection: selected,
                        onSelectionChange: (event: any) => setSelected((event.value as UserRow) ?? null)
                      }}
                    >
                      <Column field="username" header="Username" />
                      <Column field="displayName" header="Display Name" />
                      <Column field="active" header="Active" body={(row: UserRow) => (row.active ? 'Yes' : 'No')} />
                    </WorkspaceGrid>
                  </div>
                )
              }}
              center={{
                id: 'user-editor',
                label: 'Editor',
                defaultSize: 55,
                minSize: 28,
                collapsible: false,
                content: !selected ? (
                  <p className="muted">Select a user to edit.</p>
                ) : (
                  <div className="form-row">
                    <label>Display name</label>
                    <InputText value={selected.displayName} onChange={(event) => setSelected({ ...selected, displayName: event.target.value })} />
                    <label>
                      <Checkbox checked={selected.active} onChange={(event) => setSelected({ ...selected, active: Boolean(event.checked) })} /> Active
                    </label>
                    <label>Roles</label>
                    <MultiSelect
                      value={selected.roleIds}
                      options={roles.map((entry) => ({ label: entry.name, value: entry.id }))}
                      onChange={(event) => setSelected({ ...selected, roleIds: event.value as number[] })}
                    />
                    <label>Reset password</label>
                    <Password value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} feedback={false} toggleMask />
                    <label>Groups</label>
                    <MultiSelect
                      value={selected.groupIds ?? []}
                      options={groups.map((entry) => ({ label: entry.name, value: entry.id }))}
                      onChange={(event) =>
                        setSelected({
                          ...selected,
                          groupIds: event.value as number[]
                        })
                      }
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
