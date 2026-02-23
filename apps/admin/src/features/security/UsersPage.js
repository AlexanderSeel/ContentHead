import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import { PageHeader } from '../../components/common/PageHeader';
import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
export function UsersPage() {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selected, setSelected] = useState(null);
    const [newUser, setNewUser] = useState({ username: '', displayName: '', password: '', active: true });
    const [resetPassword, setResetPassword] = useState('');
    const [status, setStatus] = useState('');
    const refresh = async () => {
        const [usersRes, rolesRes] = await Promise.all([sdk.listInternalUsers(), sdk.listInternalRoles()]);
        const nextUsers = (usersRes.listInternalUsers ?? []);
        setUsers(nextUsers);
        setRoles((rolesRes.listInternalRoles ?? []));
        setSelected((prev) => nextUsers.find((entry) => entry.id === prev?.id) ?? nextUsers[0] ?? null);
    };
    useEffect(() => {
        refresh().catch((error) => setStatus(String(error)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (_jsxs("div", { className: "pageRoot", children: [_jsx(PageHeader, { title: "Users", subtitle: "Internal provider users CRUD, roles, activation and password reset", helpTopicKey: "site_overview" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }, children: [_jsxs("section", { className: "content-card", children: [_jsx("h3", { children: "Create user" }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Username" }), _jsx(InputText, { value: newUser.username, onChange: (event) => setNewUser({ ...newUser, username: event.target.value }) }), _jsx("label", { children: "Display name" }), _jsx(InputText, { value: newUser.displayName, onChange: (event) => setNewUser({ ...newUser, displayName: event.target.value }) }), _jsx("label", { children: "Password" }), _jsx(Password, { value: newUser.password, onChange: (event) => setNewUser({ ...newUser, password: event.target.value }), feedback: false, toggleMask: true }), _jsxs("label", { children: [_jsx(Checkbox, { checked: newUser.active, onChange: (event) => setNewUser({ ...newUser, active: Boolean(event.checked) }) }), " Active"] }), _jsx(Button, { label: "Create", onClick: () => sdk
                                            .createInternalUser(newUser)
                                            .then(() => {
                                            setNewUser({ username: '', displayName: '', password: '', active: true });
                                            return refresh();
                                        })
                                            .catch((error) => setStatus(String(error))) })] }), _jsxs(DataTable, { value: users, size: "small", selectionMode: "single", selection: selected, onSelectionChange: (event) => setSelected(event.value ?? null), children: [_jsx(Column, { field: "username", header: "Username" }), _jsx(Column, { field: "displayName", header: "Display Name" }), _jsx(Column, { field: "active", header: "Active", body: (row) => (row.active ? 'Yes' : 'No') })] })] }), _jsx("section", { className: "content-card", children: !selected ? (_jsx("p", { className: "muted", children: "Select a user to edit." })) : (_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Display name" }), _jsx(InputText, { value: selected.displayName, onChange: (event) => setSelected({ ...selected, displayName: event.target.value }) }), _jsxs("label", { children: [_jsx(Checkbox, { checked: selected.active, onChange: (event) => setSelected({ ...selected, active: Boolean(event.checked) }) }), " Active"] }), _jsx("label", { children: "Roles" }), _jsx(MultiSelect, { value: selected.roleIds, options: roles.map((entry) => ({ label: entry.name, value: entry.id })), onChange: (event) => setSelected({ ...selected, roleIds: event.value }) }), _jsx("div", { className: "inline-actions", children: _jsx(Button, { label: "Save", onClick: () => sdk
                                            .updateInternalUser({ id: selected.id, displayName: selected.displayName, active: selected.active })
                                            .then(() => sdk.setUserRoles({ userId: selected.id, roleIds: selected.roleIds }))
                                            .then(() => refresh())
                                            .catch((error) => setStatus(String(error))) }) }), _jsx("label", { children: "Reset password" }), _jsx(Password, { value: resetPassword, onChange: (event) => setResetPassword(event.target.value), feedback: false, toggleMask: true }), _jsx(Button, { label: "Reset password", severity: "secondary", onClick: () => sdk
                                        .resetInternalUserPassword({ userId: selected.id, password: resetPassword })
                                        .then(() => setResetPassword(''))
                                        .catch((error) => setStatus(String(error))), disabled: resetPassword.length < 8 })] })) })] }), status ? _jsx("div", { className: "status-panel", children: _jsx("pre", { children: status }) }) : null] }));
}
