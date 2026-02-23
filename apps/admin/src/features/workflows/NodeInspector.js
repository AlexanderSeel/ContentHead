import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import { getNodeRegistryEntry, validateNodeConfig } from './nodeRegistry';
export function NodeInspector({ node, onChange }) {
    if (!node) {
        return _jsx("div", { className: "status-panel", children: "Select a node on the canvas." });
    }
    const registry = getNodeRegistryEntry(node.type);
    if (!registry) {
        return _jsxs("div", { className: "status-panel", children: ["Unsupported node type: ", node.type] });
    }
    const config = node.config ?? {};
    const errors = validateNodeConfig(node.type, config);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: registry.label }), _jsx("div", { children: node.id })] }), registry.fields.map((field) => (_jsxs("div", { className: "form-row", children: [_jsx("label", { children: field.label }), field.type === 'number' ? (_jsx(InputNumber, { value: Number(config[field.key] ?? 0), onValueChange: (event) => onChange({ ...config, [field.key]: event.value ?? 0 }) })) : field.type === 'select' ? (_jsx(Dropdown, { value: String(config[field.key] ?? ''), options: field.options ?? [], onChange: (event) => onChange({ ...config, [field.key]: event.value }) })) : field.type === 'multiselect' ? (_jsx(MultiSelect, { value: Array.isArray(config[field.key]) ? config[field.key] : [], options: field.options ?? [], onChange: (event) => onChange({ ...config, [field.key]: event.value }) })) : field.type === 'boolean' ? (_jsx(Checkbox, { checked: Boolean(config[field.key]), onChange: (event) => onChange({ ...config, [field.key]: Boolean(event.checked) }) })) : field.type === 'textarea' ? (_jsx(InputTextarea, { rows: 4, value: String(config[field.key] ?? ''), onChange: (event) => onChange({ ...config, [field.key]: event.target.value }) })) : (_jsx(InputText, { value: String(config[field.key] ?? ''), onChange: (event) => onChange({ ...config, [field.key]: event.target.value }) }))] }, field.key))), errors.length > 0 ? (_jsx("div", { className: "status-panel", children: errors.map((entry) => _jsx("div", { className: "editor-error", children: entry }, entry)) })) : null, _jsx(Accordion, { children: _jsx(AccordionTab, { header: "Advanced JSON", children: _jsx(InputTextarea, { rows: 10, value: JSON.stringify(config, null, 2), onChange: (event) => {
                            try {
                                const parsed = JSON.parse(event.target.value);
                                onChange(parsed);
                            }
                            catch {
                                // keep invalid json local
                            }
                        } }) }) })] }));
}
