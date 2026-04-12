import { useState } from 'react';
import { Button, Select, TextInput } from '../../../ui/atoms';
import { DataGrid } from '../../../ui/molecules';

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
          <TextInput value={value?.text ?? ''} onChange={(next) => onChange({ ...(value ?? { kind: 'external' }), text: next })} />
        </div>
        <div className="form-row">
          <label>Target</label>
          <Select
            value={value?.target ?? '_self'}
            options={[{ label: 'Same tab', value: '_self' }, { label: 'New tab', value: '_blank' }]}
            onChange={(next) => onChange({ ...(value ?? { kind: 'external' }), target: next ?? '_self' })}
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
      <DataGrid
        data={value}
        columns={[
          { key: 'kind', header: 'Kind' },
          { key: 'url', header: 'URL', cell: (row) => row.url ?? `#${row.contentItemId ?? ''}` },
          { key: 'text', header: 'Text' },
          {
            key: '__order',
            header: 'Order',
            cell: (_row, index) => (
              <div className="inline-actions">
                <Button text icon="pi pi-angle-up" onClick={() => move(index, -1)} />
                <Button text icon="pi pi-angle-down" onClick={() => move(index, 1)} />
              </div>
            )
          },
          {
            key: '__actions',
            header: 'Actions',
            cell: (_row, index) => (
              <div className="inline-actions">
                <Button text label="Edit" onClick={() => setEditingIndex(index)} />
                <Button text severity="danger" label="Remove" onClick={() => onChange(value.filter((_, idx) => idx !== index))} />
              </div>
            )
          }
        ]}
      />

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
