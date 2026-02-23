import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
export function FieldList({ fields, selectedKey, onSelect, onReorder, onDuplicate, onDelete, onRequired }) {
    const selected = fields.find((entry) => entry.key === selectedKey) ?? null;
    return (_jsxs(DataTable, { value: fields, size: "small", reorderableRows: true, onRowReorder: (event) => onReorder(event.value), selectionMode: "single", selection: selected, onSelectionChange: (event) => {
            const row = event.value;
            if (row) {
                onSelect(row.key);
            }
        }, children: [_jsx(Column, { rowReorder: true, style: { width: '2.5rem' } }), _jsx(Column, { field: "key", header: "Key" }), _jsx(Column, { field: "label", header: "Label" }), _jsx(Column, { field: "type", header: "Type" }), _jsx(Column, { header: "Req", body: (row) => (_jsx(Checkbox, { checked: Boolean(row.required), onChange: (event) => onRequired(row.key, Boolean(event.checked)) })) }), _jsx(Column, { header: "Actions", body: (row) => (_jsxs("div", { className: "inline-actions", children: [_jsx(Button, { text: true, icon: "pi pi-copy", onClick: () => onDuplicate(row.key) }), _jsx(Button, { text: true, severity: "danger", icon: "pi pi-trash", onClick: () => onDelete(row.key) })] })) })] }));
}
