import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
import { SplitView } from '../../components/common/SplitView';
const parse = (value, fallback) => {
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
};
export function ContentTypesPage() {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const { siteId } = useAdminContext();
    const [types, setTypes] = useState([]);
    const [selected, setSelected] = useState(null);
    const [fields, setFields] = useState([{ key: 'title', label: 'Title', type: 'text', required: true }]);
    const refresh = async () => {
        const result = await sdk.listContentTypes({ siteId });
        setTypes((result.listContentTypes ?? []));
    };
    useEffect(() => {
        refresh().catch(() => undefined);
    }, [siteId]);
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Content Types", subtitle: "Type builder and field model", actions: _jsx(Button, { label: "Add Type", onClick: () => { setSelected({ id: 0, name: '', description: '', fieldsJson: '[]' }); setFields([{ key: 'title', label: 'Title', type: 'text', required: true }]); } }) }), _jsx(SplitView, { left: _jsxs(DataTable, { value: types, size: "small", selectionMode: "single", onSelectionChange: (event) => {
                        const next = event.value;
                        setSelected(next);
                        setFields(parse(next.fieldsJson, []));
                    }, children: [_jsx(Column, { field: "id", header: "ID" }), _jsx(Column, { field: "name", header: "Name" })] }), right: selected ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "form-grid", children: [_jsx(InputText, { value: selected.name, onChange: (e) => setSelected((prev) => (prev ? { ...prev, name: e.target.value } : prev)), placeholder: "Name" }), _jsx(InputText, { value: selected.description ?? '', onChange: (e) => setSelected((prev) => (prev ? { ...prev, description: e.target.value } : prev)), placeholder: "Description" }), _jsx(Button, { label: "Add Field", onClick: () => setFields((prev) => [...prev, { key: 'field', label: 'Field', type: 'text', required: false }]) })] }), _jsxs(DataTable, { value: fields, size: "small", reorderableRows: true, onRowReorder: (e) => setFields(e.value), children: [_jsx(Column, { rowReorder: true, style: { width: '3rem' } }), _jsx(Column, { header: "Key", body: (row, options) => _jsx(InputText, { value: row.key, onChange: (e) => setFields((prev) => prev.map((item, index) => (index === options.rowIndex ? { ...item, key: e.target.value } : item))) }) }), _jsx(Column, { header: "Label", body: (row, options) => _jsx(InputText, { value: row.label, onChange: (e) => setFields((prev) => prev.map((item, index) => (index === options.rowIndex ? { ...item, label: e.target.value } : item))) }) }), _jsx(Column, { header: "Type", body: (row, options) => _jsx(Dropdown, { value: row.type, options: [{ label: 'text', value: 'text' }, { label: 'richtext', value: 'richtext' }, { label: 'number', value: 'number' }, { label: 'boolean', value: 'boolean' }], onChange: (e) => setFields((prev) => prev.map((item, index) => (index === options.rowIndex ? { ...item, type: e.value } : item))) }) })] }), _jsx("div", { className: "inline-actions", children: _jsx(Button, { label: "Save Type", onClick: () => {
                                    const input = {
                                        name: selected.name,
                                        description: selected.description || null,
                                        fieldsJson: JSON.stringify(fields),
                                        by: 'admin'
                                    };
                                    (selected.id
                                        ? sdk.updateContentType({ id: selected.id, ...input })
                                        : sdk.createContentType({ siteId, ...input }))
                                        .then(() => refresh());
                                } }) }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Editor Preview" }), _jsx(InputTextarea, { rows: 6, value: JSON.stringify(fields, null, 2), readOnly: true })] })] })) : (_jsx("p", { children: "Select a content type." })) })] }));
}
