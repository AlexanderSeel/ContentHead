import { jsx as _jsx } from "react/jsx-runtime";
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { ContentReferencePicker } from '../../../components/inputs/ContentReferencePicker';
import { AssetListEditor, AssetRefEditor } from './AssetEditors';
import { ContentLinkEditor, ContentLinkListEditor } from './ContentLinkEditors';
function allowedOptions(field) {
    return (field.validations?.allowedValues ?? []).map((entry) => ({ label: entry, value: entry }));
}
export function FieldRenderer({ field, value, onChange, siteId, token, readOnly }) {
    const ui = field.uiConfig ?? {};
    if (field.type === 'boolean') {
        return _jsx(Checkbox, { checked: Boolean(value), onChange: (event) => onChange(Boolean(event.checked)), disabled: readOnly });
    }
    if (field.type === 'number') {
        return _jsx(InputNumber, { value: typeof value === 'number' ? value : null, onValueChange: (event) => onChange(event.value ?? null), disabled: readOnly });
    }
    if (field.type === 'date' || field.type === 'datetime') {
        return _jsx(Calendar, { value: value ? new Date(String(value)) : null, onChange: (event) => onChange(event.value ? event.value.toISOString() : null), showTime: field.type === 'datetime', disabled: readOnly });
    }
    if (field.type === 'select') {
        return _jsx(Dropdown, { value: value ?? null, options: allowedOptions(field), onChange: (event) => onChange(event.value), placeholder: ui.placeholder ?? '', disabled: Boolean(readOnly) });
    }
    if (field.type === 'multiselect') {
        return _jsx(MultiSelect, { value: Array.isArray(value) ? value : [], options: allowedOptions(field), onChange: (event) => onChange(event.value), placeholder: ui.placeholder ?? '', disabled: Boolean(readOnly) });
    }
    if (field.type === 'reference') {
        return _jsx(ContentReferencePicker, { token: token, siteId: siteId, value: typeof value === 'number' ? value : null, onChange: onChange });
    }
    if (field.type === 'contentLink') {
        return _jsx(ContentLinkEditor, { token: token, siteId: siteId, value: value ?? null, onChange: onChange });
    }
    if (field.type === 'contentLinkList') {
        return _jsx(ContentLinkListEditor, { token: token, siteId: siteId, value: Array.isArray(value) ? value : [], onChange: onChange });
    }
    if (field.type === 'assetRef') {
        return _jsx(AssetRefEditor, { token: token, siteId: siteId, value: typeof value === 'number' ? value : null, onChange: onChange });
    }
    if (field.type === 'assetList') {
        return _jsx(AssetListEditor, { token: token, siteId: siteId, value: Array.isArray(value) ? value.filter((entry) => typeof entry === 'number') : [], onChange: onChange });
    }
    if (field.type === 'json') {
        return _jsx(InputTextarea, { rows: 6, value: typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2), onChange: (event) => onChange(event.target.value), readOnly: readOnly });
    }
    if (field.type === 'richtext') {
        return _jsx(InputTextarea, { rows: 8, value: String(value ?? ''), onChange: (event) => onChange(event.target.value), readOnly: readOnly });
    }
    if (ui.multiline) {
        return _jsx(InputTextarea, { rows: ui.rows ?? 3, value: String(value ?? ''), onChange: (event) => onChange(event.target.value), readOnly: readOnly, placeholder: ui.placeholder ?? '' });
    }
    return _jsx(InputText, { value: String(value ?? ''), onChange: (event) => onChange(event.target.value), readOnly: readOnly, placeholder: ui.placeholder ?? '' });
}
