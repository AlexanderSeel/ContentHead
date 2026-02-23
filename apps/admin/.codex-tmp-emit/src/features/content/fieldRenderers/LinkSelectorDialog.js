import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { TabPanel, TabView } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { createAdminSdk } from '../../../lib/sdk';
export function LinkSelectorDialog({ visible, token, siteId, value, onHide, onApply }) {
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const [query, setQuery] = useState('');
    const [routes, setRoutes] = useState([]);
    const [externalUrl, setExternalUrl] = useState(value?.url ?? 'https://');
    const [openInNewTab, setOpenInNewTab] = useState(value?.target === '_blank');
    useEffect(() => {
        if (!visible) {
            return;
        }
        sdk
            .listRoutes({ siteId, marketCode: null, localeCode: null })
            .then((res) => setRoutes((res.listRoutes ?? [])))
            .catch(() => setRoutes([]));
    }, [visible, sdk, siteId]);
    const filtered = useMemo(() => {
        const text = query.trim().toLowerCase();
        if (!text) {
            return routes.slice(0, 100);
        }
        return routes.filter((entry) => entry.slug.toLowerCase().includes(text) || String(entry.contentItemId).includes(text));
    }, [routes, query]);
    return (_jsx(Dialog, { header: "Select Link", visible: visible, onHide: onHide, style: { width: '48rem' }, children: _jsxs(TabView, { children: [_jsxs(TabPanel, { header: "Internal", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Find route" }), _jsx(InputText, { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "slug or content item id" })] }), _jsxs(DataTable, { value: filtered, size: "small", children: [_jsx(Column, { field: "contentItemId", header: "Item" }), _jsx(Column, { field: "slug", header: "Slug" }), _jsx(Column, { field: "marketCode", header: "Market" }), _jsx(Column, { field: "localeCode", header: "Locale" }), _jsx(Column, { header: "Select", body: (row) => (_jsx(Button, { text: true, label: "Use", onClick: () => {
                                            onApply({ kind: 'internal', contentItemId: row.contentItemId, url: `/${row.slug}`, target: '_self' });
                                            onHide();
                                        } })) })] })] }), _jsxs(TabPanel, { header: "External", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "URL" }), _jsx(InputText, { value: externalUrl, onChange: (event) => setExternalUrl(event.target.value), placeholder: "https://example.com" }), !/^https?:\/\//i.test(externalUrl) ? _jsx("small", { className: "error-text", children: "Use http:// or https://" }) : null] }), _jsxs("label", { children: [_jsx(Checkbox, { checked: openInNewTab, onChange: (event) => setOpenInNewTab(Boolean(event.checked)) }), " Open in new tab"] }), _jsx("div", { className: "inline-actions", style: { marginTop: '0.75rem' }, children: _jsx(Button, { label: "Apply", onClick: () => {
                                    if (!/^https?:\/\//i.test(externalUrl)) {
                                        return;
                                    }
                                    onApply({ kind: 'external', url: externalUrl, target: openInNewTab ? '_blank' : '_self' });
                                    onHide();
                                } }) })] })] }) }));
}
