import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';

import { PageHeader } from '../../components/common/PageHeader';
import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';

type UserRow = {
  id: number;
  username: string;
  displayName: string;
  active: boolean;
  roleIds: number[];
};

type RoleRow = {
  id: number;
  name: string;
};

export function UsersPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [newUser, setNewUser] = useState({ username: '', displayName: '', password: '', active: true });
  const [resetPassword, setResetPassword] = useState('');
  const [status, setStatus] = useState('');

  const refresh = async () => {
    const [usersRes, rolesRes] = await Promise.all([sdk.listInternalUsers(), sdk.listInternalRoles()]);
    const nextUsers = (usersRes.listInternalUsers ?? []) as UserRow[];
    setUsers(nextUsers);
    setRoles((rolesRes.listInternalRoles ?? []) as RoleRow[]);
    setSelected((prev) => nextUsers.find((entry) => entry.id === prev?.id) ?? nextUsers[0] ?? null);
  };

  useEffect(() => {
    refresh().catch((error: unknown) => setStatus(String(error)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pageRoot">
      <PageHeader title="Users" subtitle="Internal provider users CRUD, roles, activation and password reset" helpTopicKey="site_overview" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <section className="content-card">
          <h3>Create user</h3>
          <div className="form-row">
            <label>Username</label>
            <InputText value={newUser.username} onChange={(event) => setNewUser({ ...newUser, username: event.target.value })} />
            <label>Display name</label>
            <InputText value={newUser.displayName} onChange={(event) => setNewUser({ ...newUser, displayName: event.target.value })} />
            <label>Password</label>
            <Password value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} feedback={false} toggleMask />
            <label>
              <Checkbox checked={newUser.active} onChange={(event) => setNewUser({ ...newUser, active: Boolean(event.checked) })} /> Active
            </label>
            <Button
              label="Create"
              onClick={() =>
                sdk
                  .createInternalUser(newUser)
                  .then(() => {
                    setNewUser({ username: '', displayName: '', password: '', active: true });
                    return refresh();
                  })
                  .catch((error: unknown) => setStatus(String(error)))
              }
            />
          </div>

          <DataTable value={users} size="small" selectionMode="single" selection={selected} onSelectionChange={(event) => setSelected((event.value as UserRow) ?? null)}>
            <Column field="username" header="Username" />
            <Column field="displayName" header="Display Name" />
            <Column field="active" header="Active" body={(row: UserRow) => (row.active ? 'Yes' : 'No')} />
          </DataTable>
        </section>

        <section className="content-card">
          {!selected ? (
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
              <div className="inline-actions">
                <Button
                  label="Save"
                  onClick={() =>
                    sdk
                      .updateInternalUser({ id: selected.id, displayName: selected.displayName, active: selected.active })
                      .then(() => sdk.setUserRoles({ userId: selected.id, roleIds: selected.roleIds }))
                      .then(() => refresh())
                      .catch((error: unknown) => setStatus(String(error)))
                  }
                />
              </div>

              <label>Reset password</label>
              <Password value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} feedback={false} toggleMask />
              <Button
                label="Reset password"
                severity="secondary"
                onClick={() =>
                  sdk
                    .resetInternalUserPassword({ userId: selected.id, password: resetPassword })
                    .then(() => setResetPassword(''))
                    .catch((error: unknown) => setStatus(String(error)))
                }
                disabled={resetPassword.length < 8}
              />
            </div>
          )}
        </section>
      </div>
      {status ? <div className="status-panel"><pre>{status}</pre></div> : null}
    </div>
  );
}
