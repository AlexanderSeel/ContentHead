import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { TabPanel, TabView } from 'primereact/tabview';
import { Tag } from 'primereact/tag';

import { useAdminContext } from '../../app/AdminContext';
import { useAuth } from '../../app/AuthContext';
import { createAdminSdk } from '../../lib/sdk';
import { formatErrorMessage, isForbiddenError } from '../../lib/graphqlErrorUi';
import { ForbiddenState, WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';
import {
  resolveComponentRegistry,
  type ComponentTypeSetting,
  type ResolvedComponentRegistryEntry
} from '../content/components/componentRegistry';

type ComponentTypeSettingRow = {
  siteId?: number | null;
  componentTypeId?: string | null;
  enabled?: boolean | null;
  label?: string | null;
  groupName?: string | null;
  schemaJson?: string | null;
  uiMetaJson?: string | null;
  defaultPropsJson?: string | null;
};

type PropType = 'string' | 'richtext' | 'number' | 'boolean' | 'select' | 'link' | 'asset' | 'formRef' | 'list' | 'objectList';
type ControlType = 'InputText' | 'Editor' | 'Dropdown' | 'MultiSelect' | 'LinkPicker' | 'AssetPicker';

type PropDef = {
  key: string;
  label: string;
  type: PropType;
  required: boolean;
  defaultValue: string;
  control: ControlType;
  optionsText: string;
  itemLabelKey: string;
  nestedFieldsJson: string;
};

type DraftDefinition = {
  id: string;
  label: string;
  groupName: string;
  enabled: boolean;
  props: PropDef[];
  uiMetaJsonText: string;
};

const PROP_TYPE_OPTIONS: Array<{ label: string; value: PropType }> = [
  { label: 'String', value: 'string' },
  { label: 'Rich Text', value: 'richtext' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Select', value: 'select' },
  { label: 'Link', value: 'link' },
  { label: 'Asset', value: 'asset' },
  { label: 'Form Ref', value: 'formRef' },
  { label: 'List', value: 'list' },
  { label: 'Object List', value: 'objectList' }
];

const CONTROL_OPTIONS: Array<{ label: string; value: ControlType }> = [
  { label: 'InputText', value: 'InputText' },
  { label: 'Editor', value: 'Editor' },
  { label: 'Dropdown', value: 'Dropdown' },
  { label: 'MultiSelect', value: 'MultiSelect' },
  { label: 'LinkPicker', value: 'LinkPicker' },
  { label: 'AssetPicker', value: 'AssetPicker' }
];

function parsePropsFromSchema(schemaJson: string | null | undefined, fallback: ResolvedComponentRegistryEntry): PropDef[] {
  if (schemaJson) {
    try {
      const parsed = JSON.parse(schemaJson) as Array<Record<string, unknown>>;
      if (Array.isArray(parsed)) {
        const rows = parsed
          .filter((entry) => entry && typeof entry === 'object')
          .map((entry) => {
            const key = String(entry.key ?? '').trim();
            if (!key) {
              return null;
            }
            const typeRaw = String(entry.type ?? 'string');
            const type = (PROP_TYPE_OPTIONS.find((option) => option.value === (typeRaw as PropType))?.value ?? 'string') as PropType;
            return {
              key,
              label: String(entry.label ?? key),
              type:
                typeRaw === 'objectList' || typeRaw === 'objectlist'
                  ? 'objectList'
                  : type,
              required: Boolean(entry.required),
              defaultValue:
                entry.defaultValue == null
                  ? ''
                  : typeof entry.defaultValue === 'string'
                    ? entry.defaultValue
                    : JSON.stringify(entry.defaultValue),
              control: (CONTROL_OPTIONS.find((option) => option.value === String(entry.control))?.value ?? 'InputText') as ControlType,
              optionsText: Array.isArray(entry.options)
                ? (entry.options as Array<Record<string, unknown>>)
                    .map((option) => `${String(option.value ?? '')}:${String(option.label ?? option.value ?? '')}`)
                    .filter(Boolean)
                    .join('\n')
                : '',
              itemLabelKey: String(entry.itemLabelKey ?? ''),
              nestedFieldsJson: Array.isArray(entry.fields) ? JSON.stringify(entry.fields, null, 2) : ''
            } satisfies PropDef;
          })
          .filter((entry): entry is PropDef => Boolean(entry));
        if (rows.length > 0) {
          return rows;
        }
      }
    } catch {
      // keep fallback
    }
  }

  return fallback.fields.map((field) => ({
    key: field.key,
    label: field.label,
    type:
      field.type === 'objectList'
        ? 'objectList'
        : field.type === 'richtext'
          ? 'richtext'
          : field.type === 'number'
            ? 'number'
            : field.type === 'boolean'
              ? 'boolean'
              : field.type === 'select'
                ? 'select'
                : field.type === 'contentLink'
                  ? 'link'
                  : field.type === 'assetRef'
                    ? 'asset'
                    : field.type === 'formRef'
                      ? 'formRef'
                      : field.type === 'stringList'
                        ? 'list'
                        : 'string',
    required: Boolean(field.required),
    defaultValue:
      field.defaultValue == null
        ? ''
        : typeof field.defaultValue === 'string'
          ? field.defaultValue
          : JSON.stringify(field.defaultValue),
    control: field.type === 'richtext' ? 'Editor' : field.type === 'select' ? 'Dropdown' : field.type === 'contentLink' ? 'LinkPicker' : field.type === 'assetRef' ? 'AssetPicker' : 'InputText',
    optionsText: (field.options ?? []).map((option) => `${option.value}:${option.label}`).join('\n'),
    itemLabelKey: field.itemLabelKey ?? '',
    nestedFieldsJson: Array.isArray(field.fields) && field.fields.length > 0 ? JSON.stringify(field.fields, null, 2) : ''
  }));
}

function serializeProps(props: PropDef[]): string {
  return JSON.stringify(
    props
      .map((prop) => {
        const key = prop.key.trim();
        if (!key) {
          return null;
        }
        const base = {
          key,
          label: prop.label.trim() || key,
          type: prop.type,
          required: prop.required,
          defaultValue: prop.defaultValue.trim(),
          control: prop.control
        } as Record<string, unknown>;
        if (prop.type === 'select') {
          base.options =
            prop.optionsText.trim().length === 0
              ? []
              : prop.optionsText
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => {
                    const [value, label] = line.split(':');
                    return { value: (value ?? '').trim(), label: (label ?? value ?? '').trim() };
                  });
        }
        if (prop.type === 'objectList') {
          base.itemLabelKey = prop.itemLabelKey.trim() || null;
          if (prop.nestedFieldsJson.trim()) {
            try {
              base.fields = JSON.parse(prop.nestedFieldsJson);
            } catch {
              base.fields = [];
            }
          } else {
            base.fields = [];
          }
        }
        return base;
      })
      .filter((prop): prop is Record<string, unknown> => Boolean(prop)),
    null,
    2
  );
}

function serializeDefaultProps(props: PropDef[]): string {
  const next: Record<string, unknown> = {};
  for (const prop of props) {
    const key = prop.key.trim();
    if (!key) {
      continue;
    }
    const raw = prop.defaultValue.trim();
    if (!raw) {
      continue;
    }
    if (prop.type === 'number') {
      const asNumber = Number(raw);
      next[key] = Number.isFinite(asNumber) ? asNumber : raw;
      continue;
    }
    if (prop.type === 'boolean') {
      next[key] = raw === 'true';
      continue;
    }
    if (prop.type === 'list' || prop.type === 'objectList') {
      try {
        next[key] = JSON.parse(raw);
      } catch {
        next[key] = raw;
      }
      continue;
    }
    next[key] = raw;
  }
  return JSON.stringify(next);
}

function validateDraft(draft: DraftDefinition): string[] {
  const errors: string[] = [];
  if (!draft.label.trim()) {
    errors.push('Label is required.');
  }
  const keys = draft.props.map((prop) => prop.key.trim()).filter(Boolean);
  const unique = new Set(keys);
  if (unique.size !== keys.length) {
    errors.push('Prop keys must be unique.');
  }
  for (const prop of draft.props) {
    if (!prop.key.trim()) {
      errors.push('All props require a key.');
    }
    if (prop.type === 'select' && prop.optionsText.trim().length === 0) {
      errors.push(`Select prop "${prop.key || '(new prop)'}" requires options.`);
    }
    if (prop.type === 'objectList') {
      if (!prop.nestedFieldsJson.trim()) {
        errors.push(`Object list prop "${prop.key || '(new prop)'}" requires nested field schema JSON.`);
      } else {
        try {
          const parsed = JSON.parse(prop.nestedFieldsJson);
          if (!Array.isArray(parsed)) {
            errors.push(`Object list prop "${prop.key || '(new prop)'}" nested schema must be an array.`);
          }
        } catch {
          errors.push(`Object list prop "${prop.key || '(new prop)'}" nested schema must be valid JSON.`);
        }
      }
    }
  }
  if (draft.uiMetaJsonText.trim()) {
    try {
      JSON.parse(draft.uiMetaJsonText);
    } catch {
      errors.push('UI metadata must be valid JSON.');
    }
  }
  return errors;
}

export function ComponentRegistryPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId } = useAdminContext();
  const [settings, setSettings] = useState<ComponentTypeSetting[]>([]);
  const [status, setStatus] = useState('');
  const [forbiddenReason, setForbiddenReason] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftDefinition | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});

  const handleError = (error: unknown) => {
    const message = formatErrorMessage(error);
    if (isForbiddenError(error)) {
      setForbiddenReason(message);
      return;
    }
    setStatus(message);
  };

  const refresh = async () => {
    const result = await sdk.listComponentTypeSettings({ siteId });
    const rows = (result.listComponentTypeSettings ?? []) as ComponentTypeSettingRow[];
    setSettings(
      rows
        .filter((row) => typeof row.componentTypeId === 'string')
        .map((row) => ({
          componentTypeId: row.componentTypeId as string,
          enabled: Boolean(row.enabled ?? true),
          label: row.label ?? null,
          groupName: row.groupName ?? null,
          schemaJson: row.schemaJson ?? null,
          uiMetaJson: row.uiMetaJson ?? null,
          defaultPropsJson: row.defaultPropsJson ?? null
        }))
    );
    setStatus('');
  };

  useEffect(() => {
    refresh().catch(handleError);
  }, [siteId]);

  const rows = useMemo(() => resolveComponentRegistry(settings), [settings]);
  const settingsMap = useMemo(
    () => new Map(settings.map((entry) => [entry.componentTypeId, entry])),
    [settings]
  );
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return rows;
    }
    return rows.filter((entry) =>
      entry.id.toLowerCase().includes(query) ||
      entry.label.toLowerCase().includes(query) ||
      entry.groupName.toLowerCase().includes(query)
    );
  }, [rows, search]);

  useEffect(() => {
    if (rows.length === 0) {
      setSelectedId(null);
      setDraft(null);
      return;
    }
    const nextSelected = selectedId && rows.some((entry) => entry.id === selectedId) ? selectedId : rows[0]?.id ?? null;
    setSelectedId(nextSelected);
    if (!nextSelected) {
      setDraft(null);
      return;
    }
    const row = rows.find((entry) => entry.id === nextSelected);
    if (!row) {
      setDraft(null);
      return;
    }
    const saved = settingsMap.get(row.id);
    setDraft({
      id: row.id,
      label: saved?.label?.trim() || row.label,
      groupName: saved?.groupName?.trim() || row.groupName,
      enabled: saved?.enabled ?? row.enabled,
      props: parsePropsFromSchema(saved?.schemaJson, row),
      uiMetaJsonText: saved?.uiMetaJson?.trim() ?? ''
    });
  }, [rows, selectedId, settingsMap]);

  const validation = useMemo(() => (draft ? validateDraft(draft) : []), [draft]);

  const save = async () => {
    if (!draft) {
      return;
    }
    const errors = validateDraft(draft);
    if (errors.length > 0) {
      setStatus(errors[0] ?? 'Invalid definition');
      return;
    }
    await sdk.upsertComponentTypeSetting({
      siteId,
      componentTypeId: draft.id,
      enabled: draft.enabled,
      label: draft.label.trim(),
      groupName: draft.groupName.trim() || null,
      schemaJson: serializeProps(draft.props),
      uiMetaJson: draft.uiMetaJsonText.trim() || null,
      defaultPropsJson: serializeDefaultProps(draft.props),
      by: 'admin'
    });
    await refresh();
    setStatus(`Saved component definition: ${draft.id}`);
  };

  const selectedRow = draft ? rows.find((entry) => entry.id === draft.id) ?? null : null;

  const updateProp = (index: number, patch: Partial<PropDef>) => {
    setDraft((prev) => {
      if (!prev) {
        return prev;
      }
      const next = [...prev.props];
      const current = next[index];
      if (!current) {
        return prev;
      }
      next[index] = { ...current, ...patch };
      return { ...prev, props: next };
    });
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Component Registry"
        subtitle="Build components: edit metadata, prop schemas, and inspector UI."
      />
      {forbiddenReason ? (
        <WorkspaceBody>
          <ForbiddenState title="Component registry unavailable" reason={forbiddenReason} />
        </WorkspaceBody>
      ) : (
        <>
          <WorkspaceActionBar
            primary={
              <>
                <Button label="Refresh" onClick={() => refresh().catch((error: unknown) => handleError(error))} />
                <Button label="Save Definition" severity="secondary" onClick={() => save().catch(handleError)} disabled={!draft} />
              </>
            }
          />
          <WorkspaceBody>
            <section className="content-card pane paneScroll">
              <div className="split-layout-2">
                <div>
                  <div className="table-toolbar">
                    <InputText
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search component types"
                    />
                  </div>
                  <DataTable
                    value={filteredRows}
                    size="small"
                    paginator
                    rows={12}
                    selectionMode="single"
                    selection={selectedRow}
                    onSelectionChange={(event) => setSelectedId((event.value as ResolvedComponentRegistryEntry | null)?.id ?? null)}
                  >
                    <Column field="id" header="ID" headerClassName="w-12rem" bodyClassName="w-12rem" />
                    <Column
                      header="Type"
                      body={(entry: ResolvedComponentRegistryEntry) => (
                        <div>
                          <strong>{entry.label}</strong>
                          <div className="muted">{entry.description}</div>
                        </div>
                      )}
                    />
                    <Column field="groupName" header="Group" headerClassName="w-10rem" bodyClassName="w-10rem" />
                    <Column
                      header="Status"
                      body={(entry: ResolvedComponentRegistryEntry) => (
                        <Tag value={entry.enabled ? 'Enabled' : 'Disabled'} severity={entry.enabled ? 'success' : 'danger'} />
                      )}
                      headerClassName="w-8rem"
                      bodyClassName="w-8rem"
                    />
                  </DataTable>
                </div>
                <div>
                  {!draft ? (
                    <p className="muted">Select a component to edit.</p>
                  ) : (
                    <TabView activeIndex={tabIndex} onTabChange={(event) => setTabIndex(event.index)}>
                      <TabPanel header="Basics">
                        <div className="form-grid">
                          <div className="form-row">
                            <label>Component ID</label>
                            <InputText value={draft.id} readOnly />
                          </div>
                          <div className="form-row">
                            <label>Label</label>
                            <InputText value={draft.label} onChange={(event) => setDraft((prev) => (prev ? { ...prev, label: event.target.value } : prev))} />
                          </div>
                          <div className="form-row">
                            <label>Group</label>
                            <InputText value={draft.groupName} onChange={(event) => setDraft((prev) => (prev ? { ...prev, groupName: event.target.value } : prev))} />
                          </div>
                          <div className="form-row">
                            <label>Enabled</label>
                            <InputSwitch checked={draft.enabled} onChange={(event) => setDraft((prev) => (prev ? { ...prev, enabled: Boolean(event.value) } : prev))} />
                          </div>
                        </div>
                      </TabPanel>
                      <TabPanel header="Props">
                        <div className="inline-actions mb-2">
                          <Button
                            label="Add Prop"
                            size="small"
                            onClick={() =>
                              setDraft((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      props: [
                                        ...prev.props,
                                        {
                                          key: `prop_${prev.props.length + 1}`,
                                          label: 'New Prop',
                                          type: 'string',
                                          required: false,
                                          defaultValue: '',
                                          control: 'InputText',
                                          optionsText: '',
                                          itemLabelKey: '',
                                          nestedFieldsJson: ''
                                        }
                                      ]
                                    }
                                  : prev
                              )
                            }
                          />
                        </div>
                        <DataTable value={draft.props} size="small">
                          <Column
                            header="#"
                            body={(_row, options) => (
                              <div className="inline-actions">
                                <Button
                                  text
                                  icon="pi pi-angle-up"
                                  size="small"
                                  onClick={() =>
                                    setDraft((prev) => {
                                      if (!prev || options.rowIndex <= 0) {
                                        return prev;
                                      }
                                      const next = [...prev.props];
                                      const [entry] = next.splice(options.rowIndex, 1);
                                      if (!entry) {
                                        return prev;
                                      }
                                      next.splice(options.rowIndex - 1, 0, entry);
                                      return { ...prev, props: next };
                                    })
                                  }
                                />
                                <Button
                                  text
                                  icon="pi pi-angle-down"
                                  size="small"
                                  onClick={() =>
                                    setDraft((prev) => {
                                      if (!prev || options.rowIndex >= prev.props.length - 1) {
                                        return prev;
                                      }
                                      const next = [...prev.props];
                                      const [entry] = next.splice(options.rowIndex, 1);
                                      if (!entry) {
                                        return prev;
                                      }
                                      next.splice(options.rowIndex + 1, 0, entry);
                                      return { ...prev, props: next };
                                    })
                                  }
                                />
                              </div>
                            )}
                            headerClassName="w-5rem"
                            bodyClassName="w-5rem"
                          />
                          <Column header="Key" body={(row: PropDef, options) => <InputText value={row.key} onChange={(event) => updateProp(options.rowIndex, { key: event.target.value })} />} />
                          <Column header="Label" body={(row: PropDef, options) => <InputText value={row.label} onChange={(event) => updateProp(options.rowIndex, { label: event.target.value })} />} />
                          <Column header="Type" body={(row: PropDef, options) => <Dropdown value={row.type} options={PROP_TYPE_OPTIONS} onChange={(event) => updateProp(options.rowIndex, { type: event.value as PropType })} />} />
                          <Column header="Required" body={(row: PropDef, options) => <InputSwitch checked={row.required} onChange={(event) => updateProp(options.rowIndex, { required: Boolean(event.value) })} />} />
                          <Column header="Default" body={(row: PropDef, options) => <InputText value={row.defaultValue} onChange={(event) => updateProp(options.rowIndex, { defaultValue: event.target.value })} />} />
                          <Column header="Control" body={(row: PropDef, options) => <Dropdown value={row.control} options={CONTROL_OPTIONS} onChange={(event) => updateProp(options.rowIndex, { control: event.value as ControlType })} />} />
                          <Column
                            header="Actions"
                            body={(_row, options) => (
                              <Button
                                text
                                severity="danger"
                                icon="pi pi-trash"
                                onClick={() =>
                                  setDraft((prev) => (prev ? { ...prev, props: prev.props.filter((_, index) => index !== options.rowIndex) } : prev))
                                }
                              />
                            )}
                            headerClassName="w-5rem"
                            bodyClassName="w-5rem"
                          />
                        </DataTable>
                      </TabPanel>
                      <TabPanel header="UI">
                        <p className="muted">Control mapping per prop and select options (`value:label` per line).</p>
                        {draft.props.map((prop, index) => (
                          <div key={`${prop.key}-${index}`} className="form-grid">
                            <div className="form-row">
                              <label>{prop.key} control</label>
                              <Dropdown value={prop.control} options={CONTROL_OPTIONS} onChange={(event) => updateProp(index, { control: event.value as ControlType })} />
                            </div>
                            {prop.type === 'select' ? (
                              <div className="form-row">
                                <label>{prop.key} options</label>
                                <InputTextarea rows={3} value={prop.optionsText} onChange={(event) => updateProp(index, { optionsText: event.target.value })} />
                              </div>
                            ) : null}
                            {prop.type === 'objectList' ? (
                              <>
                                <div className="form-row">
                                  <label>{prop.key} item label key</label>
                                  <InputText value={prop.itemLabelKey} onChange={(event) => updateProp(index, { itemLabelKey: event.target.value })} placeholder="title" />
                                </div>
                                <div className="form-row">
                                  <label>{prop.key} nested fields JSON</label>
                                  <InputTextarea
                                    rows={8}
                                    value={prop.nestedFieldsJson}
                                    onChange={(event) => updateProp(index, { nestedFieldsJson: event.target.value })}
                                    placeholder={'[{"key":"title","label":"Title","type":"string"},{"key":"description","label":"Description","type":"string"}]'}
                                  />
                                </div>
                              </>
                            ) : null}
                          </div>
                        ))}
                      </TabPanel>
                      <TabPanel header="Preview">
                        <div className="content-card">
                          <p className="muted">Props inspector preview</p>
                          {draft.props.map((prop) => (
                            <div className="form-row" key={`preview-${prop.key}`}>
                              <label>{prop.label}{prop.required ? ' *' : ''}</label>
                              {prop.type === 'richtext' ? (
                                <InputTextarea rows={4} value={previewValues[prop.key] ?? ''} onChange={(event) => setPreviewValues((prev) => ({ ...prev, [prop.key]: event.target.value }))} />
                              ) : prop.type === 'select' ? (
                                <Dropdown
                                  value={previewValues[prop.key] ?? ''}
                                  options={prop.optionsText
                                    .split('\n')
                                    .map((line) => line.trim())
                                    .filter(Boolean)
                                    .map((line) => {
                                      const [value, label] = line.split(':');
                                      return { value: (value ?? '').trim(), label: (label ?? value ?? '').trim() };
                                    })}
                                  onChange={(event) => setPreviewValues((prev) => ({ ...prev, [prop.key]: String(event.value ?? '') }))}
                                />
                              ) : prop.type === 'list' || prop.type === 'objectList' ? (
                                <InputTextarea
                                  rows={4}
                                  value={previewValues[prop.key] ?? (prop.type === 'objectList' ? '[]' : '')}
                                  onChange={(event) => setPreviewValues((prev) => ({ ...prev, [prop.key]: event.target.value }))}
                                />
                              ) : (
                                <InputText value={previewValues[prop.key] ?? ''} onChange={(event) => setPreviewValues((prev) => ({ ...prev, [prop.key]: event.target.value }))} />
                              )}
                            </div>
                          ))}
                        </div>
                      </TabPanel>
                      <TabPanel header="Advanced JSON">
                        <div className="form-row">
                          <label>Schema JSON</label>
                          <InputTextarea rows={10} value={serializeProps(draft.props)} readOnly />
                        </div>
                        <div className="form-row">
                          <label>UI Metadata JSON</label>
                          <InputTextarea rows={10} value={draft.uiMetaJsonText} onChange={(event) => setDraft((prev) => (prev ? { ...prev, uiMetaJsonText: event.target.value } : prev))} />
                        </div>
                      </TabPanel>
                    </TabView>
                  )}
                  {validation.length > 0 ? (
                    <div className="status-panel" role="alert">
                      {validation.map((error) => <div key={error}>{error}</div>)}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </WorkspaceBody>
          {status ? <div className="status-panel" role="alert">{status}</div> : null}
        </>
      )}
    </WorkspacePage>
  );
}
