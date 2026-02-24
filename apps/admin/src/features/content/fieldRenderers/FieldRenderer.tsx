import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';

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
    return <Checkbox checked={Boolean(value)} onChange={(event) => onChange(Boolean(event.checked))} disabled={readOnly} />;
  }

  if (field.type === 'number') {
    return <InputNumber value={typeof value === 'number' ? value : null} onValueChange={(event) => onChange(event.value ?? null)} disabled={readOnly} />;
  }

  if (field.type === 'date' || field.type === 'datetime') {
    return <Calendar value={value ? new Date(String(value)) : null} onChange={(event) => onChange(event.value ? (event.value as Date).toISOString() : null)} showTime={field.type === 'datetime'} disabled={readOnly} />;
  }

  if (field.type === 'select') {
    return <Dropdown value={value ?? null} options={allowedOptions(field)} onChange={(event) => onChange(event.value)} placeholder={ui.placeholder ?? ''} disabled={Boolean(readOnly)} />;
  }

  if (field.type === 'multiselect') {
    return <MultiSelect value={Array.isArray(value) ? value : []} options={allowedOptions(field)} onChange={(event) => onChange(event.value)} placeholder={ui.placeholder ?? ''} disabled={Boolean(readOnly)} />;
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
    return <AssetRefEditor token={token} siteId={siteId} value={typeof value === 'number' ? value : null} onChange={onChange as (value: number | null) => void} />;
  }

  if (field.type === 'assetList') {
    return <AssetListEditor token={token} siteId={siteId} value={Array.isArray(value) ? value.filter((entry): entry is number => typeof entry === 'number') : []} onChange={onChange as (value: number[]) => void} />;
  }

  if (field.type === 'json') {
    return <InputTextarea rows={6} value={typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} />;
  }

  if (field.type === 'richtext') {
    return (
      <RichTextEditor
        value={String(value ?? '')}
        onChange={(next) => onChange(next)}
        features={ui.richTextFeatures ?? null}
        readOnly={Boolean(readOnly)}
      />
    );
  }

  if (ui.multiline) {
    return <InputTextarea rows={ui.rows ?? 3} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} placeholder={ui.placeholder ?? ''} />;
  }

  return <InputText value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} placeholder={ui.placeholder ?? ''} />;
}
