import { useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import { Button, TextInput } from '../../../ui/atoms';

export type CTypeListItem = {
  id: number;
  name: string;
  description?: string | null;
  fieldsJson: string;
  allowedComponentsJson?: string | null;
  componentAreaRestrictionsJson?: string | null;
};

export function ContentTypeList({
  items,
  selectedId,
  onSelect,
  onCreate
}: {
  items: CTypeListItem[];
  selectedId: number | null;
  onSelect: (item: CTypeListItem) => void;
  onCreate: () => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter((entry) => entry.name.toLowerCase().includes(q) || String(entry.id).includes(q));
  }, [items, search]);

  const selected = items.find((entry) => entry.id === selectedId) ?? null;

  return (
    <div className="p-fluid">
      <div className="table-toolbar">
        <TextInput value={search} onChange={(next) => setSearch(next)} placeholder="Search types" />
        <Button label="Create" onClick={onCreate} />
      </div>
      <DataTable
        value={filtered}
        size="small"
        selectionMode="single"
        selection={selected}
        onSelectionChange={(event) => {
          const next = event.value as CTypeListItem | null;
          if (next) {
            onSelect(next);
          }
        }}
      >
        <Column field="id" header="ID" headerClassName="w-5rem" bodyClassName="w-5rem" />
        <Column field="name" header="Name" />
      </DataTable>
    </div>
  );
}
