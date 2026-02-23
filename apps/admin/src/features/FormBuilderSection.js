import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Sidebar } from 'primereact/sidebar';
import { TabPanel, TabView } from 'primereact/tabview';
import { evaluateFieldConditions } from '@contenthead/shared';
import { RuleEditorDialog } from '../components/rules/RuleEditorDialog';
import { useAuth } from '../app/AuthContext';
import { createAdminSdk } from '../lib/sdk';
import { applyDesignerRows, buildDesignerRows, parseUiConfigJson, stringifyUiConfigJson } from './forms/layoutModel';
const FIELD_OPTIONS = [
    { label: 'Text', value: 'text' },
    { label: 'Textarea', value: 'textarea' },
    { label: 'Number', value: 'number' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Checkbox', value: 'checkbox' },
    { label: 'Radio', value: 'radio' },
    { label: 'Select', value: 'select' },
    { label: 'MultiSelect', value: 'multiselect' },
    { label: 'Date', value: 'date' },
    { label: 'Consent', value: 'consent' }
];
const LAYOUT_ELEMENT_OPTIONS = [
    { label: 'Section Header', value: 'section' },
    { label: 'Divider', value: 'divider' },
    { label: 'Help Text', value: 'help_text' },
    { label: 'Spacer', value: 'spacer' }
];
const COMPARATORS = [
    { label: 'Equals', value: 'eq' },
    { label: 'Not Equals', value: 'neq' },
    { label: 'In', value: 'in' },
    { label: 'Contains', value: 'contains' },
    { label: 'Greater Than', value: 'gt' },
    { label: 'Less Than', value: 'lt' },
    { label: 'Regex', value: 'regex' }
];
const EMPTY_CONTEXT = '{"country":"US","segments":["default"]}';
function parseJsonObject(value, fallback) {
    try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed;
        }
        return fallback;
    }
    catch {
        return fallback;
    }
}
function normalizeFieldType(value) {
    const all = [...FIELD_OPTIONS, ...LAYOUT_ELEMENT_OPTIONS].map((entry) => entry.value);
    return (all.includes(value) ? value : 'text');
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function safeSlug(input) {
    const token = input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return token || 'field';
}
function toComparatorRuleDraft(rule) {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
        return { field: 'country', op: 'eq', value: 'US' };
    }
    const op = rule.op;
    const field = rule.field;
    const value = rule.value;
    const isComparator = typeof op === 'string' && typeof field === 'string';
    if (!isComparator) {
        return { field: 'country', op: 'eq', value: 'US' };
    }
    return {
        field,
        op: COMPARATORS.some((entry) => entry.value === op) ? op : 'eq',
        value: typeof value === 'string' ? value : JSON.stringify(value ?? '')
    };
}
function toComparatorRule(draft) {
    return {
        field: draft.field,
        op: draft.op,
        value: draft.op === 'in'
            ? draft.value.split(',').map((entry) => entry.trim()).filter(Boolean)
            : draft.value
    };
}
function renderFieldInput(field, answers, onChange, disabled, required, errors) {
    const uiConfig = parseUiConfigJson(field.uiConfigJson);
    const placeholder = typeof uiConfig.placeholder === 'string' ? uiConfig.placeholder : '';
    const value = answers[field.key];
    if (field.fieldType === 'divider') {
        return _jsx("hr", {});
    }
    if (field.fieldType === 'section') {
        return _jsx("h4", { children: field.label });
    }
    if (field.fieldType === 'help_text') {
        return _jsx("small", { children: typeof uiConfig.helpText === 'string' ? uiConfig.helpText : field.label });
    }
    if (field.fieldType === 'spacer') {
        return _jsx("div", { style: { height: 18 } });
    }
    if (field.fieldType === 'checkbox' || field.fieldType === 'consent') {
        return (_jsxs("div", { children: [_jsxs("label", { children: [_jsx(Checkbox, { checked: Boolean(value), onChange: (event) => onChange(field.key, Boolean(event.checked)), disabled: disabled }), _jsxs("span", { style: { marginLeft: 8 }, children: [field.label, required ? ' *' : ''] })] }), errors[field.key] ? _jsx("small", { className: "error-text", children: errors[field.key] }) : null] }));
    }
    if (field.fieldType === 'textarea') {
        return (_jsxs("div", { className: "form-row", children: [_jsxs("label", { children: [field.label, required ? ' *' : ''] }), _jsx(InputTextarea, { rows: 3, value: String(value ?? ''), placeholder: placeholder, disabled: disabled, onChange: (event) => onChange(field.key, event.target.value) }), errors[field.key] ? _jsx("small", { className: "error-text", children: errors[field.key] }) : null] }));
    }
    return (_jsxs("div", { className: "form-row", children: [_jsxs("label", { children: [field.label, required ? ' *' : ''] }), _jsx(InputText, { value: String(value ?? ''), placeholder: placeholder, disabled: disabled, onChange: (event) => onChange(field.key, event.target.value) }), errors[field.key] ? _jsx("small", { className: "error-text", children: errors[field.key] }) : null] }));
}
export function FormBuilderSection({ siteId, initialFormId, onStatus }) {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const [forms, setForms] = useState([]);
    const [steps, setSteps] = useState([]);
    const [fields, setFields] = useState([]);
    const [formId, setFormId] = useState(initialFormId ?? null);
    const [formName, setFormName] = useState('Lead Form');
    const [formDescription, setFormDescription] = useState('Basic lead form');
    const [formActive, setFormActive] = useState(true);
    const [stepName, setStepName] = useState('Step 1');
    const [selectedStepId, setSelectedStepId] = useState(null);
    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [builderTab, setBuilderTab] = useState(0);
    const [inspectorTab, setInspectorTab] = useState(0);
    const [dirtyFieldIds, setDirtyFieldIds] = useState(new Set());
    const [dirtyStepIds, setDirtyStepIds] = useState(new Set());
    const [formDirty, setFormDirty] = useState(false);
    const [evaluateConditions, setEvaluateConditions] = useState(true);
    const [previewContextJson, setPreviewContextJson] = useState(EMPTY_CONTEXT);
    const [previewAnswers, setPreviewAnswers] = useState({});
    const [showTestDrawer, setShowTestDrawer] = useState(false);
    const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
    const [ruleEditorTarget, setRuleEditorTarget] = useState('showIf');
    const refreshFormDetails = async (id) => {
        const [stepRes, fieldRes] = await Promise.all([sdk.listFormSteps({ formId: id }), sdk.listFormFields({ formId: id })]);
        const nextSteps = (stepRes.listFormSteps ?? []);
        const nextFields = (fieldRes.listFormFields ?? []);
        setSteps(nextSteps);
        setFields(nextFields);
        const nextStepId = nextSteps.some((step) => step.id === selectedStepId)
            ? selectedStepId
            : (nextSteps[0]?.id ?? null);
        setSelectedStepId(nextStepId);
        const scoped = nextFields.filter((field) => field.stepId === nextStepId);
        const nextFieldId = scoped.some((field) => field.id === selectedFieldId)
            ? selectedFieldId
            : (scoped[0]?.id ?? null);
        setSelectedFieldId(nextFieldId);
        setDirtyFieldIds(new Set());
        setDirtyStepIds(new Set());
        setFormDirty(false);
    };
    const refreshForms = async () => {
        const res = await sdk.listForms({ siteId });
        const next = (res.listForms ?? []);
        setForms(next);
        const selected = (initialFormId && next.some((entry) => entry.id === initialFormId))
            ? initialFormId
            : (formId && next.some((entry) => entry.id === formId) ? formId : (next[0]?.id ?? null));
        setFormId(selected);
        if (selected != null) {
            const form = next.find((entry) => entry.id === selected);
            setFormName(form?.name ?? '');
            setFormDescription(form?.description ?? '');
            setFormActive(Boolean(form?.active));
            await refreshFormDetails(selected);
        }
    };
    useEffect(() => {
        refreshForms().catch((error) => onStatus(String(error)));
    }, [siteId, token]);
    const scopedFields = useMemo(() => fields.filter((field) => field.stepId === selectedStepId), [fields, selectedStepId]);
    const selectedField = useMemo(() => scopedFields.find((field) => field.id === selectedFieldId) ?? null, [scopedFields, selectedFieldId]);
    const fieldKeyOptions = useMemo(() => fields.map((field) => ({ label: field.key, value: field.key })), [fields]);
    const layoutRows = useMemo(() => buildDesignerRows(scopedFields), [scopedFields]);
    const parsedConditions = useMemo(() => {
        return selectedField ? parseJsonObject(selectedField.conditionsJson, {}) : {};
    }, [selectedField]);
    const parsedValidations = useMemo(() => {
        return selectedField ? parseJsonObject(selectedField.validationsJson, {}) : {};
    }, [selectedField]);
    const parsedUiConfig = useMemo(() => {
        return selectedField ? parseUiConfigJson(selectedField.uiConfigJson) : parseUiConfigJson('{}');
    }, [selectedField]);
    const showIfDraft = useMemo(() => toComparatorRuleDraft(parsedConditions.showIf), [parsedConditions.showIf]);
    const requiredIfDraft = useMemo(() => toComparatorRuleDraft(parsedConditions.requiredIf), [parsedConditions.requiredIf]);
    const enabledIfDraft = useMemo(() => toComparatorRuleDraft(parsedConditions.enabledIf), [parsedConditions.enabledIf]);
    const computedPreview = useMemo(() => {
        const contextRaw = parseJsonObject(previewContextJson, {});
        const context = {
            userId: typeof contextRaw.userId === 'string' ? contextRaw.userId : null,
            sessionId: typeof contextRaw.sessionId === 'string' ? contextRaw.sessionId : null,
            country: typeof contextRaw.country === 'string' ? contextRaw.country : null,
            device: typeof contextRaw.device === 'string' ? contextRaw.device : null,
            referrer: typeof contextRaw.referrer === 'string' ? contextRaw.referrer : null,
            segments: Array.isArray(contextRaw.segments) ? contextRaw.segments.filter((entry) => typeof entry === 'string') : [],
            query: contextRaw.query && typeof contextRaw.query === 'object' && !Array.isArray(contextRaw.query)
                ? contextRaw.query
                : {},
            answers: previewAnswers
        };
        const fieldErrors = {};
        const items = scopedFields.map((field) => {
            const conditions = parseJsonObject(field.conditionsJson, {});
            const validations = parseJsonObject(field.validationsJson, {});
            const behavior = evaluateConditions ? evaluateFieldConditions(conditions, context) : { visible: true, required: Boolean(validations.required), enabled: field.active };
            const value = previewAnswers[field.key];
            if (behavior.visible && behavior.required && (value === '' || value == null || value === false)) {
                fieldErrors[field.key] = 'Required field is missing';
            }
            if (behavior.visible && typeof value === 'string') {
                if (validations.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    fieldErrors[field.key] = 'Invalid email format';
                }
                if (typeof validations.regex === 'string' && validations.regex) {
                    try {
                        const regex = new RegExp(validations.regex);
                        if (!regex.test(value)) {
                            fieldErrors[field.key] = 'Regex validation failed';
                        }
                    }
                    catch {
                        fieldErrors[field.key] = 'Invalid regex';
                    }
                }
            }
            return { field, behavior };
        });
        return {
            items,
            fieldErrors
        };
    }, [scopedFields, previewContextJson, previewAnswers, evaluateConditions]);
    const markFieldDirty = (id) => {
        setDirtyFieldIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };
    const markStepDirty = (id) => {
        setDirtyStepIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };
    const updateField = (id, updater) => {
        setFields((prev) => prev.map((field) => (field.id === id ? updater(field) : field)));
        markFieldDirty(id);
    };
    const updateFieldByKey = (field, patch) => {
        if (!field) {
            return;
        }
        updateField(field.id, (current) => ({ ...current, ...patch }));
    };
    const saveForm = async () => {
        const res = await sdk.upsertForm({
            id: formId,
            siteId,
            name: formName,
            description: formDescription || null,
            active: formActive
        });
        const savedId = res.upsertForm?.id ?? null;
        setFormId(savedId);
        if (savedId != null) {
            await refreshForms();
        }
        onStatus('Form saved');
    };
    const saveAllDraftChanges = async () => {
        if (!formId) {
            return;
        }
        if (formDirty) {
            await sdk.upsertForm({
                id: formId,
                siteId,
                name: formName,
                description: formDescription || null,
                active: formActive
            });
        }
        for (const stepId of dirtyStepIds) {
            const step = steps.find((entry) => entry.id === stepId);
            if (!step) {
                continue;
            }
            await sdk.upsertFormStep({
                id: step.id,
                formId: step.formId,
                name: step.name,
                position: step.position
            });
        }
        for (const fieldId of dirtyFieldIds) {
            const field = fields.find((entry) => entry.id === fieldId);
            if (!field) {
                continue;
            }
            await sdk.upsertFormField({
                id: field.id,
                stepId: field.stepId,
                formId: field.formId,
                key: field.key,
                label: field.label,
                fieldType: field.fieldType,
                position: field.position,
                conditionsJson: field.conditionsJson,
                validationsJson: field.validationsJson,
                uiConfigJson: field.uiConfigJson,
                active: field.active
            });
        }
        await refreshFormDetails(formId);
        onStatus('Builder changes saved');
    };
    const addStep = async () => {
        if (!formId) {
            return;
        }
        const maxPosition = steps.reduce((max, step) => Math.max(max, step.position), 0);
        await sdk.upsertFormStep({
            formId,
            name: stepName.trim() || `Step ${steps.length + 1}`,
            position: maxPosition + 10
        });
        await refreshFormDetails(formId);
        onStatus('Step added');
    };
    const duplicateStep = async () => {
        if (!formId || !selectedStepId) {
            return;
        }
        const step = steps.find((entry) => entry.id === selectedStepId);
        if (!step) {
            return;
        }
        const created = await sdk.upsertFormStep({
            formId,
            name: `${step.name} Copy`,
            position: step.position + 5
        });
        const newStepId = created.upsertFormStep?.id;
        if (!newStepId) {
            return;
        }
        const existingKeys = new Set(fields.map((field) => field.key));
        const sourceFields = fields.filter((field) => field.stepId === step.id);
        for (const source of sourceFields) {
            const keyBase = `${safeSlug(source.key)}_copy`;
            let nextKey = keyBase;
            let suffix = 1;
            while (existingKeys.has(nextKey)) {
                suffix += 1;
                nextKey = `${keyBase}_${suffix}`;
            }
            existingKeys.add(nextKey);
            await sdk.upsertFormField({
                stepId: newStepId,
                formId,
                key: nextKey,
                label: source.label,
                fieldType: source.fieldType,
                position: source.position,
                conditionsJson: source.conditionsJson,
                validationsJson: source.validationsJson,
                uiConfigJson: source.uiConfigJson,
                active: source.active
            });
        }
        await refreshFormDetails(formId);
        setSelectedStepId(newStepId);
        onStatus('Step duplicated');
    };
    const deleteStep = async (stepId) => {
        await sdk.deleteFormStep({ id: stepId });
        if (formId) {
            await refreshFormDetails(formId);
        }
        onStatus('Step deleted');
    };
    const reorderStep = (stepId, direction) => {
        const sorted = [...steps].sort((a, b) => a.position - b.position || a.id - b.id);
        const index = sorted.findIndex((entry) => entry.id === stepId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= sorted.length) {
            return;
        }
        const next = [...sorted];
        const [current] = next.splice(index, 1);
        if (!current) {
            return;
        }
        next.splice(target, 0, current);
        setSteps(next.map((step, idx) => ({ ...step, position: (idx + 1) * 10 })));
        next.forEach((step) => markStepDirty(step.id));
    };
    const createField = async (fieldType) => {
        if (!formId || !selectedStepId) {
            return;
        }
        const keyBase = safeSlug(fieldType);
        const existing = new Set(fields.map((field) => field.key));
        let key = keyBase;
        let suffix = 1;
        while (existing.has(key)) {
            suffix += 1;
            key = `${keyBase}_${suffix}`;
        }
        const nextPosition = scopedFields.reduce((max, field) => Math.max(max, field.position), 0) + 10;
        const uiConfig = stringifyUiConfigJson({
            placeholder: fieldType === 'email' ? 'you@example.com' : '',
            helpText: fieldType === 'help_text' ? 'Helpful text' : '',
            layout: {
                row: layoutRows.length,
                order: 0,
                span: fieldType === 'divider' || fieldType === 'section' || fieldType === 'help_text' ? 12 : 6
            }
        });
        const res = await sdk.upsertFormField({
            formId,
            stepId: selectedStepId,
            key,
            label: fieldType === 'help_text' ? 'Help Text' : fieldType.replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
            fieldType,
            position: nextPosition,
            conditionsJson: '{}',
            validationsJson: '{}',
            uiConfigJson: uiConfig,
            active: true
        });
        const createdId = res.upsertFormField?.id ?? null;
        await refreshFormDetails(formId);
        setSelectedFieldId(createdId);
        onStatus('Field added');
    };
    const duplicateField = async (field) => {
        if (!formId) {
            return;
        }
        const keyBase = `${safeSlug(field.key)}_copy`;
        const existing = new Set(fields.map((entry) => entry.key));
        let key = keyBase;
        let suffix = 1;
        while (existing.has(key)) {
            suffix += 1;
            key = `${keyBase}_${suffix}`;
        }
        await sdk.upsertFormField({
            stepId: field.stepId,
            formId,
            key,
            label: `${field.label} Copy`,
            fieldType: field.fieldType,
            position: field.position + 5,
            conditionsJson: field.conditionsJson,
            validationsJson: field.validationsJson,
            uiConfigJson: field.uiConfigJson,
            active: field.active
        });
        await refreshFormDetails(formId);
        onStatus('Field duplicated');
    };
    const deleteField = async (field) => {
        await sdk.deleteFormField({ id: field.id });
        if (formId) {
            await refreshFormDetails(formId);
        }
        onStatus('Field deleted');
    };
    const onDesignerDrop = (event, rowIndex, insertIndex) => {
        event.preventDefault();
        const payload = event.dataTransfer.getData('application/x-contenthead-form');
        if (!payload) {
            return;
        }
        try {
            const parsed = JSON.parse(payload);
            if (parsed.source === 'palette') {
                createField(parsed.fieldType).catch((error) => onStatus(String(error)));
                return;
            }
            const field = scopedFields.find((entry) => entry.id === parsed.fieldId);
            if (!field) {
                return;
            }
            const nextRows = layoutRows.map((row) => ({ row: row.row, items: [...row.items] }));
            let sourceRow = -1;
            let sourceIndex = -1;
            nextRows.forEach((row, rowPos) => {
                const idx = row.items.findIndex((item) => item.fieldId === field.id);
                if (idx >= 0) {
                    sourceRow = rowPos;
                    sourceIndex = idx;
                }
            });
            if (sourceRow < 0 || sourceIndex < 0) {
                return;
            }
            const [moving] = nextRows[sourceRow]?.items.splice(sourceIndex, 1) ?? [];
            if (!moving) {
                return;
            }
            while (nextRows.length <= rowIndex) {
                nextRows.push({ row: nextRows.length, items: [] });
            }
            const targetRow = nextRows[rowIndex];
            if (!targetRow) {
                return;
            }
            const insertion = clamp(insertIndex, 0, targetRow.items.length);
            targetRow.items.splice(insertion, 0, moving);
            const compactRows = nextRows.filter((row) => row.items.length > 0).map((row, idx) => ({ row: idx, items: row.items }));
            const updatedStepFields = applyDesignerRows(scopedFields, compactRows);
            setFields((prev) => prev.map((entry) => updatedStepFields.find((candidate) => candidate.id === entry.id) ?? entry));
            updatedStepFields.forEach((entry) => markFieldDirty(entry.id));
        }
        catch {
            // ignore invalid payload
        }
    };
    const setFieldSpan = (field, span) => {
        const config = parseUiConfigJson(field.uiConfigJson);
        const layout = config.layout ?? { row: 0, order: 0, span: 12 };
        const next = stringifyUiConfigJson({
            ...config,
            layout: {
                ...layout,
                span: clamp(span, 1, 12)
            }
        });
        updateFieldByKey(field, { uiConfigJson: next });
    };
    const patchSelectedValidation = (patch) => {
        if (!selectedField) {
            return;
        }
        const current = parseJsonObject(selectedField.validationsJson, {});
        const merged = { ...current, ...patch };
        if (merged.min == null) {
            delete merged.min;
        }
        if (merged.max == null) {
            delete merged.max;
        }
        if (!merged.regex) {
            delete merged.regex;
        }
        updateField(selectedField.id, (field) => ({
            ...field,
            validationsJson: JSON.stringify(merged)
        }));
    };
    const patchSelectedCondition = (key, draft) => {
        if (!selectedField) {
            return;
        }
        const current = parseJsonObject(selectedField.conditionsJson, {});
        updateField(selectedField.id, (field) => ({
            ...field,
            conditionsJson: JSON.stringify({ ...current, [key]: toComparatorRule(draft) })
        }));
    };
    const patchSelectedUiConfig = (patch) => {
        if (!selectedField) {
            return;
        }
        const current = parseUiConfigJson(selectedField.uiConfigJson);
        updateField(selectedField.id, (field) => ({
            ...field,
            uiConfigJson: stringifyUiConfigJson({ ...current, ...patch })
        }));
    };
    return (_jsxs("section", { className: "form-builder-v2", children: [_jsxs("div", { className: "form-builder-top-actions", children: [_jsx(Dropdown, { value: formId, options: forms.map((entry) => ({ label: `${entry.name} (#${entry.id})`, value: entry.id })), onChange: (event) => {
                            const selected = Number(event.value);
                            const form = forms.find((entry) => entry.id === selected);
                            setFormId(selected);
                            setFormName(form?.name ?? '');
                            setFormDescription(form?.description ?? '');
                            setFormActive(Boolean(form?.active));
                            refreshFormDetails(selected).catch((error) => onStatus(String(error)));
                        }, placeholder: "Select form" }), _jsx(InputText, { value: formName, onChange: (event) => { setFormName(event.target.value); setFormDirty(true); }, placeholder: "Form name" }), _jsx(InputText, { value: formDescription, onChange: (event) => { setFormDescription(event.target.value); setFormDirty(true); }, placeholder: "Description" }), _jsxs("label", { children: [_jsx(Checkbox, { checked: formActive, onChange: (event) => { setFormActive(Boolean(event.checked)); setFormDirty(true); } }), " Active"] }), _jsx(Button, { label: "Save", onClick: () => saveAllDraftChanges().catch((error) => onStatus(String(error))) }), _jsx(Button, { label: formActive ? 'Deactivate' : 'Activate', severity: "secondary", onClick: () => {
                            setFormActive((prev) => !prev);
                            setFormDirty(true);
                        } }), _jsx(Button, { label: "Duplicate Step", severity: "secondary", onClick: () => duplicateStep().catch((error) => onStatus(String(error))), disabled: !selectedStepId }), _jsx(Button, { label: "Save Form Only", text: true, onClick: () => saveForm().catch((error) => onStatus(String(error))) }), _jsx(Button, { label: "Test Answers", text: true, onClick: () => setShowTestDrawer(true) })] }), _jsxs("div", { className: "form-builder-layout", children: [_jsxs("aside", { className: "form-builder-sidebar-left", children: [_jsx("h4", { children: "Steps" }), _jsxs("div", { className: "form-row", children: [_jsx(InputText, { value: stepName, onChange: (event) => setStepName(event.target.value), placeholder: "New step name" }), _jsx(Button, { label: "Add Step", onClick: () => addStep().catch((error) => onStatus(String(error))), disabled: !formId })] }), _jsxs(DataTable, { value: [...steps].sort((a, b) => a.position - b.position || a.id - b.id), size: "small", selectionMode: "single", selection: steps.find((step) => step.id === selectedStepId) ?? null, onSelectionChange: (event) => {
                                    const next = event.value;
                                    setSelectedStepId(next?.id ?? null);
                                }, children: [_jsx(Column, { field: "name", header: "Step" }), _jsx(Column, { header: "Order", body: (row) => (_jsxs("div", { className: "inline-actions", children: [_jsx(Button, { text: true, size: "small", icon: "pi pi-angle-up", onClick: () => reorderStep(row.id, -1) }), _jsx(Button, { text: true, size: "small", icon: "pi pi-angle-down", onClick: () => reorderStep(row.id, 1) })] })) }), _jsx(Column, { header: "Delete", body: (row) => (_jsx(Button, { text: true, severity: "danger", size: "small", label: "Remove", onClick: () => deleteStep(row.id).catch((error) => onStatus(String(error))) })) })] }), _jsx("h4", { children: "Field Palette" }), _jsx("div", { className: "palette-grid", children: FIELD_OPTIONS.map((option) => (_jsx("button", { type: "button", className: "palette-item", draggable: true, onDragStart: (event) => {
                                        event.dataTransfer.setData('application/x-contenthead-form', JSON.stringify({ source: 'palette', fieldType: option.value }));
                                    }, onClick: () => createField(option.value).catch((error) => onStatus(String(error))), disabled: !selectedStepId, children: option.label }, option.value))) }), _jsx("h4", { children: "Layout Elements" }), _jsx("div", { className: "palette-grid", children: LAYOUT_ELEMENT_OPTIONS.map((option) => (_jsx("button", { type: "button", className: "palette-item", draggable: true, onDragStart: (event) => {
                                        event.dataTransfer.setData('application/x-contenthead-form', JSON.stringify({ source: 'palette', fieldType: option.value }));
                                    }, onClick: () => createField(option.value).catch((error) => onStatus(String(error))), disabled: !selectedStepId, children: option.label }, option.value))) })] }), _jsx("main", { className: "form-builder-center", children: _jsxs(TabView, { activeIndex: builderTab, onTabChange: (event) => setBuilderTab(event.index), children: [_jsxs(TabPanel, { header: "Designer", children: [_jsxs("div", { className: "designer-header", children: [_jsx("h4", { children: steps.find((entry) => entry.id === selectedStepId)?.name ?? 'Select step' }), _jsx("small", { children: "12-column grid. Drag from palette or drag cards to reorder." })] }), _jsxs("div", { className: "designer-canvas", onDragOver: (event) => event.preventDefault(), children: [(layoutRows.length ? layoutRows : [{ row: 0, items: [] }]).map((row, rowIndex) => (_jsxs("div", { className: "designer-row", children: [row.items.map((item, itemIndex) => {
                                                            const field = scopedFields.find((entry) => entry.id === item.fieldId);
                                                            if (!field) {
                                                                return null;
                                                            }
                                                            const ui = parseUiConfigJson(field.uiConfigJson);
                                                            const previewText = typeof ui.placeholder === 'string' ? ui.placeholder : '';
                                                            return (_jsxs("div", { className: "designer-slot", style: { gridColumn: `span ${clamp(item.span, 1, 12)}` }, children: [_jsx("div", { className: `drop-slot ${selectedFieldId === field.id ? 'selected' : ''}`, onDragOver: (event) => event.preventDefault(), onDrop: (event) => onDesignerDrop(event, rowIndex, itemIndex) }), _jsxs("div", { className: `designer-card ${selectedFieldId === field.id ? 'selected' : ''}`, draggable: true, onDragStart: (event) => {
                                                                            event.dataTransfer.setData('application/x-contenthead-form', JSON.stringify({ source: 'field', fieldId: field.id }));
                                                                        }, onClick: () => setSelectedFieldId(field.id), children: [_jsxs("div", { className: "designer-card-head", children: [_jsx("span", { className: "drag-handle", "aria-hidden": "true", children: "::" }), _jsx("strong", { children: field.label }), _jsxs("span", { className: "muted", children: ["(", field.fieldType, ")"] })] }), _jsx("div", { className: "designer-card-body", children: _jsx("small", { children: previewText || 'No placeholder' }) }), _jsxs("div", { className: "designer-card-actions", children: [_jsx(Dropdown, { value: clamp(item.span, 1, 12), options: Array.from({ length: 12 }).map((_, idx) => ({ label: `Span ${idx + 1}`, value: idx + 1 })), onChange: (event) => setFieldSpan(field, Number(event.value)) }), _jsx(Button, { text: true, size: "small", label: parseJsonObject(field.validationsJson, {}).required ? 'Req On' : 'Req Off', onClick: () => {
                                                                                            const validations = parseJsonObject(field.validationsJson, {});
                                                                                            updateField(field.id, (current) => ({ ...current, validationsJson: JSON.stringify({ ...validations, required: !Boolean(validations.required) }) }));
                                                                                        } }), _jsx(Button, { text: true, size: "small", icon: "pi pi-copy", onClick: () => duplicateField(field).catch((error) => onStatus(String(error))) }), _jsx(Button, { text: true, severity: "danger", size: "small", icon: "pi pi-trash", onClick: () => deleteField(field).catch((error) => onStatus(String(error))) })] })] })] }, field.id));
                                                        }), _jsx("div", { className: "drop-slot end", onDragOver: (event) => event.preventDefault(), onDrop: (event) => onDesignerDrop(event, rowIndex, row.items.length) })] }, `row-${rowIndex}`))), _jsx("div", { className: "drop-slot canvas-end", onDragOver: (event) => event.preventDefault(), onDrop: (event) => onDesignerDrop(event, layoutRows.length, 0), children: "Drop here to create a new row" })] })] }), _jsxs(TabPanel, { header: "Preview", children: [_jsxs("div", { className: "preview-toolbar", children: [_jsxs("label", { children: [_jsx(Checkbox, { checked: evaluateConditions, onChange: (event) => setEvaluateConditions(Boolean(event.checked)) }), " Evaluate conditions"] }), _jsx(Button, { label: "Test with answers", onClick: () => setShowTestDrawer(true), text: true })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Simulate context (JSON)" }), _jsx(InputTextarea, { rows: 4, value: previewContextJson, onChange: (event) => setPreviewContextJson(event.target.value) })] }), layoutRows.map((row, rowIndex) => (_jsx("div", { className: "preview-row-grid", children: row.items.map((item) => {
                                                const match = computedPreview.items.find((entry) => entry.field.id === item.fieldId);
                                                if (!match || !match.behavior.visible) {
                                                    return null;
                                                }
                                                return (_jsx("div", { className: "preview-field", style: { gridColumn: `span ${clamp(item.span, 1, 12)}` }, children: renderFieldInput(match.field, previewAnswers, (key, value) => setPreviewAnswers((prev) => ({ ...prev, [key]: value })), !match.behavior.enabled, match.behavior.required, computedPreview.fieldErrors) }, item.fieldId));
                                            }) }, `preview-row-${rowIndex}`)))] }), _jsxs(TabPanel, { header: "Structure", children: [_jsx("p", { className: "muted", children: "Structure edits sync directly into Designer layout metadata." }), _jsx("h4", { children: "Steps" }), _jsxs(DataTable, { value: [...steps].sort((a, b) => a.position - b.position || a.id - b.id), size: "small", children: [_jsx(Column, { field: "id", header: "ID" }), _jsx(Column, { field: "name", header: "Name", body: (row) => (_jsx(InputText, { value: row.name, onChange: (event) => {
                                                            const nextName = event.target.value;
                                                            setSteps((prev) => prev.map((step) => step.id === row.id ? { ...step, name: nextName } : step));
                                                            markStepDirty(row.id);
                                                        } })) }), _jsx(Column, { field: "position", header: "Position" })] }), _jsx("h4", { children: "Fields" }), _jsxs(DataTable, { value: [...scopedFields].sort((a, b) => a.position - b.position || a.id - b.id), size: "small", selectionMode: "single", selection: selectedField ?? null, onSelectionChange: (event) => {
                                                const next = event.value;
                                                setSelectedFieldId(next?.id ?? null);
                                            }, children: [_jsx(Column, { field: "id", header: "ID" }), _jsx(Column, { field: "key", header: "Key" }), _jsx(Column, { field: "label", header: "Label" }), _jsx(Column, { field: "fieldType", header: "Type" }), _jsx(Column, { field: "position", header: "Position" }), _jsx(Column, { header: "Quick", body: (row) => (_jsxs("div", { className: "inline-actions", children: [_jsx(Button, { text: true, size: "small", label: "Select", onClick: () => setSelectedFieldId(row.id) }), _jsx(Button, { text: true, severity: "danger", size: "small", label: "Delete", onClick: () => deleteField(row).catch((error) => onStatus(String(error))) })] })) })] })] })] }) }), _jsxs("aside", { className: "form-builder-sidebar-right", children: [_jsx("h4", { children: "Inspector" }), !selectedField ? _jsx("p", { className: "muted", children: "Select a field on the canvas." }) : (_jsxs(TabView, { activeIndex: inspectorTab, onTabChange: (event) => setInspectorTab(event.index), children: [_jsxs(TabPanel, { header: "Properties", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Key" }), _jsx(InputText, { value: selectedField.key, onChange: (event) => {
                                                            const next = safeSlug(event.target.value);
                                                            const duplicate = fields.some((field) => field.id !== selectedField.id && field.key === next);
                                                            if (duplicate) {
                                                                onStatus(`Field key ${next} already exists`);
                                                                return;
                                                            }
                                                            updateFieldByKey(selectedField, { key: next });
                                                        } })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Label" }), _jsx(InputText, { value: selectedField.label, onChange: (event) => updateFieldByKey(selectedField, { label: event.target.value }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Help Text" }), _jsx(InputTextarea, { rows: 2, value: typeof parsedUiConfig.helpText === 'string' ? parsedUiConfig.helpText : '', onChange: (event) => patchSelectedUiConfig({ helpText: event.target.value }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Placeholder" }), _jsx(InputText, { value: typeof parsedUiConfig.placeholder === 'string' ? parsedUiConfig.placeholder : '', onChange: (event) => patchSelectedUiConfig({ placeholder: event.target.value }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Default Value" }), _jsx(InputText, { value: typeof parsedUiConfig.defaultValue === 'string' ? parsedUiConfig.defaultValue : '', onChange: (event) => patchSelectedUiConfig({ defaultValue: event.target.value }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Field Type" }), _jsx(Dropdown, { value: normalizeFieldType(selectedField.fieldType), options: [...FIELD_OPTIONS, ...LAYOUT_ELEMENT_OPTIONS], onChange: (event) => updateFieldByKey(selectedField, { fieldType: String(event.value) }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Layout Span" }), _jsx(Dropdown, { value: parsedUiConfig.layout?.span ?? 12, options: Array.from({ length: 12 }).map((_, idx) => ({ label: String(idx + 1), value: idx + 1 })), onChange: (event) => {
                                                            const current = parsedUiConfig.layout ?? { row: 0, order: 0, span: 12 };
                                                            patchSelectedUiConfig({ layout: { ...current, span: Number(event.value) } });
                                                        } })] }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Span MD" }), _jsx(InputNumber, { value: parsedUiConfig.layout?.spanMd ?? null, onValueChange: (event) => {
                                                                    const current = parsedUiConfig.layout ?? { row: 0, order: 0, span: 12 };
                                                                    const nextLayout = { ...current };
                                                                    if (event.value == null) {
                                                                        delete nextLayout.spanMd;
                                                                    }
                                                                    else {
                                                                        nextLayout.spanMd = event.value;
                                                                    }
                                                                    patchSelectedUiConfig({ layout: nextLayout });
                                                                } })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Span LG" }), _jsx(InputNumber, { value: parsedUiConfig.layout?.spanLg ?? null, onValueChange: (event) => {
                                                                    const current = parsedUiConfig.layout ?? { row: 0, order: 0, span: 12 };
                                                                    const nextLayout = { ...current };
                                                                    if (event.value == null) {
                                                                        delete nextLayout.spanLg;
                                                                    }
                                                                    else {
                                                                        nextLayout.spanLg = event.value;
                                                                    }
                                                                    patchSelectedUiConfig({ layout: nextLayout });
                                                                } })] })] })] }), _jsxs(TabPanel, { header: "Validation", children: [_jsxs("label", { children: [_jsx(Checkbox, { checked: Boolean(parsedValidations.required), onChange: (event) => patchSelectedValidation({ required: Boolean(event.checked) }) }), " Required"] }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Min" }), _jsx(InputNumber, { value: parsedValidations.min ?? null, onValueChange: (event) => patchSelectedValidation(event.value == null ? {} : { min: event.value }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Max" }), _jsx(InputNumber, { value: parsedValidations.max ?? null, onValueChange: (event) => patchSelectedValidation(event.value == null ? {} : { max: event.value }) })] })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Regex" }), _jsx(InputText, { value: parsedValidations.regex ?? '', onChange: (event) => patchSelectedValidation(event.target.value ? { regex: event.target.value } : {}) })] }), _jsxs("label", { children: [_jsx(Checkbox, { checked: Boolean(parsedValidations.email), onChange: (event) => patchSelectedValidation({ email: Boolean(event.checked) }) }), " Email format"] })] }), _jsxs(TabPanel, { header: "Conditions", children: [_jsxs("div", { className: "inline-actions", children: [_jsx(Button, { text: true, label: "Edit Show If", onClick: () => { setRuleEditorTarget('showIf'); setRuleEditorOpen(true); } }), _jsx(Button, { text: true, label: "Edit Required If", onClick: () => { setRuleEditorTarget('requiredIf'); setRuleEditorOpen(true); } }), _jsx(Button, { text: true, label: "Edit Enabled If", onClick: () => { setRuleEditorTarget('enabledIf'); setRuleEditorOpen(true); } })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Show If" }), _jsx(Dropdown, { value: showIfDraft.field, options: fieldKeyOptions, onChange: (event) => patchSelectedCondition('showIf', { ...showIfDraft, field: String(event.value) }) }), _jsx(Dropdown, { value: showIfDraft.op, options: [...COMPARATORS], onChange: (event) => patchSelectedCondition('showIf', { ...showIfDraft, op: event.value }) }), _jsx(InputText, { value: showIfDraft.value, onChange: (event) => patchSelectedCondition('showIf', { ...showIfDraft, value: event.target.value }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Required If" }), _jsx(Dropdown, { value: requiredIfDraft.field, options: fieldKeyOptions, onChange: (event) => patchSelectedCondition('requiredIf', { ...requiredIfDraft, field: String(event.value) }) }), _jsx(Dropdown, { value: requiredIfDraft.op, options: [...COMPARATORS], onChange: (event) => patchSelectedCondition('requiredIf', { ...requiredIfDraft, op: event.value }) }), _jsx(InputText, { value: requiredIfDraft.value, onChange: (event) => patchSelectedCondition('requiredIf', { ...requiredIfDraft, value: event.target.value }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Enabled If" }), _jsx(Dropdown, { value: enabledIfDraft.field, options: fieldKeyOptions, onChange: (event) => patchSelectedCondition('enabledIf', { ...enabledIfDraft, field: String(event.value) }) }), _jsx(Dropdown, { value: enabledIfDraft.op, options: [...COMPARATORS], onChange: (event) => patchSelectedCondition('enabledIf', { ...enabledIfDraft, op: event.value }) }), _jsx(InputText, { value: enabledIfDraft.value, onChange: (event) => patchSelectedCondition('enabledIf', { ...enabledIfDraft, value: event.target.value }) })] })] }), _jsxs(TabPanel, { header: "Advanced", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "uiConfig JSON" }), _jsx(InputTextarea, { rows: 8, value: selectedField.uiConfigJson, onChange: (event) => updateFieldByKey(selectedField, { uiConfigJson: event.target.value }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "validations JSON" }), _jsx(InputTextarea, { rows: 6, value: selectedField.validationsJson, onChange: (event) => updateFieldByKey(selectedField, { validationsJson: event.target.value }) })] })] })] }))] })] }), _jsxs(Sidebar, { position: "right", visible: showTestDrawer, onHide: () => setShowTestDrawer(false), style: { width: '32rem' }, children: [_jsx("h3", { children: "Test with Answers" }), _jsx("p", { className: "muted", children: "Answers drive condition and validation preview." }), scopedFields.map((field) => (_jsxs("div", { className: "form-row", children: [_jsxs("label", { children: [field.label, " (", field.key, ")"] }), _jsx(InputText, { value: String(previewAnswers[field.key] ?? ''), onChange: (event) => setPreviewAnswers((prev) => ({ ...prev, [field.key]: event.target.value })) })] }, `drawer-${field.id}`)))] }), _jsx(RuleEditorDialog, { visible: ruleEditorOpen, initialRule: parsedConditions[ruleEditorTarget], fields: fieldKeyOptions, onHide: () => setRuleEditorOpen(false), onApply: (rule) => {
                    if (!selectedField) {
                        return;
                    }
                    const current = parseJsonObject(selectedField.conditionsJson, {});
                    updateField(selectedField.id, (field) => ({
                        ...field,
                        conditionsJson: JSON.stringify({ ...current, [ruleEditorTarget]: rule })
                    }));
                    setRuleEditorOpen(false);
                } })] }));
}
