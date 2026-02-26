import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { TabPanel, TabView } from 'primereact/tabview';

import { useAuth } from '../../app/AuthContext';
import { useUi } from '../../app/UiContext';
import { formatErrorMessage } from '../../lib/graphqlErrorUi';
import { createAdminSdk } from '../../lib/sdk';
import { CommandMenuButton } from '../../ui/commands/CommandMenuButton';
import { commandRegistry } from '../../ui/commands/registry';
import type { Command, CommandContext } from '../../ui/commands/types';
import { routeStartsWith } from '../../ui/commands/utils';
import { ForbiddenState, WorkspaceActionBar, WorkspaceBody, WorkspaceGrid, WorkspaceHeader, WorkspacePage, WorkspacePaneLayout, WorkspaceToolbar } from '../../ui/molecules';

type DbAdminColumn = {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string | null;
  primaryKey: boolean;
  position: number;
};

type DbAdminIndex = {
  name: string;
  columns: string[];
  unique: boolean;
};

type DbAdminTable = {
  table: string;
  columns: DbAdminColumn[];
  primaryKey: string[];
  indexes: DbAdminIndex[];
};

type DbAdminSqlResult = {
  readOnly: boolean;
  columns: string[];
  rowsJson: string;
  rowCount: number;
  message?: string | null;
  executedSql?: string | null;
};

type DbAdminTableListItem = {
  name: string;
  schema: string;
  rowCount?: number | null;
};

type RowRecord = Record<string, unknown> & { __rowKey: string };

type DbAdminHeaderContext = CommandContext & {
  selectedCount: number;
  dangerMode: boolean;
  toggleDangerMode: () => Promise<void>;
  exportSelectedJson: () => void;
  exportSelectedCsv: () => void;
  deleteSelected: () => Promise<void>;
};

type DbAdminRowCommandContext = CommandContext & {
  row: RowRecord;
  inspectRow: (row: RowRecord) => void;
  deleteRowByContext: (row: RowRecord) => Promise<void>;
};

const dbAdminHeaderCommands: Command<DbAdminHeaderContext>[] = [
  {
    id: 'db-admin.export.json',
    label: 'Export selected JSON',
    icon: 'pi pi-download',
    group: 'Export',
    visible: (ctx) => routeStartsWith(ctx.route, '/settings/global/db-admin'),
    enabled: (ctx) => ctx.selectedCount > 0,
    run: (ctx) => ctx.exportSelectedJson()
  },
  {
    id: 'db-admin.export.csv',
    label: 'Export selected CSV',
    icon: 'pi pi-file-export',
    group: 'Export',
    visible: (ctx) => routeStartsWith(ctx.route, '/settings/global/db-admin'),
    enabled: (ctx) => ctx.selectedCount > 0,
    run: (ctx) => ctx.exportSelectedCsv()
  },
  {
    id: 'db-admin.show-system',
    label: 'Toggle system tables',
    icon: 'pi pi-eye',
    group: 'View',
    visible: (ctx) => routeStartsWith(ctx.route, '/settings/global/db-admin'),
    run: (ctx) => ctx.toggleDangerMode()
  },
  {
    id: 'db-admin.delete-selected',
    label: 'Delete selected rows',
    icon: 'pi pi-trash',
    group: 'Danger',
    danger: true,
    requiresConfirm: true,
    confirmText: 'Delete selected rows? This cannot be undone.',
    visible: (ctx) => routeStartsWith(ctx.route, '/settings/global/db-admin'),
    enabled: (ctx) => ctx.selectedCount > 0,
    run: (ctx) => ctx.deleteSelected()
  }
];

const dbAdminRowCommands: Command<DbAdminRowCommandContext>[] = [
  {
    id: 'db-admin.row.inspect',
    label: 'Inspect row',
    icon: 'pi pi-search',
    visible: (ctx) => routeStartsWith(ctx.route, '/settings/global/db-admin'),
    run: (ctx) => ctx.inspectRow(ctx.row)
  },
  {
    id: 'db-admin.row.delete',
    label: 'Delete row',
    icon: 'pi pi-trash',
    group: 'Danger',
    danger: true,
    requiresConfirm: true,
    confirmText: 'Delete this row? This cannot be undone.',
    visible: (ctx) => routeStartsWith(ctx.route, '/settings/global/db-admin'),
    run: (ctx) => ctx.deleteRowByContext(ctx.row)
  }
];

