import { useMemo, useState } from 'react';

import { Button, TextInput } from '../../ui/atoms';
import { DataGrid } from '../../ui/molecules';

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
      <DataGrid
        data={filtered}
        rowKey="id"
        selectedRow={selected}
        onRowSelect={(row) => { if (row) onSelect(row); }}
        columns={[
          { key: 'id', header: 'ID', width: '5rem', headerClassName: 'w-5rem', bodyClassName: 'w-5rem' },
          { key: 'name', header: 'Name' }
        ]}
      />
    </div>
  );
}
