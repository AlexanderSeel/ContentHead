import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../../ui/atoms';
import { MultiSelect } from '../../ui/atoms';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import type { MenuItem } from 'primereact/menuitem';

import { useUi } from '../../app/UiContext';
import { CommandMenuButton } from '../commands/CommandMenuButton';
import type { Command, CommandContext } from '../commands/types';
import { DataGrid } from './DataGrid';
import type { DataGridColumn } from './DataGrid';

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
  /** Right-click context menu handler. */
  onRowContextMenu?: (row: TData, event: React.MouseEvent) => void;
  rowOverflow?: {
    commandsForRow: (row: TData) => Command<any>[];
    contextForRow: (row: TData) => CommandContext;
  };
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

  const bulkMenuModel = useMemo<MenuItem[]>(
    () =>
      (bulkActions ?? []).map((action) => ({
        label: action.label,
        icon: action.icon,
        className: action.danger ? 'ch-command-danger' : undefined,
        disabled: action.disabled,
        command: () => action.run()
      })),
    [bulkActions]
  );

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
            {bulkMenuModel.length > 0 ? (
              <BulkButton
                model={bulkMenuModel}
                onPrimary={() => bulkActions?.[0]?.run()}
                disabled={bulkMenuModel.every((item) => item.disabled)}
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
  const { data, columns, rowKey, selectedRow, onRowSelect, onRowContextMenu, rowOverflow } = props;

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
      {...(onRowContextMenu !== undefined ? { onRowContextMenu } : {})}
      {...(globalFilter !== undefined ? { globalFilter } : {})}
    />
  );
}

// ── Legacy PrimeReact table inner renderer ────────────────────────────────────

function LegacyTable<TData extends Record<string, unknown>>({
  props,
  globalFilter,
  rowActionHeader
}: {
  props: LegacyProps<TData>;
  globalFilter?: string;
  rowActionHeader: string;
}) {
  const { value, children, tableProps, rowOverflow } = props;

  return (
    <DataTable value={value} size="small" globalFilter={globalFilter} {...(tableProps as object)}>
      {children}
      {rowOverflow ? (
        <Column
          header={rowActionHeader}
          body={(row) => {
            const typedRow = row as TData;
            const context = rowOverflow.contextForRow(typedRow);
            return (
              <CommandMenuButton
                commands={rowOverflow.commandsForRow(typedRow)}
                context={context}
                buttonLabel=""
                buttonIcon="pi pi-ellipsis-h"
                text
              />
            );
          }}
          headerClassName="w-5rem"
          bodyClassName="w-5rem"
        />
      ) : null}
    </DataTable>
  );
}

// ── Minimal bulk button (replaces PrimeReact SplitButton) ────────────────────

function BulkButton({
  model,
  onPrimary,
  disabled
}: {
  model: MenuItem[];
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
