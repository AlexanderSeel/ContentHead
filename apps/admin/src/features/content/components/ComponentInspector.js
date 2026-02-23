import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useEffect, useMemo, useState } from 'react';
import { getComponentRegistryEntry, validateComponentProps } from './componentRegistry';
import { useAuth } from '../../../app/AuthContext';
import { createAdminSdk } from '../../../lib/sdk';
import { ContentLinkEditor, ContentLinkListEditor } from '../fieldRenderers/ContentLinkEditors';
import { AssetListEditor, AssetRefEditor } from '../fieldRenderers/AssetEditors';
export function ComponentInspector({ component, siteId, selectedFieldPath, onSelectFieldPath, onChange }) {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const [forms, setForms] = useState([]);
    useEffect(() => {
        sdk
            .listForms({ siteId })
            .then((res) => setForms((res.listForms ?? [])
            .filter((entry) => typeof entry.id === 'number' && typeof entry.name === 'string')
            .map((entry) => ({ id: entry.id, name: entry.name }))))
            .catch(() => setForms([]));
    }, [sdk, siteId]);
    if (!component) {
        return _jsx("p", { className: "muted", children: "Select a component to edit props." });
    }
    const entry = getComponentRegistryEntry(component.type);
    if (!entry) {
        return _jsxs("p", { className: "error-text", children: ["Unknown component type: ", component.type] });
    }
    const errors = validateComponentProps(component.type, component.props);
    return (_jsxs("div", { className: "p-fluid", children: [_jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: entry.label }), _jsx("div", { children: component.id })] }), entry.fields.map((field) => {
                const value = component.props[field.key];
                const fieldPath = `components.${component.id}.props.${field.key}`;
                const isSelected = selectedFieldPath === fieldPath;
                return (_jsxs("div", { className: `form-row ${isSelected ? 'cms-selected-editor-row' : ''}`, "data-editor-path": fieldPath, onClick: () => onSelectFieldPath?.(fieldPath), children: [_jsx("label", { children: field.label }), field.type === 'number' ? (_jsx(InputNumber, { value: typeof value === 'number' ? value : null, onValueChange: (event) => onChange({ ...component, props: { ...component.props, [field.key]: event.value ?? 0 } }) })) : field.type === 'select' ? (_jsx(Dropdown, { value: value ?? null, options: field.options ?? [], onChange: (event) => onChange({ ...component, props: { ...component.props, [field.key]: event.value } }) })) : field.type === 'boolean' ? (_jsx(Checkbox, { checked: Boolean(value), onChange: (event) => onChange({ ...component, props: { ...component.props, [field.key]: Boolean(event.checked) } }) })) : field.type === 'assetRef' ? (_jsx(AssetRefEditor, { token: token, siteId: siteId, value: typeof value === 'number' ? value : null, onChange: (next) => onChange({ ...component, props: { ...component.props, [field.key]: next } }) })) : field.type === 'assetList' ? (_jsx(AssetListEditor, { token: token, siteId: siteId, value: Array.isArray(value) ? value.filter((entry) => typeof entry === 'number') : [], onChange: (next) => onChange({ ...component, props: { ...component.props, [field.key]: next } }) })) : field.type === 'contentLink' ? (_jsx(ContentLinkEditor, { token: token, siteId: siteId, value: value ?? null, onChange: (next) => onChange({ ...component, props: { ...component.props, [field.key]: next } }) })) : field.type === 'contentLinkList' ? (_jsx(ContentLinkListEditor, { token: token, siteId: siteId, value: Array.isArray(value) ? value : [], onChange: (next) => onChange({ ...component, props: { ...component.props, [field.key]: next } }) })) : field.type === 'formRef' ? (_jsx(Dropdown, { value: typeof value === 'number' ? value : null, options: forms.map((entry) => ({ label: entry.name, value: entry.id })), onChange: (event) => onChange({ ...component, props: { ...component.props, [field.key]: event.value } }), placeholder: "Select form" })) : field.type === 'json' ? (_jsx(InputTextarea, { rows: 6, value: typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2), onChange: (event) => {
                                try {
                                    onChange({ ...component, props: { ...component.props, [field.key]: JSON.parse(event.target.value) } });
                                }
                                catch {
                                    onChange({ ...component, props: { ...component.props, [field.key]: event.target.value } });
                                }
                            } })) : field.type === 'multiline' ? (_jsx(InputTextarea, { rows: 4, value: String(value ?? ''), onChange: (event) => onChange({ ...component, props: { ...component.props, [field.key]: event.target.value } }) })) : (_jsx(InputText, { value: String(value ?? ''), onChange: (event) => onChange({ ...component, props: { ...component.props, [field.key]: event.target.value } }) }))] }, field.key));
            }), errors.length > 0 ? (_jsx("div", { className: "status-panel", children: errors.map((entryError) => _jsx("div", { className: "error-text", children: entryError }, entryError)) })) : null] }));
}
