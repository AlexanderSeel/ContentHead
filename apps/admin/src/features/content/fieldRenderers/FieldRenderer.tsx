import { Checkbox, DatePicker, MultiSelect, NumberInput, Select, Textarea, TextInput } from '../../../ui/atoms';
import { ContentReferencePicker } from '../../../components/inputs/ContentReferencePicker';
import type { ContentFieldDef } from '../../schema/fieldValidationUi';
import { AssetListEditor, AssetRefEditor } from './AssetEditors';
import { ContentLinkEditor, ContentLinkListEditor } from './ContentLinkEditors';
import { RichTextEditor } from './RichTextEditor';

export type FieldRendererProps = {
  field: ContentFieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
  siteId: number;
  token: string | null;
  readOnly?: boolean;
};

function allowedOptions(field: ContentFieldDef) {
  return (field.validations?.allowedValues ?? []).map((entry) => ({ label: entry, value: entry }));
}

export function FieldRenderer({ field, value, onChange, siteId, token, readOnly }: FieldRendererProps) {
  const ui = field.uiConfig ?? {};

  if (field.type === 'boolean') {
    return <Checkbox checked={Boolean(value)} onChange={(next) => onChange(next)} disabled={readOnly} />;
  }

  if (field.type === 'number') {
    return <NumberInput value={typeof value === 'number' ? value : null} onChange={(next) => onChange(next)} disabled={readOnly} />;
  }

  if (field.type === 'date' || field.type === 'datetime') {
    return (
      <DatePicker
        value={value ? new Date(String(value)) : null}
        onChange={(next) => onChange(next ? next.toISOString() : null)}
        showTime={field.type === 'datetime'}
        disabled={readOnly}
      />
    );
  }

  if (field.type === 'select') {
    return <Select value={value as string ?? null} options={allowedOptions(field)} onChange={(next) => onChange(next)} placeholder={ui.placeholder ?? ''} disabled={Boolean(readOnly)} />;
  }

  if (field.type === 'multiselect') {
    return <MultiSelect value={Array.isArray(value) ? value as string[] : []} options={allowedOptions(field)} onChange={(next) => onChange(next)} placeholder={ui.placeholder ?? ''} disabled={Boolean(readOnly)} />;
  }

  if (field.type === 'reference') {
    return <ContentReferencePicker token={token} siteId={siteId} value={typeof value === 'number' ? value : null} onChange={onChange as (value: number | null) => void} />;
  }

  if (field.type === 'contentLink') {
    return <ContentLinkEditor token={token} siteId={siteId} value={(value as any) ?? null} onChange={onChange as any} />;
  }

  if (field.type === 'contentLinkList') {
    return <ContentLinkListEditor token={token} siteId={siteId} value={Array.isArray(value) ? (value as any[]) : []} onChange={onChange as any} />;
  }

  if (field.type === 'assetRef') {
    return <AssetRefEditor token={token} siteId={siteId} value={(value as any) ?? null} onChange={onChange as any} />;
  }

  if (field.type === 'assetList') {
    return <AssetListEditor token={token} siteId={siteId} value={Array.isArray(value) ? value.filter((entry): entry is number => typeof entry === 'number') : []} onChange={onChange as (value: number[]) => void} />;
  }

  if (field.type === 'json') {
    return <Textarea rows={6} value={typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)} onChange={(next) => onChange(next)} readOnly={readOnly} />;
  }

  if (field.type === 'richtext') {
    return (
      <RichTextEditor
        value={String(value ?? '')}
        onChange={(next) => onChange(next)}
        features={ui.richTextFeatures ?? null}
        readOnly={Boolean(readOnly)}
        token={token}
        siteId={siteId}
      />
    );
  }

  if (ui.multiline) {
    return <Textarea rows={ui.rows ?? 3} value={String(value ?? '')} onChange={(next) => onChange(next)} readOnly={readOnly} placeholder={ui.placeholder ?? ''} />;
  }

  return <TextInput value={String(value ?? '')} onChange={(next) => onChange(next)} readOnly={readOnly} placeholder={ui.placeholder ?? ''} />;
}
