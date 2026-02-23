import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useEffect, useMemo, useState } from 'react';

import { getComponentRegistryEntry, validateComponentProps } from './componentRegistry';
import { useAuth } from '../../../app/AuthContext';
import { createAdminSdk } from '../../../lib/sdk';
import { ContentLinkEditor, ContentLinkListEditor } from '../fieldRenderers/ContentLinkEditors';
import { AssetListEditor, AssetRefEditor } from '../fieldRenderers/AssetEditors';

type ComponentRecord = {
  id: string;
  type: string;
  props: Record<string, unknown>;
};

export function ComponentInspector({
  component,
  siteId,
  selectedFieldPath,
  onSelectFieldPath,
  onChange
}: {
  component: ComponentRecord | null;
  siteId: number;
  selectedFieldPath?: string | null;
  onSelectFieldPath?: (value: string) => void;
  onChange: (next: ComponentRecord) => void;
}) {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const [forms, setForms] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    sdk
      .listForms({ siteId })
      .then((res) =>
        setForms(
          (res.listForms ?? [])
            .filter((entry) => typeof entry.id === 'number' && typeof entry.name === 'string')
            .map((entry) => ({ id: entry.id as number, name: entry.name as string }))
        )
      )
      .catch(() => setForms([]));
  }, [sdk, siteId]);

  if (!component) {
    return <p className="muted">Select a component to edit props.</p>;
  }

  const entry = getComponentRegistryEntry(component.type);
  if (!entry) {
    return <p className="error-text">Unknown component type: {component.type}</p>;
  }

  const errors = validateComponentProps(component.type, component.props);

  return (
    <div className="p-fluid">
      <div className="status-panel"><strong>{entry.label}</strong><div>{component.id}</div></div>
      {entry.fields.map((field) => {
        const value = component.props[field.key];
        const fieldPath = `components.${component.id}.props.${field.key}`;
        const isSelected = selectedFieldPath === fieldPath;

        return (
          <div
            className={`form-row ${isSelected ? 'cms-selected-editor-row' : ''}`}
            key={field.key}
            data-editor-path={fieldPath}
            onClick={() => onSelectFieldPath?.(fieldPath)}
          >
            <label>{field.label}</label>
            {field.type === 'number' ? (
              <InputNumber value={typeof value === 'number' ? value : null} onValueChange={(event) => onChange({ ...component, props: { ...component.props, [field.key]: event.value ?? 0 } })} />
            ) : field.type === 'select' ? (
              <Dropdown value={value ?? null} options={field.options ?? []} onChange={(event) => onChange({ ...component, props: { ...component.props, [field.key]: event.value } })} />
            ) : field.type === 'boolean' ? (
              <Checkbox checked={Boolean(value)} onChange={(event) => onChange({ ...component, props: { ...component.props, [field.key]: Boolean(event.checked) } })} />
            ) : field.type === 'assetRef' ? (
              <AssetRefEditor
                token={token}
                siteId={siteId}
                value={typeof value === 'number' ? value : null}
                onChange={(next) => onChange({ ...component, props: { ...component.props, [field.key]: next } })}
              />
            ) : field.type === 'assetList' ? (
              <AssetListEditor
                token={token}
                siteId={siteId}
                value={Array.isArray(value) ? value.filter((entry): entry is number => typeof entry === 'number') : []}
                onChange={(next) => onChange({ ...component, props: { ...component.props, [field.key]: next } })}
              />
            ) : field.type === 'contentLink' ? (
              <ContentLinkEditor
                token={token}
                siteId={siteId}
                value={(value as any) ?? null}
                onChange={(next) => onChange({ ...component, props: { ...component.props, [field.key]: next } })}
              />
            ) : field.type === 'contentLinkList' ? (
              <ContentLinkListEditor
                token={token}
                siteId={siteId}
                value={Array.isArray(value) ? (value as any[]) : []}
                onChange={(next) => onChange({ ...component, props: { ...component.props, [field.key]: next } })}
              />
            ) : field.type === 'formRef' ? (
              <Dropdown
                value={typeof value === 'number' ? value : null}
                options={forms.map((entry) => ({ label: entry.name, value: entry.id }))}
                onChange={(event) => onChange({ ...component, props: { ...component.props, [field.key]: event.value } })}
                placeholder="Select form"
              />
            ) : field.type === 'json' ? (
              <InputTextarea
                rows={6}
                value={typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)}
                onChange={(event) => {
                  try {
                    onChange({ ...component, props: { ...component.props, [field.key]: JSON.parse(event.target.value) } });
                  } catch {
                    onChange({ ...component, props: { ...component.props, [field.key]: event.target.value } });
                  }
                }}
              />
            ) : field.type === 'multiline' ? (
              <InputTextarea rows={4} value={String(value ?? '')} onChange={(event) => onChange({ ...component, props: { ...component.props, [field.key]: event.target.value } })} />
            ) : (
              <InputText value={String(value ?? '')} onChange={(event) => onChange({ ...component, props: { ...component.props, [field.key]: event.target.value } })} />
            )}
          </div>
        );
      })}

      {errors.length > 0 ? (
        <div className="status-panel">
          {errors.map((entryError) => <div key={entryError} className="error-text">{entryError}</div>)}
        </div>
      ) : null}
    </div>
  );
}
