import { Children, isValidElement, useMemo, useState, type CSSProperties } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../../ui/atoms';
import { MultiSelect } from '../../ui/atoms';
import { useUi } from '../../app/UiContext';
import { CommandMenuButton } from '../commands/CommandMenuButton';
import type { Command, CommandContext } from '../commands/types';
import { DataGrid } from './DataGrid';
import type { DataGridColumn } from './DataGrid';
import { Column } from './TreeTablePanel';
import type { ColumnProps } from './TreeTablePanel';

export type WorkspaceGridBulkAction = {
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  run: () => Promise<void> | void;
};

// ── Shared toolbar props ──────────────────────────────────────────────────────

type ToolbarProps = {
  className?: string;
  globalSearchValue?: string;
  onGlobalSearchChange?: (value: string) => void;
  globalSearchPlaceholder?: string;
  filterContent?: ReactNode;
  toolbarActions?: ReactNode;
  filterVisible?: boolean;
  onToggleFilterVisible?: () => void;
  columnChooser?: {
    value: string[];
    options: Array<{ label: string; value: string }>;
    onChange: (value: string[]) => void;
  };
  bulkActions?: WorkspaceGridBulkAction[];
  rowActionHeader?: string;
};

// ── New (TanStack) props ──────────────────────────────────────────────────────

type TanStackProps<TData extends Record<string, unknown>> = ToolbarProps & {
  /** Column definitions — activates TanStack Table mode. */
  columns: DataGridColumn<TData>[];
  data: TData[];
  rowKey?: keyof TData;
  /** Single-row selection. */
  selectedRow?: TData | null;
  onRowSelect?: (row: TData | null) => void;
  /** Multi-row checkbox selection. */
  multiSelect?: import('./DataGrid').DataGridMultiSelect<TData>;
  /** Right-click context menu handler. */
  onRowContextMenu?: (row: TData, event: React.MouseEvent) => void;
  rowOverflow?: {
    commandsForRow: (row: TData) => Command<any>[];
    contextForRow: (row: TData) => CommandContext;
  };
  /** Server-side pagination. */
  serverPage?: import('./DataGrid').DataGridServerPage;
  /** Server-side sort. */
  serverSort?: import('./DataGrid').DataGridServerSort;
  /** Row expansion template. */
  rowExpansionTemplate?: (row: TData) => ReactNode;
  emptyMessage?: string;
  // Legacy props must not appear
  value?: never;
  children?: never;
  tableProps?: never;
};

// ── Legacy (PrimeReact) props ─────────────────────────────────────────────────

type LegacyProps<TData extends Record<string, unknown>> = ToolbarProps & {
  /** @deprecated Pass `columns` + `data` instead. */
  value: TData[];
  /** PrimeReact Column children. @deprecated */
  children?: ReactNode;
  /** Passthrough to PrimeReact DataTable. @deprecated */
  tableProps?: Record<string, unknown>;
  rowOverflow?: {
    commandsForRow: (row: TData) => Command<any>[];
    contextForRow: (row: TData) => CommandContext;
  };
  // New props must not appear
  columns?: never;
  data?: never;
  rowKey?: never;
  selectedRow?: never;
  onRowSelect?: never;
};

export type WorkspaceGridProps<TData extends Record<string, unknown>> =
  | TanStackProps<TData>
  | LegacyProps<TData>;

