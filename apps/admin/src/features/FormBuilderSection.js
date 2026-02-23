import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { createSdk } from '@contenthead/sdk';
const sdk = createSdk({ endpoint: 'http://localhost:4000/graphql' });
export function FormBuilderSection({ siteId, onStatus }) {
    const [forms, setForms] = useState([]);
    const [formId, setFormId] = useState(null);
    const [formName, setFormName] = useState('Lead Form');
    const [formDescription, setFormDescription] = useState('Basic lead form');
    const [formActive, setFormActive] = useState(true);
    const [steps, setSteps] = useState([]);
    const [fields, setFields] = useState([]);
    const [stepName, setStepName] = useState('Step 1');
    const [stepPosition, setStepPosition] = useState(10);
    const [selectedStepId, setSelectedStepId] = useState(null);
    const [fieldKey, setFieldKey] = useState('email');
    const [fieldLabel, setFieldLabel] = useState('Email');
    const [fieldType, setFieldType] = useState('text');
    const [fieldPosition, setFieldPosition] = useState(10);
    const [conditionsJson, setConditionsJson] = useState('{"showIf":{"op":"eq","field":"country","value":"US"}}');
    const [validationsJson, setValidationsJson] = useState('{"regex":".+@.+"}');
    const [uiConfigJson, setUiConfigJson] = useState('{"placeholder":"you@example.com"}');
    const [fieldActive, setFieldActive] = useState(true);
    const [answersJson, setAnswersJson] = useState('{"email":"test@example.com"}');
    const [contextJson, setContextJson] = useState('{"country":"US"}');
    const [evaluationOutput, setEvaluationOutput] = useState('');
    const refreshForms = async () => {
        const res = await sdk.listForms({ siteId });
        const next = (res.listForms ?? []);
        setForms(next);
        const nextId = formId ?? next[0]?.id ?? null;
        setFormId(nextId);
        if (nextId) {
            await refreshFormDetails(nextId);
        }
    };
    const refreshFormDetails = async (id) => {
        const [stepRes, fieldRes] = await Promise.all([sdk.listFormSteps({ formId: id }), sdk.listFormFields({ formId: id })]);
        const nextSteps = (stepRes.listFormSteps ?? []);
        setSteps(nextSteps);
        setFields((fieldRes.listFormFields ?? []));
        setSelectedStepId(nextSteps[0]?.id ?? null);
    };
    useEffect(() => {
        refreshForms().catch((error) => onStatus(String(error)));
    }, [siteId]);
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
        await refreshForms();
        onStatus('Form saved');
    };
    const saveStep = async () => {
        if (!formId) {
            return;
        }
        await sdk.upsertFormStep({
            formId,
            name: stepName,
            position: stepPosition
        });
        await refreshFormDetails(formId);
        onStatus('Step saved');
    };
    const saveField = async () => {
        if (!formId || !selectedStepId) {
            return;
        }
        await sdk.upsertFormField({
            formId,
            stepId: selectedStepId,
            key: fieldKey,
            label: fieldLabel,
            fieldType,
            position: fieldPosition,
            conditionsJson,
            validationsJson,
            uiConfigJson,
            active: fieldActive
        });
        await refreshFormDetails(formId);
        onStatus('Field saved');
    };
    const runEvaluation = async () => {
        if (!formId) {
            return;
        }
        const result = await sdk.evaluateForm({
            formId,
            answersJson,
            contextJson
        });
        setEvaluationOutput(JSON.stringify(result.evaluateForm ?? {}, null, 2));
    };
    return (_jsxs("section", { children: [_jsx("h3", { children: "Form Builder" }), _jsxs("div", { className: "form-grid", children: [_jsx(Dropdown, { value: formId, options: forms.map((entry) => ({ label: `${entry.name} (#${entry.id})`, value: entry.id })), onChange: (event) => {
                            const selected = Number(event.value);
                            const form = forms.find((entry) => entry.id === selected);
                            setFormId(selected);
                            setFormName(form?.name ?? '');
                            setFormDescription(form?.description ?? '');
                            setFormActive(Boolean(form?.active));
                            refreshFormDetails(selected).catch((error) => onStatus(String(error)));
                        }, placeholder: "Select form" }), _jsx(InputText, { value: formName, onChange: (event) => setFormName(event.target.value), placeholder: "Form name" }), _jsx(InputText, { value: formDescription, onChange: (event) => setFormDescription(event.target.value), placeholder: "Description" }), _jsxs("label", { children: [_jsx(Checkbox, { checked: formActive, onChange: (event) => setFormActive(Boolean(event.checked)) }), " Active"] }), _jsx(Button, { label: "Save Form", onClick: () => saveForm().catch((error) => onStatus(String(error))) })] }), _jsx("h4", { children: "Steps" }), _jsxs(DataTable, { value: steps, size: "small", children: [_jsx(Column, { field: "id", header: "ID" }), _jsx(Column, { field: "name", header: "Name" }), _jsx(Column, { field: "position", header: "Position" })] }), _jsxs("div", { className: "form-grid", children: [_jsx(InputText, { value: stepName, onChange: (event) => setStepName(event.target.value), placeholder: "Step name" }), _jsx(InputText, { value: String(stepPosition), onChange: (event) => setStepPosition(Number(event.target.value || '0')), placeholder: "Position" }), _jsx(Dropdown, { value: selectedStepId, options: steps.map((entry) => ({ label: `${entry.name} (#${entry.id})`, value: entry.id })), onChange: (event) => setSelectedStepId(Number(event.value)), placeholder: "Target step" }), _jsx(Button, { label: "Save Step", onClick: () => saveStep().catch((error) => onStatus(String(error))) })] }), _jsx("h4", { children: "Fields" }), _jsxs(DataTable, { value: fields, size: "small", children: [_jsx(Column, { field: "id", header: "ID" }), _jsx(Column, { field: "key", header: "Key" }), _jsx(Column, { field: "label", header: "Label" }), _jsx(Column, { field: "fieldType", header: "Type" }), _jsx(Column, { field: "position", header: "Position" }), _jsx(Column, { header: "Load", body: (row) => (_jsx(Button, { text: true, label: "Load", size: "small", onClick: () => {
                                setSelectedStepId(row.stepId);
                                setFieldKey(row.key);
                                setFieldLabel(row.label);
                                setFieldType(row.fieldType);
                                setFieldPosition(row.position);
                                setConditionsJson(row.conditionsJson);
                                setValidationsJson(row.validationsJson);
                                setUiConfigJson(row.uiConfigJson);
                                setFieldActive(row.active);
                            } })) })] }), _jsxs("div", { className: "form-grid", children: [_jsx(InputText, { value: fieldKey, onChange: (event) => setFieldKey(event.target.value), placeholder: "key" }), _jsx(InputText, { value: fieldLabel, onChange: (event) => setFieldLabel(event.target.value), placeholder: "label" }), _jsx(Dropdown, { value: fieldType, options: [{ label: 'text', value: 'text' }, { label: 'number', value: 'number' }, { label: 'boolean', value: 'boolean' }], onChange: (event) => setFieldType(String(event.value)) }), _jsx(InputText, { value: String(fieldPosition), onChange: (event) => setFieldPosition(Number(event.target.value || '0')), placeholder: "position" }), _jsxs("label", { children: [_jsx(Checkbox, { checked: fieldActive, onChange: (event) => setFieldActive(Boolean(event.checked)) }), " Active"] })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Conditions JSON" }), _jsx(InputTextarea, { rows: 3, value: conditionsJson, onChange: (event) => setConditionsJson(event.target.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Validations JSON" }), _jsx(InputTextarea, { rows: 2, value: validationsJson, onChange: (event) => setValidationsJson(event.target.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "UI Config JSON" }), _jsx(InputTextarea, { rows: 2, value: uiConfigJson, onChange: (event) => setUiConfigJson(event.target.value) })] }), _jsx("div", { className: "inline-actions", children: _jsx(Button, { label: "Save Field", onClick: () => saveField().catch((error) => onStatus(String(error))) }) }), _jsx("h4", { children: "Evaluate Form" }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Answers JSON" }), _jsx(InputTextarea, { rows: 2, value: answersJson, onChange: (event) => setAnswersJson(event.target.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Context JSON" }), _jsx(InputTextarea, { rows: 2, value: contextJson, onChange: (event) => setContextJson(event.target.value) })] }), _jsx("div", { className: "inline-actions", children: _jsx(Button, { label: "Evaluate", onClick: () => runEvaluation().catch((error) => onStatus(String(error))) }) }), _jsx("pre", { children: evaluationOutput })] }));
}
