import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { SplitButton } from 'primereact/splitbutton';
import type { MenuItem } from 'primereact/menuitem';

import { useUi } from '../../app/UiContext';
import { CommandMenuButton } from '../commands/CommandMenuButton';
import type { Command, CommandContext } from '../commands/types';

export type WorkspaceGridBulkAction = {
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  run: () => Promise<void> | void;
};

export type WorkspaceGridProps<TData extends Record<string, unknown>> = {
  value: TData[];
  children: ReactNode;
  className?: string;
  tableProps?: Record<string, unknown>;
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
  rowOverflow?: {
    commandsForRow: (row: TData) => Command<any>[];
    contextForRow: (row: TData) => CommandContext;
  };
  rowActionHeader?: string;
};

export function WorkspaceGrid<TData extends Record<string, unknown>>({
  value,
  children,
  className,
  tableProps,
  globalSearchValue,
  onGlobalSearchChange,
  globalSearchPlaceholder = 'Search...',
  filterContent,
  toolbarActions,
  filterVisible = false,
  onToggleFilterVisible,
  columnChooser,
  bulkActions,
  rowOverflow,
  rowActionHeader = 'Actions'
}: WorkspaceGridProps<TData>) {
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

  return (
    <section className={gridClassName}>
      {hasTools ? (
        <div className="workspaceGridTools">
          <div className="workspaceGridToolsMain">
            {onGlobalSearchChange ? (
              <span className="p-input-icon-left workspaceGridSearch">
                <i className="pi pi-search" />
                <InputText
                  value={globalSearchValue ?? ''}
                  onChange={(event) => onGlobalSearchChange(event.target.value)}
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
                onChange={(event) => columnChooser.onChange((event.value as string[]) ?? [])}
                display="chip"
                placeholder="Columns"
                className="workspaceGridColumns"
              />
            ) : null}
            {bulkMenuModel.length > 0 ? (
              <SplitButton
                label="Bulk..."
                size="small"
                outlined
                disabled={bulkMenuModel.every((item) => item.disabled)}
                model={bulkMenuModel}
                onClick={() => bulkActions?.[0]?.run()}
              />
            ) : null}
            <Button
              text
              size="small"
              icon={layoutPreferences.density === 'compact' ? 'pi pi-window-maximize' : 'pi pi-compress'}
              label={layoutPreferences.density === 'compact' ? 'Comfortable' : 'Compact'}
              onClick={() =>
                setLayoutPreferences({
                  density: layoutPreferences.density === 'compact' ? 'comfortable' : 'compact'
                })
              }
            />
            {toolbarActions}
          </div>
          {filterVisible && filterContent ? <div className="workspaceGridFilters">{filterContent}</div> : null}
        </div>
      ) : null}
      <div className="workspaceGridTableWrap">
        <DataTable value={value} size="small" {...(tableProps as object)}>
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
      </div>
    </section>
  );
}
