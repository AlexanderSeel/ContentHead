import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { PageHeader } from '../../components/common/PageHeader';
import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
export function RolesPage() {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const [roles, setRoles] = useState([]);
    const [selected, setSelected] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [status, setStatus] = useState('');
    const refresh = async () => {
        const [rolesRes, permsRes] = await Promise.all([sdk.listInternalRoles(), sdk.internalPermissions()]);
        const nextRoles = (rolesRes.listInternalRoles ?? []);
        setRoles(nextRoles);
        setPermissions((permsRes.internalPermissions ?? []));
        setSelected((prev) => nextRoles.find((entry) => entry.id === prev?.id) ?? nextRoles[0] ?? null);
    };
    useEffect(() => {
        refresh().catch((error) => setStatus(String(error)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (_jsxs("div", { className: "pageRoot", children: [_jsx(PageHeader, { title: "Roles", subtitle: "Internal RBAC roles and permissions", helpTopicKey: "site_overview" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }, children: [_jsxs("section", { className: "content-card", children: [_jsx("div", { className: "inline-actions", style: { marginBottom: '0.5rem' }, children: _jsx(Button, { label: "New Role", onClick: () => setSelected({ id: 0, name: '', description: '', permissions: ['CONTENT_READ', 'CONTENT_WRITE'] }) }) }), _jsxs(DataTable, { value: roles, size: "small", selectionMode: "single", selection: selected, onSelectionChange: (event) => setSelected(event.value ?? null), children: [_jsx(Column, { field: "name", header: "Role" }), _jsx(Column, { field: "permissions", header: "Permissions", body: (row) => row.permissions.join(', ') })] })] }), _jsx("section", { className: "content-card", children: !selected ? (_jsx("p", { className: "muted", children: "Select a role." })) : (_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Name" }), _jsx(InputText, { value: selected.name, onChange: (event) => setSelected({ ...selected, name: event.target.value }) }), _jsx("label", { children: "Description" }), _jsx(InputTextarea, { rows: 3, value: selected.description ?? '', onChange: (event) => setSelected({ ...selected, description: event.target.value }) }), _jsx("label", { children: "Permissions" }), _jsx(MultiSelect, { value: selected.permissions, options: permissions.map((entry) => ({ label: entry, value: entry })), onChange: (event) => setSelected({ ...selected, permissions: event.value }), display: "chip" }), _jsxs("div", { className: "inline-actions", children: [_jsx(Button, { label: "Save", onClick: () => sdk
                                                .upsertInternalRole({
                                                id: selected.id || null,
                                                name: selected.name,
                                                description: selected.description ?? null,
                                                permissions: selected.permissions
                                            })
                                                .then(() => refresh())
                                                .catch((error) => setStatus(String(error))) }), _jsx(Button, { label: "Delete", severity: "danger", onClick: () => sdk
                                                .deleteInternalRole({ id: selected.id })
                                                .then(() => refresh())
                                                .catch((error) => setStatus(String(error))), disabled: !selected.id })] })] })) })] }), status ? _jsx("div", { className: "status-panel", children: _jsx("pre", { children: status }) }) : null] }));
}
