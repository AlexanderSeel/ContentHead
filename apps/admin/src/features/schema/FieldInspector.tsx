import { Chips } from 'primereact/chips';

import { Accordion, AccordionItem, Checkbox, MultiSelect, NumberInput, Select, Textarea, TextInput } from '../../ui/atoms';

import {
  CONTENT_FIELD_TYPES,
  DEFAULT_RICH_TEXT_FEATURES,
  FULL_RICH_TEXT_FEATURES,
  RICH_TEXT_FEATURE_OPTIONS,
  ensureUniqueFieldKey,
  type ContentFieldDef,
  type RichTextFeature
} from './fieldValidationUi';

function replaceField(fields: ContentFieldDef[], key: string, next: ContentFieldDef): ContentFieldDef[] {
  return fields.map((entry) => (entry.key === key ? next : entry));
}

function cleanValidations(value: ContentFieldDef['validations']): NonNullable<ContentFieldDef['validations']> {
  const next: NonNullable<ContentFieldDef['validations']> = { ...(value ?? {}) };
  if (next.min == null) {
    delete next.min;
  }
  if (next.max == null) {
    delete next.max;
  }
  if (next.minLength == null) {
    delete next.minLength;
  }
  if (next.maxLength == null) {
    delete next.maxLength;
  }
  if (!next.regex) {
    delete next.regex;
  }
  if (!next.allowedValues || next.allowedValues.length === 0) {
    delete next.allowedValues;
  }
  return next;
}

function cleanUiConfig(value: ContentFieldDef['uiConfig']): NonNullable<ContentFieldDef['uiConfig']> {
  const next: NonNullable<ContentFieldDef['uiConfig']> = { ...(value ?? {}) };
  if (next.rows == null) {
    delete next.rows;
  }
  if (!next.displayFormat) {
    delete next.displayFormat;
  }
  if (!next.section) {
    delete next.section;
  }
  if (!next.richTextFeatures || next.richTextFeatures.length === 0) {
    delete next.richTextFeatures;
  }
  return next;
}

