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

import {
  type ComponentUiField,
  type ResolvedComponentRegistryEntry,
  getComponentRegistryEntry,
  validateComponentProps
} from './componentRegistry';
import { useAuth } from '../../../app/AuthContext';
import { createAdminSdk } from '../../../lib/sdk';
import { ContentLinkEditor, ContentLinkListEditor } from '../fieldRenderers/ContentLinkEditors';
import { AssetListEditor, AssetRefEditor } from '../fieldRenderers/AssetEditors';
import { RichTextEditor } from '../fieldRenderers/RichTextEditor';
import { JsonSourceEditor } from '../../../ui/atoms/JsonSourceEditor';

type ComponentRecord = {
  id: string;
  type: string;
  props: Record<string, unknown>;
};

const looseObjectJsonSchema: Record<string, unknown> = { type: 'object', additionalProperties: true };
const looseArrayJsonSchema: Record<string, unknown> = { type: 'array', items: {} };

function coerceObjectListItems(value: unknown, fields: ComponentUiField[]): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const singleFieldKey = fields.length === 1 ? fields[0]?.key : null;
  return value
    .map((entry) => {
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        return entry as Record<string, unknown>;
      }
      if (singleFieldKey && typeof singleFieldKey === 'string') {
        return { [singleFieldKey]: entry };
      }
      return null;
    })
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
}

function inferObjectListFields(value: unknown): ComponentUiField[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const firstObject = value.find(
    (entry) => entry && typeof entry === 'object' && !Array.isArray(entry)
  ) as Record<string, unknown> | undefined;
  if (!firstObject) {
    return [];
  }
  return Object.keys(firstObject).map((key) => ({ key, label: key, type: 'text' }));
}

