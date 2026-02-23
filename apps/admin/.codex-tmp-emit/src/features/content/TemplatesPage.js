import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
export function TemplatesPage() {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const { siteId } = useAdminContext();
    const [templates, setTemplates] = useState([]);
    const [draft, setDraft] = useState({ id: 0, name: 'Default Page', compositionJson: '{"areas":[{"name":"main","components":[]}]}', componentsJson: '{}', constraintsJson: '{"requiredFields":["title"]}' });
    const [status, setStatus] = useState('');
    const refresh = async () => {
        const list = await sdk.listTemplates({ siteId });
        setTemplates((list.listTemplates ?? []));
    };
    useEffect(() => {
        refresh().catch((error) => setStatus(String(error)));
    }, [siteId]);
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Templates", subtitle: "Template composition and constraints" }), _jsxs(DataTable, { value: templates, size: "small", children: [_jsx(Column, { field: "id", header: "ID" }), _jsx(Column, { field: "name", header: "Name" }), _jsx(Column, { header: "Edit", body: (row) => _jsx(Button, { text: true, label: "Edit", onClick: () => setDraft(row) }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Name" }), _jsx(InputText, { value: draft.name, onChange: (e) => setDraft((prev) => ({ ...prev, name: e.target.value })) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Composition JSON" }), _jsx(InputTextarea, { rows: 3, value: draft.compositionJson, onChange: (e) => setDraft((prev) => ({ ...prev, compositionJson: e.target.value })) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Components JSON" }), _jsx(InputTextarea, { rows: 3, value: draft.componentsJson, onChange: (e) => setDraft((prev) => ({ ...prev, componentsJson: e.target.value })) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Constraints JSON" }), _jsx(InputTextarea, { rows: 3, value: draft.constraintsJson, onChange: (e) => setDraft((prev) => ({ ...prev, constraintsJson: e.target.value })) })] }), _jsxs("div", { className: "inline-actions", children: [_jsx(Button, { label: "Save", onClick: () => (draft.id
                            ? sdk.updateTemplate({ id: draft.id, name: draft.name, compositionJson: draft.compositionJson, componentsJson: draft.componentsJson, constraintsJson: draft.constraintsJson })
                            : sdk.createTemplate({ siteId, name: draft.name, compositionJson: draft.compositionJson, componentsJson: draft.componentsJson, constraintsJson: draft.constraintsJson }))
                            .then(() => refresh())
                            .catch((error) => setStatus(String(error))) }), _jsx(Button, { label: "Reconcile", severity: "secondary", onClick: () => sdk.reconcileTemplate({ templateId: draft.id }).then((res) => setStatus(JSON.stringify(res.reconcileTemplate ?? {}, null, 2))).catch((error) => setStatus(String(error))), disabled: !draft.id })] }), status ? _jsx("pre", { children: status }) : null] }));
}
