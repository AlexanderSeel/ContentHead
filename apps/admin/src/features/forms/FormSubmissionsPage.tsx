import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ContextMenu } from 'primereact/contextmenu';
import { DataTable, type DataTableSortEvent } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Calendar } from 'primereact/calendar';

import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { useUi } from '../../app/UiContext';
import { createAdminSdk } from '../../lib/sdk';
import { CommandMenuButton } from '../../ui/commands/CommandMenuButton';
import { commandRegistry } from '../../ui/commands/registry';
import { toTieredMenuItems } from '../../ui/commands/menuModel';
import type { Command, CommandContext } from '../../ui/commands/types';
import { routeStartsWith } from '../../ui/commands/utils';
import { WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage, WorkspaceToolbar } from '../../ui/molecules';

type SubmissionRow = {
  id: number;
  siteId: number;
  formId: number;
  createdAt: string;
  submittedByUserId?: string | null;
  marketCode: string;
  localeCode: string;
  pageContentItemId?: number | null;
  pageRouteSlug?: string | null;
  status: 'new' | 'processed' | 'needs_review';
  dataJson: string;
  metaJson: string;
};

type FormOption = {
  id: number;
  name: string;
};

type SiteOption = {
  id: number;
  name: string;
};

function downloadText(filename: string, payload: string, type: string): void {
  const blob = new Blob([payload], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function severityForStatus(status: SubmissionRow['status']): 'info' | 'warning' | 'success' {
  if (status === 'processed') {
    return 'success';
  }
  if (status === 'needs_review') {
    return 'warning';
  }
  return 'info';
}

type FormSubmissionsHeaderContext = CommandContext & {
  exportData: (format: 'CSV' | 'JSON') => Promise<void>;
  clearFilters: () => void;
};

type FormSubmissionsRowContext = CommandContext & {
  row: SubmissionRow;
  markProcessed: (row: SubmissionRow) => Promise<void>;
  markNeedsReview: (row: SubmissionRow) => Promise<void>;
  copyPayload: (row: SubmissionRow) => Promise<void>;
};

const formSubmissionsHeaderCommands: Command<FormSubmissionsHeaderContext>[] = [
  {
    id: 'form-submissions.export.csv',
    label: 'Export CSV',
    icon: 'pi pi-file-export',
    group: 'Export',
    visible: (ctx) => routeStartsWith(ctx.route, '/forms/submissions'),
    run: (ctx) => ctx.exportData('CSV')
  },
  {
    id: 'form-submissions.export.json',
    label: 'Export JSON',
    icon: 'pi pi-download',
    group: 'Export',
    visible: (ctx) => routeStartsWith(ctx.route, '/forms/submissions'),
    run: (ctx) => ctx.exportData('JSON')
  },
  {
    id: 'form-submissions.clear-filters',
    label: 'Clear filters',
    icon: 'pi pi-filter-slash',
    group: 'Advanced',
    visible: (ctx) => routeStartsWith(ctx.route, '/forms/submissions'),
    run: (ctx) => ctx.clearFilters()
  }
];

commandRegistry.registerCoreCommands([{ placement: 'overflow', commands: formSubmissionsHeaderCommands }]);

const formSubmissionsRowCommands: Command<FormSubmissionsRowContext>[] = [
  {
    id: 'form-submissions.row.mark-processed',
    label: 'Mark processed',
    icon: 'pi pi-check',
    visible: (ctx) => routeStartsWith(ctx.route, '/forms/submissions'),
    enabled: (ctx) => ctx.row.status !== 'processed',
    run: (ctx) => ctx.markProcessed(ctx.row)
  },
  {
    id: 'form-submissions.row.mark-needs-review',
    label: 'Mark needs review',
    icon: 'pi pi-exclamation-circle',
    visible: (ctx) => routeStartsWith(ctx.route, '/forms/submissions'),
    enabled: (ctx) => ctx.row.status !== 'needs_review',
    run: (ctx) => ctx.markNeedsReview(ctx.row)
  },
  {
    id: 'form-submissions.row.copy-json',
    label: 'Copy data JSON',
    icon: 'pi pi-copy',
    visible: (ctx) => routeStartsWith(ctx.route, '/forms/submissions'),
    run: (ctx) => ctx.copyPayload(ctx.row)
  }
];

commandRegistry.registerCoreCommands([{ placement: 'rowOverflow', commands: formSubmissionsRowCommands }]);

export function FormSubmissionsPage() {
  const location = useLocation();
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId: defaultSiteId } = useAdminContext();
  const { toast } = useUi();

  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([]);
  const [siteId, setSiteId] = useState(defaultSiteId);
  const [formOptions, setFormOptions] = useState<FormOption[]>([]);
  const [formId, setFormId] = useState<number | null>(null);
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<SubmissionRow[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [marketFilter, setMarketFilter] = useState('');
  const [localeFilter, setLocaleFilter] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [first, setFirst] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [contextRow, setContextRow] = useState<SubmissionRow | null>(null);
  const contextMenuRef = useRef<ContextMenu>(null);

  const loadSites = async () => {
    const res = await sdk.listSites();
    setSiteOptions((res.listSites ?? []).map((entry) => ({ id: entry?.id ?? 0, name: entry?.name ?? '' })));
  };

  const loadForms = async (nextSiteId: number) => {
    const res = await sdk.listForms({ siteId: nextSiteId });
    setFormOptions((res.listForms ?? []).map((entry) => ({ id: entry?.id ?? 0, name: entry?.name ?? '' })));
  };

  const reload = async () => {
    setLoading(true);
    try {
      const res = await sdk.listFormSubmissions({
        siteId,
        formId,
        search: search.trim() || null,
        status: statusFilter,
        marketCode: marketFilter.trim() || null,
        localeCode: localeFilter.trim() || null,
        fromDate: fromDate ? fromDate.toISOString() : null,
        toDate: toDate ? toDate.toISOString() : null,
        limit: rowsPerPage,
        offset: first,
        sortField,
        sortOrder
      });
      setRows((res.listFormSubmissions?.rows ?? []) as SubmissionRow[]);
      setTotal(res.listFormSubmissions?.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites().catch(() => undefined);
  }, []);

  useEffect(() => {
    loadForms(siteId).catch(() => undefined);
  }, [siteId]);

  useEffect(() => {
    reload().catch(() => undefined);
  }, [siteId, formId, search, statusFilter, marketFilter, localeFilter, fromDate, toDate, first, rowsPerPage, sortField, sortOrder]);

  const onSort = (event: DataTableSortEvent) => {
    if (!event.sortField) {
      return;
    }
    setSortField(String(event.sortField));
    setSortOrder((event.sortOrder ?? -1) > 0 ? 'ASC' : 'DESC');
  };

  const runBulkStatus = async (status: 'processed' | 'needs_review') => {
    await Promise.all(selection.map((entry) => sdk.updateSubmissionStatus({ id: entry.id, status })));
    setSelection([]);
    await reload();
  };

  const exportData = async (format: 'CSV' | 'JSON') => {
    const res = await sdk.exportFormSubmissions({
      siteId,
      formId,
      search: search.trim() || null,
      status: statusFilter,
      marketCode: marketFilter.trim() || null,
      localeCode: localeFilter.trim() || null,
      fromDate: fromDate ? fromDate.toISOString() : null,
      toDate: toDate ? toDate.toISOString() : null,
      format
    });
    const payload = res.exportFormSubmissions ?? '';
    const date = new Date().toISOString().slice(0, 10);
    downloadText(
      `form-submissions-${siteId}-${date}.${format === 'CSV' ? 'csv' : 'json'}`,
      payload,
      format === 'CSV' ? 'text/csv' : 'application/json'
    );
    toast({ severity: 'success', summary: `Exported ${format}` });
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter(null);
    setMarketFilter('');
    setLocaleFilter('');
    setFromDate(null);
    setToDate(null);
    setFirst(0);
  };

  const headerContext: FormSubmissionsHeaderContext = {
    route: location.pathname,
    siteId,
    selectedContentItemId: null,
    toast,
    exportData,
    clearFilters
  };
  const headerOverflowCommands = commandRegistry.getCommands(headerContext, 'overflow');
  const rowContextFor = (row: SubmissionRow): FormSubmissionsRowContext => ({
    route: location.pathname,
    siteId,
    selectedContentItemId: null,
    row,
    toast,
    markProcessed: async (entry) => {
      await sdk.updateSubmissionStatus({ id: entry.id, status: 'processed' });
      await reload();
      toast({ severity: 'success', summary: `Submission #${entry.id} updated` });
    },
    markNeedsReview: async (entry) => {
      await sdk.updateSubmissionStatus({ id: entry.id, status: 'needs_review' });
      await reload();
      toast({ severity: 'success', summary: `Submission #${entry.id} updated` });
    },
    copyPayload: async (entry) => {
      await navigator.clipboard.writeText(entry.dataJson);
      toast({ severity: 'success', summary: 'Submission data copied' });
    }
  });
  const contextItems = contextRow ? toTieredMenuItems(commandRegistry.getCommands(rowContextFor(contextRow), 'rowOverflow'), rowContextFor(contextRow)) : [];

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Form Submissions"
        subtitle="Filter, group, inspect, and export captured form data."
      />
      <WorkspaceActionBar
        primary={<Button icon="pi pi-refresh" label="Refresh" onClick={() => reload().catch(() => undefined)} />}
        overflow={<CommandMenuButton commands={headerOverflowCommands} context={headerContext} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />}
      />
      <WorkspaceToolbar>
        <div className="grid">
          <div className="col-12 md:col-6 xl:col-3">
            <label>Site</label>
            <Dropdown
              value={siteId}
              options={siteOptions.map((entry) => ({ label: `${entry.name} (#${entry.id})`, value: entry.id }))}
              onChange={(event) => {
                setSiteId(Number(event.value));
                setFirst(0);
              }}
            />
          </div>
          <div className="col-12 md:col-6 xl:col-3">
            <label>Form</label>
            <Dropdown
              value={formId}
              options={[{ label: 'All forms', value: null }, ...formOptions.map((entry) => ({ label: entry.name, value: entry.id }))]}
              onChange={(event) => {
                setFormId(event.value ?? null);
                setFirst(0);
              }}
            />
          </div>
          <div className="col-12 md:col-6 xl:col-3">
            <label>Status</label>
            <Dropdown
              value={statusFilter}
              options={[
                { label: 'All statuses', value: null },
                { label: 'new', value: 'new' },
                { label: 'processed', value: 'processed' },
                { label: 'needs_review', value: 'needs_review' }
              ]}
              onChange={(event) => {
                setStatusFilter(event.value ?? null);
                setFirst(0);
              }}
            />
          </div>
          <div className="col-12 md:col-6 xl:col-3">
            <label>Market</label>
            <InputText value={marketFilter} onChange={(event) => { setMarketFilter(event.target.value); setFirst(0); }} placeholder="US" />
          </div>
          <div className="col-12 md:col-6 xl:col-3">
            <label>Locale</label>
            <InputText value={localeFilter} onChange={(event) => { setLocaleFilter(event.target.value); setFirst(0); }} placeholder="en-US" />
          </div>
          <div className="col-12 md:col-6 xl:col-3">
            <label>From</label>
            <Calendar value={fromDate} onChange={(event) => { setFromDate((event.value as Date | null) ?? null); setFirst(0); }} showIcon />
          </div>
          <div className="col-12 md:col-6 xl:col-3">
            <label>To</label>
            <Calendar value={toDate} onChange={(event) => { setToDate((event.value as Date | null) ?? null); setFirst(0); }} showIcon />
          </div>
          <div className="col-12 md:col-6 xl:col-3">
            <label>Search</label>
            <InputText value={search} onChange={(event) => { setSearch(event.target.value); setFirst(0); }} placeholder="Search answers/meta/route" />
          </div>
        </div>
        <small className="muted">Tip: group by `Form` and expand rows to inspect full submitted JSON payload and metadata.</small>
      </WorkspaceToolbar>
      <WorkspaceBody>
      <section className="content-card splitFill">
        <div className="inline-actions mb-2">
          <Button
            label="Mark Processed"
            disabled={selection.length === 0}
            onClick={() => runBulkStatus('processed').catch(() => undefined)}
          />
          <Button
            label="Mark Needs Review"
            severity="secondary"
            disabled={selection.length === 0}
            onClick={() => runBulkStatus('needs_review').catch(() => undefined)}
          />
        </div>
        <ContextMenu ref={contextMenuRef} model={contextItems} />
        <DataTable
          value={rows}
          loading={loading}
          paginator
          first={first}
          rows={rowsPerPage}
          totalRecords={total}
          onPage={(event) => {
            setFirst(event.first);
            setRowsPerPage(event.rows);
          }}
          sortField={sortField}
          sortOrder={sortOrder === 'ASC' ? 1 : -1}
          onSort={onSort}
          selection={selection}
          onSelectionChange={(event) => setSelection((event.value as SubmissionRow[]) ?? [])}
          selectionMode="checkbox"
          dataKey="id"
          rowGroupMode="subheader"
          groupRowsBy="formId"
          expandableRowGroups
          expandedRows={expandedRows}
          onRowToggle={(event) => setExpandedRows((event.data as Record<string, boolean>) ?? {})}
          rowExpansionTemplate={(row: SubmissionRow) => {
            let dataPretty = row.dataJson;
            let metaPretty = row.metaJson;
            try {
              dataPretty = JSON.stringify(JSON.parse(row.dataJson), null, 2);
            } catch {
              // keep raw
            }
            try {
              metaPretty = JSON.stringify(JSON.parse(row.metaJson), null, 2);
            } catch {
              // keep raw
            }
            return (
              <div className="grid gap-3">
                <div>
                  <strong>Answers</strong>
                  <pre className="m-0">{dataPretty}</pre>
                </div>
                <div>
                  <strong>Metadata</strong>
                  <pre className="m-0">{metaPretty}</pre>
                </div>
                {row.pageRouteSlug ? (
                  <a
                    href={`http://localhost:3000/${row.marketCode}/${row.localeCode}/${row.pageRouteSlug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open related page
                  </a>
                ) : null}
              </div>
            );
          }}
          onContextMenu={(event) => {
            setContextRow(event.data as SubmissionRow);
            window.requestAnimationFrame(() => contextMenuRef.current?.show(event.originalEvent));
          }}
        >
          <Column expander headerClassName="w-3rem" bodyClassName="w-3rem" />
          <Column selectionMode="multiple" headerClassName="w-3rem" bodyClassName="w-3rem" />
          <Column field="id" header="ID" sortable />
          <Column field="createdAt" header="Created" sortable />
          <Column field="formId" header="Form" sortable />
          <Column
            field="status"
            header="Status"
            sortable
            body={(row: SubmissionRow) => <Tag value={row.status} severity={severityForStatus(row.status)} />}
          />
          <Column field="marketCode" header="Market" sortable />
          <Column field="localeCode" header="Locale" sortable />
          <Column field="pageRouteSlug" header="Route" />
          <Column
            header="Actions"
            body={(row: SubmissionRow) => <CommandMenuButton commands={commandRegistry.getCommands(rowContextFor(row), 'rowOverflow')} context={rowContextFor(row)} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />}
          />
        </DataTable>
      </section>
      </WorkspaceBody>
    </WorkspacePage>
  );
}

