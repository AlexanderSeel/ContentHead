import { Checkbox, DatePicker, MultiSelect, NumberInput, Select, Textarea, TextInput } from '../../ui/atoms';
import type { ContentFieldDef } from './fieldValidationUi';
import { RichTextEditor } from '../content/fieldRenderers/RichTextEditor';

export function FieldPreview({ field }: { field: ContentFieldDef | null }) {
  if (!field) {
    return <p className="muted">Select a field to preview editor rendering.</p>;
  }

  const ui = field.uiConfig ?? {};
  const allowed = (field.validations?.allowedValues ?? []).map((entry) => ({ label: entry, value: entry }));

  if (field.type === 'boolean') {
    return <Checkbox checked={Boolean(ui.defaultValue)} onChange={() => undefined} />;
  }
  if (field.type === 'number') {
    return <NumberInput value={typeof ui.defaultValue === 'number' ? ui.defaultValue : null} onChange={() => undefined} />;
  }
  if (field.type === 'date' || field.type === 'datetime') {
    return <DatePicker value={ui.defaultValue ? new Date(String(ui.defaultValue)) : null} onChange={() => undefined} showTime={field.type === 'datetime'} />;
  }
  if (field.type === 'select') {
    return <Select value={null} options={allowed} onChange={() => undefined} placeholder={ui.placeholder ?? ''} />;
  }
  if (field.type === 'multiselect') {
    return <MultiSelect value={[]} options={allowed} onChange={() => undefined} placeholder={ui.placeholder ?? ''} />;
  }
  if (field.type === 'contentLink') {
    return <TextInput value="internal: /sample-route" readOnly />;
  }
  if (field.type === 'contentLinkList') {
    return <Textarea rows={3} value='[{"kind":"external","url":"https://example.com"}]' onChange={() => undefined} readOnly />;
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
    return <Textarea rows={ui.rows ?? 4} value={String(ui.defaultValue ?? '')} onChange={() => undefined} />;
  }

  return <TextInput value={String(ui.defaultValue ?? '')} placeholder={ui.placeholder ?? ''} />;
}
