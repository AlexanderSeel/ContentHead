import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
const templates = {
    types: [
        { label: 'Generate fields', prompt: 'Generate ContentType schema fields for: ' },
        { label: 'Add validations', prompt: 'Suggest validation rules for these fields: ' }
    ],
    content: [
        { label: 'Create draft', prompt: 'Create a content draft for this page in market/locale: ' },
        { label: 'Rewrite tone', prompt: 'Rewrite this content to be concise and conversion focused: ' }
    ],
    forms: [
        { label: 'Suggest steps', prompt: 'Suggest form step flow with field list and validations for: ' },
        { label: 'Generate conditions', prompt: 'Generate conditional rules for these form fields: ' }
    ],
    workflows: [
        { label: 'Generate workflow', prompt: 'Build workflow graph for AI generate -> approval -> publish -> activate variant for: ' },
        { label: 'Improve workflow', prompt: 'Improve this workflow with retries and error handling: ' }
    ],
    graphql: [
        { label: 'Generate query', prompt: 'Generate a GraphQL operation for: ' },
        { label: 'Explain error', prompt: 'Explain this GraphQL error and how to fix it: ' }
    ],
    general: [{ label: 'General assistant', prompt: 'Help with: ' }]
};
function summarizeContext(contextPayload, includePayload) {
    if (!includePayload) {
        return '';
    }
    return `\n\nIncluded context:\n${JSON.stringify(contextPayload, null, 2).slice(0, 4000)}`;
}
export function AskAiDialog({ visible, onHide, defaultContext, contextPayload, onApply, onInsert, onCopy }) {
    const [contextType, setContextType] = useState(defaultContext);
    const [prompt, setPrompt] = useState('');
    const [includeContext, setIncludeContext] = useState(true);
    const [response, setResponse] = useState('');
    const templateOptions = useMemo(() => templates[contextType] ?? templates.general, [contextType]);
    const generate = () => {
        const body = `${prompt}${summarizeContext(contextPayload, includeContext)}`.trim();
        if (!body) {
            setResponse('Please enter a prompt.');
            return;
        }
        const generated = [
            `Assistant suggestion for ${contextType}:`,
            '',
            `1. Clarify objective and constraints.`,
            `2. Draft a minimal safe change first.`,
            `3. Validate output against current schema/state.`,
            '',
            `Prompt used:`,
            body
        ].join('\n');
        setResponse(generated);
    };
    return (_jsxs(Dialog, { header: "Ask AI", visible: visible, onHide: onHide, style: { width: '46rem' }, children: [_jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Context" }), _jsx(Dropdown, { value: contextType, options: [
                                    { label: 'Content Types', value: 'types' },
                                    { label: 'Content', value: 'content' },
                                    { label: 'Forms', value: 'forms' },
                                    { label: 'Workflows', value: 'workflows' },
                                    { label: 'GraphQL', value: 'graphql' },
                                    { label: 'General', value: 'general' }
                                ], onChange: (event) => setContextType(event.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Template" }), _jsx(Dropdown, { options: templateOptions.map((entry, index) => ({ label: entry.label, value: index })), placeholder: "Use template", onChange: (event) => setPrompt(templateOptions[Number(event.value)]?.prompt ?? '') })] })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Prompt" }), _jsx(InputTextarea, { rows: 6, value: prompt, onChange: (event) => setPrompt(event.target.value) })] }), _jsxs("label", { children: [_jsx(Checkbox, { checked: includeContext, onChange: (event) => setIncludeContext(Boolean(event.checked)) }), " Include current context"] }), _jsxs("div", { className: "inline-actions", style: { marginTop: '0.75rem' }, children: [_jsx(Button, { label: "Generate", onClick: generate }), _jsx(Button, { label: "Copy", severity: "secondary", onClick: () => { navigator.clipboard.writeText(response); onCopy?.(response); }, disabled: !response }), _jsx(Button, { label: "Insert", severity: "secondary", onClick: () => onInsert?.(response), disabled: !response || !onInsert }), _jsx(Button, { label: "Apply", severity: "success", onClick: () => onApply?.(response), disabled: !response || !onApply })] }), _jsxs("div", { className: "form-row", style: { marginTop: '0.75rem' }, children: [_jsx("label", { children: "Response" }), _jsx(InputTextarea, { rows: 10, value: response, onChange: (event) => setResponse(event.target.value) })] })] }));
}