export function FieldInspector({
  selected,
  fields,
  onChange
}: {
  selected: ContentFieldDef | null;
  fields: ContentFieldDef[];
  onChange: (nextFields: ContentFieldDef[]) => void;
}) {
  if (!selected) {
    return <p className="muted">Select a field to edit properties.</p>;
  }

  const apply = (patch: Partial<ContentFieldDef>) => {
    onChange(replaceField(fields, selected.key, { ...selected, ...patch }));
  };

  const validations: NonNullable<ContentFieldDef['validations']> = cleanValidations(selected.validations ?? {});
  const uiConfig: NonNullable<ContentFieldDef['uiConfig']> = cleanUiConfig(selected.uiConfig ?? {});

  return (
    <div className="p-fluid">
      <Accordion activeIndex={0}>
        <AccordionItem header="Properties">
          <div className="form-row">
            <label>Key</label>
            <TextInput
              value={selected.key}
              onChange={(next) => {
                const nextKey = ensureUniqueFieldKey(next, fields, selected.key);
                onChange(fields.map((entry) => (entry.key === selected.key ? { ...selected, key: nextKey } : entry)));
              }}
            />
          </div>
          <div className="form-row">
            <label>Label</label>
            <TextInput value={selected.label} onChange={(next) => apply({ label: next })} />
          </div>
          <div className="form-row">
            <label>Description</label>
            <Textarea rows={2} value={selected.description ?? ''} onChange={(next) => apply({ description: next })} />
          </div>
          <div className="form-row">
            <label>Type</label>
            <Select value={selected.type} options={CONTENT_FIELD_TYPES} onChange={(next) => next && apply({ type: next as ContentFieldDef['type'] })} />
          </div>
          <div className="form-row">
            <label>Placeholder</label>
            <TextInput value={uiConfig.placeholder ?? ''} onChange={(next) => apply({ uiConfig: { ...uiConfig, placeholder: next } })} />
          </div>
          <div className="form-row">
            <label>Default Value</label>
            <TextInput
              value={uiConfig.defaultValue == null ? '' : String(uiConfig.defaultValue)}
              onChange={(next) => apply({ uiConfig: { ...uiConfig, defaultValue: next } })}
            />
          </div>
        </AccordionItem>

        <AccordionItem header="Validation">
          <label>
            <Checkbox checked={Boolean(selected.required)} onChange={(next) => apply({ required: next })} /> Required
          </label>
          <div className="form-grid">
            <div className="form-row">
              <label>Min</label>
              <NumberInput value={validations.min ?? null} onChange={(next) => apply({ validations: cleanValidations({ ...validations, ...(next == null ? {} : { min: next }) }) })} />
            </div>
            <div className="form-row">
              <label>Max</label>
              <NumberInput value={validations.max ?? null} onChange={(next) => apply({ validations: cleanValidations({ ...validations, ...(next == null ? {} : { max: next }) }) })} />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-row">
              <label>Min Length</label>
              <NumberInput value={validations.minLength ?? null} onChange={(next) => apply({ validations: cleanValidations({ ...validations, ...(next == null ? {} : { minLength: next }) }) })} />
            </div>
            <div className="form-row">
              <label>Max Length</label>
              <NumberInput value={validations.maxLength ?? null} onChange={(next) => apply({ validations: cleanValidations({ ...validations, ...(next == null ? {} : { maxLength: next }) }) })} />
            </div>
          </div>
          <div className="form-row">
            <label>Regex</label>
            <TextInput value={validations.regex ?? ''} onChange={(next) => apply({ validations: cleanValidations({ ...validations, ...(next ? { regex: next } : {}) }) })} />
          </div>
          <div className="form-row">
            <label>Allowed Values</label>
            <Chips value={validations.allowedValues ?? []} onChange={(event) => apply({ validations: cleanValidations({ ...validations, allowedValues: event.value as string[] }) })} separator="," />
          </div>
        </AccordionItem>

        <AccordionItem header="UI">
          <label>
            <Checkbox checked={Boolean(uiConfig.multiline)} onChange={(next) => apply({ uiConfig: { ...uiConfig, multiline: next } })} /> Multiline editor
          </label>
          {selected.type === 'richtext' ? (
            <div className="form-row">
              <label>Rich Text Features</label>
              <div className="inline-actions">
                <Select
                  value={
                    JSON.stringify(uiConfig.richTextFeatures ?? DEFAULT_RICH_TEXT_FEATURES) === JSON.stringify(DEFAULT_RICH_TEXT_FEATURES)
                      ? 'default'
                      : JSON.stringify(uiConfig.richTextFeatures ?? DEFAULT_RICH_TEXT_FEATURES) === JSON.stringify(FULL_RICH_TEXT_FEATURES)
                        ? 'full'
                        : 'custom'
                  }
                  options={[
                    { label: 'Preset: Default', value: 'default' },
                    { label: 'Preset: Full', value: 'full' },
                    { label: 'Preset: Custom', value: 'custom' }
                  ]}
                  onChange={(next) => {
                    if (next === 'default') {
                      apply({ uiConfig: cleanUiConfig({ ...uiConfig, richTextFeatures: [...DEFAULT_RICH_TEXT_FEATURES] }) });
                    } else if (next === 'full') {
                      apply({ uiConfig: cleanUiConfig({ ...uiConfig, richTextFeatures: [...FULL_RICH_TEXT_FEATURES] }) });
                    }
                  }}
                />
              </div>
              <MultiSelect
                value={uiConfig.richTextFeatures ?? DEFAULT_RICH_TEXT_FEATURES}
                options={RICH_TEXT_FEATURE_OPTIONS}
                onChange={(next) => apply({ uiConfig: cleanUiConfig({ ...uiConfig, richTextFeatures: next as RichTextFeature[] }) })}
                placeholder="Select toolbar features"
              />
              <small className="muted">Toolbar buttons and inline edit shortcuts.</small>
            </div>
          ) : null}
          <div className="form-grid">
            <div className="form-row">
              <label>Rows</label>
              <NumberInput value={uiConfig.rows ?? null} onChange={(next) => apply({ uiConfig: cleanUiConfig({ ...uiConfig, ...(next == null ? {} : { rows: next }) }) })} />
            </div>
            <div className="form-row">
              <label>Display Format</label>
              <TextInput value={uiConfig.displayFormat ?? ''} onChange={(next) => apply({ uiConfig: cleanUiConfig({ ...uiConfig, displayFormat: next }) })} />
            </div>
          </div>
          <div className="form-row">
            <label>Section</label>
            <TextInput value={uiConfig.section ?? ''} onChange={(next) => apply({ uiConfig: cleanUiConfig({ ...uiConfig, section: next }) })} />
          </div>
        </AccordionItem>

        <AccordionItem header="Advanced">
          <div className="form-row">
            <label>Validations JSON</label>
            <Textarea
              rows={4}
              value={JSON.stringify(validations, null, 2)}
              onChange={(next) => {
                try {
                  const parsed = JSON.parse(next) as ContentFieldDef['validations'];
                  apply({ validations: parsed ?? {} });
                } catch {
                  // keep invalid JSON local
                }
              }}
            />
          </div>
          <div className="form-row">
            <label>UI Config JSON</label>
            <Textarea
              rows={4}
              value={JSON.stringify(uiConfig, null, 2)}
              onChange={(next) => {
                try {
                  const parsed = JSON.parse(next) as ContentFieldDef['uiConfig'];
                  apply({ uiConfig: parsed ?? {} });
                } catch {
                  // keep invalid JSON local
                }
              }}
            />
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
