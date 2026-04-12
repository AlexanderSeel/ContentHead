import { useMemo, useRef, useState } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';
import { ContextMenuPanel } from './ContextMenuPanel';
import type { ContextMenuHandle } from './ContextMenuPanel';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table';

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
  const contextMenuRef = useRef<ContextMenuHandle>(null);
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

  const helper = createColumnHelper<T>();

  const colDefs = useMemo(() => {
    const defs = columns.map((col) =>
      helper.display({
        id: col.key,
        header: col.header,
        cell: col.body
          ? ({ row }) => col.body!(row.original)
          : ({ row }) => String(row.original[col.key] ?? '')
      })
    );

    if (rowCommands) {
      defs.push(
        helper.display({
          id: '__rowActions',
          header: 'Actions',
          cell: ({ row }) => (
            <div className="entity-row-actions">
              <CommandMenuButton
                commands={rowCommands(row.original)}
                context={{
                  route: commandContext?.route ?? '',
                  ...commandContext,
                  row: row.original
                }}
                buttonLabel=""
                buttonIcon="pi pi-ellipsis-h"
                text
                size="small"
              />
            </div>
          ),
          meta: { bodyStyle: { width: '3rem', textAlign: 'left' } }
        })
      );
    }

    return defs;
  }, [columns, rowCommands, commandContext, helper]);

  const tableOptions = {
    data: value,
    columns: colDefs,
    getCoreRowModel: getCoreRowModel(),
    ...(rowKey ? { getRowId: (row: T) => String(row[rowKey]) } : {})
  };
  const table = useReactTable(tableOptions);

  const sizeClass = size === 'small' ? 'p-datatable-sm' : '';

  return (
    <>
      <ContextMenuPanel ref={contextMenuRef} model={contextMenuItems} />
      <div className={`p-datatable p-component ${sizeClass}`}>
        <div className="p-datatable-wrapper">
          <table role="table">
            <thead className="p-datatable-thead">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
                      <div className="p-column-header-content">
                        <span className="p-column-title">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="p-datatable-tbody">
              {table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? 'p-row-even' : 'p-row-odd'}
                  onContextMenu={
                    rowCommands
                      ? (event: SyntheticEvent) => {
                          setContextRow(row.original);
                          contextMenuRef.current?.show(event as unknown as SyntheticEvent);
                        }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={(cell.column.columnDef.meta as any)?.bodyStyle}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
