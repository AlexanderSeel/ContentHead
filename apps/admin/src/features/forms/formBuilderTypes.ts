import type { Rule } from '@contenthead/shared';

// ── Field / layout options ────────────────────────────────────────────────────

export const FIELD_OPTIONS = [
  { label: 'Text', value: 'text' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Number', value: 'number' },
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'phone' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Radio', value: 'radio' },
  { label: 'Select', value: 'select' },
  { label: 'MultiSelect', value: 'multiselect' },
  { label: 'Date', value: 'date' },
  { label: 'Consent', value: 'consent' }
] as const;

export const LAYOUT_ELEMENT_OPTIONS = [
  { label: 'Section Header', value: 'section' },
  { label: 'Divider', value: 'divider' },
  { label: 'Help Text', value: 'help_text' },
  { label: 'Spacer', value: 'spacer' }
] as const;

export const COMPARATORS = [
  { label: 'Equals', value: 'eq' },
  { label: 'Not Equals', value: 'neq' },
  { label: 'In', value: 'in' },
  { label: 'Contains', value: 'contains' },
  { label: 'Greater Than', value: 'gt' },
  { label: 'Less Than', value: 'lt' },
  { label: 'Regex', value: 'regex' }
] as const;

export const EMPTY_CONTEXT = '{"country":"US","segments":["default"]}';

// ── Derived types ─────────────────────────────────────────────────────────────

export type FieldType = (typeof FIELD_OPTIONS)[number]['value'] | (typeof LAYOUT_ELEMENT_OPTIONS)[number]['value'];
export type Comparator = (typeof COMPARATORS)[number]['value'];

// ── Data shapes ───────────────────────────────────────────────────────────────

export type FormRecord = {
  id: number;
  siteId: number;
  name: string;
  description?: string | null;
  active: boolean;
};

export type FormStep = {
  id: number;
  formId: number;
  name: string;
  position: number;
};

export type FormField = {
  id: number;
  stepId: number;
  formId: number;
  key: string;
  label: string;
  fieldType: string;
  position: number;
  conditionsJson: string;
  validationsJson: string;
  uiConfigJson: string;
  active: boolean;
};

export type FormConditionSet = {
  showIf?: Rule;
  requiredIf?: Rule;
  enabledIf?: Rule;
};

export type FormValidationSet = {
  required?: boolean;
  min?: number;
  max?: number;
  regex?: string;
  email?: boolean;
};

export type ComparatorRuleDraft = {
  field: string;
  op: Comparator;
  value: string;
};

// ── Utilities ─────────────────────────────────────────────────────────────────

export function parseJsonObject<T extends object>(value: string, fallback: T): T {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as T;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function normalizeFieldType(value: string): FieldType {
  const all = [...FIELD_OPTIONS, ...LAYOUT_ELEMENT_OPTIONS].map((entry) => entry.value);
  return (all.includes(value as FieldType) ? value : 'text') as FieldType;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function safeSlug(input: string): string {
  const token = input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return token || 'field';
}

export function toComparatorRuleDraft(rule: Rule | undefined): ComparatorRuleDraft {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
    return { field: 'country', op: 'eq', value: 'US' };
  }
  const op = (rule as { op?: Comparator }).op;
  const field = (rule as { field?: string }).field;
  const value = (rule as { value?: unknown }).value;
  const isComparator = typeof op === 'string' && typeof field === 'string';
  if (!isComparator) {
    return { field: 'country', op: 'eq', value: 'US' };
  }
  return {
    field,
    op: COMPARATORS.some((entry) => entry.value === op) ? op : 'eq',
    value: typeof value === 'string' ? value : JSON.stringify(value ?? '')
  };
}

export function toComparatorRule(draft: ComparatorRuleDraft): Rule {
  return {
    field: draft.field,
    op: draft.op,
    value: draft.op === 'in'
      ? draft.value.split(',').map((entry) => entry.trim()).filter(Boolean)
      : draft.value
  };
}
