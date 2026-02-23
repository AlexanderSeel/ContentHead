import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Checkbox } from 'primereact/checkbox';
import { Chips } from 'primereact/chips';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { CONTENT_FIELD_TYPES, ensureUniqueFieldKey } from './fieldValidationUi';
function replaceField(fields, key, next) {
    return fields.map((entry) => (entry.key === key ? next : entry));
}
function cleanValidations(value) {
    const next = { ...(value ?? {}) };
    if (next.min == null) {
        delete next.min;
    }
    if (next.max == null) {
        delete next.max;
    }
    if (next.minLength == null) {
        delete next.minLength;
    }
    if (next.maxLength == null) {
        delete next.maxLength;
    }
    if (!next.regex) {
        delete next.regex;
    }
    if (!next.allowedValues || next.allowedValues.length === 0) {
        delete next.allowedValues;
    }
    return next;
}
function cleanUiConfig(value) {
    const next = { ...(value ?? {}) };
    if (next.rows == null) {
        delete next.rows;
    }
    if (!next.displayFormat) {
        delete next.displayFormat;
    }
    if (!next.section) {
        delete next.section;
    }
    return next;
}
export function FieldInspector({ selected, fields, onChange }) {
    if (!selected) {
        return _jsx("p", { className: "muted", children: "Select a field to edit properties." });
    }
    const apply = (patch) => {
        onChange(replaceField(fields, selected.key, { ...selected, ...patch }));
    };
    const validations = cleanValidations(selected.validations ?? {});
    const uiConfig = cleanUiConfig(selected.uiConfig ?? {});
    return (_jsx("div", { className: "p-fluid", children: _jsxs(Accordion, { activeIndex: 0, children: [_jsxs(AccordionTab, { header: "Properties", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Key" }), _jsx(InputText, { value: selected.key, onChange: (event) => {
                                        const nextKey = ensureUniqueFieldKey(event.target.value, fields, selected.key);
                                        onChange(fields.map((entry) => (entry.key === selected.key ? { ...selected, key: nextKey } : entry)));
                                    } })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Label" }), _jsx(InputText, { value: selected.label, onChange: (event) => apply({ label: event.target.value }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Description" }), _jsx(InputTextarea, { rows: 2, value: selected.description ?? '', onChange: (event) => apply({ description: event.target.value }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Type" }), _jsx(Dropdown, { value: selected.type, options: CONTENT_FIELD_TYPES, onChange: (event) => apply({ type: event.value }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Placeholder" }), _jsx(InputText, { value: uiConfig.placeholder ?? '', onChange: (event) => apply({ uiConfig: { ...uiConfig, placeholder: event.target.value } }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Default Value" }), _jsx(InputText, { value: uiConfig.defaultValue == null ? '' : String(uiConfig.defaultValue), onChange: (event) => apply({ uiConfig: { ...uiConfig, defaultValue: event.target.value } }) })] })] }), _jsxs(AccordionTab, { header: "Validation", children: [_jsxs("label", { children: [_jsx(Checkbox, { checked: Boolean(selected.required), onChange: (event) => apply({ required: Boolean(event.checked) }) }), " Required"] }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Min" }), _jsx(InputNumber, { value: validations.min ?? null, onValueChange: (event) => apply({ validations: cleanValidations({ ...validations, ...(event.value == null ? {} : { min: event.value }) }) }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Max" }), _jsx(InputNumber, { value: validations.max ?? null, onValueChange: (event) => apply({ validations: cleanValidations({ ...validations, ...(event.value == null ? {} : { max: event.value }) }) }) })] })] }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Min Length" }), _jsx(InputNumber, { value: validations.minLength ?? null, onValueChange: (event) => apply({ validations: cleanValidations({ ...validations, ...(event.value == null ? {} : { minLength: event.value }) }) }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Max Length" }), _jsx(InputNumber, { value: validations.maxLength ?? null, onValueChange: (event) => apply({ validations: cleanValidations({ ...validations, ...(event.value == null ? {} : { maxLength: event.value }) }) }) })] })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Regex" }), _jsx(InputText, { value: validations.regex ?? '', onChange: (event) => apply({ validations: cleanValidations({ ...validations, ...(event.target.value ? { regex: event.target.value } : {}) }) }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Allowed Values" }), _jsx(Chips, { value: validations.allowedValues ?? [], onChange: (event) => apply({ validations: cleanValidations({ ...validations, allowedValues: event.value }) }), separator: "," })] })] }), _jsxs(AccordionTab, { header: "UI", children: [_jsxs("label", { children: [_jsx(Checkbox, { checked: Boolean(uiConfig.multiline), onChange: (event) => apply({ uiConfig: { ...uiConfig, multiline: Boolean(event.checked) } }) }), " Multiline editor"] }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Rows" }), _jsx(InputNumber, { value: uiConfig.rows ?? null, onValueChange: (event) => apply({ uiConfig: cleanUiConfig({ ...uiConfig, ...(event.value == null ? {} : { rows: event.value }) }) }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Display Format" }), _jsx(InputText, { value: uiConfig.displayFormat ?? '', onChange: (event) => apply({ uiConfig: cleanUiConfig({ ...uiConfig, displayFormat: event.target.value }) }) })] })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Section" }), _jsx(InputText, { value: uiConfig.section ?? '', onChange: (event) => apply({ uiConfig: cleanUiConfig({ ...uiConfig, section: event.target.value }) }) })] })] }), _jsxs(AccordionTab, { header: "Advanced", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Validations JSON" }), _jsx(InputTextarea, { rows: 4, value: JSON.stringify(validations, null, 2), onChange: (event) => {
                                        try {
                                            const parsed = JSON.parse(event.target.value);
                                            apply({ validations: parsed ?? {} });
                                        }
                                        catch {
                                            // keep invalid JSON local
                                        }
                                    } })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "UI Config JSON" }), _jsx(InputTextarea, { rows: 4, value: JSON.stringify(uiConfig, null, 2), onChange: (event) => {
                                        try {
                                            const parsed = JSON.parse(event.target.value);
                                            apply({ uiConfig: parsed ?? {} });
                                        }
                                        catch {
                                            // keep invalid JSON local
                                        }
                                    } })] })] })] }) }));
}
