import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Chips } from 'primereact/chips';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

import { type ComponentUiField, getComponentRegistryEntry, validateComponentProps } from './componentRegistry';
import { useAuth } from '../../../app/AuthContext';
import { createAdminSdk } from '../../../lib/sdk';
import { ContentLinkEditor, ContentLinkListEditor } from '../fieldRenderers/ContentLinkEditors';
import { AssetListEditor, AssetRefEditor } from '../fieldRenderers/AssetEditors';
import { RichTextEditor } from '../fieldRenderers/RichTextEditor';

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

  const renderFieldSummary = (field: ComponentUiField, value: unknown): string => {
    if (field.type === 'contentLink') {
      if (value && typeof value === 'object') {
        const link = value as { text?: string; url?: string; contentItemId?: number };
        return link.text ?? link.url ?? (link.contentItemId ? `#${link.contentItemId}` : '');
      }
      return '';
    }
    if (field.type === 'contentLinkList') {
      return Array.isArray(value) ? `${value.length} links` : '0 links';
    }
    if (field.type === 'stringList') {
      return Array.isArray(value) ? value.join(', ') : '';
    }
    if (field.type === 'assetRef') {
      return typeof value === 'number' ? `Asset #${value}` : '';
    }
    if (field.type === 'assetList') {
      return Array.isArray(value) ? `${value.length} assets` : '0 assets';
    }
    if (field.type === 'formRef') {
      const id = typeof value === 'number' ? value : null;
      if (!id) {
        return '';
      }
      const match = forms.find((entry) => entry.id === id);
      return match?.name ?? `Form #${id}`;
    }
    if (field.type === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (field.type === 'number') {
      return typeof value === 'number' ? String(value) : '';
    }
    if (field.type === 'select') {
      const match = field.options?.find((option) => option.value === value);
      return match?.label ?? String(value ?? '');
    }
    if (field.type === 'objectList') {
      return Array.isArray(value) ? `${value.length} items` : '0 items';
    }
    if (field.type === 'multiline' || field.type === 'text') {
      return String(value ?? '');
    }
    return value == null ? '' : String(value);
  };

  function ObjectListEditor({
    value,
    fields,
    onChangeValue
  }: {
    value: unknown;
    fields: ComponentUiField[];
    onChangeValue: (next: Record<string, unknown>[]) => void;
  }) {
    const items = Array.isArray(value)
      ? value.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object' && !Array.isArray(entry))
      : [];
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [draft, setDraft] = useState<Record<string, unknown>>({});

    useEffect(() => {
      if (editingIndex == null) {
        return;
      }
      if (editingIndex >= items.length) {
        setDraft({});
        return;
      }
      const current = items[editingIndex];
      setDraft(current ? { ...current } : {});
    }, [editingIndex, items]);

    const move = (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= items.length) {
        return;
      }
      const next = [...items];
      const [current] = next.splice(index, 1);
      if (!current) {
        return;
      }
      next.splice(target, 0, current);
      onChangeValue(next);
    };

    const apply = () => {
      if (editingIndex == null) {
        return;
      }
      const next = [...items];
      if (editingIndex >= next.length) {
        next.push(draft);
      } else {
        next[editingIndex] = draft;
      }
      onChangeValue(next);
      setEditingIndex(null);
    };

    return (
      <div className="form-row">
        <div className="inline-actions">
          <Button label="Add item" onClick={() => setEditingIndex(items.length)} />
        </div>
        <DataTable value={items} size="small">
          {fields.slice(0, 2).map((field) => (
            <Column
              key={field.key}
              header={field.label}
              body={(row: Record<string, unknown>) => renderFieldSummary(field, row[field.key])}
            />
          ))}
          <Column
            header="Order"
            body={(_row: Record<string, unknown>, options) => (
              <div className="inline-actions">
                <Button text icon="pi pi-angle-up" onClick={() => move(options.rowIndex, -1)} />
                <Button text icon="pi pi-angle-down" onClick={() => move(options.rowIndex, 1)} />
              </div>
            )}
          />
          <Column
            header="Actions"
            body={(_row: Record<string, unknown>, options) => (
              <div className="inline-actions">
                <Button text label="Edit" onClick={() => setEditingIndex(options.rowIndex)} />
                <Button
                  text
                  severity="danger"
                  label="Remove"
                  onClick={() => onChangeValue(items.filter((_, idx) => idx !== options.rowIndex))}
                />
              </div>
            )}
          />
        </DataTable>

        <Dialog
          header="Edit item"
          visible={editingIndex != null}
          onHide={() => setEditingIndex(null)}
          style={{ width: 'min(48rem, 95vw)' }}
        >
          <div className="form-row">
            {fields.map((field) => (
              <div className="form-row" key={field.key}>
                <label>{field.label}</label>
                {renderFieldInput(field, draft[field.key], (next) => setDraft((prev) => ({ ...prev, [field.key]: next })))}
              </div>
            ))}
          </div>
          <div className="inline-actions" style={{ justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <Button label="Cancel" text onClick={() => setEditingIndex(null)} />
            <Button label="Apply" onClick={apply} />
          </div>
        </Dialog>
      </div>
    );
  }

  function renderFieldInput(field: ComponentUiField, value: unknown, onChangeValue: (next: unknown) => void) {
    if (field.type === 'number') {
      return (
        <InputNumber
          value={typeof value === 'number' ? value : null}
          onValueChange={(event) => onChangeValue(event.value ?? 0)}
        />
      );
    }
    if (field.type === 'select') {
      return <Dropdown value={value ?? null} options={field.options ?? []} onChange={(event) => onChangeValue(event.value)} />;
    }
    if (field.type === 'boolean') {
      return <Checkbox checked={Boolean(value)} onChange={(event) => onChangeValue(Boolean(event.checked))} />;
    }
    if (field.type === 'assetRef') {
      return (
        <AssetRefEditor
          token={token}
          siteId={siteId}
          value={typeof value === 'number' ? value : null}
          onChange={(next) => onChangeValue(next)}
        />
      );
    }
    if (field.type === 'assetList') {
      return (
        <AssetListEditor
          token={token}
          siteId={siteId}
          value={Array.isArray(value) ? value.filter((entry): entry is number => typeof entry === 'number') : []}
          onChange={(next) => onChangeValue(next)}
        />
      );
    }
    if (field.type === 'contentLink') {
      return (
        <ContentLinkEditor
          token={token}
          siteId={siteId}
          value={(value as any) ?? null}
          onChange={(next) => onChangeValue(next)}
        />
      );
    }
    if (field.type === 'contentLinkList') {
      return (
        <ContentLinkListEditor
          token={token}
          siteId={siteId}
          value={Array.isArray(value) ? (value as any[]) : []}
          onChange={(next) => onChangeValue(next)}
        />
      );
    }
    if (field.type === 'formRef') {
      return (
        <Dropdown
          value={typeof value === 'number' ? value : null}
          options={forms.map((entry) => ({ label: entry.name, value: entry.id }))}
          onChange={(event) => onChangeValue(event.value)}
          placeholder="Select form"
        />
      );
    }
    if (field.type === 'stringList') {
      return (
        <Chips
          value={Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []}
          onChange={(event) => onChangeValue(event.value ?? [])}
          separator=","
        />
      );
    }
    if (field.type === 'richtext') {
      return (
        <RichTextEditor
          value={String(value ?? '')}
          onChange={(next) => onChangeValue(next)}
          token={token}
          siteId={siteId}
        />
      );
    }
    if (field.type === 'objectList') {
      return (
        <ObjectListEditor
          value={value}
          fields={field.fields ?? []}
          onChangeValue={(next) => onChangeValue(next)}
        />
      );
    }
    if (field.type === 'json') {
      return (
        <InputTextarea
          rows={6}
          value={typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)}
          onChange={(event) => {
            try {
              onChangeValue(JSON.parse(event.target.value));
            } catch {
              onChangeValue(event.target.value);
            }
          }}
        />
      );
    }
    if (field.type === 'multiline') {
      return <InputTextarea rows={4} value={String(value ?? '')} onChange={(event) => onChangeValue(event.target.value)} />;
    }
    return <InputText value={String(value ?? '')} onChange={(event) => onChangeValue(event.target.value)} />;
  }

  if (!component) {
    return <p className="muted">Select a component to edit props.</p>;
  }

  const entry = getComponentRegistryEntry(component.type);
  if (!entry) {
    return <p className="error-text">Unknown component type: {component.type}</p>;
  }

  const errors = validateComponentProps(component.type, component.props);
  const propsJson = JSON.stringify(component.props, null, 2);

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
            {renderFieldInput(field, value, (next) => onChange({ ...component, props: { ...component.props, [field.key]: next } }))}
          </div>
        );
      })}

      {errors.length > 0 ? (
        <div className="status-panel">
          {errors.map((entryError) => <div key={entryError} className="error-text">{entryError}</div>)}
        </div>
      ) : null}
      <div className="form-row">
        <label>Advanced Props JSON (fallback)</label>
        <InputTextarea
          rows={8}
          value={propsJson}
          onChange={(event) => {
            try {
              const parsed = JSON.parse(event.target.value);
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                onChange({ ...component, props: parsed as Record<string, unknown> });
              }
            } catch {
              // Keep editor permissive while typing invalid JSON.
            }
          }}
        />
      </div>
    </div>
  );
}
