import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { LinkSelectorDialog } from './LinkSelectorDialog';
export function ContentLinkEditor({ token, siteId, value, onChange }) {
    const [open, setOpen] = useState(false);
    return (_jsxs("div", { className: "form-row", children: [_jsxs("div", { className: "inline-actions", children: [_jsx(Button, { label: "Select Link", onClick: () => setOpen(true) }), _jsx(Button, { text: true, label: "Clear", onClick: () => onChange(null), disabled: !value })] }), _jsx("small", { children: value ? `${value.kind}: ${value.url ?? `#${value.contentItemId ?? ''}`}` : 'No link selected' }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Link Text" }), _jsx(InputText, { value: value?.text ?? '', onChange: (event) => onChange({ ...(value ?? { kind: 'external' }), text: event.target.value }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Target" }), _jsx(Dropdown, { value: value?.target ?? '_self', options: [{ label: 'Same tab', value: '_self' }, { label: 'New tab', value: '_blank' }], onChange: (event) => onChange({ ...(value ?? { kind: 'external' }), target: event.value }) })] })] }), _jsx(LinkSelectorDialog, { visible: open, token: token, siteId: siteId, value: value, onHide: () => setOpen(false), onApply: onChange })] }));
}
export function ContentLinkListEditor({ token, siteId, value, onChange }) {
    const [editingIndex, setEditingIndex] = useState(null);
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
    return (_jsxs("div", { className: "form-row", children: [_jsx("div", { className: "inline-actions", children: _jsx(Button, { label: "Add Link", onClick: () => setEditingIndex(value.length) }) }), _jsxs(DataTable, { value: value, size: "small", children: [_jsx(Column, { field: "kind", header: "Kind" }), _jsx(Column, { field: "url", header: "URL", body: (row) => row.url ?? `#${row.contentItemId ?? ''}` }), _jsx(Column, { field: "text", header: "Text" }), _jsx(Column, { header: "Order", body: (_row, options) => (_jsxs("div", { className: "inline-actions", children: [_jsx(Button, { text: true, icon: "pi pi-angle-up", onClick: () => move(options.rowIndex, -1) }), _jsx(Button, { text: true, icon: "pi pi-angle-down", onClick: () => move(options.rowIndex, 1) })] })) }), _jsx(Column, { header: "Actions", body: (_row, options) => (_jsxs("div", { className: "inline-actions", children: [_jsx(Button, { text: true, label: "Edit", onClick: () => setEditingIndex(options.rowIndex) }), _jsx(Button, { text: true, severity: "danger", label: "Remove", onClick: () => onChange(value.filter((_, idx) => idx !== options.rowIndex)) })] })) })] }), _jsx(LinkSelectorDialog, { visible: editingIndex != null, token: token, siteId: siteId, value: editingIndex != null && editingIndex < value.length ? (value[editingIndex] ?? null) : null, onHide: () => setEditingIndex(null), onApply: (nextValue) => {
                    const next = [...value];
                    if (editingIndex == null) {
                        return;
                    }
                    if (editingIndex >= next.length) {
                        next.push(nextValue);
                    }
                    else {
                        next[editingIndex] = nextValue;
                    }
                    onChange(next);
                    setEditingIndex(null);
                } })] }));
}
