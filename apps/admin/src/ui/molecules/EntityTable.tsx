import { useMemo, useRef, useState } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';
import { ContextMenu } from 'primereact/contextmenu';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import { CommandMenuButton } from '../commands/CommandMenuButton';
import { toTieredMenuItems } from '../commands/menuModel';
import type { Command, CommandContext } from '../commands/types';

export type EntityTableColumn<T> = {
  key: string;
  header: string;
  body?: (row: T) => ReactNode;
};

export function EntityTable<T extends Record<string, unknown>>({
  value,
  columns,
  rowKey,
  size = 'small',
  rowCommands,
  commandContext
}: {
  value: T[];
  columns: EntityTableColumn<T>[];
  rowKey?: string;
  size?: 'small' | 'large';
  rowCommands?: (row: T) => Command<CommandContext & { row: T }>[];
  commandContext?: CommandContext;
}) {
  const contextMenuRef = useRef<ContextMenu>(null);
  const [contextRow, setContextRow] = useState<T | null>(null);

  const contextMenuItems = useMemo(() => {
    if (!rowCommands || !contextRow) {
      return [];
    }
    return toTieredMenuItems(rowCommands(contextRow), {
      route: commandContext?.route ?? '',
      ...commandContext,
      row: contextRow
    });
  }, [rowCommands, contextRow, commandContext]);

  const tableProps = {
    value,
    size,
    ...(rowKey ? { dataKey: rowKey } : {}),
    ...(rowCommands
      ? {
          onContextMenu: (event: { data: unknown; originalEvent: SyntheticEvent }) => {
            const row = event.data as T;
            setContextRow(row);
            contextMenuRef.current?.show(event.originalEvent);
          }
        }
      : {})
  };

  return (
    <>
      <ContextMenu ref={contextMenuRef} model={contextMenuItems} />
      <DataTable {...tableProps}>
        {columns.map((column) => (
          <Column
            key={column.key}
            field={column.body ? undefined : column.key}
            header={column.header}
            body={column.body ? (row) => column.body?.(row as T) : undefined}
          />
        ))}
        {rowCommands ? (
          <Column
            key="__rowActions"
            header="Actions"
            body={(row) => (
              <div className="entity-row-actions">
                <CommandMenuButton
                  commands={rowCommands(row as T)}
                  context={{
                    route: commandContext?.route ?? '',
                    ...commandContext,
                    row: row as T
                  }}
                  buttonLabel=""
                  buttonIcon="pi pi-ellipsis-h"
                  text
                  size="small"
                />
              </div>
            )}
            bodyStyle={{ width: '3rem', textAlign: 'left' }}
          />
        ) : null}
      </DataTable>
    </>
  );
}
