import { useEffect, useMemo, useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { PaneRoot, PaneScroll, WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';
import { useUi } from '../../app/UiContext';

type LocaleCatalog = { code: string; name: string; language: string; region: string };
type Market = { code: string; name: string; currency?: string | null; timezone?: string | null; active: boolean; isDefault: boolean };
type Locale = { code: string; name: string; active: boolean; fallbackLocaleCode?: string | null; isDefault: boolean };
type Combo = { marketCode: string; localeCode: string; active: boolean; isDefaultForMarket: boolean };

export function MarketsLocalesPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId, refreshContext } = useAdminContext();
  const { toast } = useUi();

  const [catalog, setCatalog] = useState<LocaleCatalog[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [locales, setLocales] = useState<Locale[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [defaultMarketCode, setDefaultMarketCode] = useState('');
  const [defaultLocaleCode, setDefaultLocaleCode] = useState('');
  const [marketDefaults, setMarketDefaults] = useState<Record<string, string>>({});

  const [marketForm, setMarketForm] = useState<Market>({ code: '', name: '', currency: '', timezone: '', active: true, isDefault: false });
  const [localeForm, setLocaleForm] = useState<Locale>({ code: '', name: '', active: true, fallbackLocaleCode: null, isDefault: false });
  const [localeOverrideName, setLocaleOverrideName] = useState('');
  const [localeOverrideFallback, setLocaleOverrideFallback] = useState<string | null>(null);

  const refresh = async () => {
    const [matrix, localeCatalogRes] = await Promise.all([sdk.getSiteMarketLocaleMatrix({ siteId }), sdk.localeCatalog()]);
    const payload = matrix.getSiteMarketLocaleMatrix;
    const nextMarkets = (payload?.markets ?? []) as Market[];
    const nextLocales = (payload?.locales ?? []) as Locale[];
    setCatalog((localeCatalogRes.localeCatalog ?? []) as LocaleCatalog[]);
    setMarkets(nextMarkets);
    setLocales(nextLocales);
    setCombos((payload?.combinations ?? []) as Combo[]);
    setDefaultMarketCode(payload?.defaults?.defaultMarketCode ?? nextMarkets.find((entry) => entry.isDefault)?.code ?? '');
    setDefaultLocaleCode(payload?.defaults?.defaultLocaleCode ?? nextLocales.find((entry) => entry.isDefault)?.code ?? '');
    const byMarket: Record<string, string> = {};
    for (const entry of payload?.defaults?.marketDefaultLocales ?? []) {
      if (entry.marketCode && entry.localeCode) {
        byMarket[entry.marketCode] = entry.localeCode;
      }
    }
    setMarketDefaults(byMarket);
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [siteId]);

  const localeOptions = locales.map((entry) => ({ label: entry.code, value: entry.code }));
  const localeCatalogSuggestions = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    if (!query) {
      return catalog.slice(0, 20);
    }
    return catalog.filter((entry) => entry.code.toLowerCase().includes(query) || entry.name.toLowerCase().includes(query)).slice(0, 20);
  }, [catalog, catalogSearch]);

  const matrixWarnings = useMemo(() => {
    return combos
      .filter((entry) => entry.active)
      .filter((entry) => {
        const locale = locales.find((candidate) => candidate.code === entry.localeCode);
        return locale && !locale.isDefault && !locale.fallbackLocaleCode;
      })
      .map((entry) => `${entry.marketCode}/${entry.localeCode} is active but has no fallback locale.`);
  }, [combos, locales]);

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Markets & Locales"
        subtitle="Catalog-driven locales, overrides, matrix defaults and URL-ready combinations."
      />
      <WorkspaceActionBar primary={<Button label="Refresh" onClick={() => refresh().catch(() => undefined)} />} />
      <WorkspaceBody>
        <PaneRoot className="content-card">
          <PaneScroll>
            <TabView>
              <TabPanel header="Markets">
                <DataTable value={markets} size="small">
                  <Column field="code" header="Code" />
                  <Column field="name" header="Name" />
                  <Column field="currency" header="Currency" />
                  <Column field="timezone" header="Timezone" />
                  <Column field="active" header="Active" body={(row: Market) => (row.active ? 'Yes' : 'No')} />
                  <Column field="isDefault" header="Default" body={(row: Market) => (row.isDefault ? 'Yes' : 'No')} />
                  <Column header="Edit" body={(row: Market) => <Button text label="Edit" onClick={() => setMarketForm(row)} />} />
                </DataTable>
                <div className="form-grid">
                  <InputText value={marketForm.code} onChange={(e) => setMarketForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} placeholder="Code" />
                  <InputText value={marketForm.name} onChange={(e) => setMarketForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Name" />
                  <InputText value={marketForm.currency ?? ''} onChange={(e) => setMarketForm((prev) => ({ ...prev, currency: e.target.value }))} placeholder="Currency" />
                  <InputText value={marketForm.timezone ?? ''} onChange={(e) => setMarketForm((prev) => ({ ...prev, timezone: e.target.value }))} placeholder="Timezone" />
                  <label><Checkbox checked={marketForm.active} onChange={(e) => setMarketForm((prev) => ({ ...prev, active: Boolean(e.checked) }))} /> Active</label>
                  <label><Checkbox checked={marketForm.isDefault} onChange={(e) => setMarketForm((prev) => ({ ...prev, isDefault: Boolean(e.checked) }))} /> Default</label>
                  <Button label="Save Market" onClick={() => sdk.upsertMarket({ siteId, ...marketForm }).then(async () => { await refresh(); await refreshContext(); toast({ severity: 'success', summary: 'Market saved' }); })} />
                </div>
              </TabPanel>
              <TabPanel header="Locales">
                <DataTable value={locales} size="small">
                  <Column field="code" header="Code" />
                  <Column field="name" header="Display Name" />
                  <Column field="fallbackLocaleCode" header="Fallback" />
                  <Column field="active" header="Active" body={(row: Locale) => (row.active ? 'Yes' : 'No')} />
                  <Column field="isDefault" header="Default" body={(row: Locale) => (row.isDefault ? 'Yes' : 'No')} />
                  <Column
                    header="Edit"
                    body={(row: Locale) => (
                      <Button
                        text
                        label="Edit"
                        onClick={() => {
                          setLocaleForm(row);
                          setLocaleOverrideName(row.name);
                          setLocaleOverrideFallback(row.fallbackLocaleCode ?? null);
                        }}
                      />
                    )}
                  />
                </DataTable>
                <div className="form-grid">
                  <AutoComplete
                    value={localeForm.code}
                    suggestions={localeCatalogSuggestions}
                    completeMethod={(event) => setCatalogSearch(event.query)}
                    field="code"
                    dropdown
                    itemTemplate={(item: LocaleCatalog) => <span>{item.code} - {item.name}</span>}
                    onChange={(event) => {
                      const value = event.value as LocaleCatalog | string;
                      if (typeof value === 'string') {
                        setLocaleForm((prev) => ({ ...prev, code: value }));
                        return;
                      }
                      setLocaleForm((prev) => ({ ...prev, code: value.code, name: value.name }));
                      setLocaleOverrideName(value.name);
                    }}
                    placeholder="Locale from catalog"
                  />
                  <InputText value={localeOverrideName} onChange={(e) => setLocaleOverrideName(e.target.value)} placeholder="Display name override" />
                  <Dropdown
                    value={localeOverrideFallback}
                    options={localeOptions}
                    onChange={(e) => setLocaleOverrideFallback(e.value ?? null)}
                    showClear
                    filter
                    placeholder="Fallback locale override"
                  />
                  <label><Checkbox checked={localeForm.active} onChange={(e) => setLocaleForm((prev) => ({ ...prev, active: Boolean(e.checked) }))} /> Active</label>
                  <label><Checkbox checked={localeForm.isDefault} onChange={(e) => setLocaleForm((prev) => ({ ...prev, isDefault: Boolean(e.checked) }))} /> Default</label>
                  <Button
                    label="Save Locale"
                    onClick={async () => {
                      await sdk.upsertLocale({ siteId, ...localeForm, name: localeForm.name || localeOverrideName });
                      await sdk.upsertSiteLocaleOverride({
                        siteId,
                        code: localeForm.code,
                        displayName: localeOverrideName || null,
                        fallbackLocaleCode: localeOverrideFallback
                      });
                      await refresh();
                      await refreshContext();
                      toast({ severity: 'success', summary: 'Locale and override saved' });
                    }}
                  />
                </div>
              </TabPanel>
              <TabPanel header="Matrix">
                {matrixWarnings.length > 0 ? (
                  <div className="status-panel">
                    {matrixWarnings.map((warning) => (
                      <div key={warning} className="editor-error">{warning}</div>
                    ))}
                  </div>
                ) : null}
                <div className="matrix-wrap">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th>Market \\ Locale</th>
                        {locales.map((locale) => (
                          <th key={locale.code}>{locale.code}</th>
                        ))}
                        <th>Default Locale / Market</th>
                      </tr>
                    </thead>
                    <tbody>
                      {markets.map((market) => (
                        <tr key={market.code}>
                          <td>{market.code}</td>
                          {locales.map((locale) => {
                            const item = combos.find((entry) => entry.marketCode === market.code && entry.localeCode === locale.code);
                            return (
                              <td key={`${market.code}-${locale.code}`}>
                                <Checkbox
                                  checked={Boolean(item?.active)}
                                  onChange={(event) =>
                                    setCombos((prev) => {
                                      const index = prev.findIndex((entry) => entry.marketCode === market.code && entry.localeCode === locale.code);
                                      if (index >= 0) {
                                        const next = [...prev];
                                        const current = next[index];
                                        if (current) {
                                          next[index] = { ...current, active: Boolean(event.checked) };
                                        }
                                        return next;
                                      }
                                      return [...prev, { marketCode: market.code, localeCode: locale.code, active: Boolean(event.checked), isDefaultForMarket: false }];
                                    })
                                  }
                                />
                              </td>
                            );
                          })}
                          <td>
                            <Dropdown
                              value={marketDefaults[market.code] ?? null}
                              options={locales
                                .filter((locale) => combos.some((entry) => entry.marketCode === market.code && entry.localeCode === locale.code && entry.active))
                                .map((entry) => ({ label: entry.code, value: entry.code }))}
                              onChange={(event) => setMarketDefaults((prev) => ({ ...prev, [market.code]: event.value }))}
                              filter
                              placeholder="Default locale"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="form-grid">
                  <Dropdown value={defaultMarketCode} options={markets.filter((entry) => entry.active).map((entry) => ({ label: entry.code, value: entry.code }))} onChange={(event) => setDefaultMarketCode(String(event.value))} filter placeholder="Default market" />
                  <Dropdown value={defaultLocaleCode} options={locales.filter((entry) => entry.active).map((entry) => ({ label: entry.code, value: entry.code }))} onChange={(event) => setDefaultLocaleCode(String(event.value))} filter placeholder="Default locale" />
                  <Button
                    label="Save Matrix"
                    onClick={async () => {
                      await sdk.setSiteMarkets({ siteId, defaultMarketCode, markets: markets.map((entry) => ({ code: entry.code, active: entry.active })) });
                      await sdk.setSiteLocales({ siteId, defaultLocaleCode, locales: locales.map((entry) => ({ code: entry.code, active: entry.active })) });
                      await sdk.setSiteMarketLocaleMatrix({
                        siteId,
                        combinations: combos.map((entry) => ({
                          marketCode: entry.marketCode,
                          localeCode: entry.localeCode,
                          active: entry.active,
                          isDefaultForMarket: marketDefaults[entry.marketCode] === entry.localeCode
                        })),
                        defaults: { marketDefaultLocales: Object.entries(marketDefaults).map(([marketCode, localeCode]) => ({ marketCode, localeCode })) }
                      });
                      await refresh();
                      await refreshContext();
                      toast({ severity: 'success', summary: 'Matrix saved' });
                    }}
                  />
                </div>
              </TabPanel>
            </TabView>
          </PaneScroll>
        </PaneRoot>
      </WorkspaceBody>
    </WorkspacePage>
  );
}
