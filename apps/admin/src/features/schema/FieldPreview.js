import { jsx as _jsx } from "react/jsx-runtime";
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
export function FieldPreview({ field }) {
    if (!field) {
        return _jsx("p", { className: "muted", children: "Select a field to preview editor rendering." });
    }
    const ui = field.uiConfig ?? {};
    const allowed = (field.validations?.allowedValues ?? []).map((entry) => ({ label: entry, value: entry }));
    if (field.type === 'boolean') {
        return _jsx(Checkbox, { checked: Boolean(ui.defaultValue) });
    }
    if (field.type === 'number') {
        return _jsx(InputNumber, { value: typeof ui.defaultValue === 'number' ? ui.defaultValue : null });
    }
    if (field.type === 'date' || field.type === 'datetime') {
        return _jsx(Calendar, { value: ui.defaultValue ? new Date(String(ui.defaultValue)) : null, showTime: field.type === 'datetime' });
    }
    if (field.type === 'select') {
        return _jsx(Dropdown, { options: allowed, placeholder: ui.placeholder ?? '' });
    }
    if (field.type === 'multiselect') {
        return _jsx(MultiSelect, { options: allowed, placeholder: ui.placeholder ?? '' });
    }
    if (field.type === 'richtext' || ui.multiline) {
        return _jsx(InputTextarea, { rows: ui.rows ?? 4, value: String(ui.defaultValue ?? '') });
    }
    return _jsx(InputText, { value: String(ui.defaultValue ?? ''), placeholder: ui.placeholder ?? '' });
}
