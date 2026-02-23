import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

type CompositionArea = { name: string; components: string[] };

export function ComponentList({
  areas,
  selected,
  onSelect,
  onMove,
  onDelete
}: {
  areas: CompositionArea[];
  selected: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onDelete: (id: string) => void;
}) {
  const rows = areas.flatMap((area) => area.components.map((id, index) => ({ id, area: area.name, index })));

  return (
    <DataTable value={rows} size="small" selectionMode="single" selection={rows.find((row) => row.id === selected) ?? null} onSelectionChange={(event) => {
      const row = event.value as { id: string } | null;
      if (row) {
        onSelect(row.id);
      }
    }}>
      <Column field="id" header="ID" />
      <Column field="area" header="Area" />
      <Column
        header="Order"
        body={(row: { id: string }) => (
          <div className="inline-actions">
            <Button text icon="pi pi-angle-up" onClick={() => onMove(row.id, -1)} />
            <Button text icon="pi pi-angle-down" onClick={() => onMove(row.id, 1)} />
          </div>
        )}
      />
      <Column header="Delete" body={(row: { id: string }) => <Button text severity="danger" icon="pi pi-trash" onClick={() => onDelete(row.id)} />} />
    </DataTable>
  );
}
