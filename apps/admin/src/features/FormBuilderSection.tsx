
import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Sidebar } from 'primereact/sidebar';
import { TabPanel, TabView } from 'primereact/tabview';
import { evaluateFieldConditions, type Rule } from '@contenthead/shared';
import { RuleEditorDialog } from '../components/rules/RuleEditorDialog';

import { useAuth } from '../app/AuthContext';
import { createAdminSdk } from '../lib/sdk';
import {
  applyDesignerRows,
  buildDesignerRows,
  parseUiConfigJson,
  stringifyUiConfigJson,
  type DesignerRow
} from './forms/layoutModel';

const FIELD_OPTIONS = [
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

const LAYOUT_ELEMENT_OPTIONS = [
  { label: 'Section Header', value: 'section' },
  { label: 'Divider', value: 'divider' },
  { label: 'Help Text', value: 'help_text' },
  { label: 'Spacer', value: 'spacer' }
] as const;

const COMPARATORS = [
  { label: 'Equals', value: 'eq' },
  { label: 'Not Equals', value: 'neq' },
  { label: 'In', value: 'in' },
  { label: 'Contains', value: 'contains' },
  { label: 'Greater Than', value: 'gt' },
  { label: 'Less Than', value: 'lt' },
  { label: 'Regex', value: 'regex' }
] as const;

type FieldType = (typeof FIELD_OPTIONS)[number]['value'] | (typeof LAYOUT_ELEMENT_OPTIONS)[number]['value'];
type Comparator = (typeof COMPARATORS)[number]['value'];

type FormRecord = {
  id: number;
  siteId: number;
  name: string;
  description?: string | null;
  active: boolean;
};

type FormStep = {
  id: number;
  formId: number;
  name: string;
  position: number;
};

type FormField = {
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

type FormConditionSet = {
  showIf?: Rule;
  requiredIf?: Rule;
  enabledIf?: Rule;
};

type FormValidationSet = {
  required?: boolean;
  min?: number;
  max?: number;
  regex?: string;
  email?: boolean;
};

type ComparatorRuleDraft = {
  field: string;
  op: Comparator;
  value: string;
};

const EMPTY_CONTEXT = '{"country":"US","segments":["default"]}';

function parseJsonObject<T extends object>(value: string, fallback: T): T {
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

function normalizeFieldType(value: string): FieldType {
  const all = [...FIELD_OPTIONS, ...LAYOUT_ELEMENT_OPTIONS].map((entry) => entry.value);
  return (all.includes(value as FieldType) ? value : 'text') as FieldType;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safeSlug(input: string): string {
  const token = input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return token || 'field';
}

function toComparatorRuleDraft(rule: Rule | undefined): ComparatorRuleDraft {
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

function toComparatorRule(draft: ComparatorRuleDraft): Rule {
  return {
    field: draft.field,
    op: draft.op,
    value: draft.op === 'in'
      ? draft.value.split(',').map((entry) => entry.trim()).filter(Boolean)
      : draft.value
  };
}

function renderFieldInput(
  field: FormField,
  answers: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void,
  disabled: boolean,
  required: boolean,
  errors: Record<string, string>
) {
  const uiConfig = parseUiConfigJson(field.uiConfigJson);
  const placeholder = typeof uiConfig.placeholder === 'string' ? uiConfig.placeholder : '';
  const value = answers[field.key];

  if (field.fieldType === 'divider') {
    return <hr />;
  }
  if (field.fieldType === 'section') {
    return <h4>{field.label}</h4>;
  }
  if (field.fieldType === 'help_text') {
    return <small>{typeof uiConfig.helpText === 'string' ? uiConfig.helpText : field.label}</small>;
  }
  if (field.fieldType === 'spacer') {
    return <div style={{ height: 18 }} />;
  }

  if (field.fieldType === 'checkbox' || field.fieldType === 'consent') {
    return (
      <div>
        <label>
          <Checkbox checked={Boolean(value)} onChange={(event) => onChange(field.key, Boolean(event.checked))} disabled={disabled} />
          <span style={{ marginLeft: 8 }}>{field.label}{required ? ' *' : ''}</span>
        </label>
        {errors[field.key] ? <small className="error-text">{errors[field.key]}</small> : null}
      </div>
    );
  }

  if (field.fieldType === 'textarea') {
    return (
      <div className="form-row">
        <label>{field.label}{required ? ' *' : ''}</label>
        <InputTextarea
          rows={3}
          value={String(value ?? '')}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(field.key, event.target.value)}
        />
        {errors[field.key] ? <small className="error-text">{errors[field.key]}</small> : null}
      </div>
    );
  }

  return (
    <div className="form-row">
      <label>{field.label}{required ? ' *' : ''}</label>
      <InputText
        value={String(value ?? '')}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(field.key, event.target.value)}
      />
      {errors[field.key] ? <small className="error-text">{errors[field.key]}</small> : null}
    </div>
  );
}

export function FormBuilderSection({
  siteId,
  initialFormId,
  onStatus
}: {
  siteId: number;
  initialFormId?: number | null;
  onStatus: (value: string) => void;
}) {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);

  const [forms, setForms] = useState<FormRecord[]>([]);
  const [steps, setSteps] = useState<FormStep[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);

  const [formId, setFormId] = useState<number | null>(initialFormId ?? null);
  const [formName, setFormName] = useState('Lead Form');
  const [formDescription, setFormDescription] = useState('Basic lead form');
  const [formActive, setFormActive] = useState(true);

  const [stepName, setStepName] = useState('Step 1');
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [builderTab, setBuilderTab] = useState(0);
  const [inspectorTab, setInspectorTab] = useState(0);

  const [dirtyFieldIds, setDirtyFieldIds] = useState<Set<number>>(new Set());
  const [dirtyStepIds, setDirtyStepIds] = useState<Set<number>>(new Set());
  const [formDirty, setFormDirty] = useState(false);

  const [evaluateConditions, setEvaluateConditions] = useState(true);
  const [previewContextJson, setPreviewContextJson] = useState(EMPTY_CONTEXT);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, unknown>>({});
  const [showTestDrawer, setShowTestDrawer] = useState(false);
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [ruleEditorTarget, setRuleEditorTarget] = useState<keyof FormConditionSet>('showIf');

  const refreshFormDetails = async (id: number) => {
    const [stepRes, fieldRes] = await Promise.all([sdk.listFormSteps({ formId: id }), sdk.listFormFields({ formId: id })]);
    const nextSteps = (stepRes.listFormSteps ?? []) as FormStep[];
    const nextFields = (fieldRes.listFormFields ?? []) as FormField[];
    setSteps(nextSteps);
    setFields(nextFields);

    const nextStepId = nextSteps.some((step) => step.id === selectedStepId)
      ? selectedStepId
      : (nextSteps[0]?.id ?? null);
    setSelectedStepId(nextStepId);

    const scoped = nextFields.filter((field) => field.stepId === nextStepId);
    const nextFieldId = scoped.some((field) => field.id === selectedFieldId)
      ? selectedFieldId
      : (scoped[0]?.id ?? null);
    setSelectedFieldId(nextFieldId);

    setDirtyFieldIds(new Set());
    setDirtyStepIds(new Set());
    setFormDirty(false);
  };

  const refreshForms = async () => {
    const res = await sdk.listForms({ siteId });
    const next = (res.listForms ?? []) as FormRecord[];
    setForms(next);

    const selected = (initialFormId && next.some((entry) => entry.id === initialFormId))
      ? initialFormId
      : (formId && next.some((entry) => entry.id === formId) ? formId : (next[0]?.id ?? null));

    setFormId(selected);
    if (selected != null) {
      const form = next.find((entry) => entry.id === selected);
      setFormName(form?.name ?? '');
      setFormDescription(form?.description ?? '');
      setFormActive(Boolean(form?.active));
      await refreshFormDetails(selected);
    }
  };

  useEffect(() => {
    refreshForms().catch((error: unknown) => onStatus(String(error)));
  }, [siteId, token]);

  const scopedFields = useMemo(() => fields.filter((field) => field.stepId === selectedStepId), [fields, selectedStepId]);
  const selectedField = useMemo(() => scopedFields.find((field) => field.id === selectedFieldId) ?? null, [scopedFields, selectedFieldId]);

  const fieldKeyOptions = useMemo(
    () => fields.map((field) => ({ label: field.key, value: field.key })),
    [fields]
  );

  const layoutRows = useMemo(() => buildDesignerRows(scopedFields), [scopedFields]);

  const parsedConditions = useMemo<FormConditionSet>(() => {
    return selectedField ? parseJsonObject<FormConditionSet>(selectedField.conditionsJson, {}) : {};
  }, [selectedField]);

  const parsedValidations = useMemo<FormValidationSet>(() => {
    return selectedField ? parseJsonObject<FormValidationSet>(selectedField.validationsJson, {}) : {};
  }, [selectedField]);

  const parsedUiConfig = useMemo(() => {
    return selectedField ? parseUiConfigJson(selectedField.uiConfigJson) : parseUiConfigJson('{}');
  }, [selectedField]);

  const showIfDraft = useMemo(() => toComparatorRuleDraft(parsedConditions.showIf), [parsedConditions.showIf]);
  const requiredIfDraft = useMemo(() => toComparatorRuleDraft(parsedConditions.requiredIf), [parsedConditions.requiredIf]);
  const enabledIfDraft = useMemo(() => toComparatorRuleDraft(parsedConditions.enabledIf), [parsedConditions.enabledIf]);

  const computedPreview = useMemo(() => {
    const contextRaw = parseJsonObject<Record<string, unknown>>(previewContextJson, {});
    const context = {
      userId: typeof contextRaw.userId === 'string' ? contextRaw.userId : null,
      sessionId: typeof contextRaw.sessionId === 'string' ? contextRaw.sessionId : null,
      country: typeof contextRaw.country === 'string' ? contextRaw.country : null,
      device: typeof contextRaw.device === 'string' ? contextRaw.device : null,
      referrer: typeof contextRaw.referrer === 'string' ? contextRaw.referrer : null,
      segments: Array.isArray(contextRaw.segments) ? contextRaw.segments.filter((entry): entry is string => typeof entry === 'string') : [],
      query: contextRaw.query && typeof contextRaw.query === 'object' && !Array.isArray(contextRaw.query)
        ? (contextRaw.query as Record<string, string | number | boolean | null | undefined>)
        : {},
      answers: previewAnswers
    };

    const fieldErrors: Record<string, string> = {};

    const items = scopedFields.map((field) => {
      const conditions = parseJsonObject<FormConditionSet>(field.conditionsJson, {});
      const validations = parseJsonObject<FormValidationSet>(field.validationsJson, {});
      const behavior = evaluateConditions ? evaluateFieldConditions(conditions, context) : { visible: true, required: Boolean(validations.required), enabled: field.active };
      const value = previewAnswers[field.key];

      if (behavior.visible && behavior.required && (value === '' || value == null || value === false)) {
        fieldErrors[field.key] = 'Required field is missing';
      }
      if (behavior.visible && typeof value === 'string') {
        if (validations.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          fieldErrors[field.key] = 'Invalid email format';
        }
        if (typeof validations.regex === 'string' && validations.regex) {
          try {
            const regex = new RegExp(validations.regex);
            if (!regex.test(value)) {
              fieldErrors[field.key] = 'Regex validation failed';
            }
          } catch {
            fieldErrors[field.key] = 'Invalid regex';
          }
        }
      }

      return { field, behavior };
    });

    return {
      items,
      fieldErrors
    };
  }, [scopedFields, previewContextJson, previewAnswers, evaluateConditions]);

  const markFieldDirty = (id: number) => {
    setDirtyFieldIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const markStepDirty = (id: number) => {
    setDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const updateField = (id: number, updater: (field: FormField) => FormField) => {
    setFields((prev) => prev.map((field) => (field.id === id ? updater(field) : field)));
    markFieldDirty(id);
  };

  const updateFieldByKey = (field: FormField | null, patch: Partial<FormField>) => {
    if (!field) {
      return;
    }
    updateField(field.id, (current) => ({ ...current, ...patch }));
  };

  const saveForm = async () => {
    const res = await sdk.upsertForm({
      id: formId,
      siteId,
      name: formName,
      description: formDescription || null,
      active: formActive
    });
    const savedId = res.upsertForm?.id ?? null;
    setFormId(savedId);
    if (savedId != null) {
      await refreshForms();
    }
    onStatus('Form saved');
  };

  const saveAllDraftChanges = async () => {
    if (!formId) {
      return;
    }

    if (formDirty) {
      await sdk.upsertForm({
        id: formId,
        siteId,
        name: formName,
        description: formDescription || null,
        active: formActive
      });
    }

    for (const stepId of dirtyStepIds) {
      const step = steps.find((entry) => entry.id === stepId);
      if (!step) {
        continue;
      }
      await sdk.upsertFormStep({
        id: step.id,
        formId: step.formId,
        name: step.name,
        position: step.position
      });
    }

    for (const fieldId of dirtyFieldIds) {
      const field = fields.find((entry) => entry.id === fieldId);
      if (!field) {
        continue;
      }
      await sdk.upsertFormField({
        id: field.id,
        stepId: field.stepId,
        formId: field.formId,
        key: field.key,
        label: field.label,
        fieldType: field.fieldType,
        position: field.position,
        conditionsJson: field.conditionsJson,
        validationsJson: field.validationsJson,
        uiConfigJson: field.uiConfigJson,
        active: field.active
      });
    }

    await refreshFormDetails(formId);
    onStatus('Builder changes saved');
  };

  const addStep = async () => {
    if (!formId) {
      return;
    }
    const maxPosition = steps.reduce((max, step) => Math.max(max, step.position), 0);
    await sdk.upsertFormStep({
      formId,
      name: stepName.trim() || `Step ${steps.length + 1}`,
      position: maxPosition + 10
    });
    await refreshFormDetails(formId);
    onStatus('Step added');
  };

  const duplicateStep = async () => {
    if (!formId || !selectedStepId) {
      return;
    }
    const step = steps.find((entry) => entry.id === selectedStepId);
    if (!step) {
      return;
    }

    const created = await sdk.upsertFormStep({
      formId,
      name: `${step.name} Copy`,
      position: step.position + 5
    });
    const newStepId = created.upsertFormStep?.id;
    if (!newStepId) {
      return;
    }

    const existingKeys = new Set(fields.map((field) => field.key));
    const sourceFields = fields.filter((field) => field.stepId === step.id);
    for (const source of sourceFields) {
      const keyBase = `${safeSlug(source.key)}_copy`;
      let nextKey = keyBase;
      let suffix = 1;
      while (existingKeys.has(nextKey)) {
        suffix += 1;
        nextKey = `${keyBase}_${suffix}`;
      }
      existingKeys.add(nextKey);

      await sdk.upsertFormField({
        stepId: newStepId,
        formId,
        key: nextKey,
        label: source.label,
        fieldType: source.fieldType,
        position: source.position,
        conditionsJson: source.conditionsJson,
        validationsJson: source.validationsJson,
        uiConfigJson: source.uiConfigJson,
        active: source.active
      });
    }

    await refreshFormDetails(formId);
    setSelectedStepId(newStepId);
    onStatus('Step duplicated');
  };

  const deleteStep = async (stepId: number) => {
    await sdk.deleteFormStep({ id: stepId });
    if (formId) {
      await refreshFormDetails(formId);
    }
    onStatus('Step deleted');
  };

  const reorderStep = (stepId: number, direction: -1 | 1) => {
    const sorted = [...steps].sort((a, b) => a.position - b.position || a.id - b.id);
    const index = sorted.findIndex((entry) => entry.id === stepId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) {
      return;
    }

    const next = [...sorted];
    const [current] = next.splice(index, 1);
    if (!current) {
      return;
    }
    next.splice(target, 0, current);

    setSteps(next.map((step, idx) => ({ ...step, position: (idx + 1) * 10 })));
    next.forEach((step) => markStepDirty(step.id));
  };

  const createField = async (fieldType: FieldType) => {
    if (!formId || !selectedStepId) {
      return;
    }

    const keyBase = safeSlug(fieldType);
    const existing = new Set(fields.map((field) => field.key));
    let key = keyBase;
    let suffix = 1;
    while (existing.has(key)) {
      suffix += 1;
      key = `${keyBase}_${suffix}`;
    }

    const nextPosition = scopedFields.reduce((max, field) => Math.max(max, field.position), 0) + 10;
    const uiConfig = stringifyUiConfigJson({
      placeholder: fieldType === 'email' ? 'you@example.com' : '',
      helpText: fieldType === 'help_text' ? 'Helpful text' : '',
      layout: {
        row: layoutRows.length,
        order: 0,
        span: fieldType === 'divider' || fieldType === 'section' || fieldType === 'help_text' ? 12 : 6
      }
    });

    const res = await sdk.upsertFormField({
      formId,
      stepId: selectedStepId,
      key,
      label: fieldType === 'help_text' ? 'Help Text' : fieldType.replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
      fieldType,
      position: nextPosition,
      conditionsJson: '{}',
      validationsJson: '{}',
      uiConfigJson: uiConfig,
      active: true
    });

    const createdId = res.upsertFormField?.id ?? null;
    await refreshFormDetails(formId);
    setSelectedFieldId(createdId);
    onStatus('Field added');
  };

  const duplicateField = async (field: FormField) => {
    if (!formId) {
      return;
    }
    const keyBase = `${safeSlug(field.key)}_copy`;
    const existing = new Set(fields.map((entry) => entry.key));
    let key = keyBase;
    let suffix = 1;
    while (existing.has(key)) {
      suffix += 1;
      key = `${keyBase}_${suffix}`;
    }

    await sdk.upsertFormField({
      stepId: field.stepId,
      formId,
      key,
      label: `${field.label} Copy`,
      fieldType: field.fieldType,
      position: field.position + 5,
      conditionsJson: field.conditionsJson,
      validationsJson: field.validationsJson,
      uiConfigJson: field.uiConfigJson,
      active: field.active
    });

    await refreshFormDetails(formId);
    onStatus('Field duplicated');
  };

  const deleteField = async (field: FormField) => {
    await sdk.deleteFormField({ id: field.id });
    if (formId) {
      await refreshFormDetails(formId);
    }
    onStatus('Field deleted');
  };

  const onDesignerDrop = (event: DragEvent<HTMLDivElement>, rowIndex: number, insertIndex: number) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData('application/x-contenthead-form');
    if (!payload) {
      return;
    }

    try {
      const parsed = JSON.parse(payload) as { source: 'palette'; fieldType: FieldType } | { source: 'field'; fieldId: number };
      if (parsed.source === 'palette') {
        createField(parsed.fieldType).catch((error: unknown) => onStatus(String(error)));
        return;
      }

      const field = scopedFields.find((entry) => entry.id === parsed.fieldId);
      if (!field) {
        return;
      }

      const nextRows: DesignerRow[] = layoutRows.map((row) => ({ row: row.row, items: [...row.items] }));
      let sourceRow = -1;
      let sourceIndex = -1;
      nextRows.forEach((row, rowPos) => {
        const idx = row.items.findIndex((item) => item.fieldId === field.id);
        if (idx >= 0) {
          sourceRow = rowPos;
          sourceIndex = idx;
        }
      });

      if (sourceRow < 0 || sourceIndex < 0) {
        return;
      }

      const [moving] = nextRows[sourceRow]?.items.splice(sourceIndex, 1) ?? [];
      if (!moving) {
        return;
      }

      while (nextRows.length <= rowIndex) {
        nextRows.push({ row: nextRows.length, items: [] });
      }
      const targetRow = nextRows[rowIndex];
      if (!targetRow) {
        return;
      }

      const insertion = clamp(insertIndex, 0, targetRow.items.length);
      targetRow.items.splice(insertion, 0, moving);

      const compactRows = nextRows.filter((row) => row.items.length > 0).map((row, idx) => ({ row: idx, items: row.items }));
      const updatedStepFields = applyDesignerRows(scopedFields, compactRows);
      setFields((prev) => prev.map((entry) => updatedStepFields.find((candidate) => candidate.id === entry.id) ?? entry));
      updatedStepFields.forEach((entry) => markFieldDirty(entry.id));
    } catch {
      // ignore invalid payload
    }
  };

  const setFieldSpan = (field: FormField, span: number) => {
    const config = parseUiConfigJson(field.uiConfigJson);
    const layout = config.layout ?? { row: 0, order: 0, span: 12 };
    const next = stringifyUiConfigJson({
      ...config,
      layout: {
        ...layout,
        span: clamp(span, 1, 12)
      }
    });
    updateFieldByKey(field, { uiConfigJson: next });
  };

  const patchSelectedValidation = (patch: Partial<FormValidationSet>) => {
    if (!selectedField) {
      return;
    }
    const current = parseJsonObject<FormValidationSet>(selectedField.validationsJson, {});
    const merged: FormValidationSet = { ...current, ...patch };
    if (merged.min == null) {
      delete merged.min;
    }
    if (merged.max == null) {
      delete merged.max;
    }
    if (!merged.regex) {
      delete merged.regex;
    }
    updateField(selectedField.id, (field) => ({
      ...field,
      validationsJson: JSON.stringify(merged)
    }));
  };

  const patchSelectedCondition = (key: keyof FormConditionSet, draft: ComparatorRuleDraft) => {
    if (!selectedField) {
      return;
    }
    const current = parseJsonObject<FormConditionSet>(selectedField.conditionsJson, {});
    updateField(selectedField.id, (field) => ({
      ...field,
      conditionsJson: JSON.stringify({ ...current, [key]: toComparatorRule(draft) })
    }));
  };

  const patchSelectedUiConfig = (patch: Record<string, unknown>) => {
    if (!selectedField) {
      return;
    }
    const current = parseUiConfigJson(selectedField.uiConfigJson);
    updateField(selectedField.id, (field) => ({
      ...field,
      uiConfigJson: stringifyUiConfigJson({ ...current, ...patch })
    }));
  };

  return (
    <section className="form-builder-v2">
      <div className="form-builder-top-actions">
        <Dropdown
          value={formId}
          options={forms.map((entry) => ({ label: `${entry.name} (#${entry.id})`, value: entry.id }))}
          onChange={(event) => {
            const selected = Number(event.value);
            const form = forms.find((entry) => entry.id === selected);
            setFormId(selected);
            setFormName(form?.name ?? '');
            setFormDescription(form?.description ?? '');
            setFormActive(Boolean(form?.active));
            refreshFormDetails(selected).catch((error: unknown) => onStatus(String(error)));
          }}
          placeholder="Select form"
        />
        <InputText value={formName} onChange={(event) => { setFormName(event.target.value); setFormDirty(true); }} placeholder="Form name" />
        <InputText value={formDescription} onChange={(event) => { setFormDescription(event.target.value); setFormDirty(true); }} placeholder="Description" />
        <label><Checkbox checked={formActive} onChange={(event) => { setFormActive(Boolean(event.checked)); setFormDirty(true); }} /> Active</label>
        <Button label="Save" onClick={() => saveAllDraftChanges().catch((error: unknown) => onStatus(String(error)))} />
        <Button label={formActive ? 'Deactivate' : 'Activate'} severity="secondary" onClick={() => {
          setFormActive((prev) => !prev);
          setFormDirty(true);
        }} />
        <Button label="Duplicate Step" severity="secondary" onClick={() => duplicateStep().catch((error: unknown) => onStatus(String(error)))} disabled={!selectedStepId} />
        <Button label="Save Form Only" text onClick={() => saveForm().catch((error: unknown) => onStatus(String(error)))} />
        <Button label="Test Answers" text onClick={() => setShowTestDrawer(true)} />
      </div>

      <div className="form-builder-layout">
        <aside className="form-builder-sidebar-left">
          <h4>Steps</h4>
          <div className="form-row">
            <InputText value={stepName} onChange={(event) => setStepName(event.target.value)} placeholder="New step name" />
            <Button label="Add Step" onClick={() => addStep().catch((error: unknown) => onStatus(String(error)))} disabled={!formId} />
          </div>

          <DataTable value={[...steps].sort((a, b) => a.position - b.position || a.id - b.id)} size="small" selectionMode="single" selection={steps.find((step) => step.id === selectedStepId) ?? null} onSelectionChange={(event) => {
            const next = event.value as FormStep | null;
            setSelectedStepId(next?.id ?? null);
          }}>
            <Column field="name" header="Step" />
            <Column
              header="Order"
              body={(row: FormStep) => (
                <div className="inline-actions">
                  <Button text size="small" icon="pi pi-angle-up" onClick={() => reorderStep(row.id, -1)} />
                  <Button text size="small" icon="pi pi-angle-down" onClick={() => reorderStep(row.id, 1)} />
                </div>
              )}
            />
            <Column
              header="Delete"
              body={(row: FormStep) => (
                <Button text severity="danger" size="small" label="Remove" onClick={() => deleteStep(row.id).catch((error: unknown) => onStatus(String(error)))} />
              )}
            />
          </DataTable>

          <h4>Field Palette</h4>
          <div className="palette-grid">
            {FIELD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="palette-item"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/x-contenthead-form', JSON.stringify({ source: 'palette', fieldType: option.value }));
                }}
                onClick={() => createField(option.value).catch((error: unknown) => onStatus(String(error)))}
                disabled={!selectedStepId}
              >
                {option.label}
              </button>
            ))}
          </div>

          <h4>Layout Elements</h4>
          <div className="palette-grid">
            {LAYOUT_ELEMENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="palette-item"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/x-contenthead-form', JSON.stringify({ source: 'palette', fieldType: option.value }));
                }}
                onClick={() => createField(option.value).catch((error: unknown) => onStatus(String(error)))}
                disabled={!selectedStepId}
              >
                {option.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="form-builder-center">
          <TabView activeIndex={builderTab} onTabChange={(event) => setBuilderTab(event.index)}>
            <TabPanel header="Designer">
              <div className="designer-header">
                <h4>{steps.find((entry) => entry.id === selectedStepId)?.name ?? 'Select step'}</h4>
                <small>12-column grid. Drag from palette or drag cards to reorder.</small>
              </div>

              <div className="designer-canvas" onDragOver={(event) => event.preventDefault()}>
                {(layoutRows.length ? layoutRows : [{ row: 0, items: [] }]).map((row, rowIndex) => (
                  <div key={`row-${rowIndex}`} className="designer-row">
                    {row.items.map((item, itemIndex) => {
                      const field = scopedFields.find((entry) => entry.id === item.fieldId);
                      if (!field) {
                        return null;
                      }
                      const ui = parseUiConfigJson(field.uiConfigJson);
                      const previewText = typeof ui.placeholder === 'string' ? ui.placeholder : '';
                      return (
                        <div key={field.id} className="designer-slot" style={{ gridColumn: `span ${clamp(item.span, 1, 12)}` }}>
                          <div
                            className={`drop-slot ${selectedFieldId === field.id ? 'selected' : ''}`}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => onDesignerDrop(event, rowIndex, itemIndex)}
                          />
                          <div
                            className={`designer-card ${selectedFieldId === field.id ? 'selected' : ''}`}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData('application/x-contenthead-form', JSON.stringify({ source: 'field', fieldId: field.id }));
                            }}
                            onClick={() => setSelectedFieldId(field.id)}
                          >
                            <div className="designer-card-head">
                              <span className="drag-handle" aria-hidden="true">::</span>
                              <strong>{field.label}</strong>
                              <span className="muted">({field.fieldType})</span>
                            </div>
                            <div className="designer-card-body">
                              <small>{previewText || 'No placeholder'}</small>
                            </div>
                            <div className="designer-card-actions">
                              <Dropdown
                                value={clamp(item.span, 1, 12)}
                                options={Array.from({ length: 12 }).map((_, idx) => ({ label: `Span ${idx + 1}`, value: idx + 1 }))}
                                onChange={(event) => setFieldSpan(field, Number(event.value))}
                              />
                              <Button text size="small" label={parseJsonObject<FormValidationSet>(field.validationsJson, {}).required ? 'Req On' : 'Req Off'} onClick={() => {
                                const validations = parseJsonObject<FormValidationSet>(field.validationsJson, {});
                                updateField(field.id, (current) => ({ ...current, validationsJson: JSON.stringify({ ...validations, required: !Boolean(validations.required) }) }));
                              }} />
                              <Button text size="small" icon="pi pi-copy" onClick={() => duplicateField(field).catch((error: unknown) => onStatus(String(error)))} />
                              <Button text severity="danger" size="small" icon="pi pi-trash" onClick={() => deleteField(field).catch((error: unknown) => onStatus(String(error)))} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="drop-slot end" onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDesignerDrop(event, rowIndex, row.items.length)} />
                  </div>
                ))}
                <div className="drop-slot canvas-end" onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDesignerDrop(event, layoutRows.length, 0)}>
                  Drop here to create a new row
                </div>
              </div>
            </TabPanel>

            <TabPanel header="Preview">
              <div className="preview-toolbar">
                <label>
                  <Checkbox checked={evaluateConditions} onChange={(event) => setEvaluateConditions(Boolean(event.checked))} /> Evaluate conditions
                </label>
                <Button label="Test with answers" onClick={() => setShowTestDrawer(true)} text />
              </div>
              <div className="form-row">
                <label>Simulate context (JSON)</label>
                <InputTextarea rows={4} value={previewContextJson} onChange={(event) => setPreviewContextJson(event.target.value)} />
              </div>

              {layoutRows.map((row, rowIndex) => (
                <div key={`preview-row-${rowIndex}`} className="preview-row-grid">
                  {row.items.map((item) => {
                    const match = computedPreview.items.find((entry) => entry.field.id === item.fieldId);
                    if (!match || !match.behavior.visible) {
                      return null;
                    }
                    return (
                      <div key={item.fieldId} className="preview-field" style={{ gridColumn: `span ${clamp(item.span, 1, 12)}` }}>
                        {renderFieldInput(
                          match.field,
                          previewAnswers,
                          (key, value) => setPreviewAnswers((prev) => ({ ...prev, [key]: value })),
                          !match.behavior.enabled,
                          match.behavior.required,
                          computedPreview.fieldErrors
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </TabPanel>

            <TabPanel header="Structure">
              <p className="muted">Structure edits sync directly into Designer layout metadata.</p>

              <h4>Steps</h4>
              <DataTable value={[...steps].sort((a, b) => a.position - b.position || a.id - b.id)} size="small">
                <Column field="id" header="ID" />
                <Column field="name" header="Name" body={(row: FormStep) => (
                  <InputText
                    value={row.name}
                    onChange={(event) => {
                      const nextName = event.target.value;
                      setSteps((prev) => prev.map((step) => step.id === row.id ? { ...step, name: nextName } : step));
                      markStepDirty(row.id);
                    }}
                  />
                )} />
                <Column field="position" header="Position" />
              </DataTable>

              <h4>Fields</h4>
              <DataTable value={[...scopedFields].sort((a, b) => a.position - b.position || a.id - b.id)} size="small" selectionMode="single" selection={selectedField ?? null} onSelectionChange={(event) => {
                const next = event.value as FormField | null;
                setSelectedFieldId(next?.id ?? null);
              }}>
                <Column field="id" header="ID" />
                <Column field="key" header="Key" />
                <Column field="label" header="Label" />
                <Column field="fieldType" header="Type" />
                <Column field="position" header="Position" />
                <Column
                  header="Quick"
                  body={(row: FormField) => (
                    <div className="inline-actions">
                      <Button text size="small" label="Select" onClick={() => setSelectedFieldId(row.id)} />
                      <Button text severity="danger" size="small" label="Delete" onClick={() => deleteField(row).catch((error: unknown) => onStatus(String(error)))} />
                    </div>
                  )}
                />
              </DataTable>
            </TabPanel>
          </TabView>
        </main>

        <aside className="form-builder-sidebar-right">
          <h4>Inspector</h4>
          {!selectedField ? <p className="muted">Select a field on the canvas.</p> : (
            <TabView activeIndex={inspectorTab} onTabChange={(event) => setInspectorTab(event.index)}>
              <TabPanel header="Properties">
                <div className="form-row">
                  <label>Key</label>
                  <InputText
                    value={selectedField.key}
                    onChange={(event) => {
                      const next = safeSlug(event.target.value);
                      const duplicate = fields.some((field) => field.id !== selectedField.id && field.key === next);
                      if (duplicate) {
                        onStatus(`Field key ${next} already exists`);
                        return;
                      }
                      updateFieldByKey(selectedField, { key: next });
                    }}
                  />
                </div>
                <div className="form-row">
                  <label>Label</label>
                  <InputText value={selectedField.label} onChange={(event) => updateFieldByKey(selectedField, { label: event.target.value })} />
                </div>
                <div className="form-row">
                  <label>Help Text</label>
                  <InputTextarea rows={2} value={typeof parsedUiConfig.helpText === 'string' ? parsedUiConfig.helpText : ''} onChange={(event) => patchSelectedUiConfig({ helpText: event.target.value })} />
                </div>
                <div className="form-row">
                  <label>Placeholder</label>
                  <InputText value={typeof parsedUiConfig.placeholder === 'string' ? parsedUiConfig.placeholder : ''} onChange={(event) => patchSelectedUiConfig({ placeholder: event.target.value })} />
                </div>
                <div className="form-row">
                  <label>Default Value</label>
                  <InputText value={typeof parsedUiConfig.defaultValue === 'string' ? parsedUiConfig.defaultValue : ''} onChange={(event) => patchSelectedUiConfig({ defaultValue: event.target.value })} />
                </div>
                <div className="form-row">
                  <label>Field Type</label>
                  <Dropdown
                    value={normalizeFieldType(selectedField.fieldType)}
                    options={[...FIELD_OPTIONS, ...LAYOUT_ELEMENT_OPTIONS]}
                    onChange={(event) => updateFieldByKey(selectedField, { fieldType: String(event.value) })}
                  />
                </div>
                <div className="form-row">
                  <label>Layout Span</label>
                  <Dropdown
                    value={parsedUiConfig.layout?.span ?? 12}
                    options={Array.from({ length: 12 }).map((_, idx) => ({ label: String(idx + 1), value: idx + 1 }))}
                    onChange={(event) => {
                      const current = parsedUiConfig.layout ?? { row: 0, order: 0, span: 12 };
                      patchSelectedUiConfig({ layout: { ...current, span: Number(event.value) } });
                    }}
                  />
                </div>
                <div className="form-grid">
                  <div className="form-row">
                    <label>Span MD</label>
                    <InputNumber value={parsedUiConfig.layout?.spanMd ?? null} onValueChange={(event) => {
                      const current = parsedUiConfig.layout ?? { row: 0, order: 0, span: 12 };
                      const nextLayout: Record<string, unknown> = { ...current };
                      if (event.value == null) {
                        delete nextLayout.spanMd;
                      } else {
                        nextLayout.spanMd = event.value;
                      }
                      patchSelectedUiConfig({ layout: nextLayout });
                    }} />
                  </div>
                  <div className="form-row">
                    <label>Span LG</label>
                    <InputNumber value={parsedUiConfig.layout?.spanLg ?? null} onValueChange={(event) => {
                      const current = parsedUiConfig.layout ?? { row: 0, order: 0, span: 12 };
                      const nextLayout: Record<string, unknown> = { ...current };
                      if (event.value == null) {
                        delete nextLayout.spanLg;
                      } else {
                        nextLayout.spanLg = event.value;
                      }
                      patchSelectedUiConfig({ layout: nextLayout });
                    }} />
                  </div>
                </div>
              </TabPanel>

              <TabPanel header="Validation">
                <label>
                  <Checkbox checked={Boolean(parsedValidations.required)} onChange={(event) => patchSelectedValidation({ required: Boolean(event.checked) })} /> Required
                </label>
                <div className="form-grid">
                  <div className="form-row">
                    <label>Min</label>
                    <InputNumber value={parsedValidations.min ?? null} onValueChange={(event) => patchSelectedValidation(event.value == null ? {} : { min: event.value })} />
                  </div>
                  <div className="form-row">
                    <label>Max</label>
                    <InputNumber value={parsedValidations.max ?? null} onValueChange={(event) => patchSelectedValidation(event.value == null ? {} : { max: event.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <label>Regex</label>
                  <InputText value={parsedValidations.regex ?? ''} onChange={(event) => patchSelectedValidation(event.target.value ? { regex: event.target.value } : {})} />
                </div>
                <label>
                  <Checkbox checked={Boolean(parsedValidations.email)} onChange={(event) => patchSelectedValidation({ email: Boolean(event.checked) })} /> Email format
                </label>
              </TabPanel>

              <TabPanel header="Conditions">
                <div className="inline-actions">
                  <Button text label="Edit Show If" onClick={() => { setRuleEditorTarget('showIf'); setRuleEditorOpen(true); }} />
                  <Button text label="Edit Required If" onClick={() => { setRuleEditorTarget('requiredIf'); setRuleEditorOpen(true); }} />
                  <Button text label="Edit Enabled If" onClick={() => { setRuleEditorTarget('enabledIf'); setRuleEditorOpen(true); }} />
                </div>
                <div className="form-row">
                  <label>Show If</label>
                  <Dropdown value={showIfDraft.field} options={fieldKeyOptions} onChange={(event) => patchSelectedCondition('showIf', { ...showIfDraft, field: String(event.value) })} />
                  <Dropdown value={showIfDraft.op} options={[...COMPARATORS]} onChange={(event) => patchSelectedCondition('showIf', { ...showIfDraft, op: event.value as Comparator })} />
                  <InputText value={showIfDraft.value} onChange={(event) => patchSelectedCondition('showIf', { ...showIfDraft, value: event.target.value })} />
                </div>
                <div className="form-row">
                  <label>Required If</label>
                  <Dropdown value={requiredIfDraft.field} options={fieldKeyOptions} onChange={(event) => patchSelectedCondition('requiredIf', { ...requiredIfDraft, field: String(event.value) })} />
                  <Dropdown value={requiredIfDraft.op} options={[...COMPARATORS]} onChange={(event) => patchSelectedCondition('requiredIf', { ...requiredIfDraft, op: event.value as Comparator })} />
                  <InputText value={requiredIfDraft.value} onChange={(event) => patchSelectedCondition('requiredIf', { ...requiredIfDraft, value: event.target.value })} />
                </div>
                <div className="form-row">
                  <label>Enabled If</label>
                  <Dropdown value={enabledIfDraft.field} options={fieldKeyOptions} onChange={(event) => patchSelectedCondition('enabledIf', { ...enabledIfDraft, field: String(event.value) })} />
                  <Dropdown value={enabledIfDraft.op} options={[...COMPARATORS]} onChange={(event) => patchSelectedCondition('enabledIf', { ...enabledIfDraft, op: event.value as Comparator })} />
                  <InputText value={enabledIfDraft.value} onChange={(event) => patchSelectedCondition('enabledIf', { ...enabledIfDraft, value: event.target.value })} />
                </div>
              </TabPanel>

              <TabPanel header="Advanced">
                <div className="form-row">
                  <label>uiConfig JSON</label>
                  <InputTextarea rows={8} value={selectedField.uiConfigJson} onChange={(event) => updateFieldByKey(selectedField, { uiConfigJson: event.target.value })} />
                </div>
                <div className="form-row">
                  <label>validations JSON</label>
                  <InputTextarea rows={6} value={selectedField.validationsJson} onChange={(event) => updateFieldByKey(selectedField, { validationsJson: event.target.value })} />
                </div>
              </TabPanel>
            </TabView>
          )}
        </aside>
      </div>

      <Sidebar position="right" visible={showTestDrawer} onHide={() => setShowTestDrawer(false)} style={{ width: '32rem' }}>
        <h3>Test with Answers</h3>
        <p className="muted">Answers drive condition and validation preview.</p>
        {scopedFields.map((field) => (
          <div className="form-row" key={`drawer-${field.id}`}>
            <label>{field.label} ({field.key})</label>
            <InputText value={String(previewAnswers[field.key] ?? '')} onChange={(event) => setPreviewAnswers((prev) => ({ ...prev, [field.key]: event.target.value }))} />
          </div>
        ))}
      </Sidebar>
      <RuleEditorDialog
        visible={ruleEditorOpen}
        initialRule={parsedConditions[ruleEditorTarget]}
        fields={fieldKeyOptions}
        onHide={() => setRuleEditorOpen(false)}
        onApply={(rule) => {
          if (!selectedField) {
            return;
          }
          const current = parseJsonObject<FormConditionSet>(selectedField.conditionsJson, {});
          updateField(selectedField.id, (field) => ({
            ...field,
            conditionsJson: JSON.stringify({ ...current, [ruleEditorTarget]: rule })
          }));
          setRuleEditorOpen(false);
        }}
      />
    </section>
  );
}