export function ComponentInspector({
  component,
  siteId,
  registryEntry,
  availableComponentRefs = [],
  selectedFieldPath,
  onSelectFieldPath,
  onChange
}: {
  component: ComponentRecord | null;
  siteId: number;
  registryEntry?: ResolvedComponentRegistryEntry | null;
  availableComponentRefs?: Array<{ id: string; label: string; type: string }>;
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
    if (field.type === 'componentRef') {
      if (typeof value !== 'string' || !value) {
        return '';
      }
      const match = availableComponentRefs.find((entry) => entry.id === value);
      return match?.label ?? value;
    }
    if (field.type === 'objectRef') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return '';
      }
      const typed = value as { componentId?: string; path?: string };
      const componentId = typeof typed.componentId === 'string' ? typed.componentId : '';
      const path = typeof typed.path === 'string' ? typed.path : '';
      return [componentId, path].filter(Boolean).join(':');
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
      if (value && typeof value === 'object') {
        try {
          return JSON.stringify(value);
        } catch {
          return '[object]';
        }
      }
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
    const items = coerceObjectListItems(value, fields);
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
        <DataTable value={items} size="small" className="cms-object-list-table">
          {fields.length > 0 ? (
            fields.slice(0, 2).map((field) => (
              <Column
                key={field.key}
                header={field.label}
                body={(row: Record<string, unknown>) => {
                  const summary = renderFieldSummary(field, row[field.key]);
                  return <span className="cms-cell-ellipsis" title={summary}>{summary}</span>;
                }}
              />
            ))
          ) : (
            <Column
              header="Item"
              body={(row: Record<string, unknown>) => {
                try {
                  return JSON.stringify(row);
                } catch {
                  return '[object]';
                }
              }}
            />
          )}
          <Column
            header="Order"
            style={{ width: '5.5rem' }}
            body={(_row: Record<string, unknown>, options) => (
              <div className="inline-actions">
                <Button text icon="pi pi-angle-up" onClick={() => move(options.rowIndex, -1)} />
                <Button text icon="pi pi-angle-down" onClick={() => move(options.rowIndex, 1)} />
              </div>
            )}
          />
          <Column
            header="Actions"
            style={{ width: '7.5rem' }}
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
          className="w-11 lg:w-9 xl:w-8"
        >
          <div className="form-row">
            {fields.map((field) => (
              <div className="form-row" key={field.key}>
                <label>{field.label}</label>
                {renderFieldInput(field, draft[field.key], (next) => setDraft((prev) => ({ ...prev, [field.key]: next })))}
              </div>
            ))}
          </div>
          <div className="inline-actions justify-content-end mt-3">
            <Button label="Cancel" text onClick={() => setEditingIndex(null)} />
            <Button label="Apply" onClick={apply} />
          </div>
        </Dialog>
      </div>
    );
  }

  function renderFieldInput(field: ComponentUiField, value: unknown, onChangeValue: (next: unknown) => void) {
    const filteredComponentRefs =
      Array.isArray(field.refComponentTypes) && field.refComponentTypes.length > 0
        ? availableComponentRefs.filter((entry) => field.refComponentTypes?.includes(entry.type))
        : availableComponentRefs;
    const renderJsonFallback = (schema: Record<string, unknown>) => (
      <JsonSourceEditor
        editorId={`component-prop-json-fallback-${component?.id ?? 'unknown'}-${field.key}`}
        value={typeof value === 'string' ? value : JSON.stringify(value ?? (schema.type === 'array' ? [] : {}), null, 2)}
        onChange={(next) => {
          try {
            onChangeValue(JSON.parse(next));
          } catch {
            // Keep JSON editor permissive while user is typing invalid JSON.
          }
        }}
        height={180}
        schema={schema}
      />
    );
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
          value={(value as any) ?? null}
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
    if (field.type === 'componentRef') {
      return (
        <Dropdown
          value={typeof value === 'string' ? value : null}
          options={filteredComponentRefs.map((entry) => ({ label: entry.label, value: entry.id }))}
          onChange={(event) => onChangeValue(typeof event.value === 'string' ? event.value : '')}
          filter
          showClear
          placeholder="Select component"
        />
      );
    }
    if (field.type === 'objectRef') {
      const typed =
        value && typeof value === 'object' && !Array.isArray(value)
          ? (value as { componentId?: string; path?: string })
          : {};
      const componentId = typeof typed.componentId === 'string' ? typed.componentId : '';
      const path = typeof typed.path === 'string' ? typed.path : '';
      return (
        <div className="form-grid">
          <div className="form-row">
            <label className="muted">Component</label>
            <Dropdown
              value={componentId || null}
              options={filteredComponentRefs.map((entry) => ({ label: entry.label, value: entry.id }))}
              onChange={(event) =>
                onChangeValue({
                  componentId: typeof event.value === 'string' ? event.value : '',
                  path
                })
              }
              filter
              showClear
              placeholder="Select component"
            />
          </div>
          <div className="form-row">
            <label className="muted">Object path</label>
            <InputText
              value={path}
              onChange={(event) =>
                onChangeValue({
                  componentId,
                  path: event.target.value
                })
              }
              placeholder="items.0.title"
            />
          </div>
        </div>
      );
    }
    if (field.type === 'stringList') {
      if (Array.isArray(value) && value.some((entry) => typeof entry !== 'string')) {
        return renderJsonFallback(looseArrayJsonSchema);
      }
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
      const objectListFields = field.fields && field.fields.length > 0 ? field.fields : inferObjectListFields(value);
      return (
        <ObjectListEditor
          value={value}
          fields={objectListFields}
          onChangeValue={(next) => onChangeValue(next)}
        />
      );
    }
    if (field.type === 'json') {
      return (
        <JsonSourceEditor
          editorId={`component-prop-json-${component?.id ?? 'unknown'}-${field.key}`}
          value={typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)}
          onChange={(next) => {
            try {
              onChangeValue(JSON.parse(next));
            } catch {
              onChangeValue(next);
            }
          }}
          height={180}
          schema={looseObjectJsonSchema}
        />
      );
    }
    if (field.type === 'multiline') {
      if (value && typeof value === 'object') {
        return renderJsonFallback(Array.isArray(value) ? looseArrayJsonSchema : looseObjectJsonSchema);
      }
      return <InputTextarea rows={4} value={String(value ?? '')} onChange={(event) => onChangeValue(event.target.value)} />;
    }
    if (value && typeof value === 'object') {
      return renderJsonFallback(Array.isArray(value) ? looseArrayJsonSchema : looseObjectJsonSchema);
    }
    return <InputText value={String(value ?? '')} onChange={(event) => onChangeValue(event.target.value)} />;
  }

  if (!component) {
    return <p className="muted">Select a component to edit props.</p>;
  }

  const entry = registryEntry ?? getComponentRegistryEntry(component.type);
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
        <JsonSourceEditor
          editorId={`component-props-json-${component.id}`}
          value={propsJson}
          onChange={(next) => {
            try {
              const parsed = JSON.parse(next);
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                onChange({ ...component, props: parsed as Record<string, unknown> });
              }
            } catch {
              // Keep editor permissive while typing invalid JSON.
            }
          }}
          height={240}
          schema={looseObjectJsonSchema}
        />
      </div>
    </div>
  );
}

