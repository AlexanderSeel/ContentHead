export const CONTENT_FIELD_TYPES = [
    { label: 'Text', value: 'text' },
    { label: 'Rich Text', value: 'richtext' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Date', value: 'date' },
    { label: 'Date & Time', value: 'datetime' },
    { label: 'Select', value: 'select' },
    { label: 'Multi Select', value: 'multiselect' },
    { label: 'Reference', value: 'reference' },
    { label: 'JSON', value: 'json' },
    { label: 'Content Link', value: 'contentLink' },
    { label: 'Content Link List', value: 'contentLinkList' }
];
export function parseFieldsJson(value) {
    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed
            .filter((entry) => entry && typeof entry === 'object' && typeof entry.key === 'string')
            .map((entry) => {
            const typed = entry;
            const result = {
                key: typed.key,
                label: typed.label ?? typed.key,
                type: typed.type ?? 'text',
                required: Boolean(typed.required),
                validations: typed.validations ?? {},
                uiConfig: typed.uiConfig ?? {}
            };
            if (typeof typed.description === 'string' && typed.description) {
                result.description = typed.description;
            }
            return result;
        });
    }
    catch {
        return [];
    }
}
export function stringifyFieldsJson(fields) {
    return JSON.stringify(fields);
}
export function suggestFieldKey(label) {
    const slug = label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return slug || 'field';
}
export function ensureUniqueFieldKey(candidate, fields, current) {
    const normalized = suggestFieldKey(candidate);
    const existing = new Set(fields.filter((field) => field.key !== current).map((field) => field.key));
    let next = normalized;
    let idx = 1;
    while (existing.has(next)) {
        idx += 1;
        next = `${normalized}_${idx}`;
    }
    return next;
}
