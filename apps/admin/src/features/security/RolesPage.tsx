import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';

import { PageHeader } from '../../components/common/PageHeader';
import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';

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

  const refresh = async () => {
    const [rolesRes, permsRes] = await Promise.all([sdk.listInternalRoles(), sdk.internalPermissions()]);
    const nextRoles = (rolesRes.listInternalRoles ?? []) as RoleRow[];
    setRoles(nextRoles);
    setPermissions((permsRes.internalPermissions ?? []) as string[]);
    setSelected((prev) => nextRoles.find((entry) => entry.id === prev?.id) ?? nextRoles[0] ?? null);
  };

  useEffect(() => {
    refresh().catch((error: unknown) => setStatus(String(error)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pageRoot">
      <PageHeader title="Roles" subtitle="Internal RBAC roles and permissions" helpTopicKey="site_overview" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <section className="content-card">
          <div className="inline-actions" style={{ marginBottom: '0.5rem' }}>
            <Button
              label="New Role"
              onClick={() => setSelected({ id: 0, name: '', description: '', permissions: ['CONTENT_READ', 'CONTENT_WRITE'] })}
            />
          </div>
          <DataTable value={roles} size="small" selectionMode="single" selection={selected} onSelectionChange={(event) => setSelected((event.value as RoleRow) ?? null)}>
            <Column field="name" header="Role" />
            <Column field="permissions" header="Permissions" body={(row: RoleRow) => row.permissions.join(', ')} />
          </DataTable>
        </section>

        <section className="content-card">
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
              <div className="inline-actions">
                <Button
                  label="Save"
                  onClick={() =>
                    sdk
                      .upsertInternalRole({
                        id: selected.id || null,
                        name: selected.name,
                        description: selected.description ?? null,
                        permissions: selected.permissions
                      })
                      .then(() => refresh())
                      .catch((error: unknown) => setStatus(String(error)))
                  }
                />
                <Button
                  label="Delete"
                  severity="danger"
                  onClick={() =>
                    sdk
                      .deleteInternalRole({ id: selected.id })
                      .then(() => refresh())
                      .catch((error: unknown) => setStatus(String(error)))
                  }
                  disabled={!selected.id}
                />
              </div>
            </div>
          )}
        </section>
      </div>
      {status ? <div className="status-panel"><pre>{status}</pre></div> : null}
    </div>
  );
}
