import type { ReactNode } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

export type EntityTableColumn<T> = {
  key: string;
  header: string;
  body?: (row: T) => ReactNode;
};

export function EntityTable<T extends Record<string, unknown>>({
  value,
  columns,
  rowKey,
  size = 'small'
}: {
  value: T[];
  columns: EntityTableColumn<T>[];
  rowKey?: string;
  size?: 'small' | 'normal' | 'large';
}) {
  return (
    <DataTable value={value} dataKey={rowKey} size={size}>
      {columns.map((column) => (
        <Column
          key={column.key}
          field={column.body ? undefined : column.key}
          header={column.header}
          body={column.body ? (row) => column.body?.(row as T) : undefined}
        />
      ))}
    </DataTable>
  );
}
