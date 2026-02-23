import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { AssetPickerDialog } from '../../../components/inputs/AssetPickerDialog';
import { createAdminSdk } from '../../../lib/sdk';
function AssetPreview({ id }) {
    const base = import.meta.env.VITE_API_URL?.replace('/graphql', '') ?? 'http://localhost:4000';
    return (_jsx("img", { src: `${base}/assets/${id}/rendition/thumb`, alt: "asset", style: { width: 56, height: 40, objectFit: 'cover', borderRadius: 6 } }));
}
export function AssetRefEditor({ token, siteId, value, onChange }) {
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [asset, setAsset] = useState(null);
    const load = async (id) => {
        if (!id) {
            setAsset(null);
            return;
        }
        const res = await sdk.getAsset({ id });
        setAsset(res.getAsset ?? null);
    };
    return (_jsxs("div", { className: "form-row", children: [_jsxs("div", { className: "inline-actions", children: [_jsx(Button, { label: "Select asset", onClick: () => setPickerOpen(true) }), _jsx(Button, { text: true, label: "Clear", onClick: () => {
                            onChange(null);
                            setAsset(null);
                        }, disabled: !value })] }), value ? (_jsxs("div", { className: "inline-actions", children: [_jsx(AssetPreview, { id: value }), _jsx("small", { children: asset?.title ?? asset?.originalName ?? `Asset #${value}` })] })) : (_jsx("small", { className: "muted", children: "No asset selected" })), _jsx(AssetPickerDialog, { visible: pickerOpen, token: token, siteId: siteId, selected: value ? [value] : [], onHide: () => setPickerOpen(false), onApply: (assetIds) => {
                    const next = assetIds[0] ?? null;
                    onChange(next);
                    load(next).catch(() => undefined);
                } })] }));
}
export function AssetListEditor({ token, siteId, value, onChange }) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const move = (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= value.length) {
            return;
        }
        const next = [...value];
        const [current] = next.splice(index, 1);
        if (!current) {
            return;
        }
        next.splice(target, 0, current);
        onChange(next);
    };
    return (_jsxs("div", { className: "form-row", children: [_jsx("div", { className: "inline-actions", children: _jsx(Button, { label: "Add assets", onClick: () => setPickerOpen(true) }) }), _jsxs(DataTable, { value: value.map((id) => ({ id })), size: "small", children: [_jsx(Column, { header: "Preview", body: (row) => _jsx(AssetPreview, { id: row.id }) }), _jsx(Column, { field: "id", header: "Asset ID" }), _jsx(Column, { header: "Order", body: (row, options) => (_jsxs("div", { className: "inline-actions", children: [_jsx(Button, { text: true, icon: "pi pi-angle-up", onClick: () => move(options.rowIndex, -1) }), _jsx(Button, { text: true, icon: "pi pi-angle-down", onClick: () => move(options.rowIndex, 1) })] })) }), _jsx(Column, { header: "Actions", body: (row) => (_jsx(Button, { text: true, severity: "danger", label: "Remove", onClick: () => onChange(value.filter((id) => id !== row.id)) })) })] }), _jsx(AssetPickerDialog, { visible: pickerOpen, token: token, siteId: siteId, multiple: true, selected: value, onHide: () => setPickerOpen(false), onApply: (assetIds) => onChange(assetIds) })] }));
}
