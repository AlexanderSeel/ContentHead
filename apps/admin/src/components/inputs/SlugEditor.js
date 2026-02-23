import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
export function SlugEditor({ value, sourceText, onChange }) {
    const isValid = /^[a-z0-9][a-z0-9-/]*$/.test(value);
    return (_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Slug" }), _jsxs("div", { className: "inline-actions", children: [_jsx(InputText, { value: value, onChange: (event) => onChange(event.target.value), placeholder: "start" }), _jsx(Button, { size: "small", type: "button", label: "Generate", onClick: () => onChange(slugify(sourceText ?? value)) })] }), !isValid ? _jsx("small", { className: "editor-error", children: "Use lowercase letters, numbers, hyphen and slash." }) : null] }));
}
