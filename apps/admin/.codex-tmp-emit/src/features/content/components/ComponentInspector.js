import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { getComponentRegistryEntry, validateComponentProps } from './componentRegistry';
export function ComponentInspector({ component, selectedFieldPath, onSelectFieldPath, onChange }) {
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
                return (_jsxs("div", { className: `form-row ${isSelected ? 'cms-selected-editor-row' : ''}`, "data-editor-path": fieldPath, onClick: () => onSelectFieldPath?.(fieldPath), children: [_jsx("label", { children: field.label }), field.type === 'number' ? (_jsx(InputNumber, { value: typeof value === 'number' ? value : null, onValueChange: (event) => onChange({ ...component, props: { ...component.props, [field.key]: event.value ?? 0 } }) })) : field.type === 'select' ? (_jsx(Dropdown, { value: value ?? null, options: field.options ?? [], onChange: (event) => onChange({ ...component, props: { ...component.props, [field.key]: event.value } }) })) : field.type === 'boolean' ? (_jsx(Checkbox, { checked: Boolean(value), onChange: (event) => onChange({ ...component, props: { ...component.props, [field.key]: Boolean(event.checked) } }) })) : field.type === 'multiline' ? (_jsx(InputTextarea, { rows: 4, value: String(value ?? ''), onChange: (event) => onChange({ ...component, props: { ...component.props, [field.key]: event.target.value } }) })) : (_jsx(InputText, { value: String(value ?? ''), onChange: (event) => onChange({ ...component, props: { ...component.props, [field.key]: event.target.value } }) }))] }, field.key));
            }), errors.length > 0 ? (_jsx("div", { className: "status-panel", children: errors.map((entryError) => _jsx("div", { className: "error-text", children: entryError }, entryError)) })) : null] }));
}