export function WorkspaceGrid<TData extends Record<string, unknown>>(
  props: WorkspaceGridProps<TData>
) {
  const {
    className,
    globalSearchValue,
    onGlobalSearchChange,
    globalSearchPlaceholder = 'Search...',
    filterContent,
    toolbarActions,
    filterVisible = false,
    onToggleFilterVisible,
    columnChooser,
    bulkActions,
    rowActionHeader = 'Actions'
  } = props;

  const { layoutPreferences, setLayoutPreferences } = useUi();

  const gridClassName = ['workspaceGrid', className].filter(Boolean).join(' ');

  const hasTools =
    Boolean(onGlobalSearchChange) ||
    Boolean(columnChooser) ||
    Boolean(bulkActions?.length) ||
    Boolean(toolbarActions) ||
    Boolean(onToggleFilterVisible) ||
    Boolean(filterVisible && filterContent);

  const isNewMode = 'columns' in props && props.columns !== undefined;

  return (
    <section className={gridClassName}>
      {hasTools ? (
        <div className="workspaceGridTools">
          <div className="workspaceGridToolsMain">
            {onGlobalSearchChange ? (
              <span className="p-input-icon-left workspaceGridSearch">
                <i className="pi pi-search" />
                <input
                  className="p-inputtext p-component"
                  value={globalSearchValue ?? ''}
                  onChange={(e) => onGlobalSearchChange(e.target.value)}
                  placeholder={globalSearchPlaceholder}
                />
              </span>
            ) : null}
            {onToggleFilterVisible ? (
              <Button
                text
                size="small"
                icon="pi pi-filter"
                label={filterVisible ? 'Hide filters' : 'Filters'}
                onClick={onToggleFilterVisible}
              />
            ) : null}
            {columnChooser ? (
              <MultiSelect
                value={columnChooser.value}
                options={columnChooser.options}
                onChange={(next) => columnChooser.onChange(next)}
                placeholder="Columns"
                className="workspaceGridColumns"
              />
            ) : null}
            {(bulkActions?.length ?? 0) > 0 ? (
              <BulkButton
                onPrimary={() => bulkActions?.[0]?.run()}
                disabled={!bulkActions?.some((action) => !action.disabled)}
              />
            ) : null}
            <Button
              text
              size="small"
              icon={
                layoutPreferences.density === 'compact' ? 'pi pi-window-maximize' : 'pi pi-compress'
              }
              label={layoutPreferences.density === 'compact' ? 'Comfortable' : 'Compact'}
              onClick={() =>
                setLayoutPreferences({
                  density: layoutPreferences.density === 'compact' ? 'comfortable' : 'compact'
                })
              }
            />
            {toolbarActions}
          </div>
          {filterVisible && filterContent ? (
            <div className="workspaceGridFilters">{filterContent}</div>
          ) : null}
        </div>
      ) : null}
      <div className="workspaceGridTableWrap">
        {isNewMode ? (
          <TanStackTable
            props={props as TanStackProps<TData>}
            {...(globalSearchValue !== undefined ? { globalFilter: globalSearchValue } : {})}
            rowActionHeader={rowActionHeader}
          />
        ) : (
          <LegacyTable
            props={props as LegacyProps<TData>}
            {...(globalSearchValue !== undefined ? { globalFilter: globalSearchValue } : {})}
            rowActionHeader={rowActionHeader}
          />
        )}
      </div>
    </section>
  );
}

// ── TanStack table inner renderer ─────────────────────────────────────────────

function TanStackTable<TData extends Record<string, unknown>>({
  props,
  globalFilter,
  rowActionHeader
}: {
  props: TanStackProps<TData>;
  globalFilter?: string;
  rowActionHeader: string;
}) {
  const {
    data, columns, rowKey, selectedRow, onRowSelect, multiSelect,
    onRowContextMenu, rowOverflow, serverPage, serverSort,
    rowExpansionTemplate, emptyMessage
  } = props;

  const allColumns = useMemo<DataGridColumn<TData>[]>(() => {
    if (!rowOverflow) return columns;
    return [
      ...columns,
      {
        key: '__rowActions',
        header: rowActionHeader,
        bodyClassName: 'w-5rem',
        headerClassName: 'w-5rem',
        cell: (row) => (
          <CommandMenuButton
            commands={rowOverflow.commandsForRow(row)}
            context={rowOverflow.contextForRow(row)}
            buttonLabel=""
            buttonIcon="pi pi-ellipsis-h"
            text
          />
        )
      }
    ];
  }, [columns, rowOverflow, rowActionHeader]);

  return (
    <DataGrid
      data={data}
      columns={allColumns}
      size="small"
      {...(rowKey !== undefined ? { rowKey } : {})}
      {...(selectedRow !== undefined ? { selectedRow } : {})}
      {...(onRowSelect !== undefined ? { onRowSelect } : {})}
      {...(multiSelect !== undefined ? { multiSelect } : {})}
      {...(onRowContextMenu !== undefined ? { onRowContextMenu } : {})}
      {...(globalFilter !== undefined ? { globalFilter } : {})}
      {...(serverPage !== undefined ? { serverPage } : {})}
      {...(serverSort !== undefined ? { serverSort } : {})}
      {...(rowExpansionTemplate !== undefined ? { rowExpansionTemplate } : {})}
      {...(emptyMessage !== undefined ? { emptyMessage } : {})}
    />
  );
}

