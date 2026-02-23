import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { useAdminContext } from '../../app/AdminContext';
import { useAuth } from '../../app/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { createAdminSdk } from '../../lib/sdk';
import { ContentTypeList } from './ContentTypeList';
import { FieldInspector } from './FieldInspector';
import { FieldList } from './FieldList';
import { FieldPreview } from './FieldPreview';
import { CONTENT_FIELD_TYPES, ensureUniqueFieldKey, parseFieldsJson, stringifyFieldsJson, suggestFieldKey } from './fieldValidationUi';
export function ContentTypesPage() {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const { siteId } = useAdminContext();
    const [types, setTypes] = useState([]);
    const [selected, setSelected] = useState(null);
    const [fields, setFields] = useState([]);
    const [selectedFieldKey, setSelectedFieldKey] = useState(null);
    const [showAddField, setShowAddField] = useState(false);
    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [newFieldKey, setNewFieldKey] = useState('');
    const [newFieldType, setNewFieldType] = useState('text');
    const [newFieldRequired, setNewFieldRequired] = useState(false);
    const refresh = async () => {
        const result = await sdk.listContentTypes({ siteId });
        const all = (result.listContentTypes ?? []);
        setTypes(all);
        if (selected) {
            const nextSelected = all.find((entry) => entry.id === selected.id) ?? null;
            setSelected(nextSelected);
            setFields(parseFieldsJson(nextSelected?.fieldsJson ?? '[]'));
        }
    };
    useEffect(() => {
        refresh().catch(() => undefined);
    }, [siteId]);
    const selectedField = fields.find((entry) => entry.key === selectedFieldKey) ?? null;
    const createType = () => {
        const draft = { id: 0, name: '', description: '', fieldsJson: '[]' };
        setSelected(draft);
        setFields([]);
        setSelectedFieldKey(null);
    };
    const duplicateField = (key) => {
        const source = fields.find((entry) => entry.key === key);
        if (!source) {
            return;
        }
        const nextKey = ensureUniqueFieldKey(`${source.key}_copy`, fields);
        const next = { ...source, key: nextKey, label: `${source.label} Copy` };
        setFields((prev) => [...prev, next]);
        setSelectedFieldKey(nextKey);
    };
    const removeField = (key) => {
        setFields((prev) => prev.filter((entry) => entry.key !== key));
        if (selectedFieldKey === key) {
            setSelectedFieldKey(null);
        }
    };
    const saveType = async () => {
        if (!selected) {
            return;
        }
        const payload = {
            name: selected.name,
            description: selected.description || null,
            fieldsJson: stringifyFieldsJson(fields),
            by: 'admin'
        };
        if (selected.id) {
            await sdk.updateContentType({ id: selected.id, ...payload });
        }
        else {
            await sdk.createContentType({ siteId, ...payload });
        }
        await refresh();
    };
    const addField = () => {
        const key = ensureUniqueFieldKey(newFieldKey || newFieldLabel, fields);
        const next = {
            key,
            label: newFieldLabel || key,
            type: newFieldType,
            required: newFieldRequired,
            validations: {},
            uiConfig: {}
        };
        setFields((prev) => [...prev, next]);
        setSelectedFieldKey(key);
        setShowAddField(false);
        setNewFieldLabel('');
        setNewFieldKey('');
        setNewFieldType('text');
        setNewFieldRequired(false);
    };
    return (_jsxs("div", { className: "pageRoot", children: [_jsx(PageHeader, { title: "Content Types", subtitle: "Visual schema builder with field inspector and preview", helpTopicKey: "content_types", askAiContext: "types", askAiPayload: { siteId, selectedType: selected, fields }, onAskAiInsert: (value) => {
                    setSelected((prev) => (prev ? { ...prev, description: `${prev.description ?? ''}\n${value}`.trim() } : prev));
                }, actions: _jsxs("div", { className: "inline-actions", children: [_jsx(Button, { label: "New Type", onClick: createType }), _jsx(Button, { label: "Save Type", severity: "success", onClick: () => saveType().catch(() => undefined), disabled: !selected })] }) }), _jsxs("div", { className: "form-builder-layout", children: [_jsx("section", { className: "content-card", children: _jsx(ContentTypeList, { items: types, selectedId: selected?.id ?? null, onCreate: createType, onSelect: (item) => {
                                setSelected(item);
                                const parsed = parseFieldsJson(item.fieldsJson);
                                setFields(parsed);
                                setSelectedFieldKey(parsed[0]?.key ?? null);
                            } }) }), _jsx("section", { className: "content-card", children: !selected ? _jsx("p", { children: "Select a content type." }) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Name" }), _jsx(InputText, { value: selected.name, onChange: (event) => setSelected((prev) => (prev ? { ...prev, name: event.target.value } : prev)) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Description" }), _jsx(InputText, { value: selected.description ?? '', onChange: (event) => setSelected((prev) => (prev ? { ...prev, description: event.target.value } : prev)) })] }), _jsx("div", { className: "inline-actions", style: { alignSelf: 'end' }, children: _jsx(Button, { label: "Add Field", onClick: () => setShowAddField(true) }) })] }), _jsx(FieldList, { fields: fields, selectedKey: selectedFieldKey, onSelect: setSelectedFieldKey, onReorder: setFields, onDuplicate: duplicateField, onDelete: removeField, onRequired: (key, required) => setFields((prev) => prev.map((entry) => (entry.key === key ? { ...entry, required } : entry))) })] })) }), _jsxs("section", { className: "content-card", children: [_jsx(FieldInspector, { selected: selectedField, fields: fields, onChange: setFields }), _jsxs("div", { className: "form-row", style: { marginTop: '0.75rem' }, children: [_jsx("label", { children: "Preview" }), _jsx(FieldPreview, { field: selectedField })] })] })] }), _jsxs(Dialog, { header: "Add Field", visible: showAddField, onHide: () => setShowAddField(false), style: { width: '32rem' }, children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Label" }), _jsx(InputText, { value: newFieldLabel, onChange: (event) => {
                                    const value = event.target.value;
                                    setNewFieldLabel(value);
                                    if (!newFieldKey) {
                                        setNewFieldKey(suggestFieldKey(value));
                                    }
                                } })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Key" }), _jsx(InputText, { value: newFieldKey, onChange: (event) => setNewFieldKey(suggestFieldKey(event.target.value)) }), fields.some((entry) => entry.key === newFieldKey) ? _jsx("small", { className: "error-text", children: "Key already exists" }) : null] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Type" }), _jsx(Dropdown, { value: newFieldType, options: CONTENT_FIELD_TYPES, onChange: (event) => setNewFieldType(event.value) })] }), _jsxs("label", { children: [_jsx(Checkbox, { checked: newFieldRequired, onChange: (event) => setNewFieldRequired(Boolean(event.checked)) }), " Required"] }), _jsxs("div", { className: "inline-actions", style: { marginTop: '0.75rem' }, children: [_jsx(Button, { label: "Cancel", text: true, onClick: () => setShowAddField(false) }), _jsx(Button, { label: "Add", onClick: addField, disabled: !newFieldLabel.trim() || fields.some((entry) => entry.key === newFieldKey) })] })] })] }));
}
