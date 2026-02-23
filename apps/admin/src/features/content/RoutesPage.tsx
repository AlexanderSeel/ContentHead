import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';

type Route = { id: number; contentItemId: number; marketCode: string; localeCode: string; slug: string; isCanonical: boolean };
type Item = { id: number };

export function RoutesPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId, combos } = useAdminContext();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState<Route>({ id: 0, contentItemId: 0, marketCode: 'US', localeCode: 'en-US', slug: '', isCanonical: true });

  const activeComboOptions = combos.filter((entry) => entry.active).map((entry) => ({ label: `${entry.marketCode}/${entry.localeCode}`, value: `${entry.marketCode}::${entry.localeCode}` }));

  const refresh = async () => {
    const [routesRes, itemsRes] = await Promise.all([sdk.listRoutes({ siteId, marketCode: null, localeCode: null }), sdk.listContentItems({ siteId })]);
    setRoutes((routesRes.listRoutes ?? []) as Route[]);
    setItems((itemsRes.listContentItems ?? []) as Item[]);
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [siteId]);

  return (
    <div>
      <PageHeader title="Routes" subtitle="Route bindings per market/locale" />
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
        <Dropdown value={draft.contentItemId} options={items.map((entry) => ({ label: `#${entry.id}`, value: entry.id }))} onChange={(e) => setDraft((prev) => ({ ...prev, contentItemId: Number(e.value) }))} placeholder="Item" />
        <Dropdown value={`${draft.marketCode}::${draft.localeCode}`} options={activeComboOptions} onChange={(e) => {
          const [marketCode, localeCode] = String(e.value).split('::');
          setDraft((prev) => ({ ...prev, marketCode: marketCode ?? prev.marketCode, localeCode: localeCode ?? prev.localeCode }));
        }} />
        <InputText value={draft.slug} onChange={(e) => setDraft((prev) => ({ ...prev, slug: e.target.value }))} placeholder="slug" />
        <label><Checkbox checked={draft.isCanonical} onChange={(e) => setDraft((prev) => ({ ...prev, isCanonical: Boolean(e.checked) }))} /> Canonical</label>
        <Button label="Save Route" onClick={() => sdk.upsertRoute({ ...(draft.id ? { id: draft.id } : {}), siteId, contentItemId: draft.contentItemId, marketCode: draft.marketCode, localeCode: draft.localeCode, slug: draft.slug, isCanonical: draft.isCanonical }).then(() => refresh())} />
      </div>
    </div>
  );
}
