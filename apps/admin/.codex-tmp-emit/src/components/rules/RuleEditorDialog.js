import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { TabPanel, TabView } from 'primereact/tabview';
import { evaluateRule } from '@contenthead/shared';
function parseRuleToRows(rule) {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
        return { mode: 'all', rows: [{ field: 'country', op: 'eq', value: 'US' }] };
    }
    const root = rule;
    if (Array.isArray(root.all) || Array.isArray(root.any)) {
        const list = (root.all ?? root.any ?? []).map((entry) => {
            const r = entry;
            return {
                field: typeof r.field === 'string' ? r.field : 'country',
                op: (r.op ?? 'eq'),
                value: typeof r.value === 'string' ? r.value : JSON.stringify(r.value ?? '')
            };
        });
        return { mode: root.all ? 'all' : 'any', rows: list.length > 0 ? list : [{ field: 'country', op: 'eq', value: 'US' }] };
    }
    return {
        mode: 'all',
        rows: [{ field: root.field ?? 'country', op: root.op ?? 'eq', value: typeof root.value === 'string' ? root.value : JSON.stringify(root.value ?? '') }]
    };
}
function rowsToRule(mode, rows) {
    const mapped = rows.map((row) => ({
        field: row.field,
        op: row.op,
        value: row.op === 'in' ? row.value.split(',').map((entry) => entry.trim()).filter(Boolean) : row.value
    }));
    return mode === 'all' ? { all: mapped } : { any: mapped };
}
export function RuleEditorDialog({ visible, initialRule, fields, onHide, onApply }) {
    const initial = useMemo(() => parseRuleToRows(initialRule), [initialRule]);
    const [mode, setMode] = useState(initial.mode);
    const [rows, setRows] = useState(initial.rows);
    const [jsonValue, setJsonValue] = useState(JSON.stringify(rowsToRule(initial.mode, initial.rows), null, 2));
    const [testContext, setTestContext] = useState('{"country":"US"}');
    const [jsonError, setJsonError] = useState('');
    const currentRule = useMemo(() => rowsToRule(mode, rows), [mode, rows]);
    const testResult = useMemo(() => {
        try {
            const ctx = JSON.parse(testContext);
            return evaluateRule(currentRule, ctx) ? 'true' : 'false';
        }
        catch {
            return 'invalid context';
        }
    }, [testContext, currentRule]);
    return (_jsx(Dialog, { header: "Rule Editor", visible: visible, onHide: onHide, style: { width: '46rem' }, children: _jsxs(TabView, { children: [_jsxs(TabPanel, { header: "Visual", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Group Mode" }), _jsx(Dropdown, { value: mode, options: [{ label: 'ALL', value: 'all' }, { label: 'ANY', value: 'any' }], onChange: (event) => setMode(event.value) })] }), rows.map((row, index) => (_jsxs("div", { className: "form-grid", children: [_jsx(Dropdown, { value: row.field, options: fields.length > 0 ? fields : [{ label: 'country', value: 'country' }], onChange: (event) => setRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, field: String(event.value) } : entry))), filter: true }), _jsx(Dropdown, { value: row.op, options: [
                                        { label: 'eq', value: 'eq' },
                                        { label: 'neq', value: 'neq' },
                                        { label: 'in', value: 'in' },
                                        { label: 'contains', value: 'contains' },
                                        { label: 'gt', value: 'gt' },
                                        { label: 'lt', value: 'lt' },
                                        { label: 'regex', value: 'regex' }
                                    ], onChange: (event) => setRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, op: event.value } : entry))) }), _jsx(InputText, { value: row.value, onChange: (event) => setRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, value: event.target.value } : entry))), placeholder: "Value" }), _jsx(Button, { text: true, severity: "danger", icon: "pi pi-trash", onClick: () => setRows((prev) => prev.filter((_, i) => i !== index)) })] }, `row-${index}`))), _jsxs("div", { className: "inline-actions", children: [_jsx(Button, { label: "Add condition", text: true, onClick: () => setRows((prev) => [...prev, { field: fields[0]?.value ?? 'country', op: 'eq', value: '' }]) }), _jsx(Button, { label: "Apply", onClick: () => onApply(currentRule) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Test context JSON" }), _jsx(InputTextarea, { rows: 4, value: testContext, onChange: (event) => setTestContext(event.target.value) }), _jsxs("small", { children: ["Result: ", testResult] })] })] }), _jsxs(TabPanel, { header: "Advanced JSON", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Rule JSON" }), _jsx(InputTextarea, { rows: 12, value: jsonValue, onChange: (event) => {
                                        setJsonValue(event.target.value);
                                        try {
                                            const parsed = JSON.parse(event.target.value);
                                            const next = parseRuleToRows(parsed);
                                            setMode(next.mode);
                                            setRows(next.rows);
                                            setJsonError('');
                                        }
                                        catch (error) {
                                            setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
                                        }
                                    } }), jsonError ? _jsx("small", { className: "error-text", children: jsonError }) : null] }), _jsx("div", { className: "inline-actions", children: _jsx(Button, { label: "Apply JSON", onClick: () => {
                                    try {
                                        onApply(JSON.parse(jsonValue));
                                        setJsonError('');
                                    }
                                    catch (error) {
                                        setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
                                    }
                                } }) })] })] }) }));
}
