import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
export function ContentTypeList({ items, selectedId, onSelect, onCreate }) {
    const [search, setSearch] = useState('');
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) {
            return items;
        }
        return items.filter((entry) => entry.name.toLowerCase().includes(q) || String(entry.id).includes(q));
    }, [items, search]);
    const selected = items.find((entry) => entry.id === selectedId) ?? null;
    return (_jsxs("div", { className: "p-fluid", children: [_jsxs("div", { className: "table-toolbar", children: [_jsx(InputText, { value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Search types" }), _jsx(Button, { label: "Create", onClick: onCreate })] }), _jsxs(DataTable, { value: filtered, size: "small", selectionMode: "single", selection: selected, onSelectionChange: (event) => {
                    const next = event.value;
                    if (next) {
                        onSelect(next);
                    }
                }, children: [_jsx(Column, { field: "id", header: "ID", style: { width: '5rem' } }), _jsx(Column, { field: "name", header: "Name" })] })] }));
}
