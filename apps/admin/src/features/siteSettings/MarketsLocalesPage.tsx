import { useEffect, useMemo, useState } from 'react';
import { AutoComplete, Button, Checkbox, Select, TabItem, Tabs, TextInput } from '../../ui/atoms';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { DataGrid, PaneRoot, PaneScroll, WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';
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
            <Tabs>
              <TabItem header="Markets">
                <DataGrid
                  data={markets}
                  rowKey="code"
                  columns={[
                    { key: 'code', header: 'Code' },
                    { key: 'name', header: 'Name' },
                    { key: 'currency', header: 'Currency' },
                    { key: 'timezone', header: 'Timezone' },
                    { key: 'active', header: 'Active', cell: (row) => (row.active ? 'Yes' : 'No') },
                    { key: 'isDefault', header: 'Default', cell: (row) => (row.isDefault ? 'Yes' : 'No') },
                    { key: '__edit', header: 'Edit', cell: (row) => <Button text label="Edit" onClick={() => setMarketForm(row)} /> }
                  ]}
                />
                <div className="form-grid">
                  <TextInput value={marketForm.code} onChange={(next) => setMarketForm((prev) => ({ ...prev, code: next.toUpperCase() }))} placeholder="Code" />
                  <TextInput value={marketForm.name} onChange={(next) => setMarketForm((prev) => ({ ...prev, name: next }))} placeholder="Name" />
                  <TextInput value={marketForm.currency ?? ''} onChange={(next) => setMarketForm((prev) => ({ ...prev, currency: next }))} placeholder="Currency" />
                  <TextInput value={marketForm.timezone ?? ''} onChange={(next) => setMarketForm((prev) => ({ ...prev, timezone: next }))} placeholder="Timezone" />
                  <label><Checkbox checked={marketForm.active} onChange={(next) => setMarketForm((prev) => ({ ...prev, active: next }))} /> Active</label>
                  <label><Checkbox checked={marketForm.isDefault} onChange={(next) => setMarketForm((prev) => ({ ...prev, isDefault: next }))} /> Default</label>
                  <Button label="Save Market" onClick={() => sdk.upsertMarket({ siteId, ...marketForm }).then(async () => { await refresh(); await refreshContext(); toast({ severity: 'success', summary: 'Market saved' }); })} />
                </div>
              </TabItem>
              <TabItem header="Locales">
                <DataGrid
                  data={locales}
                  rowKey="code"
                  columns={[
                    { key: 'code', header: 'Code' },
                    { key: 'name', header: 'Display Name' },
                    { key: 'fallbackLocaleCode', header: 'Fallback' },
                    { key: 'active', header: 'Active', cell: (row) => (row.active ? 'Yes' : 'No') },
                    { key: 'isDefault', header: 'Default', cell: (row) => (row.isDefault ? 'Yes' : 'No') },
                    {
                      key: '__edit',
                      header: 'Edit',
                      cell: (row) => (
                        <Button
                          text
                          label="Edit"
                          onClick={() => {
                            setLocaleForm(row);
                            setLocaleOverrideName(row.name);
                            setLocaleOverrideFallback(row.fallbackLocaleCode ?? null);
                          }}
                        />
                      )
                    }
                  ]}
                />
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
                  <TextInput value={localeOverrideName} onChange={(next) => setLocaleOverrideName(next)} placeholder="Display name override" />
                  <Select
                    value={localeOverrideFallback ?? ''}
                    options={localeOptions}
                    onChange={(next) => setLocaleOverrideFallback(next || null)}
                    filter
                    placeholder="Fallback locale override"
                  />
                  <label><Checkbox checked={localeForm.active} onChange={(next) => setLocaleForm((prev) => ({ ...prev, active: next }))} /> Active</label>
                  <label><Checkbox checked={localeForm.isDefault} onChange={(next) => setLocaleForm((prev) => ({ ...prev, isDefault: next }))} /> Default</label>
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
              </TabItem>
              <TabItem header="Matrix">
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
                                  onChange={(next) =>
                                    setCombos((prev) => {
                                      const index = prev.findIndex((entry) => entry.marketCode === market.code && entry.localeCode === locale.code);
                                      if (index >= 0) {
                                        const arr = [...prev];
                                        const current = arr[index];
                                        if (current) {
                                          arr[index] = { ...current, active: next };
                                        }
                                        return arr;
                                      }
                                      return [...prev, { marketCode: market.code, localeCode: locale.code, active: next, isDefaultForMarket: false }];
                                    })
                                  }
                                />
                              </td>
                            );
                          })}
                          <td>
                            <Select
                              value={marketDefaults[market.code] ?? ''}
                              options={locales
                                .filter((locale) => combos.some((entry) => entry.marketCode === market.code && entry.localeCode === locale.code && entry.active))
                                .map((entry) => ({ label: entry.code, value: entry.code }))}
                              onChange={(next) => next !== undefined && setMarketDefaults((prev) => ({ ...prev, [market.code]: next }))}
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
                  <Select value={defaultMarketCode} options={markets.filter((entry) => entry.active).map((entry) => ({ label: entry.code, value: entry.code }))} onChange={(next) => next !== undefined && setDefaultMarketCode(next)} filter placeholder="Default market" />
                  <Select value={defaultLocaleCode} options={locales.filter((entry) => entry.active).map((entry) => ({ label: entry.code, value: entry.code }))} onChange={(next) => next !== undefined && setDefaultLocaleCode(next)} filter placeholder="Default locale" />
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
              </TabItem>
            </Tabs>
          </PaneScroll>
        </PaneRoot>
      </WorkspaceBody>
    </WorkspacePage>
  );
}
