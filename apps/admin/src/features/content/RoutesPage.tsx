import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
import { MarketLocalePicker } from '../../components/inputs/MarketLocalePicker';
import { SlugEditor } from '../../components/inputs/SlugEditor';
import { ContentReferencePicker } from '../../components/inputs/ContentReferencePicker';

type Route = { id: number; contentItemId: number; marketCode: string; localeCode: string; slug: string; isCanonical: boolean };

export function RoutesPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId, combos } = useAdminContext();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [draft, setDraft] = useState<Route>({ id: 0, contentItemId: 0, marketCode: 'US', localeCode: 'en-US', slug: '', isCanonical: true });

  const refresh = async () => {
    const routesRes = await sdk.listRoutes({ siteId, marketCode: null, localeCode: null });
    setRoutes((routesRes.listRoutes ?? []) as Route[]);
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [siteId]);

  return (
    <div>
      <PageHeader title="Routes" subtitle="Route bindings per market/locale" />
      <div className="table-toolbar">
        <InputText placeholder="Search slug or item id" />
        <Button label="Refresh" onClick={() => refresh()} />
      </div>
      <DataTable value={routes} size="small">
        <Column field="id" header="ID" />
        <Column field="contentItemId" header="Item" />
        <Column field="marketCode" header="Market" />
        <Column field="localeCode" header="Locale" />
        <Column field="slug" header="Slug" />
        <Column field="isCanonical" header="Canonical" body={(row: Route) => (row.isCanonical ? 'Yes' : 'No')} />
        <Column header="Edit" body={(row: Route) => <Button text label="Edit" onClick={() => setDraft(row)} />} />
      </DataTable>
      <div className="form-grid">
        <ContentReferencePicker token={token} siteId={siteId} value={draft.contentItemId || null} onChange={(value) => setDraft((prev) => ({ ...prev, contentItemId: value ?? 0 }))} />
        <MarketLocalePicker
          combos={combos}
          marketCode={draft.marketCode}
          localeCode={draft.localeCode}
          onChange={(value) => setDraft((prev) => ({ ...prev, ...value }))}
        />
        <SlugEditor value={draft.slug} onChange={(value) => setDraft((prev) => ({ ...prev, slug: value }))} />
        <label><Checkbox checked={draft.isCanonical} onChange={(e) => setDraft((prev) => ({ ...prev, isCanonical: Boolean(e.checked) }))} /> Canonical</label>
        <Button
          label="Save Route"
          onClick={() =>
            sdk
              .upsertRoute({
                ...(draft.id ? { id: draft.id } : {}),
                siteId,
                contentItemId: draft.contentItemId,
                marketCode: draft.marketCode,
                localeCode: draft.localeCode,
                slug: draft.slug,
                isCanonical: draft.isCanonical
              })
              .then(() => refresh())
          }
        />
      </div>
    </div>
  );
}
