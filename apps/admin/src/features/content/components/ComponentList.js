import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
export function ComponentList({ areas, selected, onSelect, onMove, onDelete }) {
    const rows = areas.flatMap((area) => area.components.map((id, index) => ({ id, area: area.name, index })));
    return (_jsxs(DataTable, { value: rows, size: "small", selectionMode: "single", selection: rows.find((row) => row.id === selected) ?? null, onSelectionChange: (event) => {
            const row = event.value;
            if (row) {
                onSelect(row.id);
            }
        }, children: [_jsx(Column, { field: "id", header: "ID" }), _jsx(Column, { field: "area", header: "Area" }), _jsx(Column, { header: "Order", body: (row) => (_jsxs("div", { className: "inline-actions", children: [_jsx(Button, { text: true, icon: "pi pi-angle-up", onClick: () => onMove(row.id, -1) }), _jsx(Button, { text: true, icon: "pi pi-angle-down", onClick: () => onMove(row.id, 1) })] })) }), _jsx(Column, { header: "Delete", body: (row) => _jsx(Button, { text: true, severity: "danger", icon: "pi pi-trash", onClick: () => onDelete(row.id) }) })] }));
}
