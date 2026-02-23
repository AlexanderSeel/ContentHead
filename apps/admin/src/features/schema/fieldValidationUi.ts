export type ContentFieldType =
  | 'text'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'reference'
  | 'json'
  | 'contentLink'
  | 'contentLinkList'
  | 'assetRef'
  | 'assetList';

export type ContentFieldDef = {
  key: string;
  label: string;
  type: ContentFieldType;
  required?: boolean;
  description?: string;
  validations?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    regex?: string;
    allowedValues?: string[];
  };
  uiConfig?: {
    placeholder?: string;
    helpText?: string;
    defaultValue?: unknown;
    multiline?: boolean;
    rows?: number;
    displayFormat?: string;
    section?: string;
  };
};

export const CONTENT_FIELD_TYPES: Array<{ label: string; value: ContentFieldType }> = [
  { label: 'Text', value: 'text' },
  { label: 'Rich Text', value: 'richtext' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date', value: 'date' },
  { label: 'Date & Time', value: 'datetime' },
  { label: 'Select', value: 'select' },
  { label: 'Multi Select', value: 'multiselect' },
  { label: 'Reference', value: 'reference' },
  { label: 'JSON', value: 'json' }
  ,
  { label: 'Content Link', value: 'contentLink' },
  { label: 'Content Link List', value: 'contentLinkList' },
  { label: 'Asset Reference', value: 'assetRef' },
  { label: 'Asset List', value: 'assetList' }
];

export function parseFieldsJson(value: string): ContentFieldDef[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((entry) => entry && typeof entry === 'object' && typeof entry.key === 'string')
      .map((entry) => {
        const typed = entry as ContentFieldDef;
        const result: ContentFieldDef = {
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
  } catch {
    return [];
  }
}

export function stringifyFieldsJson(fields: ContentFieldDef[]): string {
  return JSON.stringify(fields);
}

export function suggestFieldKey(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'field';
}

export function ensureUniqueFieldKey(candidate: string, fields: ContentFieldDef[], current?: string): string {
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
