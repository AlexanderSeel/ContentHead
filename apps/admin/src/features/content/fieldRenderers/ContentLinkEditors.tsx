import { useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';

import { type ContentLinkValue } from './LinkSelectorDialog';
import { LinkPickerButton } from '../../../ui/atoms';

export function ContentLinkEditor({
  token,
  siteId,
  value,
  onChange
}: {
  token: string | null;
  siteId: number;
  value: ContentLinkValue | null;
  onChange: (value: ContentLinkValue | null) => void;
}) {
  return (
    <div className="form-row">
      <div className="inline-actions">
        <LinkPickerButton token={token} siteId={siteId} value={value} onChange={onChange} label="Select Link" />
        <Button text label="Clear" onClick={() => onChange(null)} disabled={!value} />
      </div>
      <small>{value ? `${value.kind}: ${value.url ?? `#${value.contentItemId ?? ''}`}` : 'No link selected'}</small>
      <div className="form-grid">
        <div className="form-row">
          <label>Link Text</label>
          <InputText value={value?.text ?? ''} onChange={(event) => onChange({ ...(value ?? { kind: 'external' }), text: event.target.value })} />
        </div>
        <div className="form-row">
          <label>Target</label>
          <Dropdown
            value={value?.target ?? '_self'}
            options={[{ label: 'Same tab', value: '_self' }, { label: 'New tab', value: '_blank' }]}
            onChange={(event) => onChange({ ...(value ?? { kind: 'external' }), target: event.value })}
          />
        </div>
      </div>
      {/* handled by LinkPickerButton */}
    </div>
  );
}

export function ContentLinkListEditor({
  token,
  siteId,
  value,
  onChange
}: {
  token: string | null;
  siteId: number;
  value: ContentLinkValue[];
  onChange: (value: ContentLinkValue[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) {
      return;
    }
    const next = [...value];
    const [current] = next.splice(index, 1);
    if (!current) {
      return;
    }
    next.splice(target, 0, current);
    onChange(next);
  };

  return (
    <div className="form-row">
      <div className="inline-actions">
        <Button label="Add Link" onClick={() => setEditingIndex(value.length)} />
      </div>
      <DataTable value={value} size="small">
        <Column field="kind" header="Kind" />
        <Column field="url" header="URL" body={(row: ContentLinkValue) => row.url ?? `#${row.contentItemId ?? ''}`} />
        <Column field="text" header="Text" />
        <Column
          header="Order"
          body={(_row: ContentLinkValue, options) => (
            <div className="inline-actions">
              <Button text icon="pi pi-angle-up" onClick={() => move(options.rowIndex, -1)} />
              <Button text icon="pi pi-angle-down" onClick={() => move(options.rowIndex, 1)} />
            </div>
          )}
        />
        <Column
          header="Actions"
          body={(_row: ContentLinkValue, options) => (
            <div className="inline-actions">
              <Button text label="Edit" onClick={() => setEditingIndex(options.rowIndex)} />
              <Button text severity="danger" label="Remove" onClick={() => onChange(value.filter((_, idx) => idx !== options.rowIndex))} />
            </div>
          )}
        />
      </DataTable>

      {editingIndex != null ? (
        <div className="inline-actions">
          <LinkPickerButton
            token={token}
            siteId={siteId}
            value={editingIndex < value.length ? (value[editingIndex] ?? null) : null}
            label="Pick Link"
            onChange={(nextValue) => {
              const next = [...value];
              if (editingIndex >= next.length) {
                next.push(nextValue);
              } else {
                next[editingIndex] = nextValue;
              }
              onChange(next);
              setEditingIndex(null);
            }}
          />
          <Button text label="Cancel" onClick={() => setEditingIndex(null)} />
        </div>
      ) : null}
    </div>
  );
}
