import { Accordion, AccordionTab } from 'primereact/accordion';
import { Checkbox } from 'primereact/checkbox';
import { Chips } from 'primereact/chips';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

import { CONTENT_FIELD_TYPES, ensureUniqueFieldKey, type ContentFieldDef } from './fieldValidationUi';

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
        <AccordionTab header="Properties">
          <div className="form-row">
            <label>Key</label>
            <InputText
              value={selected.key}
              onChange={(event) => {
                const nextKey = ensureUniqueFieldKey(event.target.value, fields, selected.key);
                onChange(fields.map((entry) => (entry.key === selected.key ? { ...selected, key: nextKey } : entry)));
              }}
            />
          </div>
          <div className="form-row">
            <label>Label</label>
            <InputText value={selected.label} onChange={(event) => apply({ label: event.target.value })} />
          </div>
          <div className="form-row">
            <label>Description</label>
            <InputTextarea rows={2} value={selected.description ?? ''} onChange={(event) => apply({ description: event.target.value })} />
          </div>
          <div className="form-row">
            <label>Type</label>
            <Dropdown value={selected.type} options={CONTENT_FIELD_TYPES} onChange={(event) => apply({ type: event.value })} />
          </div>
          <div className="form-row">
            <label>Placeholder</label>
            <InputText value={uiConfig.placeholder ?? ''} onChange={(event) => apply({ uiConfig: { ...uiConfig, placeholder: event.target.value } })} />
          </div>
          <div className="form-row">
            <label>Default Value</label>
            <InputText
              value={uiConfig.defaultValue == null ? '' : String(uiConfig.defaultValue)}
              onChange={(event) => apply({ uiConfig: { ...uiConfig, defaultValue: event.target.value } })}
            />
          </div>
        </AccordionTab>

        <AccordionTab header="Validation">
          <label>
            <Checkbox checked={Boolean(selected.required)} onChange={(event) => apply({ required: Boolean(event.checked) })} /> Required
          </label>
          <div className="form-grid">
            <div className="form-row">
              <label>Min</label>
              <InputNumber value={validations.min ?? null} onValueChange={(event) => apply({ validations: cleanValidations({ ...validations, ...(event.value == null ? {} : { min: event.value }) }) })} />
            </div>
            <div className="form-row">
              <label>Max</label>
              <InputNumber value={validations.max ?? null} onValueChange={(event) => apply({ validations: cleanValidations({ ...validations, ...(event.value == null ? {} : { max: event.value }) }) })} />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-row">
              <label>Min Length</label>
              <InputNumber value={validations.minLength ?? null} onValueChange={(event) => apply({ validations: cleanValidations({ ...validations, ...(event.value == null ? {} : { minLength: event.value }) }) })} />
            </div>
            <div className="form-row">
              <label>Max Length</label>
              <InputNumber value={validations.maxLength ?? null} onValueChange={(event) => apply({ validations: cleanValidations({ ...validations, ...(event.value == null ? {} : { maxLength: event.value }) }) })} />
            </div>
          </div>
          <div className="form-row">
            <label>Regex</label>
            <InputText value={validations.regex ?? ''} onChange={(event) => apply({ validations: cleanValidations({ ...validations, ...(event.target.value ? { regex: event.target.value } : {}) }) })} />
          </div>
          <div className="form-row">
            <label>Allowed Values</label>
            <Chips value={validations.allowedValues ?? []} onChange={(event) => apply({ validations: cleanValidations({ ...validations, allowedValues: event.value as string[] }) })} separator="," />
          </div>
        </AccordionTab>

        <AccordionTab header="UI">
          <label>
            <Checkbox checked={Boolean(uiConfig.multiline)} onChange={(event) => apply({ uiConfig: { ...uiConfig, multiline: Boolean(event.checked) } })} /> Multiline editor
          </label>
          <div className="form-grid">
            <div className="form-row">
              <label>Rows</label>
              <InputNumber value={uiConfig.rows ?? null} onValueChange={(event) => apply({ uiConfig: cleanUiConfig({ ...uiConfig, ...(event.value == null ? {} : { rows: event.value }) }) })} />
            </div>
            <div className="form-row">
              <label>Display Format</label>
              <InputText value={uiConfig.displayFormat ?? ''} onChange={(event) => apply({ uiConfig: cleanUiConfig({ ...uiConfig, displayFormat: event.target.value }) })} />
            </div>
          </div>
          <div className="form-row">
            <label>Section</label>
            <InputText value={uiConfig.section ?? ''} onChange={(event) => apply({ uiConfig: cleanUiConfig({ ...uiConfig, section: event.target.value }) })} />
          </div>
        </AccordionTab>

        <AccordionTab header="Advanced">
          <div className="form-row">
            <label>Validations JSON</label>
            <InputTextarea
              rows={4}
              value={JSON.stringify(validations, null, 2)}
              onChange={(event) => {
                try {
                  const parsed = JSON.parse(event.target.value) as ContentFieldDef['validations'];
                  apply({ validations: parsed ?? {} });
                } catch {
                  // keep invalid JSON local
                }
              }}
            />
          </div>
          <div className="form-row">
            <label>UI Config JSON</label>
            <InputTextarea
              rows={4}
              value={JSON.stringify(uiConfig, null, 2)}
              onChange={(event) => {
                try {
                  const parsed = JSON.parse(event.target.value) as ContentFieldDef['uiConfig'];
                  apply({ uiConfig: parsed ?? {} });
                } catch {
                  // keep invalid JSON local
                }
              }}
            />
          </div>
        </AccordionTab>
      </Accordion>
    </div>
  );
}
