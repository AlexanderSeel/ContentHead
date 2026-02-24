import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { TabPanel, TabView } from 'primereact/tabview';

import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { TextInput, NumberInput } from '../../ui/atoms';
import { EntityEditor, EntityTable, ToolbarActions, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';
import { deleteEntity, insertEntity, listEntities, updateEntity } from '../core/dbEntityApi';

type Organisation = {
  id: number;
  site_id: number;
  name: string;
  website: string | null;
  notes: string | null;
};

type Customer = {
  id: number;
  site_id: number;
  organisation_id: number | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  content_item_id: number | null;
  notes: string | null;
};

const emptyOrganisation: Organisation = { id: 0, site_id: 0, name: '', website: null, notes: null };
const emptyCustomer: Customer = {
  id: 0,
  site_id: 0,
  organisation_id: null,
  display_name: '',
  email: null,
  phone: null,
  content_item_id: null,
  notes: null
};

function nextId(rows: Array<{ id: number }>): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

export function CustomerOrganisationPage() {
  const { token } = useAuth();
  const { siteId } = useAdminContext();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [status, setStatus] = useState('');
  const [editingOrganisation, setEditingOrganisation] = useState<Organisation | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const load = async () => {
    const [orgRows, customerRows] = await Promise.all([
      listEntities<Organisation>(token, 'ext_organisations', [{ column: 'site_id', op: 'eq', value: String(siteId) }]),
      listEntities<Customer>(token, 'ext_customers', [{ column: 'site_id', op: 'eq', value: String(siteId) }])
    ]);
    setOrganisations(orgRows);
    setCustomers(customerRows);
  };

  useEffect(() => {
    load().catch((error) => setStatus(String(error)));
  }, [siteId]);

  const orgLookup = useMemo(() => new Map(organisations.map((entry) => [entry.id, entry.name])), [organisations]);

  return (
    <WorkspacePage>
      <WorkspaceHeader title="Customers & Organisations" subtitle="Demo extension addon with CRUD pages and content references." />
      <ToolbarActions
        left={<small className="muted">Site {siteId}</small>}
        right={<Button label="Reload" text onClick={() => load().catch((error) => setStatus(String(error)))} />}
      />
      <TabView>
        <TabPanel header="Organisations">
          <div className="inline-actions" style={{ marginBottom: '0.75rem' }}>
            <Button
              label="Add Organisation"
              onClick={() => setEditingOrganisation({ ...emptyOrganisation, id: nextId(organisations), site_id: siteId })}
            />
          </div>
          <EntityTable
            value={organisations}
            rowKey="id"
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'name', header: 'Name' },
              { key: 'website', header: 'Website' },
              {
                key: 'actions',
                header: 'Actions',
                body: (row) => (
                  <div className="inline-actions">
                    <Button text label="Edit" onClick={() => setEditingOrganisation(row)} />
                    <Button
                      text
                      severity="danger"
                      label="Delete"
                      onClick={() =>
                        deleteEntity(token, 'ext_organisations', { id: row.id })
                          .then(() => load())
                          .catch((error) => setStatus(String(error)))
                      }
                    />
                  </div>
                )
              }
            ]}
          />
        </TabPanel>
        <TabPanel header="Customers">
          <div className="inline-actions" style={{ marginBottom: '0.75rem' }}>
            <Button
              label="Add Customer"
              onClick={() => setEditingCustomer({ ...emptyCustomer, id: nextId(customers), site_id: siteId })}
            />
          </div>
          <EntityTable
            value={customers}
            rowKey="id"
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'display_name', header: 'Name' },
              { key: 'email', header: 'Email' },
              { key: 'phone', header: 'Phone' },
              {
                key: 'organisation',
                header: 'Organisation',
                body: (row) => (row.organisation_id ? orgLookup.get(row.organisation_id) ?? `#${row.organisation_id}` : '-')
              },
              {
                key: 'content_item_id',
                header: 'Content Ref',
                body: (row) => (row.content_item_id ? `#${row.content_item_id}` : '-')
              },
              {
                key: 'actions',
                header: 'Actions',
                body: (row) => (
                  <div className="inline-actions">
                    <Button text label="Edit" onClick={() => setEditingCustomer(row)} />
                    <Button
                      text
                      severity="danger"
                      label="Delete"
                      onClick={() =>
                        deleteEntity(token, 'ext_customers', { id: row.id })
                          .then(() => load())
                          .catch((error) => setStatus(String(error)))
                      }
                    />
                  </div>
                )
              }
            ]}
          />
        </TabPanel>
      </TabView>

      <EntityEditor
        visible={Boolean(editingOrganisation)}
        title={editingOrganisation?.name ? 'Edit Organisation' : 'Create Organisation'}
        onHide={() => setEditingOrganisation(null)}
        footer={(
          <div className="inline-actions" style={{ justifyContent: 'flex-end' }}>
            <Button text label="Cancel" onClick={() => setEditingOrganisation(null)} />
            <Button
              label="Save"
              onClick={() => {
                if (!editingOrganisation) {
                  return;
                }
                const payload = {
                  ...editingOrganisation,
                  name: editingOrganisation.name.trim(),
                  website: editingOrganisation.website?.trim() || null,
                  notes: editingOrganisation.notes?.trim() || null
                };
                const action = organisations.some((entry) => entry.id === payload.id)
                  ? updateEntity(token, 'ext_organisations', { id: payload.id }, payload)
                  : insertEntity(token, 'ext_organisations', payload);
                action
                  .then(() => load())
                  .then(() => setEditingOrganisation(null))
                  .catch((error) => setStatus(String(error)));
              }}
              disabled={!editingOrganisation?.name.trim()}
            />
          </div>
        )}
      >
        {editingOrganisation ? (
          <div className="form-grid">
            <div className="form-row">
              <label>Name</label>
              <TextInput value={editingOrganisation.name} onChange={(next) => setEditingOrganisation((prev) => (prev ? { ...prev, name: next } : prev))} />
            </div>
            <div className="form-row">
              <label>Website</label>
              <TextInput value={editingOrganisation.website ?? ''} onChange={(next) => setEditingOrganisation((prev) => (prev ? { ...prev, website: next } : prev))} />
            </div>
            <div className="form-row">
              <label>Notes</label>
              <TextInput value={editingOrganisation.notes ?? ''} onChange={(next) => setEditingOrganisation((prev) => (prev ? { ...prev, notes: next } : prev))} />
            </div>
          </div>
        ) : null}
      </EntityEditor>

      <EntityEditor
        visible={Boolean(editingCustomer)}
        title={editingCustomer?.display_name ? 'Edit Customer' : 'Create Customer'}
        onHide={() => setEditingCustomer(null)}
        footer={(
          <div className="inline-actions" style={{ justifyContent: 'flex-end' }}>
            <Button text label="Cancel" onClick={() => setEditingCustomer(null)} />
            <Button
              label="Save"
              onClick={() => {
                if (!editingCustomer) {
                  return;
                }
                const payload = {
                  ...editingCustomer,
                  display_name: editingCustomer.display_name.trim(),
                  email: editingCustomer.email?.trim() || null,
                  phone: editingCustomer.phone?.trim() || null,
                  notes: editingCustomer.notes?.trim() || null
                };
                const action = customers.some((entry) => entry.id === payload.id)
                  ? updateEntity(token, 'ext_customers', { id: payload.id }, payload)
                  : insertEntity(token, 'ext_customers', payload);
                action
                  .then(() => load())
                  .then(() => setEditingCustomer(null))
                  .catch((error) => setStatus(String(error)));
              }}
              disabled={!editingCustomer?.display_name.trim()}
            />
          </div>
        )}
      >
        {editingCustomer ? (
          <div className="form-grid">
            <div className="form-row">
              <label>Name</label>
              <TextInput value={editingCustomer.display_name} onChange={(next) => setEditingCustomer((prev) => (prev ? { ...prev, display_name: next } : prev))} />
            </div>
            <div className="form-row">
              <label>Email</label>
              <TextInput value={editingCustomer.email ?? ''} onChange={(next) => setEditingCustomer((prev) => (prev ? { ...prev, email: next } : prev))} />
            </div>
            <div className="form-row">
              <label>Phone</label>
              <TextInput value={editingCustomer.phone ?? ''} onChange={(next) => setEditingCustomer((prev) => (prev ? { ...prev, phone: next } : prev))} />
            </div>
            <div className="form-row">
              <label>Organisation ID</label>
              <NumberInput value={editingCustomer.organisation_id} onChange={(next) => setEditingCustomer((prev) => (prev ? { ...prev, organisation_id: next } : prev))} />
            </div>
            <div className="form-row">
              <label>Linked Content Item ID</label>
              <NumberInput value={editingCustomer.content_item_id} onChange={(next) => setEditingCustomer((prev) => (prev ? { ...prev, content_item_id: next } : prev))} />
            </div>
            <div className="form-row">
              <label>Notes</label>
              <TextInput value={editingCustomer.notes ?? ''} onChange={(next) => setEditingCustomer((prev) => (prev ? { ...prev, notes: next } : prev))} />
            </div>
          </div>
        ) : null}
      </EntityEditor>
      {status ? <div className="status-panel"><pre>{status}</pre></div> : null}
    </WorkspacePage>
  );
}
