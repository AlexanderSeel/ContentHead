import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, type DataTableSortEvent } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Calendar } from 'primereact/calendar';

import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
import { createAdminSdk } from '../../lib/sdk';

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

export function FormSubmissionsPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId: defaultSiteId } = useAdminContext();

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
  };

  return (
    <div className="pageRoot">
      <PageHeader
        title="Form Submissions"
        subtitle="Filter, group, inspect, and export captured form data."
        actions={(
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button icon="pi pi-refresh" text onClick={() => reload().catch(() => undefined)} />
            <Button label="Export CSV" onClick={() => exportData('CSV').catch(() => undefined)} />
            <Button label="Export JSON" severity="secondary" onClick={() => exportData('JSON').catch(() => undefined)} />
          </div>
        )}
      />

      <section className="content-card" style={{ marginBottom: '1rem' }}>
        <div className="form-row" style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div>
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
          <div>
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
          <div>
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
          <div>
            <label>Market</label>
            <InputText value={marketFilter} onChange={(event) => { setMarketFilter(event.target.value); setFirst(0); }} placeholder="US" />
          </div>
          <div>
            <label>Locale</label>
            <InputText value={localeFilter} onChange={(event) => { setLocaleFilter(event.target.value); setFirst(0); }} placeholder="en-US" />
          </div>
          <div>
            <label>From</label>
            <Calendar value={fromDate} onChange={(event) => { setFromDate((event.value as Date | null) ?? null); setFirst(0); }} showIcon />
          </div>
          <div>
            <label>To</label>
            <Calendar value={toDate} onChange={(event) => { setToDate((event.value as Date | null) ?? null); setFirst(0); }} showIcon />
          </div>
          <div>
            <label>Search</label>
            <InputText value={search} onChange={(event) => { setSearch(event.target.value); setFirst(0); }} placeholder="Search answers/meta/route" />
          </div>
        </div>
        <small className="muted">Tip: group by `Form` and expand rows to inspect full submitted JSON payload and metadata.</small>
      </section>

      <section className="content-card">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
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
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <strong>Answers</strong>
                  <pre style={{ margin: 0 }}>{dataPretty}</pre>
                </div>
                <div>
                  <strong>Metadata</strong>
                  <pre style={{ margin: 0 }}>{metaPretty}</pre>
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
        >
          <Column expander style={{ width: '3rem' }} />
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
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
        </DataTable>
      </section>
    </div>
  );
}
