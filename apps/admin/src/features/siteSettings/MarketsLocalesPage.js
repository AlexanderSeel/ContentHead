import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { PageHeader } from '../../components/common/PageHeader';
import { useUi } from '../../app/UiContext';
export function MarketsLocalesPage() {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const { siteId, refreshContext } = useAdminContext();
    const { toast } = useUi();
    const [catalog, setCatalog] = useState([]);
    const [catalogSearch, setCatalogSearch] = useState('');
    const [markets, setMarkets] = useState([]);
    const [locales, setLocales] = useState([]);
    const [combos, setCombos] = useState([]);
    const [defaultMarketCode, setDefaultMarketCode] = useState('');
    const [defaultLocaleCode, setDefaultLocaleCode] = useState('');
    const [marketDefaults, setMarketDefaults] = useState({});
    const [marketForm, setMarketForm] = useState({ code: '', name: '', currency: '', timezone: '', active: true, isDefault: false });
    const [localeForm, setLocaleForm] = useState({ code: '', name: '', active: true, fallbackLocaleCode: null, isDefault: false });
    const [localeOverrideName, setLocaleOverrideName] = useState('');
    const [localeOverrideFallback, setLocaleOverrideFallback] = useState(null);
    const refresh = async () => {
        const [matrix, localeCatalogRes] = await Promise.all([sdk.getSiteMarketLocaleMatrix({ siteId }), sdk.localeCatalog()]);
        const payload = matrix.getSiteMarketLocaleMatrix;
        const nextMarkets = (payload?.markets ?? []);
        const nextLocales = (payload?.locales ?? []);
        setCatalog((localeCatalogRes.localeCatalog ?? []));
        setMarkets(nextMarkets);
        setLocales(nextLocales);
        setCombos((payload?.combinations ?? []));
        setDefaultMarketCode(payload?.defaults?.defaultMarketCode ?? nextMarkets.find((entry) => entry.isDefault)?.code ?? '');
        setDefaultLocaleCode(payload?.defaults?.defaultLocaleCode ?? nextLocales.find((entry) => entry.isDefault)?.code ?? '');
        const byMarket = {};
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
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Markets & Locales", subtitle: "Catalog-driven locales, overrides, matrix defaults and URL-ready combinations.", actions: _jsx(Button, { label: "Refresh", onClick: () => refresh().catch(() => undefined) }) }), _jsxs(TabView, { children: [_jsxs(TabPanel, { header: "Markets", children: [_jsxs(DataTable, { value: markets, size: "small", children: [_jsx(Column, { field: "code", header: "Code" }), _jsx(Column, { field: "name", header: "Name" }), _jsx(Column, { field: "currency", header: "Currency" }), _jsx(Column, { field: "timezone", header: "Timezone" }), _jsx(Column, { field: "active", header: "Active", body: (row) => (row.active ? 'Yes' : 'No') }), _jsx(Column, { field: "isDefault", header: "Default", body: (row) => (row.isDefault ? 'Yes' : 'No') }), _jsx(Column, { header: "Edit", body: (row) => _jsx(Button, { text: true, label: "Edit", onClick: () => setMarketForm(row) }) })] }), _jsxs("div", { className: "form-grid", children: [_jsx(InputText, { value: marketForm.code, onChange: (e) => setMarketForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() })), placeholder: "Code" }), _jsx(InputText, { value: marketForm.name, onChange: (e) => setMarketForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "Name" }), _jsx(InputText, { value: marketForm.currency ?? '', onChange: (e) => setMarketForm((prev) => ({ ...prev, currency: e.target.value })), placeholder: "Currency" }), _jsx(InputText, { value: marketForm.timezone ?? '', onChange: (e) => setMarketForm((prev) => ({ ...prev, timezone: e.target.value })), placeholder: "Timezone" }), _jsxs("label", { children: [_jsx(Checkbox, { checked: marketForm.active, onChange: (e) => setMarketForm((prev) => ({ ...prev, active: Boolean(e.checked) })) }), " Active"] }), _jsxs("label", { children: [_jsx(Checkbox, { checked: marketForm.isDefault, onChange: (e) => setMarketForm((prev) => ({ ...prev, isDefault: Boolean(e.checked) })) }), " Default"] }), _jsx(Button, { label: "Save Market", onClick: () => sdk.upsertMarket({ siteId, ...marketForm }).then(async () => { await refresh(); await refreshContext(); toast({ severity: 'success', summary: 'Market saved' }); }) })] })] }), _jsxs(TabPanel, { header: "Locales", children: [_jsxs(DataTable, { value: locales, size: "small", children: [_jsx(Column, { field: "code", header: "Code" }), _jsx(Column, { field: "name", header: "Display Name" }), _jsx(Column, { field: "fallbackLocaleCode", header: "Fallback" }), _jsx(Column, { field: "active", header: "Active", body: (row) => (row.active ? 'Yes' : 'No') }), _jsx(Column, { field: "isDefault", header: "Default", body: (row) => (row.isDefault ? 'Yes' : 'No') }), _jsx(Column, { header: "Edit", body: (row) => (_jsx(Button, { text: true, label: "Edit", onClick: () => {
                                                setLocaleForm(row);
                                                setLocaleOverrideName(row.name);
                                                setLocaleOverrideFallback(row.fallbackLocaleCode ?? null);
                                            } })) })] }), _jsxs("div", { className: "form-grid", children: [_jsx(AutoComplete, { value: localeForm.code, suggestions: localeCatalogSuggestions, completeMethod: (event) => setCatalogSearch(event.query), field: "code", dropdown: true, itemTemplate: (item) => _jsxs("span", { children: [item.code, " - ", item.name] }), onChange: (event) => {
                                            const value = event.value;
                                            if (typeof value === 'string') {
                                                setLocaleForm((prev) => ({ ...prev, code: value }));
                                                return;
                                            }
                                            setLocaleForm((prev) => ({ ...prev, code: value.code, name: value.name }));
                                            setLocaleOverrideName(value.name);
                                        }, placeholder: "Locale from catalog" }), _jsx(InputText, { value: localeOverrideName, onChange: (e) => setLocaleOverrideName(e.target.value), placeholder: "Display name override" }), _jsx(Dropdown, { value: localeOverrideFallback, options: localeOptions, onChange: (e) => setLocaleOverrideFallback(e.value ?? null), showClear: true, filter: true, placeholder: "Fallback locale override" }), _jsxs("label", { children: [_jsx(Checkbox, { checked: localeForm.active, onChange: (e) => setLocaleForm((prev) => ({ ...prev, active: Boolean(e.checked) })) }), " Active"] }), _jsxs("label", { children: [_jsx(Checkbox, { checked: localeForm.isDefault, onChange: (e) => setLocaleForm((prev) => ({ ...prev, isDefault: Boolean(e.checked) })) }), " Default"] }), _jsx(Button, { label: "Save Locale", onClick: async () => {
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
                                        } })] })] }), _jsxs(TabPanel, { header: "Matrix", children: [matrixWarnings.length > 0 ? (_jsx("div", { className: "status-panel", children: matrixWarnings.map((warning) => (_jsx("div", { className: "editor-error", children: warning }, warning))) })) : null, _jsx("div", { className: "matrix-wrap", children: _jsxs("table", { className: "matrix-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Market \\\\ Locale" }), locales.map((locale) => (_jsx("th", { children: locale.code }, locale.code))), _jsx("th", { children: "Default Locale / Market" })] }) }), _jsx("tbody", { children: markets.map((market) => (_jsxs("tr", { children: [_jsx("td", { children: market.code }), locales.map((locale) => {
                                                        const item = combos.find((entry) => entry.marketCode === market.code && entry.localeCode === locale.code);
                                                        return (_jsx("td", { children: _jsx(Checkbox, { checked: Boolean(item?.active), onChange: (event) => setCombos((prev) => {
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
                                                                }) }) }, `${market.code}-${locale.code}`));
                                                    }), _jsx("td", { children: _jsx(Dropdown, { value: marketDefaults[market.code] ?? null, options: locales
                                                                .filter((locale) => combos.some((entry) => entry.marketCode === market.code && entry.localeCode === locale.code && entry.active))
                                                                .map((entry) => ({ label: entry.code, value: entry.code })), onChange: (event) => setMarketDefaults((prev) => ({ ...prev, [market.code]: event.value })), filter: true, placeholder: "Default locale" }) })] }, market.code))) })] }) }), _jsxs("div", { className: "form-grid", children: [_jsx(Dropdown, { value: defaultMarketCode, options: markets.filter((entry) => entry.active).map((entry) => ({ label: entry.code, value: entry.code })), onChange: (event) => setDefaultMarketCode(String(event.value)), filter: true, placeholder: "Default market" }), _jsx(Dropdown, { value: defaultLocaleCode, options: locales.filter((entry) => entry.active).map((entry) => ({ label: entry.code, value: entry.code })), onChange: (event) => setDefaultLocaleCode(String(event.value)), filter: true, placeholder: "Default locale" }), _jsx(Button, { label: "Save Matrix", onClick: async () => {
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
                                        } })] })] })] })] }));
}