commandRegistry.registerCoreCommands([{ placement: 'overflow', commands: dbAdminHeaderCommands }]);
commandRegistry.registerCoreCommands([{ placement: 'rowOverflow', commands: dbAdminRowCommands }]);

const FILTER_OPS = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'eq' },
  { label: 'Not Equal', value: 'neq' },
  { label: 'Starts With', value: 'starts_with' },
  { label: 'Ends With', value: 'ends_with' },
  { label: 'Greater Than', value: 'gt' },
  { label: 'Less Than', value: 'lt' },
  { label: 'Is Null', value: 'is_null' },
  { label: 'Not Null', value: 'not_null' }
];

function downloadBlob(filename: string, payload: Blob) {
  const url = URL.createObjectURL(payload);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(filename, blob);
}

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
  }
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function columnKind(type: string): 'text' | 'number' | 'boolean' | 'datetime' | 'json' {
  const normalized = type.toLowerCase();
  if (normalized.includes('bool')) {
    return 'boolean';
  }
  if (
    normalized.includes('int') ||
    normalized.includes('decimal') ||
    normalized.includes('numeric') ||
    normalized.includes('double') ||
    normalized.includes('real') ||
    normalized.includes('float')
  ) {
    return 'number';
  }
  if (normalized.includes('date') || normalized.includes('time')) {
    return 'datetime';
  }
  if (normalized.includes('json') || normalized.includes('struct') || normalized.includes('map') || normalized.includes('list')) {
    return 'json';
  }
  return 'text';
}

function parseRows(rowsJson: string | null | undefined, primaryKey: string[]): RowRecord[] {
  if (!rowsJson) {
    return [];
  }
  try {
    const raw = JSON.parse(rowsJson) as Record<string, unknown>[];
    return raw.map((row, index) => {
      const keyParts = primaryKey.map((key) => row[key]).filter((value) => value !== undefined && value !== null);
      const rowKey = keyParts.length === primaryKey.length ? keyParts.map((part) => String(part)).join('|') : `row-${index}`;
      return { ...row, __rowKey: rowKey };
    });
  } catch {
    return [];
  }
}

