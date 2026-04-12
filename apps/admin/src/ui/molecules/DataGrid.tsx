import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';

export type DataGridColumn<T> = {
  key: string;
  header: string;
  /** Width CSS value, e.g. '6rem'. Applied to both th and td. */
  width?: string;
  headerClassName?: string;
  bodyClassName?: string;
  /** Custom cell renderer. If omitted, renders `String(row[key])`. */
  cell?: (row: T, index: number) => ReactNode;
  /** Whether this column is sortable. Default false. */
  sortable?: boolean;
  /** Accessor for sorting/filtering when key alone is not enough. */
  accessor?: (row: T) => unknown;
};

export type DataGridProps<T extends Record<string, unknown>> = {
  data: T[];
  columns: DataGridColumn<T>[];
  rowKey?: keyof T;
  size?: 'small' | 'large';
  /** Controlled row selection (single). */
  selectedRow?: T | null;
  onRowSelect?: (row: T | null) => void;
  /** Right-click handler. */
  onRowContextMenu?: (row: T, event: React.MouseEvent) => void;
  /** Global filter string (applied across all columns). */
  globalFilter?: string;
  className?: string;
  /** Extra wrapper style (e.g. height, overflow). */
  style?: React.CSSProperties;
  tableStyle?: React.CSSProperties;
  /** Max height for the scroll wrapper, e.g. "320px" or "flex". */
  scrollHeight?: string;
  /** Message shown when data is empty. */
  emptyMessage?: string;
  /** Client-side pagination: rows per page. Enables paginator UI when set. */
  pageSize?: number;
};

export function DataGrid<T extends Record<string, unknown>>({
  data,
  columns,
  rowKey,
  size = 'small',
  selectedRow,
  onRowSelect,
  onRowContextMenu,
  globalFilter,
  className,
  style,
  tableStyle,
  scrollHeight,
  emptyMessage = 'No records found.',
  pageSize
}: DataGridProps<T>) {
  const colDefs = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((col) => ({
        id: col.key,
        header: col.header,
        accessorFn: col.accessor ?? ((row) => row[col.key]),
        enableSorting: col.sortable ?? false,
        cell: col.cell
          ? ({ row }) => col.cell!(row.original, row.index)
          : ({ getValue }) => {
              const v = getValue();
              return v == null ? '' : String(v);
            },
        meta: {
          width: col.width,
          headerClassName: col.headerClassName,
          bodyClassName: col.bodyClassName
        }
      })),
    [columns]
  );

  const sorting = useMemo<SortingState>(() => [], []);
  const [pageIndex, setPageIndex] = useState(0);

  const tableOptions = {
    data,
    columns: colDefs,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(pageSize ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    state: {
      globalFilter: globalFilter ?? '',
      sorting,
      ...(pageSize ? { pagination: { pageIndex, pageSize } } : {})
    },
    ...(rowKey ? { getRowId: (row: T) => String(row[rowKey]) } : {})
  };

  const table = useReactTable(tableOptions);

  const sizeClass = size === 'small' ? 'p-datatable-sm' : '';
  const scrollClass = scrollHeight ? 'p-datatable-scrollable' : '';
  const wrapClass = ['p-datatable', 'p-component', sizeClass, scrollClass, className].filter(Boolean).join(' ');

  const selectedKey = selectedRow && rowKey ? String(selectedRow[rowKey]) : null;

  return (
    <div className={wrapClass} style={style}>
      <div
        className="p-datatable-wrapper"
        style={
          scrollHeight
            ? { maxHeight: scrollHeight === 'flex' ? '100%' : scrollHeight, overflow: 'auto' }
            : undefined
        }
      >
        <table role="table" style={tableStyle}>
          <thead className="p-datatable-thead">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as DataGridColumn<T> | undefined;
                  return (
                    <th
                      key={header.id}
                      className={[
                        header.column.getCanSort() ? 'p-sortable-column' : '',
                        meta?.headerClassName ?? ''
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={meta?.width ? { width: meta.width } : undefined}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="p-column-header-content">
                        <span className="p-column-title">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {header.column.getCanSort() ? (
                          <span className="p-sortable-column-icon pi pi-fw pi-sort-alt" />
                        ) : null}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="p-datatable-tbody">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={colDefs.length} className="p-datatable-emptymessage">
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {table.getRowModel().rows.map((row, i) => {
              const isSelected = selectedKey != null && row.id === selectedKey;
              const rowClass = [
                i % 2 === 0 ? 'p-row-even' : 'p-row-odd',
                isSelected ? 'p-highlight' : '',
                onRowSelect ? 'p-selectable-row' : ''
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <tr
                  key={row.id}
                  className={rowClass}
                  data-p-selected={isSelected || undefined}
                  onClick={
                    onRowSelect
                      ? () => onRowSelect(isSelected ? null : row.original)
                      : undefined
                  }
                  onContextMenu={
                    onRowContextMenu
                      ? (event: React.MouseEvent) => onRowContextMenu(row.original, event)
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as DataGridColumn<T> | undefined;
                    return (
                      <td
                        key={cell.id}
                        className={meta?.bodyClassName}
                        style={meta?.width ? { width: meta.width } : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pageSize ? (
        <div className="p-paginator p-component">
          <button
            className="p-paginator-prev p-paginator-element p-link"
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="p-paginator-icon pi pi-angle-left" />
          </button>
          {Array.from({ length: table.getPageCount() }, (_, i) => (
            <button
              key={i}
              className={`p-paginator-page p-paginator-element p-link${i === pageIndex ? ' p-highlight' : ''}`}
              onClick={() => setPageIndex(i)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="p-paginator-next p-paginator-element p-link"
            onClick={() => setPageIndex((prev) => Math.min(table.getPageCount() - 1, prev + 1))}
            disabled={!table.getCanNextPage()}
          >
            <span className="p-paginator-icon pi pi-angle-right" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
