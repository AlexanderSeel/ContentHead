import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';

import type { ContentFieldDef } from './fieldValidationUi';
import { RichTextEditor } from '../content/fieldRenderers/RichTextEditor';

export function FieldPreview({ field }: { field: ContentFieldDef | null }) {
  if (!field) {
    return <p className="muted">Select a field to preview editor rendering.</p>;
  }

  const ui = field.uiConfig ?? {};
  const allowed = (field.validations?.allowedValues ?? []).map((entry) => ({ label: entry, value: entry }));

  if (field.type === 'boolean') {
    return <Checkbox checked={Boolean(ui.defaultValue)} />;
  }
  if (field.type === 'number') {
    return <InputNumber value={typeof ui.defaultValue === 'number' ? ui.defaultValue : null} />;
  }
  if (field.type === 'date' || field.type === 'datetime') {
    return <Calendar value={ui.defaultValue ? new Date(String(ui.defaultValue)) : null} showTime={field.type === 'datetime'} />;
  }
  if (field.type === 'select') {
    return <Dropdown options={allowed} placeholder={ui.placeholder ?? ''} />;
  }
  if (field.type === 'multiselect') {
    return <MultiSelect options={allowed} placeholder={ui.placeholder ?? ''} />;
  }
  if (field.type === 'contentLink') {
    return <InputText value="internal: /sample-route" readOnly />;
  }
  if (field.type === 'contentLinkList') {
    return <InputTextarea rows={3} value='[{"kind":"external","url":"https://example.com"}]' readOnly />;
  }
  if (field.type === 'richtext') {
    return (
      <RichTextEditor
        value={String(ui.defaultValue ?? '')}
        onChange={() => undefined}
        features={ui.richTextFeatures ?? null}
        readOnly
      />
    );
  }
  if (ui.multiline) {
    return <InputTextarea rows={ui.rows ?? 4} value={String(ui.defaultValue ?? '')} />;
  }

  return <InputText value={String(ui.defaultValue ?? '')} placeholder={ui.placeholder ?? ''} />;
}
