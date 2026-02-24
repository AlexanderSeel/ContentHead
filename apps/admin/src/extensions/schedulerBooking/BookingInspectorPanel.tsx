import { useState } from 'react';
import { Button } from 'primereact/button';

import { useAuth } from '../../app/AuthContext';
import { DatePicker, TextInput } from '../../ui/atoms';
import { EntityEditor } from '../../ui/molecules';
import { insertEntity } from '../core/dbEntityApi';

export function BookingInspectorPanel({ siteId, contentItemId }: { siteId: number; contentItemId: number | null }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');

  return (
    <>
      <div className="form-row">
        <small className="muted">Schedule a publish/review meeting for this content item.</small>
        <Button label="Schedule Meeting" onClick={() => setOpen(true)} disabled={!contentItemId} />
      </div>
      {status ? <small className="muted">{status}</small> : null}
      <EntityEditor
        visible={open}
        title="Schedule Review Meeting"
        onHide={() => setOpen(false)}
        footer={(
          <div className="inline-actions" style={{ justifyContent: 'flex-end' }}>
            <Button text label="Cancel" onClick={() => setOpen(false)} />
            <Button
              label="Create Booking"
              onClick={() => {
                if (!contentItemId || !bookingDate) {
                  return;
                }
                insertEntity(token, 'ext_bookings', {
                  id: Math.floor(Date.now() / 1000),
                  site_id: siteId,
                  booking_at: bookingDate.toISOString(),
                  customer_id: null,
                  content_item_id: contentItemId,
                  status: 'PLANNED',
                  notes: notes.trim() || 'Publish review meeting (scheduled from content inspector)'
                })
                  .then(() => {
                    setStatus('Booking created');
                    setOpen(false);
                  })
                  .catch((error) => setStatus(String(error)));
              }}
              disabled={!contentItemId}
            />
          </div>
        )}
      >
        <div className="form-row">
          <label>Meeting time</label>
          <DatePicker value={bookingDate} onChange={setBookingDate} showTime />
        </div>
        <div className="form-row">
          <label>Notes</label>
          <TextInput value={notes} onChange={setNotes} placeholder="Who should join, agenda, expected outcome" />
        </div>
      </EntityEditor>
    </>
  );
}
