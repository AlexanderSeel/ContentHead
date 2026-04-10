import { useEffect, useMemo, useState } from 'react';
import { useAdminContext } from '../../app/AdminContext';
import { useAuth } from '../../app/AuthContext';
import { Button, DatePicker, NumberInput, Select, TextInput } from '../../ui/atoms';
import { EntityEditor, EntityTable, PaneRoot, PaneScroll, WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';
import { formatErrorMessage } from '../../lib/graphqlErrorUi';
import { deleteEntity, insertEntity, listEntities, updateEntity } from '../core/dbEntityApi';

type Booking = {
  id: number;
  site_id: number;
  booking_at: string;
  customer_id: number | null;
  content_item_id: number | null;
  status: string;
  notes: string | null;
};

type Customer = {
  id: number;
  display_name: string;
  site_id: number;
};

function nextId(rows: Array<{ id: number }>): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function SchedulerBookingPage() {
  const { token } = useAuth();
  const { siteId } = useAdminContext();
  const [status, setStatus] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const load = async () => {
    const [bookingRows, customerRows] = await Promise.all([
      listEntities<Booking>(token, 'ext_bookings', [{ column: 'site_id', op: 'eq', value: String(siteId) }]),
      listEntities<Customer>(token, 'ext_customers', [{ column: 'site_id', op: 'eq', value: String(siteId) }])
    ]);
    setBookings(bookingRows);
    setCustomers(customerRows);
  };

  useEffect(() => {
    load().catch((error) => setStatus(formatErrorMessage(error)));
  }, [siteId]);

  const customerLookup = useMemo(() => new Map(customers.map((entry) => [entry.id, entry.display_name])), [customers]);

  const filtered = useMemo(() => {
    if (!filterDate) {
      return bookings;
    }
    const iso = filterDate.toISOString().slice(0, 10);
    return bookings.filter((entry) => entry.booking_at.slice(0, 10) === iso);
  }, [bookings, filterDate]);

  return (
    <WorkspacePage>
      <WorkspaceHeader title="Scheduler & Booking" subtitle="Bookings table with date filtering and extension inspector hooks." />
      <WorkspaceActionBar
        primary={(
          <>
            <DatePicker value={filterDate} onChange={setFilterDate} />
            <Button text label="Clear Date" onClick={() => setFilterDate(null)} />
            <Button label="New Booking" onClick={() => setEditingBooking({ id: nextId(bookings), site_id: siteId, booking_at: new Date().toISOString(), customer_id: null, content_item_id: null, status: 'PLANNED', notes: null })} />
            <Button text label="Reload" onClick={() => load().catch((error) => setStatus(formatErrorMessage(error)))} />
          </>
        )}
      />
      <WorkspaceBody>
        <PaneRoot className="content-card">
          <PaneScroll>
            <EntityTable
              value={filtered}
              rowKey="id"
              columns={[
                { key: 'id', header: 'ID' },
                { key: 'booking_at', header: 'Date/Time' },
                {
                  key: 'customer_id',
                  header: 'Customer',
                  body: (row) => (row.customer_id ? customerLookup.get(row.customer_id) ?? `#${row.customer_id}` : '-')
                },
                {
                  key: 'content_item_id',
                  header: 'Content',
                  body: (row) => (row.content_item_id ? `#${row.content_item_id}` : '-')
                },
                { key: 'status', header: 'Status' },
                {
                  key: 'actions',
                  header: 'Actions',
                  body: (row) => (
                    <div className="inline-actions">
                      <Button text label="Edit" onClick={() => setEditingBooking(row)} />
                      <Button
                        text
                        severity="danger"
                        label="Delete"
                        onClick={() => deleteEntity(token, 'ext_bookings', { id: row.id }).then(() => load()).catch((error) => setStatus(formatErrorMessage(error)))}
                      />
                    </div>
                  )
                }
              ]}
            />
          </PaneScroll>
        </PaneRoot>
      </WorkspaceBody>
      <EntityEditor
        visible={Boolean(editingBooking)}
        title={editingBooking?.id ? 'Edit Booking' : 'Create Booking'}
        onHide={() => setEditingBooking(null)}
        footer={(
          <div className="inline-actions justify-content-end">
            <Button text label="Cancel" onClick={() => setEditingBooking(null)} />
            <Button
              label="Save"
              onClick={() => {
                if (!editingBooking) {
                  return;
                }
                const payload = {
                  ...editingBooking,
                  notes: editingBooking.notes?.trim() || null
                };
                const action = bookings.some((entry) => entry.id === payload.id)
                  ? updateEntity(token, 'ext_bookings', { id: payload.id }, payload)
                  : insertEntity(token, 'ext_bookings', payload);
                action.then(() => load()).then(() => setEditingBooking(null)).catch((error) => setStatus(formatErrorMessage(error)));
              }}
            />
          </div>
        )}
      >
        {editingBooking ? (
          <div className="form-grid">
            <div className="form-row">
              <label>Date / Time</label>
              <DatePicker
                value={toDate(editingBooking.booking_at)}
                showTime
                onChange={(next) => setEditingBooking((prev) => (prev ? { ...prev, booking_at: (next ?? new Date()).toISOString() } : prev))}
              />
            </div>
            <div className="form-row">
              <label>Status</label>
              <Select
                value={editingBooking.status}
                onChange={(next) => setEditingBooking((prev) => (prev ? { ...prev, status: next ?? 'PLANNED' } : prev))}
                options={[
                  { label: 'Planned', value: 'PLANNED' },
                  { label: 'Confirmed', value: 'CONFIRMED' },
                  { label: 'Done', value: 'DONE' },
                  { label: 'Cancelled', value: 'CANCELLED' }
                ]}
              />
            </div>
            <div className="form-row">
              <label>Customer ID</label>
              <NumberInput value={editingBooking.customer_id} onChange={(next) => setEditingBooking((prev) => (prev ? { ...prev, customer_id: next } : prev))} />
            </div>
            <div className="form-row">
              <label>Content Item ID</label>
              <NumberInput value={editingBooking.content_item_id} onChange={(next) => setEditingBooking((prev) => (prev ? { ...prev, content_item_id: next } : prev))} />
            </div>
            <div className="form-row">
              <label>Notes</label>
              <TextInput value={editingBooking.notes ?? ''} onChange={(next) => setEditingBooking((prev) => (prev ? { ...prev, notes: next } : prev))} />
            </div>
          </div>
        ) : null}
      </EntityEditor>
      {status ? <div className="status-panel" role="alert">{status}</div> : null}
    </WorkspacePage>
  );
}