// ── Legacy native table inner renderer ───────────────────────────────────────

type TableProps = {
  scrollable?: boolean;
  scrollHeight?: string;
  selectionMode?: string;
  selection?: unknown;
  metaKeySelection?: boolean;
  onSelectionChange?: (event: { value: unknown }) => void;
  onRowClick?: (event: { data: unknown }) => void;
  onContextMenu?: (event: { data: unknown; originalEvent: MouseEvent }) => void;
  rowClassName?: (row: unknown) => string;
  loading?: boolean;
  paginator?: boolean;
  lazy?: boolean;
  first?: number;
  rows?: number;
  totalRecords?: number;
  onPage?: (event: { first: number; rows: number }) => void;
  sortField?: string;
  sortOrder?: number;
  onSort?: (event: { sortField: string; sortOrder: number }) => void;
  dataKey?: string;
  style?: CSSProperties;
  tableStyle?: CSSProperties;
  [key: string]: unknown;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function LegacyTable<TData extends Record<string, unknown>>({
  props,
  globalFilter,
  rowActionHeader
}: {
  props: LegacyProps<TData>;
  globalFilter?: string;
  rowActionHeader: string;
}) {
  const { value, children, tableProps = {} as TableProps, rowOverflow } = props;
  const tp = tableProps as TableProps;

  // Collect column defs from Column children
  const columns: ColumnProps[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === Column) {
      columns.push(child.props as ColumnProps);
    }
  });

  // Add rowOverflow actions column
  if (rowOverflow) {
    columns.push({
      header: rowActionHeader,
      headerClassName: 'w-5rem',
      bodyClassName: 'w-5rem',
      body: (row: TData) => {
        const context = rowOverflow.contextForRow(row);
        return (
          <CommandMenuButton
            commands={rowOverflow.commandsForRow(row)}
            context={context}
            buttonLabel=""
            buttonIcon="pi pi-ellipsis-h"
            text
          />
        );
      }
    });
  }

  // Client-side pagination when paginator is set but not lazy
  const [clientPage, setClientPage] = useState(0);
  const pageSize = tp.rows ?? 25;
  const isLazy = tp.lazy ?? false;

  // Filter rows by globalFilter
  const filtered = useMemo(() => {
    if (!globalFilter || !value.length) return value;
    const q = globalFilter.toLowerCase();
    return value.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [value, globalFilter]);

  const totalCount = isLazy ? (tp.totalRecords ?? filtered.length) : filtered.length;
  const pageFirst = isLazy ? (tp.first ?? 0) : clientPage * pageSize;
  const displayed = tp.paginator
    ? (isLazy ? filtered : filtered.slice(pageFirst, pageFirst + pageSize))
    : filtered;

  const totalPages = Math.ceil(totalCount / pageSize);
  const currentPage = Math.floor(pageFirst / pageSize);

  const handleRowClick = (e: React.MouseEvent, row: TData) => {
    tp.onRowClick?.({ data: row });
    if (tp.selectionMode === 'single') {
      tp.onSelectionChange?.({ value: row });
    }
  };

  const handleContextMenu = (e: React.MouseEvent, row: TData) => {
    e.preventDefault();
    tp.onContextMenu?.({ data: row, originalEvent: e.nativeEvent });
  };

  const wrapStyle: CSSProperties = {
    ...(tp.scrollable ? { overflow: 'auto', maxHeight: tp.scrollHeight !== 'flex' ? tp.scrollHeight : undefined } : {}),
    ...tp.style
  };

  return (
    <div className="p-datatable p-component p-datatable-sm legacy-datatable" style={wrapStyle}>
      {tp.loading ? <div className="p-datatable-loading-overlay"><span className="pi pi-spin pi-spinner" /></div> : null}
      <div className="p-datatable-wrapper">
        <table className="p-datatable-table" style={tp.tableStyle}>
          <thead className="p-datatable-thead">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={['p-datatable-th', col.headerClassName].filter(Boolean).join(' ')}
                  style={{ ...col.headerStyle, ...col.style }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="p-datatable-tbody">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-datatable-emptymessage">No records found.</td>
              </tr>
            ) : (
              displayed.map((row, rowIdx) => {
                const rowClass = tp.rowClassName ? tp.rowClassName(row) : '';
                return (
                  <tr
                    key={tp.dataKey ? String(row[tp.dataKey]) : rowIdx}
                    className={['p-datatable-row', rowClass].filter(Boolean).join(' ')}
                    onClick={(e) => handleRowClick(e, row)}
                    onContextMenu={(e) => handleContextMenu(e, row)}
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={['p-datatable-td', col.bodyClassName].filter(Boolean).join(' ')}
                        style={{ ...col.bodyStyle, ...col.style }}
                      >
                        {col.selectionMode === 'multiple' || col.selectionMode === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={Array.isArray(tp.selection) && (tp.selection as TData[]).some((s) => tp.dataKey ? s[tp.dataKey] === row[tp.dataKey ?? ''] : s === row)}
                            onChange={() => {
                              const sel = Array.isArray(tp.selection) ? (tp.selection as TData[]) : [];
                              const isSelected = tp.dataKey
                                ? sel.some((s) => s[tp.dataKey!] === row[tp.dataKey!])
                                : sel.includes(row);
                              const next = isSelected
                                ? sel.filter((s) => tp.dataKey ? s[tp.dataKey!] !== row[tp.dataKey!] : s !== row)
                                : [...sel, row];
                              tp.onSelectionChange?.({ value: next });
                            }}
                          />
                        ) : col.body ? (
                          col.body(row)
                        ) : (
                          String(row[col.field ?? ''] ?? '')
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {tp.paginator ? (
        <div className="p-paginator p-component">
          <button
            type="button"
            className="p-paginator-prev p-link"
            disabled={currentPage === 0}
            onClick={() => {
              if (isLazy) {
                tp.onPage?.({ first: Math.max(0, pageFirst - pageSize), rows: pageSize });
              } else {
                setClientPage((p) => Math.max(0, p - 1));
              }
            }}
          >
            <span className="pi pi-chevron-left" aria-hidden />
          </button>
          <span className="p-paginator-current">
            Page {currentPage + 1} of {Math.max(1, totalPages)}
          </span>
          <button
            type="button"
            className="p-paginator-next p-link"
            disabled={currentPage >= totalPages - 1}
            onClick={() => {
              if (isLazy) {
                tp.onPage?.({ first: pageFirst + pageSize, rows: pageSize });
              } else {
                setClientPage((p) => Math.min(totalPages - 1, p + 1));
              }
            }}
          >
            <span className="pi pi-chevron-right" aria-hidden />
          </button>
          <select
            className="p-paginator-rpp-options"
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              if (isLazy) {
                tp.onPage?.({ first: 0, rows: newSize });
              } else {
                setClientPage(0);
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

// ── Minimal bulk button (replaces PrimeReact SplitButton) ────────────────────

function BulkButton({
  onPrimary,
  disabled
}: {
  onPrimary: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      text={false}
      size="small"
      outlined
      disabled={disabled}
      label="Bulk..."
      onClick={onPrimary}
    />
  );
}
