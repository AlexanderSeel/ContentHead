import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
export function MarketsLocalesPage() {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const { siteId, refreshContext } = useAdminContext();
    const [markets, setMarkets] = useState([]);
    const [locales, setLocales] = useState([]);
    const [combos, setCombos] = useState([]);
    const [defaultMarketCode, setDefaultMarketCode] = useState('');
    const [defaultLocaleCode, setDefaultLocaleCode] = useState('');
    const [marketDefaults, setMarketDefaults] = useState({});
    const [marketForm, setMarketForm] = useState({ code: '', name: '', currency: '', timezone: '', active: true, isDefault: false });
    const [localeForm, setLocaleForm] = useState({ code: '', name: '', active: true, fallbackLocaleCode: null, isDefault: false });
    const refresh = async () => {
        const matrix = await sdk.getSiteMarketLocaleMatrix({ siteId });
        const payload = matrix.getSiteMarketLocaleMatrix;
        const nextMarkets = (payload?.markets ?? []);
        const nextLocales = (payload?.locales ?? []);
        const nextCombos = (payload?.combinations ?? []);
        setMarkets(nextMarkets);
        setLocales(nextLocales);
        setCombos(nextCombos);
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
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Markets & Locales", subtitle: "Site matrix and defaults", actions: _jsx(Button, { label: "Refresh", onClick: () => refresh().catch(() => undefined) }) }), _jsxs(TabView, { children: [_jsxs(TabPanel, { header: "Markets", children: [_jsxs(DataTable, { value: markets, size: "small", children: [_jsx(Column, { field: "code", header: "Code" }), _jsx(Column, { field: "name", header: "Name" }), _jsx(Column, { field: "currency", header: "Currency" }), _jsx(Column, { field: "timezone", header: "Timezone" }), _jsx(Column, { field: "active", header: "Active", body: (row) => (row.active ? 'Yes' : 'No') }), _jsx(Column, { field: "isDefault", header: "Default", body: (row) => (row.isDefault ? 'Yes' : 'No') }), _jsx(Column, { header: "Edit", body: (row) => _jsx(Button, { text: true, label: "Edit", onClick: () => setMarketForm(row) }) })] }), _jsxs("div", { className: "form-grid", children: [_jsx(InputText, { value: marketForm.code, onChange: (e) => setMarketForm((prev) => ({ ...prev, code: e.target.value })), placeholder: "Code" }), _jsx(InputText, { value: marketForm.name, onChange: (e) => setMarketForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "Name" }), _jsx(InputText, { value: marketForm.currency ?? '', onChange: (e) => setMarketForm((prev) => ({ ...prev, currency: e.target.value })), placeholder: "Currency" }), _jsx(InputText, { value: marketForm.timezone ?? '', onChange: (e) => setMarketForm((prev) => ({ ...prev, timezone: e.target.value })), placeholder: "Timezone" }), _jsxs("label", { children: [_jsx(Checkbox, { checked: marketForm.active, onChange: (e) => setMarketForm((prev) => ({ ...prev, active: Boolean(e.checked) })) }), " Active"] }), _jsxs("label", { children: [_jsx(Checkbox, { checked: marketForm.isDefault, onChange: (e) => setMarketForm((prev) => ({ ...prev, isDefault: Boolean(e.checked) })) }), " Default"] }), _jsx(Button, { label: "Save Market", onClick: () => sdk
                                            .upsertMarket({ siteId, ...marketForm })
                                            .then(async () => {
                                            await refresh();
                                            await refreshContext();
                                        }) })] })] }), _jsxs(TabPanel, { header: "Locales", children: [_jsxs(DataTable, { value: locales, size: "small", children: [_jsx(Column, { field: "code", header: "Code" }), _jsx(Column, { field: "name", header: "Name" }), _jsx(Column, { field: "fallbackLocaleCode", header: "Fallback" }), _jsx(Column, { field: "active", header: "Active", body: (row) => (row.active ? 'Yes' : 'No') }), _jsx(Column, { field: "isDefault", header: "Default", body: (row) => (row.isDefault ? 'Yes' : 'No') }), _jsx(Column, { header: "Edit", body: (row) => _jsx(Button, { text: true, label: "Edit", onClick: () => setLocaleForm(row) }) })] }), _jsxs("div", { className: "form-grid", children: [_jsx(InputText, { value: localeForm.code, onChange: (e) => setLocaleForm((prev) => ({ ...prev, code: e.target.value })), placeholder: "Code" }), _jsx(InputText, { value: localeForm.name, onChange: (e) => setLocaleForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "Name" }), _jsx(Dropdown, { value: localeForm.fallbackLocaleCode, options: localeOptions, onChange: (e) => setLocaleForm((prev) => ({ ...prev, fallbackLocaleCode: e.value ?? null })), showClear: true, placeholder: "Fallback locale" }), _jsxs("label", { children: [_jsx(Checkbox, { checked: localeForm.active, onChange: (e) => setLocaleForm((prev) => ({ ...prev, active: Boolean(e.checked) })) }), " Active"] }), _jsxs("label", { children: [_jsx(Checkbox, { checked: localeForm.isDefault, onChange: (e) => setLocaleForm((prev) => ({ ...prev, isDefault: Boolean(e.checked) })) }), " Default"] }), _jsx(Button, { label: "Save Locale", onClick: () => sdk
                                            .upsertLocale({ siteId, ...localeForm })
                                            .then(async () => {
                                            await refresh();
                                            await refreshContext();
                                        }) })] })] }), _jsxs(TabPanel, { header: "Matrix", children: [_jsx("div", { className: "matrix-wrap", children: _jsxs("table", { className: "matrix-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Market \\\\ Locale" }), locales.map((locale) => (_jsx("th", { children: locale.code }, locale.code))), _jsx("th", { children: "Default Locale / Market" })] }) }), _jsx("tbody", { children: markets.map((market) => (_jsxs("tr", { children: [_jsx("td", { children: market.code }), locales.map((locale) => {
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
                                                                .map((entry) => ({ label: entry.code, value: entry.code })), onChange: (event) => setMarketDefaults((prev) => ({
                                                                ...prev,
                                                                [market.code]: event.value
                                                            })), placeholder: "Default locale" }) })] }, market.code))) })] }) }), _jsxs("div", { className: "form-grid", children: [_jsx(Dropdown, { value: defaultMarketCode, options: markets.filter((entry) => entry.active).map((entry) => ({ label: entry.code, value: entry.code })), onChange: (event) => setDefaultMarketCode(String(event.value)), placeholder: "Default market" }), _jsx(Dropdown, { value: defaultLocaleCode, options: locales.filter((entry) => entry.active).map((entry) => ({ label: entry.code, value: entry.code })), onChange: (event) => setDefaultLocaleCode(String(event.value)), placeholder: "Default locale" }), _jsx(Button, { label: "Save Matrix", onClick: async () => {
                                            await sdk.setSiteMarkets({
                                                siteId,
                                                defaultMarketCode,
                                                markets: markets.map((entry) => ({ code: entry.code, active: entry.active }))
                                            });
                                            await sdk.setSiteLocales({
                                                siteId,
                                                defaultLocaleCode,
                                                locales: locales.map((entry) => ({ code: entry.code, active: entry.active }))
                                            });
                                            await sdk.setSiteMarketLocaleMatrix({
                                                siteId,
                                                combinations: combos.map((entry) => ({
                                                    marketCode: entry.marketCode,
                                                    localeCode: entry.localeCode,
                                                    active: entry.active,
                                                    isDefaultForMarket: marketDefaults[entry.marketCode] === entry.localeCode
                                                })),
                                                defaults: {
                                                    marketDefaultLocales: Object.entries(marketDefaults).map(([marketCode, localeCode]) => ({ marketCode, localeCode }))
                                                }
                                            });
                                            await refresh();
                                            await refreshContext();
                                        } })] })] })] })] }));
}
