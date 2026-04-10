import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import { Button, Checkbox } from '../../ui/atoms';

import type { ContentFieldDef } from './fieldValidationUi';

export function FieldList({
  fields,
  selectedKey,
  onSelect,
  onReorder,
  onDuplicate,
  onDelete,
  onRequired,
  className
}: {
  fields: ContentFieldDef[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onReorder: (next: ContentFieldDef[]) => void;
  onDuplicate: (key: string) => void;
  onDelete: (key: string) => void;
  onRequired: (key: string, required: boolean) => void;
  className?: string;
}) {
  const selected = fields.find((entry) => entry.key === selectedKey) ?? null;

  return (
    <div className={['content-types-field-table', className].filter(Boolean).join(' ')}>
      <DataTable
        value={fields}
        size="small"
        dataKey="key"
        scrollable
        scrollHeight="flex"
        style={{ height: '100%' }}
        tableStyle={{ width: '100%', tableLayout: 'fixed' }}
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
        <Column rowReorder headerClassName="w-3rem" bodyClassName="w-3rem" style={{ width: '2.8rem' }} />
        <Column field="key" header="Key" body={(row: ContentFieldDef) => <span className="cms-cell-ellipsis">{row.key}</span>} style={{ width: '24%' }} />
        <Column field="label" header="Label" body={(row: ContentFieldDef) => <span className="cms-cell-ellipsis">{row.label}</span>} style={{ width: '32%' }} />
        <Column field="type" header="Type" body={(row: ContentFieldDef) => <span className="cms-cell-ellipsis">{row.type}</span>} style={{ width: '17%' }} />
        <Column
          header="Req"
          body={(row: ContentFieldDef) => (
            <Checkbox checked={Boolean(row.required)} onChange={(next) => onRequired(row.key, next)} />
          )}
          headerClassName="w-4rem"
          bodyClassName="w-4rem"
          style={{ width: '4.5rem' }}
        />
        <Column
          header="Actions"
          body={(row: ContentFieldDef) => (
            <div className="content-types-field-actions">
              <Button text icon="pi pi-copy" onClick={() => onDuplicate(row.key)} />
              <Button text severity="danger" icon="pi pi-trash" onClick={() => onDelete(row.key)} />
            </div>
          )}
          headerClassName="w-6rem"
          bodyClassName="w-6rem"
          style={{ width: '6rem' }}
        />
      </DataTable>
    </div>
  );
}
