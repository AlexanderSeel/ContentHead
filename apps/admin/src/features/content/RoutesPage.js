import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export function RoutesPage() {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const { siteId, combos } = useAdminContext();
    const [routes, setRoutes] = useState([]);
    const [items, setItems] = useState([]);
    const [draft, setDraft] = useState({ id: 0, contentItemId: 0, marketCode: 'US', localeCode: 'en-US', slug: '', isCanonical: true });
    const activeComboOptions = combos.filter((entry) => entry.active).map((entry) => ({ label: `${entry.marketCode}/${entry.localeCode}`, value: `${entry.marketCode}::${entry.localeCode}` }));
    const refresh = async () => {
        const [routesRes, itemsRes] = await Promise.all([sdk.listRoutes({ siteId, marketCode: null, localeCode: null }), sdk.listContentItems({ siteId })]);
        setRoutes((routesRes.listRoutes ?? []));
        setItems((itemsRes.listContentItems ?? []));
    };
    useEffect(() => {
        refresh().catch(() => undefined);
    }, [siteId]);
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Routes", subtitle: "Route bindings per market/locale" }), _jsxs(DataTable, { value: routes, size: "small", children: [_jsx(Column, { field: "id", header: "ID" }), _jsx(Column, { field: "contentItemId", header: "Item" }), _jsx(Column, { field: "marketCode", header: "Market" }), _jsx(Column, { field: "localeCode", header: "Locale" }), _jsx(Column, { field: "slug", header: "Slug" }), _jsx(Column, { field: "isCanonical", header: "Canonical", body: (row) => (row.isCanonical ? 'Yes' : 'No') }), _jsx(Column, { header: "Edit", body: (row) => _jsx(Button, { text: true, label: "Edit", onClick: () => setDraft(row) }) })] }), _jsxs("div", { className: "form-grid", children: [_jsx(Dropdown, { value: draft.contentItemId, options: items.map((entry) => ({ label: `#${entry.id}`, value: entry.id })), onChange: (e) => setDraft((prev) => ({ ...prev, contentItemId: Number(e.value) })), placeholder: "Item" }), _jsx(Dropdown, { value: `${draft.marketCode}::${draft.localeCode}`, options: activeComboOptions, onChange: (e) => {
                            const [marketCode, localeCode] = String(e.value).split('::');
                            setDraft((prev) => ({ ...prev, marketCode: marketCode ?? prev.marketCode, localeCode: localeCode ?? prev.localeCode }));
                        } }), _jsx(InputText, { value: draft.slug, onChange: (e) => setDraft((prev) => ({ ...prev, slug: e.target.value })), placeholder: "slug" }), _jsxs("label", { children: [_jsx(Checkbox, { checked: draft.isCanonical, onChange: (e) => setDraft((prev) => ({ ...prev, isCanonical: Boolean(e.checked) })) }), " Canonical"] }), _jsx(Button, { label: "Save Route", onClick: () => sdk.upsertRoute({ ...(draft.id ? { id: draft.id } : {}), siteId, contentItemId: draft.contentItemId, marketCode: draft.marketCode, localeCode: draft.localeCode, slug: draft.slug, isCanonical: draft.isCanonical }).then(() => refresh()) })] })] }));
}
