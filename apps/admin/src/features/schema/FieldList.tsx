import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';

import type { ContentFieldDef } from './fieldValidationUi';

export function FieldList({
  fields,
  selectedKey,
  onSelect,
  onReorder,
  onDuplicate,
  onDelete,
  onRequired
}: {
  fields: ContentFieldDef[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onReorder: (next: ContentFieldDef[]) => void;
  onDuplicate: (key: string) => void;
  onDelete: (key: string) => void;
  onRequired: (key: string, required: boolean) => void;
}) {
  const selected = fields.find((entry) => entry.key === selectedKey) ?? null;

  return (
    <DataTable
      value={fields}
      size="small"
      reorderableRows
      onRowReorder={(event) => onReorder(event.value as ContentFieldDef[])}
      selectionMode="single"
      selection={selected}
      onSelectionChange={(event) => {
        const row = event.value as ContentFieldDef | null;
        if (row) {
          onSelect(row.key);
        }
      }}
    >
      <Column rowReorder style={{ width: '2.5rem' }} />
      <Column field="key" header="Key" />
      <Column field="label" header="Label" />
      <Column field="type" header="Type" />
      <Column
        header="Req"
        body={(row: ContentFieldDef) => (
          <Checkbox checked={Boolean(row.required)} onChange={(event) => onRequired(row.key, Boolean(event.checked))} />
        )}
      />
      <Column
        header="Actions"
        body={(row: ContentFieldDef) => (
          <div className="inline-actions">
            <Button text icon="pi pi-copy" onClick={() => onDuplicate(row.key)} />
            <Button text severity="danger" icon="pi pi-trash" onClick={() => onDelete(row.key)} />
          </div>
        )}
      />
    </DataTable>
  );
}
