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

export type DataGridMultiSelect<T> = {
  selectedRows: T[];
  onRowsSelect: (rows: T[]) => void;
  rowKey: keyof T;
};

export type DataGridServerSort = {
  sortField: string;
  sortOrder: 'ASC' | 'DESC';
  onSort: (field: string, order: 'ASC' | 'DESC') => void;
};

export type DataGridServerPage = {
  first: number;
  rows: number;
  totalRecords: number;
  onPage: (event: { first: number; rows: number }) => void;
};

export type DataGridProps<T extends Record<string, unknown>> = {
  data: T[];
  columns: DataGridColumn<T>[];
  rowKey?: keyof T;
  size?: 'small' | 'large';
  /** Controlled single-row selection. */
  selectedRow?: T | null;
  onRowSelect?: (row: T | null) => void;
  /** Multi-row checkbox selection. */
  multiSelect?: DataGridMultiSelect<T>;
  /** Right-click handler. */
  onRowContextMenu?: (row: T, event: React.MouseEvent) => void;
  /** Global filter string (applied across all columns). */
  globalFilter?: string;
  className?: string;
  style?: React.CSSProperties;
  tableStyle?: React.CSSProperties;
  /** Max height for the scroll wrapper. */
  scrollHeight?: string;
  emptyMessage?: string;
  /** Client-side pagination: rows per page. */
  pageSize?: number;
  /** Server-side pagination. When set, disables client-side paging. */
  serverPage?: DataGridServerPage;
  /** Server-side sort. When set, disables client-side sort. */
  serverSort?: DataGridServerSort;
  /** Row expansion — renders extra content below each row. */
  rowExpansionTemplate?: (row: T) => ReactNode;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250];