function normalizeDraftValue(column: DbAdminColumn, value: unknown): unknown {
  if (value instanceof Date) {
    if (column.type.toLowerCase().includes('date') && !column.type.toLowerCase().includes('time')) {
      return value.toISOString().split('T')[0];
    }
    return value.toISOString();
  }
  if (columnKind(column.type) === 'json' && typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

export function DbAdminPage() {
  const location = useLocation();
  const { token } = useAuth();
  const ui = useUi();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const [tables, setTables] = useState<DbAdminTableListItem[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [dangerMode, setDangerMode] = useState(false);
  const [revealSensitiveColumns, setRevealSensitiveColumns] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<DbAdminTable | null>(null);
  const [rows, setRows] = useState<RowRecord[]>([]);
  const [selectedRows, setSelectedRows] = useState<RowRecord[]>([]);
  const [activeRow, setActiveRow] = useState<RowRecord | null>(null);
  const [draftRow, setDraftRow] = useState<Record<string, unknown>>({});
  const [editMode, setEditMode] = useState<'view' | 'edit' | 'new'>('view');
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterOp, setFilterOp] = useState<string>('contains');
  const [filterValue, setFilterValue] = useState<string>('');
  const [totalRows, setTotalRows] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState<{ column: string; direction: 'ASC' | 'DESC' } | null>(null);
  const [globalRowSearch, setGlobalRowSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users');
  const [sqlParams, setSqlParams] = useState('[]');
  const [sqlAllowWrites, setSqlAllowWrites] = useState(false);
  const [sqlConfirm, setSqlConfirm] = useState('');
  const [sqlResult, setSqlResult] = useState<DbAdminSqlResult | null>(null);
  const [sqlAdvancedTabs, setSqlAdvancedTabs] = useState<number[] | number | null>([]);

  const tableRows = useMemo(() => {
    const search = tableSearch.trim().toLowerCase();
    const list = search ? tables.filter((table) => table.name.toLowerCase().includes(search)) : tables;
    return list;
  }, [tables, tableSearch]);

  const selectedTableRow = useMemo(
    () => tableRows.find((row) => row.name === selectedTable) ?? null,
    [selectedTable, tableRows]
  );
  const visibleColumns = useMemo(() => {
    const columns = tableInfo?.columns ?? [];
    if (revealSensitiveColumns) {
      return columns;
    }
    return columns.filter((column) => !/(password|secret|token|hash)/i.test(column.name));
  }, [tableInfo, revealSensitiveColumns]);
  const visibleRows = useMemo(() => {
    const query = globalRowSearch.trim().toLowerCase();
    if (!query) {
      return rows;
    }
    return rows.filter((row) =>
      visibleColumns.some((column) => String(row[column.name] ?? '').toLowerCase().includes(query))
    );
  }, [globalRowSearch, rows, visibleColumns]);

  const parseErrorCode = (error: unknown): string => {
    const candidate = error as {
      response?: { errors?: Array<{ extensions?: { code?: string } }> };
      message?: string;
    };
    const code = candidate?.response?.errors?.[0]?.extensions?.code;
    if (typeof code === 'string') {
      return code;
    }
    const text = String(candidate?.message ?? error);
    return text.includes('FORBIDDEN') ? 'FORBIDDEN' : '';
  };

  const getErrorMessage = (error: unknown): string =>
    parseErrorCode(error) === 'FORBIDDEN'
      ? 'Forbidden: DB Admin requires DB_ADMIN permission or admin role.'
      : formatErrorMessage(error);

  const checkDbAdminAccess = async (): Promise<boolean> => {
    const diagnosticsResult = await sdk.safe.devDiagnostics();
    if (!diagnosticsResult.ok) {
      setAccessChecked(true);
      return true;
    }
    const diagnostics = diagnosticsResult.data.devDiagnostics;
    const roles = diagnostics?.roles ?? [];
    const permissions = diagnostics?.permissions ?? [];
    const hasAccess = roles.includes('admin') || permissions.includes('DB_ADMIN') || permissions.includes('DB_ADMIN_READ');
    if (!hasAccess) {
      setForbiddenMessage('Forbidden: DB Admin requires DB_ADMIN permission or admin role.');
    } else {
      setForbiddenMessage(null);
    }
    setAccessChecked(true);
    return hasAccess;
  };

  const refreshTables = async (nextDangerMode = dangerMode) => {
    setTablesLoading(true);
    setForbiddenMessage(null);
    try {
      const result = await sdk.dbAdminTables({ dangerMode: nextDangerMode });
      const tableList = (result.dbAdminTables ?? []) as DbAdminTableListItem[];
      setTables(tableList);
      if (selectedTable && !tableList.some((table) => table.name === selectedTable)) {
        setSelectedTable(tableList[0]?.name ?? null);
      } else if (!selectedTable && tableList.length > 0) {
        setSelectedTable(tableList[0]?.name ?? null);
      }
    } catch (error) {
      if (parseErrorCode(error) === 'FORBIDDEN') {
        setForbiddenMessage('Forbidden: DB Admin requires DB_ADMIN permission or admin role.');
      }
      setStatus(getErrorMessage(error));
      setTables([]);
      setSelectedTable(null);
    } finally {
      setTablesLoading(false);
    }
  };

  const loadTableInfo = async (tableName: string) => {
    const info = await sdk.dbAdminDescribe({ table: tableName, dangerMode });
    const table = info.dbAdminDescribe as DbAdminTable | null;
    setTableInfo(table);
    return table;
  };

  const loadRows = async (tableName: string, primaryKeyOverride?: string[]) => {
    setRowsLoading(true);
    try {
      const filter =
        filterColumn && (filterValue.trim() || ['is_null', 'not_null'].includes(filterOp))
          ? [
              {
                column: filterColumn,
                op: filterOp,
                value: filterValue.trim() || null
              }
            ]
          : null;

      const result = await sdk.dbAdminList({
        table: tableName,
        paging: { limit, offset },
        sort: sort ? { column: sort.column, direction: sort.direction } : null,
        filter,
        dangerMode
      });

      const list = result.dbAdminList;
      const primaryKey = primaryKeyOverride ?? tableInfo?.primaryKey ?? [];
      setRows(parseRows(list?.rowsJson ?? '[]', primaryKey));
      setTotalRows(list?.total ?? 0);
    } finally {
      setRowsLoading(false);
    }
  };

  useEffect(() => {
    checkDbAdminAccess()
      .then((hasAccess) => (hasAccess ? refreshTables() : undefined))
      .catch((error: unknown) => setStatus(getErrorMessage(error)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!accessChecked || forbiddenMessage) {
      return;
    }
    if (!selectedTable) {
      setTableInfo(null);
      setRows([]);
      setSelectedRows([]);
      setActiveRow(null);
      return;
    }
    setOffset(0);
    setSort(null);
    setSelectedRows([]);
    setActiveRow(null);
    setEditMode('view');
    setFilterColumn('');
    setFilterValue('');
    setFilterOp('contains');
    loadTableInfo(selectedTable)
      .then((info) => loadRows(selectedTable, info?.primaryKey ?? []))
      .catch((error: unknown) => setStatus(getErrorMessage(error)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable, dangerMode]);

  useEffect(() => {
    if (!accessChecked || forbiddenMessage) {
      return;
    }
    if (!selectedTable) {
      return;
    }
    loadRows(selectedTable).catch((error: unknown) => setStatus(getErrorMessage(error)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset, sort, filterColumn, filterOp, filterValue]);

  useEffect(() => {
    if (!activeRow || !tableInfo) {
      setDraftRow({});
      return;
    }
    const next: Record<string, unknown> = {};
    tableInfo.columns.forEach((column) => {
      next[column.name] = activeRow[column.name];
    });
    setDraftRow(next);
    setEditMode('edit');
  }, [activeRow, tableInfo]);

  const startNewRow = () => {
    if (!tableInfo) {
      return;
    }
    const next: Record<string, unknown> = {};
    tableInfo.columns.forEach((column) => {
      next[column.name] = undefined;
    });
    setDraftRow(next);
    setEditMode('new');
    setActiveRow(null);
  };

  const saveRow = async () => {
    if (!tableInfo || !selectedTable) {
      return;
    }
    try {
      const payload: Record<string, unknown> = {};
      tableInfo.columns.forEach((column) => {
        if (draftRow[column.name] !== undefined) {
          payload[column.name] = normalizeDraftValue(column, draftRow[column.name]);
        }
      });

      if (editMode === 'new') {
        await sdk.dbAdminInsert({ table: selectedTable, rowJson: JSON.stringify(payload), dangerMode });
      } else if (editMode === 'edit' && activeRow) {
        const pk: Record<string, unknown> = {};
        tableInfo.primaryKey.forEach((key) => {
          pk[key] = activeRow[key];
        });
        await sdk.dbAdminUpdate({
          table: selectedTable,
          pkJson: JSON.stringify(pk),
          patchJson: JSON.stringify(payload),
          dangerMode
        });
      }

      await loadRows(selectedTable);
      setStatus('Saved changes.');
    } catch (error) {
      setStatus(getErrorMessage(error));
    }
  };

  const deleteRow = async (row: RowRecord) => {
    if (!tableInfo || !selectedTable) {
      return;
    }
    if (tableInfo.primaryKey.length === 0) {
      setStatus('This table has no primary key; delete is disabled.');
      return;
    }
    try {
      const pk: Record<string, unknown> = {};
      tableInfo.primaryKey.forEach((key) => {
        pk[key] = row[key];
      });
      await sdk.dbAdminDelete({ table: selectedTable, pkJson: JSON.stringify(pk), dangerMode });
    } catch (error) {
      setStatus(getErrorMessage(error));
    }
  };

  const bulkDelete = async () => {
    if (!tableInfo || !selectedTable || selectedRows.length === 0) {
      return;
    }
    const confirmed = await ui.confirm({
      header: 'Confirm Bulk Delete',
      message: `Delete ${selectedRows.length} row(s) from ${selectedTable}? This cannot be undone.`,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel'
    });
    if (!confirmed) {
      return;
    }
    for (const row of selectedRows) {
      await deleteRow(row);
    }
    setSelectedRows([]);
    await loadRows(selectedTable);
  };

  const exportSelected = (format: 'json' | 'csv') => {
    if (!tableInfo || selectedRows.length === 0) {
      return;
    }
    const payload = selectedRows.map((row) => {
      const next: Record<string, unknown> = {};
      tableInfo.columns.forEach((column) => {
        next[column.name] = row[column.name];
      });
      return next;
    });
    if (format === 'json') {
      downloadJson(`${selectedTable}-rows.json`, payload);
      return;
    }
    const header = tableInfo.columns.map((column) => toCsvValue(column.name)).join(',');
    const lines = payload.map((row) => tableInfo.columns.map((column) => toCsvValue(row[column.name])).join(','));
    const csv = [header, ...lines].join('\n');
    downloadBlob(`${selectedTable}-rows.csv`, new Blob([csv], { type: 'text/csv' }));
  };

  const renderCell = (value: unknown) => {
    if (value === null || value === undefined) {
      return <span className="muted">null</span>;
    }
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (typeof value === 'object') {
      return <code className="db-admin-cell-value" title={text}>{text}</code>;
    }
    return <span className="db-admin-cell-value" title={text}>{text}</span>;
  };

  const renderEditor = (column: DbAdminColumn) => {
    const value = draftRow[column.name];
    const kind = columnKind(column.type);
    const disabled = editMode === 'edit' && column.primaryKey;

    if (kind === 'boolean') {
      return (
        <Checkbox
          checked={Boolean(value)}
          onChange={(event) => setDraftRow((prev) => ({ ...prev, [column.name]: Boolean(event.checked) }))}
          disabled={disabled}
        />
      );
    }
    if (kind === 'number') {
      const numeric = typeof value === 'number' ? value : value === null || value === undefined ? null : Number(value);
      return (
        <InputNumber
          value={Number.isFinite(numeric) ? numeric : null}
          onValueChange={(event) => setDraftRow((prev) => ({ ...prev, [column.name]: event.value ?? null }))}
          disabled={disabled}
        />
      );
    }
    if (kind === 'datetime') {
      let dateValue: Date | null = null;
      if (value instanceof Date) {
        dateValue = value;
      } else if (typeof value === 'string' && value) {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
          dateValue = parsed;
        }
      }
      const showTime = column.type.toLowerCase().includes('time');
      return (
        <Calendar
          value={dateValue}
          onChange={(event) => setDraftRow((prev) => ({ ...prev, [column.name]: event.value ?? null }))}
          showTime={showTime}
          showSeconds={showTime}
          dateFormat="yy-mm-dd"
          disabled={disabled}
        />
      );
    }
    if (kind === 'json') {
      const textValue = typeof value === 'string' ? value : JSON.stringify(value ?? null);
      return (
        <InputTextarea
          rows={3}
          value={textValue}
          onChange={(event) => setDraftRow((prev) => ({ ...prev, [column.name]: event.target.value }))}
          disabled={disabled}
        />
      );
    }
    return (
      <InputText
        value={value === null || value === undefined ? '' : String(value)}
        onChange={(event) => setDraftRow((prev) => ({ ...prev, [column.name]: event.target.value }))}
        disabled={disabled}
      />
    );
  };

  const runSql = async () => {
    setStatus('');
    const result = await sdk.dbAdminSql({
      query: sqlQuery,
      paramsJson: sqlParams.trim() || null,
      allowWrites: sqlAllowWrites
    });
    setSqlResult(result.dbAdminSql as DbAdminSqlResult | null);
  };

  const sqlRows = useMemo(() => parseRows(sqlResult?.rowsJson ?? '[]', []), [sqlResult]);
  const sqlColumns = sqlResult?.columns ?? (sqlRows[0] ? Object.keys(sqlRows[0]).filter((key) => key !== '__rowKey') : []);
  const headerContext: DbAdminHeaderContext = {
    route: location.pathname,
    siteId: null,
    selectedContentItemId: null,
    selectedCount: selectedRows.length,
    dangerMode,
    toggleDangerMode: async () => {
      const next = !dangerMode;
      if (next) {
        const confirmed = await ui.confirm({
          header: 'Show System Tables',
          message: 'This will include internal DuckDB/system tables. Continue?',
          acceptLabel: 'Enable',
          rejectLabel: 'Cancel'
        });
        if (!confirmed) {
          return;
        }
      }
      setDangerMode(next);
      await refreshTables(next);
    },
    exportSelectedJson: () => exportSelected('json'),
    exportSelectedCsv: () => exportSelected('csv'),
    deleteSelected: () => bulkDelete(),
    toast: ui.toast,
    confirm: ui.confirm
  };
  const headerOverflowCommands = commandRegistry.getCommands(headerContext, 'overflow');

  return (
    <WorkspacePage className="db-admin-page">
      <WorkspaceHeader
        title="DB Admin"
        subtitle="Database workspace with table explorer, row grid, schema, and SQL console."
        helpTopicKey="db_admin"
        badges={dangerMode ? <Tag value="System tables visible" severity="warning" /> : undefined}
      />
      <WorkspaceActionBar
        primary={(
          <>
            <Button
              label="Refresh"
              onClick={() => selectedTable && loadRows(selectedTable).catch((error: unknown) => setStatus(getErrorMessage(error)))}
            />
            <Button label="New Row" onClick={startNewRow} disabled={!tableInfo} />
          </>
        )}
        overflow={<CommandMenuButton commands={headerOverflowCommands} context={headerContext} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />}
      />
      <WorkspaceToolbar defaultExpanded>
        <div className="table-toolbar">
          <div className="inline-actions">
            <InputText placeholder="Search tables" value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} />
            <InputText placeholder="Global row search" value={globalRowSearch} onChange={(event) => setGlobalRowSearch(event.target.value)} />
          </div>
          <div className="inline-actions">
            <Dropdown
              value={filterColumn}
              options={(tableInfo?.columns ?? []).map((column) => ({ label: column.name, value: column.name }))}
              onChange={(event) => setFilterColumn(event.value as string)}
              placeholder="Filter column"
            />
            <Dropdown value={filterOp} options={FILTER_OPS} onChange={(event) => setFilterOp(event.value as string)} />
            <InputText
              placeholder="Filter value"
              value={filterValue}
              onChange={(event) => setFilterValue(event.target.value)}
              disabled={['is_null', 'not_null'].includes(filterOp)}
            />
            <label className="flex align-items-center gap-2">
              Reveal sensitive
              <InputSwitch checked={revealSensitiveColumns} onChange={(event) => setRevealSensitiveColumns(Boolean(event.value))} />
            </label>
          </div>
        </div>
      </WorkspaceToolbar>
      <WorkspaceBody>
        {!accessChecked ? (
          <div className="status-panel">Checking DB Admin permissions...</div>
        ) : forbiddenMessage ? (
          <ForbiddenState title="DB Admin unavailable" reason={forbiddenMessage} />
        ) : (
          <WorkspacePaneLayout
            workspaceId="settings-db-admin"
            className="db-admin-split"
            left={{
              id: 'tables',
              label: 'Tables',
              defaultSize: 25,
              minSize: 14,
              collapsible: true,
              content: (
                <DataTable
                  value={tableRows}
                  size="small"
                  loading={tablesLoading}
                  scrollable
                  scrollHeight="flex"
                  style={{ height: '100%' }}
                  tableStyle={{ minWidth: '22rem' }}
                  className="db-admin-table"
                  selectionMode="single"
                  selection={selectedTableRow}
                  onSelectionChange={(event) => setSelectedTable((event.value as DbAdminTableListItem | null)?.name ?? null)}
                >
                  <Column field="name" header="Tables" style={{ minWidth: '11rem' }} />
                  <Column field="schema" header="Schema" style={{ minWidth: '5.5rem' }} />
                  <Column field="rowCount" header="Rows" body={(row: DbAdminTableListItem) => row.rowCount ?? '-'} style={{ minWidth: '4.5rem' }} />
                </DataTable>
              )
            }}
            center={{
              id: 'rows',
              label: 'Rows',
              defaultSize: 50,
              minSize: 24,
              collapsible: false,
              content: (
                <WorkspaceGrid
                  value={visibleRows}
                  className="db-admin-table"
                  tableProps={{
                    loading: rowsLoading,
                    scrollable: true,
                    scrollHeight: 'flex',
                    style: { height: '100%' },
                    tableStyle: { minWidth: '100%', width: 'max-content' },
                    dataKey: '__rowKey',
                    selectionMode: 'multiple',
                    selection: selectedRows,
                    resizableColumns: true,
                    columnResizeMode: 'expand',
                    onSelectionChange: (event: any) =>
                      setSelectedRows(Array.isArray(event.value) ? (event.value as RowRecord[]) : []),
                    onRowClick: (event: any) => setActiveRow(event.data as RowRecord),
                    paginator: true,
                    lazy: true,
                    rows: limit,
                    first: offset,
                    totalRecords: totalRows,
                    onPage: (event: any) => {
                      setLimit(event.rows ?? limit);
                      setOffset(event.first ?? 0);
                    },
                    sortField: sort?.column,
                    sortOrder: sort ? (sort.direction === 'DESC' ? -1 : 1) : 0,
                    onSort: (event: any) => {
                      if (!event.sortField) {
                        setSort(null);
                        return;
                      }
                      setSort({
                        column: event.sortField as string,
                        direction: event.sortOrder === -1 ? 'DESC' : 'ASC'
                      });
                    }
                  }}
                  rowOverflow={{
                    commandsForRow: (row) => {
                      const commandContext: DbAdminRowCommandContext = {
                        route: location.pathname,
                        siteId: null,
                        selectedContentItemId: null,
                        row,
                        inspectRow: (next) => {
                          setActiveRow(next);
                          setEditMode('edit');
                        },
                        deleteRowByContext: async (next) => {
                          await deleteRow(next);
                          if (selectedTable) {
                            await loadRows(selectedTable);
                          }
                        },
                        confirm: ui.confirm
                      };
                      return commandRegistry.getCommands(commandContext, 'rowOverflow');
                    },
                    contextForRow: (row) => ({
                      route: location.pathname,
                      siteId: null,
                      selectedContentItemId: null,
                      row,
                      inspectRow: (next: RowRecord) => {
                        setActiveRow(next);
                        setEditMode('edit');
                      },
                      deleteRowByContext: async (next: RowRecord) => {
                        await deleteRow(next);
                        if (selectedTable) {
                          await loadRows(selectedTable);
                        }
                      },
                      confirm: ui.confirm
                    })
                  }}
                >
                  <Column selectionMode="multiple" headerClassName="w-3rem" bodyClassName="w-3rem" style={{ width: '3rem', minWidth: '3rem' }} />
                  {visibleColumns.map((column) => (
                    <Column
                      key={column.name}
                      field={column.name}
                      header={column.name}
                      body={(row) => renderCell((row as RowRecord)[column.name])}
                      sortable
                      style={{ minWidth: /(json|description|content|body)/i.test(column.name) ? '18rem' : '12rem' }}
                    />
                  ))}
                </WorkspaceGrid>
              )
            }}
            right={{
              id: 'inspector',
              label: 'Inspector',
              defaultSize: 25,
              minSize: 14,
              collapsible: true,
              content: (
                <TabView className="db-admin-inspector-tabs">
                  <TabPanel header="Inspector">
                    {!tableInfo ? (
                      <p className="muted">Select a table to inspect rows.</p>
                    ) : (
                      <Accordion multiple activeIndex={[0]}>
                        <AccordionTab header="Basic">
                          <div className="inline-actions mb-3">
                            <Button
                              label="Save"
                              onClick={() => void saveRow()}
                              disabled={editMode === 'view' || (editMode === 'edit' && (tableInfo?.primaryKey.length ?? 0) === 0)}
                            />
                            <Button
                              label="Delete"
                              severity="danger"
                              onClick={async () => {
                                if (!activeRow) {
                                  return;
                                }
                                const confirmed = await ui.confirm({
                                  header: 'Delete Row',
                                  message: 'Delete the selected row? This cannot be undone.',
                                  acceptLabel: 'Delete',
                                  rejectLabel: 'Cancel'
                                });
                                if (!confirmed) {
                                  return;
                                }
                                await deleteRow(activeRow);
                                await loadRows(selectedTable ?? '');
                                setActiveRow(null);
                              }}
                              disabled={!activeRow || (tableInfo?.primaryKey.length ?? 0) === 0}
                            />
                          </div>
                          <div className="form-row">
                            {(tableInfo.columns ?? []).map((column) => (
                              <div key={column.name} className="form-row">
                                <label>
                                  {column.name} <span className="muted">({column.type})</span>
                                  {column.primaryKey ? <span className="muted"> PK</span> : null}
                                </label>
                                {renderEditor(column)}
                              </div>
                            ))}
                          </div>
                        </AccordionTab>
                        <AccordionTab header="Advanced" />
                      </Accordion>
                    )}
                  </TabPanel>
                  <TabPanel header="Schema">
                    {!tableInfo ? (
                      <p className="muted">Select a table to view schema details.</p>
                    ) : (
                      <>
                        <h4 className="mt-0">Columns</h4>
                        <DataTable value={tableInfo.columns} size="small">
                          <Column field="name" header="Column" />
                          <Column field="type" header="Type" />
                          <Column field="nullable" header="Nullable" body={(row: DbAdminColumn) => (row.nullable ? 'Yes' : 'No')} />
                          <Column field="defaultValue" header="Default" body={(row: DbAdminColumn) => row.defaultValue ?? ''} />
                          <Column field="primaryKey" header="PK" body={(row: DbAdminColumn) => (row.primaryKey ? 'Yes' : '')} />
                        </DataTable>
                        <h4>Indexes</h4>
                        {tableInfo.indexes.length === 0 ? (
                          <p className="muted">No indexes reported.</p>
                        ) : (
                          <DataTable value={tableInfo.indexes} size="small">
                            <Column field="name" header="Index" />
                            <Column field="columns" header="Columns" body={(row: DbAdminIndex) => row.columns.join(', ')} />
                            <Column field="unique" header="Unique" body={(row: DbAdminIndex) => (row.unique ? 'Yes' : 'No')} />
                          </DataTable>
                        )}
                      </>
                    )}
                  </TabPanel>
                  <TabPanel header="SQL Console">
                    <Accordion multiple activeIndex={sqlAdvancedTabs} onTabChange={(event) => setSqlAdvancedTabs(event.index)}>
                      <AccordionTab header="Advanced: SQL Console">
                        <div className="form-row">
                          <label>Query</label>
                          <InputTextarea rows={8} value={sqlQuery} onChange={(event) => setSqlQuery(event.target.value)} />
                          <label>Params (JSON array)</label>
                          <InputTextarea rows={3} value={sqlParams} onChange={(event) => setSqlParams(event.target.value)} />
                          <label>Enable Writes</label>
                          <div className="inline-actions">
                            <InputText
                              placeholder="Type ENABLE WRITE"
                              value={sqlConfirm}
                              onChange={(event) => setSqlConfirm(event.target.value)}
                            />
                            <InputSwitch
                              checked={sqlAllowWrites}
                              onChange={(event) => {
                                if (event.value && sqlConfirm.trim().toUpperCase() !== 'ENABLE WRITE') {
                                  setStatus('Type ENABLE WRITE to enable SQL writes.');
                                  return;
                                }
                                setSqlAllowWrites(Boolean(event.value));
                              }}
                            />
                          </div>
                          <div className="inline-actions">
                            <Button
                              label="Run Query"
                              onClick={() => runSql().catch((error: unknown) => setStatus(getErrorMessage(error)))}
                            />
                            <Button
                              label="Clear Results"
                              severity="secondary"
                              onClick={() => setSqlResult(null)}
                            />
                          </div>
                        </div>
                        {sqlResult ? (
                          <div className="mt-4">
                            <div className="inline-actions mb-2">
                              <span className="muted">
                                {sqlResult.readOnly ? 'Read-only' : 'Write'} - {sqlResult.rowCount} row(s)
                              </span>
                              {sqlResult.message ? <span className="muted">{sqlResult.message}</span> : null}
                            </div>
                            {sqlRows.length > 0 ? (
                              <DataTable value={sqlRows} size="small">
                                {sqlColumns.map((column) => (
                                  <Column key={column} field={column} header={column} body={(row) => renderCell((row as RowRecord)[column])} />
                                ))}
                              </DataTable>
                            ) : (
                              <p className="muted">No rows returned.</p>
                            )}
                          </div>
                        ) : null}
                      </AccordionTab>
                    </Accordion>
                  </TabPanel>
                  </TabView>
              )
            }}
          />
        )}
      </WorkspaceBody>
      {status ? (
        <div className="status-panel" role="alert">
          {status}
        </div>
      ) : null}
    </WorkspacePage>
  );
}

