import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';

import { useAdminContext } from '../../app/AdminContext';
import { useAuth } from '../../app/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { createAdminSdk } from '../../lib/sdk';
import { ContentTypeList, type CTypeListItem } from './ContentTypeList';
import { FieldInspector } from './FieldInspector';
import { FieldList } from './FieldList';
import { FieldPreview } from './FieldPreview';
import {
  CONTENT_FIELD_TYPES,
  ensureUniqueFieldKey,
  parseFieldsJson,
  stringifyFieldsJson,
  suggestFieldKey,
  type ContentFieldDef,
  type ContentFieldType
} from './fieldValidationUi';

export function ContentTypesPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId } = useAdminContext();

  const [types, setTypes] = useState<CTypeListItem[]>([]);
  const [selected, setSelected] = useState<CTypeListItem | null>(null);
  const [fields, setFields] = useState<ContentFieldDef[]>([]);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldType, setNewFieldType] = useState<ContentFieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [allItems, setAllItems] = useState<Array<{ id?: number | null; contentTypeId?: number | null }>>([]);
  const [allRoutes, setAllRoutes] = useState<Array<{ contentItemId?: number | null; slug?: string | null; marketCode?: string | null; localeCode?: string | null }>>([]);

  const refresh = async () => {
    const result = await sdk.listContentTypes({ siteId });
    const all = (result.listContentTypes ?? []) as CTypeListItem[];
    setTypes(all);
    if (selected) {
      const nextSelected = all.find((entry) => entry.id === selected.id) ?? null;
      setSelected(nextSelected);
      setFields(parseFieldsJson(nextSelected?.fieldsJson ?? '[]'));
    }
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [siteId]);

  useEffect(() => {
    Promise.all([sdk.listContentItems({ siteId }), sdk.listRoutes({ siteId, marketCode: null, localeCode: null })])
      .then(([itemsRes, routesRes]) => {
        setAllItems((itemsRes.listContentItems ?? []) as Array<{ id?: number | null; contentTypeId?: number | null }>);
        setAllRoutes((routesRes.listRoutes ?? []) as Array<{ contentItemId?: number | null; slug?: string | null; marketCode?: string | null; localeCode?: string | null }>);
      })
      .catch(() => undefined);
  }, [sdk, siteId]);

  const selectedField = fields.find((entry) => entry.key === selectedFieldKey) ?? null;
  const selectedTypeUsage = useMemo(() => {
    if (!selected?.id) {
      return [];
    }
    const itemIds = new Set(
      allItems
        .filter((entry) => entry.contentTypeId === selected.id)
        .map((entry) => entry.id)
        .filter((id): id is number => typeof id === 'number')
    );
    return allRoutes
      .filter((route) => typeof route.contentItemId === 'number' && itemIds.has(route.contentItemId))
      .map((route) => ({
        contentItemId: route.contentItemId ?? 0,
        slug: route.slug ?? '',
        marketCode: route.marketCode ?? '',
        localeCode: route.localeCode ?? ''
      }));
  }, [allItems, allRoutes, selected?.id]);

  const createType = () => {
    const draft: CTypeListItem = { id: 0, name: '', description: '', fieldsJson: '[]' };
    setSelected(draft);
    setFields([]);
    setSelectedFieldKey(null);
  };

  const duplicateField = (key: string) => {
    const source = fields.find((entry) => entry.key === key);
    if (!source) {
      return;
    }
    const nextKey = ensureUniqueFieldKey(`${source.key}_copy`, fields);
    const next: ContentFieldDef = { ...source, key: nextKey, label: `${source.label} Copy` };
    setFields((prev) => [...prev, next]);
    setSelectedFieldKey(nextKey);
  };

  const removeField = (key: string) => {
    setFields((prev) => prev.filter((entry) => entry.key !== key));
    if (selectedFieldKey === key) {
      setSelectedFieldKey(null);
    }
  };

  const saveType = async () => {
    if (!selected) {
      return;
    }

    const payload = {
      name: selected.name,
      description: selected.description || null,
      fieldsJson: stringifyFieldsJson(fields),
      by: 'admin'
    };

    if (selected.id) {
      await sdk.updateContentType({ id: selected.id, ...payload });
    } else {
      await sdk.createContentType({ siteId, ...payload });
    }

    await refresh();
  };

  const addField = () => {
    const key = ensureUniqueFieldKey(newFieldKey || newFieldLabel, fields);
    const next: ContentFieldDef = {
      key,
      label: newFieldLabel || key,
      type: newFieldType,
      required: newFieldRequired,
      validations: {},
      uiConfig: {}
    };
    setFields((prev) => [...prev, next]);
    setSelectedFieldKey(key);
    setShowAddField(false);
    setNewFieldLabel('');
    setNewFieldKey('');
    setNewFieldType('text');
    setNewFieldRequired(false);
  };

  return (
    <div className="pageRoot">
      <PageHeader
        title="Content Types"
        subtitle="Visual schema builder with field inspector and preview"
        helpTopicKey="content_types"
        askAiContext="types"
        askAiPayload={{ siteId, selectedType: selected, fields }}
        onAskAiInsert={(value) => {
          setSelected((prev) => (prev ? { ...prev, description: `${prev.description ?? ''}\n${value}`.trim() } : prev));
        }}
        actions={
          <div className="inline-actions">
            <Button label="New Type" onClick={createType} />
            <Button label="Save Type" severity="success" onClick={() => saveType().catch(() => undefined)} disabled={!selected} />
          </div>
        }
      />

      <div className="form-builder-layout">
        <section className="content-card">
          <ContentTypeList
            items={types}
            selectedId={selected?.id ?? null}
            onCreate={createType}
            onSelect={(item) => {
              setSelected(item);
              const parsed = parseFieldsJson(item.fieldsJson);
              setFields(parsed);
              setSelectedFieldKey(parsed[0]?.key ?? null);
            }}
          />
        </section>

        <section className="content-card">
          {!selected ? <p>Select a content type.</p> : (
            <>
              <div className="form-grid">
                <div className="form-row">
                  <label>Name</label>
                  <InputText value={selected.name} onChange={(event) => setSelected((prev) => (prev ? { ...prev, name: event.target.value } : prev))} />
                </div>
                <div className="form-row">
                  <label>Description</label>
                  <InputText value={selected.description ?? ''} onChange={(event) => setSelected((prev) => (prev ? { ...prev, description: event.target.value } : prev))} />
                </div>
                <div className="inline-actions" style={{ alignSelf: 'end' }}>
                  <Button label="Add Field" onClick={() => setShowAddField(true)} />
                </div>
              </div>

              <FieldList
                fields={fields}
                selectedKey={selectedFieldKey}
                onSelect={setSelectedFieldKey}
                onReorder={setFields}
                onDuplicate={duplicateField}
                onDelete={removeField}
                onRequired={(key, required) => setFields((prev) => prev.map((entry) => (entry.key === key ? { ...entry, required } : entry)))}
              />
            </>
          )}
        </section>

        <section className="content-card">
          <FieldInspector selected={selectedField} fields={fields} onChange={setFields} />
          <div className="form-row" style={{ marginTop: '0.75rem' }}>
            <label>Preview</label>
            <FieldPreview field={selectedField} />
          </div>
          <div className="form-row" style={{ marginTop: '0.75rem' }}>
            <label>Usage</label>
            {selected?.id ? (
              <DataTable value={selectedTypeUsage} size="small" emptyMessage="No content items/routes use this type yet.">
                <Column field="contentItemId" header="Item ID" />
                <Column field="slug" header="Slug" />
                <Column field="marketCode" header="Market" />
                <Column field="localeCode" header="Locale" />
              </DataTable>
            ) : (
              <p className="muted">Select a content type to view usage.</p>
            )}
          </div>
        </section>
      </div>

      <Dialog header="Add Field" visible={showAddField} onHide={() => setShowAddField(false)} style={{ width: '32rem' }}>
        <div className="form-row">
          <label>Label</label>
          <InputText
            value={newFieldLabel}
            onChange={(event) => {
              const value = event.target.value;
              setNewFieldLabel(value);
              if (!newFieldKey) {
                setNewFieldKey(suggestFieldKey(value));
              }
            }}
          />
        </div>
        <div className="form-row">
          <label>Key</label>
          <InputText value={newFieldKey} onChange={(event) => setNewFieldKey(suggestFieldKey(event.target.value))} />
          {fields.some((entry) => entry.key === newFieldKey) ? <small className="error-text">Key already exists</small> : null}
        </div>
        <div className="form-row">
          <label>Type</label>
          <Dropdown value={newFieldType} options={CONTENT_FIELD_TYPES} onChange={(event) => setNewFieldType(event.value as ContentFieldType)} />
        </div>
        <label>
          <Checkbox checked={newFieldRequired} onChange={(event) => setNewFieldRequired(Boolean(event.checked))} /> Required
        </label>
        <div className="inline-actions" style={{ marginTop: '0.75rem' }}>
          <Button label="Cancel" text onClick={() => setShowAddField(false)} />
          <Button label="Add" onClick={addField} disabled={!newFieldLabel.trim() || fields.some((entry) => entry.key === newFieldKey)} />
        </div>
      </Dialog>
    </div>
  );
}
