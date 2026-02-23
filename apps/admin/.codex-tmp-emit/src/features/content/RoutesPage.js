import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export function RoutesPage() {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const { siteId, combos } = useAdminContext();
    const [routes, setRoutes] = useState([]);
    const [draft, setDraft] = useState({ id: 0, contentItemId: 0, marketCode: 'US', localeCode: 'en-US', slug: '', isCanonical: true });
    const refresh = async () => {
        const routesRes = await sdk.listRoutes({ siteId, marketCode: null, localeCode: null });
        setRoutes((routesRes.listRoutes ?? []));
    };
    useEffect(() => {
        refresh().catch(() => undefined);
    }, [siteId]);
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Routes", subtitle: "Route bindings per market/locale" }), _jsxs("div", { className: "table-toolbar", children: [_jsx(InputText, { placeholder: "Search slug or item id" }), _jsx(Button, { label: "Refresh", onClick: () => refresh() })] }), _jsxs(DataTable, { value: routes, size: "small", children: [_jsx(Column, { field: "id", header: "ID" }), _jsx(Column, { field: "contentItemId", header: "Item" }), _jsx(Column, { field: "marketCode", header: "Market" }), _jsx(Column, { field: "localeCode", header: "Locale" }), _jsx(Column, { field: "slug", header: "Slug" }), _jsx(Column, { field: "isCanonical", header: "Canonical", body: (row) => (row.isCanonical ? 'Yes' : 'No') }), _jsx(Column, { header: "Edit", body: (row) => _jsx(Button, { text: true, label: "Edit", onClick: () => setDraft(row) }) })] }), _jsxs("div", { className: "form-grid", children: [_jsx(ContentReferencePicker, { token: token, siteId: siteId, value: draft.contentItemId || null, onChange: (value) => setDraft((prev) => ({ ...prev, contentItemId: value ?? 0 })) }), _jsx(MarketLocalePicker, { combos: combos, marketCode: draft.marketCode, localeCode: draft.localeCode, onChange: (value) => setDraft((prev) => ({ ...prev, ...value })) }), _jsx(SlugEditor, { value: draft.slug, onChange: (value) => setDraft((prev) => ({ ...prev, slug: value })) }), _jsxs("label", { children: [_jsx(Checkbox, { checked: draft.isCanonical, onChange: (e) => setDraft((prev) => ({ ...prev, isCanonical: Boolean(e.checked) })) }), " Canonical"] }), _jsx(Button, { label: "Save Route", onClick: () => sdk
                            .upsertRoute({
                            ...(draft.id ? { id: draft.id } : {}),
                            siteId,
                            contentItemId: draft.contentItemId,
                            marketCode: draft.marketCode,
                            localeCode: draft.localeCode,
                            slug: draft.slug,
                            isCanonical: draft.isCanonical
                        })
                            .then(() => refresh()) })] })] }));
}