export function DataGrid<T extends Record<string, unknown>>({
  data,
  columns,
  rowKey,
  size = 'small',
  selectedRow,
  onRowSelect,
  multiSelect,
  onRowContextMenu,
  globalFilter,
  className,
  style,
  tableStyle,
  scrollHeight,
  emptyMessage = 'No records found.',
  pageSize,
  serverPage,
  serverSort,
  rowExpansionTemplate
}: DataGridProps<T>) {
  const [pageIndex, setPageIndex] = useState(0);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

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

  const sorting = useMemo<SortingState>(
    () =>
      serverSort
        ? [{ id: serverSort.sortField, desc: serverSort.sortOrder === 'DESC' }]
        : [],
    [serverSort]
  );

  const isServerPage = Boolean(serverPage);
  const isServerSort = Boolean(serverSort);

  const tableOptions = {
    data,
    columns: colDefs,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(!isServerPage && (pageSize || serverPage) ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    manualSorting: isServerSort,
    manualPagination: isServerPage,
    state: {
      globalFilter: globalFilter ?? '',
      sorting,
      ...(!isServerPage && pageSize ? { pagination: { pageIndex, pageSize } } : {})
    },
    ...(rowKey ? { getRowId: (row: T) => String(row[rowKey]) } : {}),
    ...(isServerPage
      ? { pageCount: Math.ceil((serverPage!.totalRecords) / (serverPage!.rows || 25)) }
      : {}),
    onSortingChange: isServerSort
      ? (updater: SortingState | ((old: SortingState) => SortingState)) => {
          const next = typeof updater === 'function' ? updater(sorting) : updater;
          const col = next[0];
          if (col) {
            serverSort!.onSort(col.id, col.desc ? 'DESC' : 'ASC');
          }
        }
      : undefined
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = useReactTable(tableOptions as any);

  const sizeClass = size === 'small' ? 'p-datatable-sm' : '';
  const scrollClass = scrollHeight ? 'p-datatable-scrollable' : '';
  const wrapClass = ['p-datatable', 'p-component', sizeClass, scrollClass, className].filter(Boolean).join(' ');

  const selectedKey = selectedRow && rowKey ? String(selectedRow[rowKey]) : null;
  const selectedSet = useMemo(() => {
    if (!multiSelect) return new Set<string>();
    return new Set(
      multiSelect.selectedRows.map((r) => String(r[multiSelect.rowKey]))
    );
  }, [multiSelect]);

  const allVisibleKeys = table.getRowModel().rows.map((r) => r.id);
  const allSelected =
    allVisibleKeys.length > 0 && allVisibleKeys.every((k) => selectedSet.has(k));

  const toggleSelectAll = () => {
    if (!multiSelect) return;
    if (allSelected) {
      multiSelect.onRowsSelect([]);
    } else {
      multiSelect.onRowsSelect(table.getRowModel().rows.map((r) => r.original as T));
    }
  };

  const toggleRow = (row: T) => {
    if (!multiSelect) return;
    const key = String(row[multiSelect.rowKey]);
    const isSelected = selectedSet.has(key);
    const next = isSelected
      ? multiSelect.selectedRows.filter((r) => String(r[multiSelect!.rowKey]) !== key)
      : [...multiSelect.selectedRows, row];
    multiSelect.onRowsSelect(next);
  };

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Effective page info
  const effectiveFirst = serverPage?.first ?? pageIndex * (pageSize ?? 25);
  const effectiveRows = serverPage?.rows ?? pageSize ?? 25;
  const effectiveTotal = serverPage?.totalRecords ?? data.length;
  const effectivePageCount = Math.max(1, Math.ceil(effectiveTotal / effectiveRows));
  const effectiveCurrentPage = Math.floor(effectiveFirst / effectiveRows);

  const hasPager = Boolean(pageSize || serverPage);

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
                {multiSelect ? (
                  <th style={{ width: '2.5rem' }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                  </th>
                ) : null}
                {rowExpansionTemplate ? <th style={{ width: '2rem' }} /> : null}
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
                <td
                  colSpan={
                    colDefs.length +
                    (multiSelect ? 1 : 0) +
                    (rowExpansionTemplate ? 1 : 0)
                  }
                  className="p-datatable-emptymessage"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {table.getRowModel().rows.map((row, i) => {
              const isSelected = selectedKey != null && row.id === selectedKey;
              const isMultiSelected = selectedSet.has(row.id);
              const isExpanded = expandedKeys.has(row.id);

              const rowClass = [
                i % 2 === 0 ? 'p-row-even' : 'p-row-odd',
                isSelected || isMultiSelected ? 'p-highlight' : '',
                onRowSelect || multiSelect ? 'p-selectable-row' : ''
              ]
                .filter(Boolean)
                .join(' ');

              return [
                <tr
                  key={row.id}
                  className={rowClass}
                  data-p-selected={isSelected || isMultiSelected || undefined}
                  onClick={
                    onRowSelect
                      ? () => onRowSelect(isSelected ? null : row.original as T)
                      : undefined
                  }
                  onContextMenu={
                    onRowContextMenu
                      ? (event: React.MouseEvent) => onRowContextMenu(row.original as T, event)
                      : undefined
                  }
                >
                  {multiSelect ? (
                    <td style={{ width: '2.5rem' }}>
                      <input
                        type="checkbox"
                        checked={isMultiSelected}
                        onChange={(e) => { e.stopPropagation(); toggleRow(row.original as T); }}
                      />
                    </td>
                  ) : null}
                  {rowExpansionTemplate ? (
                    <td style={{ width: '2rem' }}>
                      <button
                        type="button"
                        className="p-row-toggler p-link"
                        onClick={(e) => { e.stopPropagation(); toggleExpand(row.id); }}
                        aria-expanded={isExpanded}
                      >
                        <span
                          className={`pi ${isExpanded ? 'pi-chevron-down' : 'pi-chevron-right'}`}
                          aria-hidden
                        />
                      </button>
                    </td>
                  ) : null}
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
                </tr>,
                isExpanded && rowExpansionTemplate ? (
                  <tr key={`${row.id}-expansion`} className="p-datatable-row-expansion">
                    <td
                      colSpan={
                        colDefs.length +
                        (multiSelect ? 1 : 0) +
                        1
                      }
                    >
                      {rowExpansionTemplate(row.original as T)}
                    </td>
                  </tr>
                ) : null
              ];
            })}
          </tbody>
        </table>
      </div>
      {hasPager ? (
        <div className="p-paginator p-component">
          <button
            type="button"
            className="p-paginator-prev p-paginator-element p-link"
            disabled={effectiveCurrentPage === 0}
            onClick={() => {
              if (serverPage) {
                serverPage.onPage({ first: Math.max(0, effectiveFirst - effectiveRows), rows: effectiveRows });
              } else {
                setPageIndex((p) => Math.max(0, p - 1));
              }
            }}
          >
            <span className="p-paginator-icon pi pi-angle-left" />
          </button>
          <span className="p-paginator-current">
            {effectiveFirst + 1}–{Math.min(effectiveFirst + effectiveRows, effectiveTotal)} of {effectiveTotal}
          </span>
          <button
            type="button"
            className="p-paginator-next p-paginator-element p-link"
            disabled={effectiveCurrentPage >= effectivePageCount - 1}
            onClick={() => {
              if (serverPage) {
                serverPage.onPage({ first: effectiveFirst + effectiveRows, rows: effectiveRows });
              } else {
                setPageIndex((p) => Math.min(effectivePageCount - 1, p + 1));
              }
            }}
          >
            <span className="p-paginator-icon pi pi-angle-right" />
          </button>
          <select
            className="p-paginator-rpp-options"
            value={effectiveRows}
            onChange={(e) => {
              const newRows = Number(e.target.value);
              if (serverPage) {
                serverPage.onPage({ first: 0, rows: newRows });
              } else {
                setPageIndex(0);
              }
            }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}
