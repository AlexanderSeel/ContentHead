import { useEffect, useMemo, useState } from 'react';
import { Button, MultiSelect, Select, Switch, TabItem, Tabs, Tag, Textarea, TextInput } from '../../ui/atoms';

import { useAdminContext } from '../../app/AdminContext';
import { useAuth } from '../../app/AuthContext';
import { createAdminSdk } from '../../lib/sdk';
import { formatErrorMessage, isForbiddenError } from '../../lib/graphqlErrorUi';
import { DataGrid, ForbiddenState, WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';
import type { DataGridColumn } from '../../ui/molecules';
import { JsonSourceEditor } from '../../ui/atoms/JsonSourceEditor';
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

type PropType =
  | 'text'
  | 'multiline'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'select'
  | 'stringList'
  | 'contentLink'
  | 'contentLinkList'
  | 'assetRef'
  | 'assetList'
  | 'formRef'
  | 'componentRef'
  | 'objectRef'
  | 'objectList'
  | 'json';
type ControlType =
  | 'InputText'
  | 'Editor'
  | 'Dropdown'
  | 'MultiSelect'
  | 'LinkPicker'
  | 'AssetPicker'
  | 'ComponentPicker';

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
  refComponentTypesText: string;
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
  { label: 'Text', value: 'text' },
  { label: 'Multiline', value: 'multiline' },
  { label: 'Rich Text', value: 'richtext' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Select', value: 'select' },
  { label: 'String List', value: 'stringList' },
  { label: 'Content Link', value: 'contentLink' },
  { label: 'Content Link List', value: 'contentLinkList' },
  { label: 'Asset Ref', value: 'assetRef' },
  { label: 'Asset List', value: 'assetList' },
  { label: 'Form Ref', value: 'formRef' },
  { label: 'Component Ref', value: 'componentRef' },
  { label: 'Object Ref', value: 'objectRef' },
  { label: 'Object List', value: 'objectList' },
  { label: 'JSON', value: 'json' }
];

const CONTROL_OPTIONS: Array<{ label: string; value: ControlType }> = [
  { label: 'InputText', value: 'InputText' },
  { label: 'Editor', value: 'Editor' },
  { label: 'Dropdown', value: 'Dropdown' },
  { label: 'MultiSelect', value: 'MultiSelect' },
  { label: 'LinkPicker', value: 'LinkPicker' },
  { label: 'AssetPicker', value: 'AssetPicker' },
  { label: 'ComponentPicker', value: 'ComponentPicker' }
];

const componentFieldsJsonSchema: Record<string, unknown> = {
  type: 'array',
  items: {
    type: 'object',
    required: ['key', 'label', 'type'],
    properties: {
      key: { type: 'string' },
      label: { type: 'string' },
      type: { type: 'string' },
      required: { type: 'boolean' },
      defaultValue: {},
      control: { type: 'string' },
      itemLabelKey: { type: 'string' },
      refComponentTypes: {
        type: 'array',
        items: { type: 'string' }
      },
      options: {
        type: 'array',
        items: {
          type: 'object',
          required: ['value'],
          properties: {
            label: { type: 'string' },
            value: { type: 'string' }
          }
        }
      },
      fields: {
        type: 'array',
        items: {
          type: 'object',
          required: ['key', 'label', 'type'],
          properties: {
            key: { type: 'string' },
            label: { type: 'string' },
            type: { type: 'string' },
            required: { type: 'boolean' },
            defaultValue: {},
            control: { type: 'string' },
            refComponentTypes: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    }
  }
};

const uiMetaJsonSchema: Record<string, unknown> = {
  type: 'object',
  additionalProperties: true
};

const looseJsonObjectSchema: Record<string, unknown> = {
  type: 'object',
  additionalProperties: true
};

function normalizeEditorPropType(raw: string): PropType {
  const normalized = raw.trim().toLowerCase();
  const known = PROP_TYPE_OPTIONS.find((entry) => entry.value.toLowerCase() === normalized);
  if (known) return known.value;
  if (normalized === 'string') {
    return 'text';
  }
  if (normalized === 'link') {
    return 'contentLink';
  }
  if (normalized === 'asset') {
    return 'assetRef';
  }
  if (normalized === 'stringlist' || normalized === 'list') {
    return 'stringList';
  }
  if (normalized === 'contentlink') {
    return 'contentLink';
  }
  if (normalized === 'contentlinklist') {
    return 'contentLinkList';
  }
  if (normalized === 'assetref') {
    return 'assetRef';
  }
  if (normalized === 'assetlist') {
    return 'assetList';
  }
  if (normalized === 'formref') {
    return 'formRef';
  }
  if (normalized === 'componentref') {
    return 'componentRef';
  }
  if (normalized === 'objectref') {
    return 'objectRef';
  }
  if (normalized === 'objectlist') {
    return 'objectList';
  }
  if (normalized === 'subtype' || normalized === 'complex' || normalized === 'object') {
    return 'objectList';
  }
  return 'text';
}

function defaultControlForType(type: PropType): ControlType {
  if (type === 'richtext') {
    return 'Editor';
  }
  if (type === 'select') {
    return 'Dropdown';
  }
  if (type === 'contentLink') {
    return 'LinkPicker';
  }
  if (type === 'assetRef') {
    return 'AssetPicker';
  }
  if (type === 'componentRef' || type === 'objectRef') {
    return 'ComponentPicker';
  }
  if (type === 'objectList') {
    return 'ComponentPicker';
  }
  return 'InputText';
}

function normalizeControlForType(type: PropType, rawControl: unknown): ControlType {
  const parsed =
    CONTROL_OPTIONS.find((option) => option.value === String(rawControl))?.value ?? defaultControlForType(type);
  if (type === 'componentRef' || type === 'objectRef' || type === 'objectList') {
    if (parsed === 'InputText' || parsed === 'Editor') {
      return defaultControlForType(type);
    }
  }
  return parsed;
}

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
            const typeRaw = String(entry.type ?? 'text');
            const type = normalizeEditorPropType(typeRaw);
            return {
              key,
              label: String(entry.label ?? key),
              type,
              required: Boolean(entry.required),
              defaultValue:
                entry.defaultValue == null
                  ? ''
                  : typeof entry.defaultValue === 'string'
                    ? entry.defaultValue
                    : JSON.stringify(entry.defaultValue),
              control: normalizeControlForType(type, entry.control),
              optionsText: Array.isArray(entry.options)
                ? (entry.options as Array<Record<string, unknown>>)
                    .map((option) => `${String(option.value ?? '')}:${String(option.label ?? option.value ?? '')}`)
                    .filter(Boolean)
                    .join('\n')
                : '',
              itemLabelKey: String(entry.itemLabelKey ?? ''),
              nestedFieldsJson: Array.isArray(entry.fields) ? JSON.stringify(entry.fields, null, 2) : '',
              refComponentTypesText: Array.isArray(entry.refComponentTypes)
                ? (entry.refComponentTypes as unknown[])
                    .filter((value): value is string => typeof value === 'string')
                    .join(', ')
                : type === 'objectList' && Array.isArray(entry.fields)
                  ? ((entry.fields as Array<Record<string, unknown>>)
                      .find((field) => String(field.type ?? '').toLowerCase() === 'componentref')
                      ?.refComponentTypes as string[] | undefined)?.join(', ') ?? ''
                  : ''
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
    type: normalizeEditorPropType(field.type),
    required: Boolean(field.required),
    defaultValue:
      field.defaultValue == null
        ? ''
        : typeof field.defaultValue === 'string'
          ? field.defaultValue
          : JSON.stringify(field.defaultValue),
    control: normalizeControlForType(
      normalizeEditorPropType(field.type),
      field.type === 'richtext'
        ? 'Editor'
        : field.type === 'select'
          ? 'Dropdown'
          : field.type === 'contentLink'
            ? 'LinkPicker'
            : field.type === 'assetRef'
              ? 'AssetPicker'
              : 'InputText'
    ),
    optionsText: (field.options ?? []).map((option) => `${option.value}:${option.label}`).join('\n'),
    itemLabelKey: field.itemLabelKey ?? '',
    nestedFieldsJson: Array.isArray(field.fields) && field.fields.length > 0 ? JSON.stringify(field.fields, null, 2) : '',
    refComponentTypesText: Array.isArray(field.refComponentTypes) ? field.refComponentTypes.join(', ') : ''
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
          } else if (prop.refComponentTypesText.trim()) {
            base.fields = [
              {
                key: 'item',
                label: 'Item Component',
                type: 'componentRef',
                refComponentTypes: prop.refComponentTypesText
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean)
              }
            ];
            if (!base.itemLabelKey) {
              base.itemLabelKey = 'item';
            }
          } else {
            base.fields = [];
          }
        }
        if (prop.type === 'componentRef' || prop.type === 'objectRef') {
          base.refComponentTypes = prop.refComponentTypesText
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
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
    if (
      prop.type === 'objectList' ||
      prop.type === 'stringList' ||
      prop.type === 'contentLinkList' ||
      prop.type === 'assetList'
    ) {
      try {
        next[key] = JSON.parse(raw);
      } catch {
        next[key] = raw;
      }
      continue;
    }
    if (prop.type === 'objectRef' || prop.type === 'contentLink') {
      try {
        next[key] = JSON.parse(raw);
      } catch {
        next[key] = prop.type === 'objectRef' ? { componentId: '', path: raw } : raw;
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
      if (!prop.nestedFieldsJson.trim() && !prop.refComponentTypesText.trim()) {
        errors.push(`Object list prop "${prop.key || '(new prop)'}" requires nested field schema JSON.`);
      } else {
        if (!prop.nestedFieldsJson.trim() && prop.refComponentTypesText.trim()) {
          continue;
        }
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
  const componentTypeOptions = useMemo(
    () => rows.map((entry) => ({ label: `${entry.label} (${entry.id})`, value: entry.id })),
    [rows]
  );

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
                    <TextInput
                      value={search}
                      onChange={(next) => setSearch(next)}
                      placeholder="Search component types"
                    />
                  </div>
                  <DataGrid
                    data={filteredRows}
                    rowKey="id"
                    pageSize={12}
                    selectedRow={selectedRow}
                    onRowSelect={(row) => setSelectedId(row?.id ?? null)}
                    columns={[
                      { key: 'id', header: 'ID', width: '12rem', headerClassName: 'w-12rem', bodyClassName: 'w-12rem' },
                      {
                        key: '__type',
                        header: 'Type',
                        cell: (entry) => (
                          <div>
                            <strong>{entry.label}</strong>
                            <div className="muted">{entry.description}</div>
                          </div>
                        )
                      },
                      { key: 'groupName', header: 'Group', width: '10rem', headerClassName: 'w-10rem', bodyClassName: 'w-10rem' },
                      {
                        key: '__status',
                        header: 'Status',
                        width: '8rem',
                        headerClassName: 'w-8rem',
                        bodyClassName: 'w-8rem',
                        cell: (entry) => (
                          <Tag value={entry.enabled ? 'Enabled' : 'Disabled'} severity={entry.enabled ? 'success' : 'danger'} />
                        )
                      }
                    ]}
                  />
                </div>
                <div>
                  {!draft ? (
                    <p className="muted">Select a component to edit.</p>
                  ) : (
                    <Tabs activeIndex={tabIndex} onTabChange={(index) => setTabIndex(index)}>
                      <TabItem header="Basics">
                        <div className="form-grid">
                          <div className="form-row">
                            <label>Component ID</label>
                            <TextInput value={draft.id} readOnly />
                          </div>
                          <div className="form-row">
                            <label>Label</label>
                            <TextInput value={draft.label} onChange={(next) => setDraft((prev) => (prev ? { ...prev, label: next } : prev))} />
                          </div>
                          <div className="form-row">
                            <label>Group</label>
                            <TextInput value={draft.groupName} onChange={(next) => setDraft((prev) => (prev ? { ...prev, groupName: next } : prev))} />
                          </div>
                          <div className="form-row">
                            <label>Enabled</label>
                            <Switch value={draft.enabled} onChange={(next) => setDraft((prev) => (prev ? { ...prev, enabled: next } : prev))} />
                          </div>
                        </div>
                      </TabItem>
                      <TabItem header="Props">
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
                                          type: 'text',
                                          required: false,
                                          defaultValue: '',
                                          control: 'InputText',
                                          optionsText: '',
                                          itemLabelKey: '',
                                          nestedFieldsJson: '',
                                          refComponentTypesText: ''
                                        }
                                      ]
                                    }
                                  : prev
                              )
                            }
                          />
                        </div>
                        <DataGrid<PropDef>
                          data={draft.props}
                          columns={[
                            {
                              key: '__order',
                              header: '#',
                              width: '5rem',
                              headerClassName: 'w-5rem',
                              bodyClassName: 'w-5rem',
                              cell: (_row, index) => (
                                <div className="inline-actions">
                                  <Button
                                    text
                                    icon="pi pi-angle-up"
                                    size="small"
                                    onClick={() =>
                                      setDraft((prev) => {
                                        if (!prev || index <= 0) return prev;
                                        const next = [...prev.props];
                                        const [entry] = next.splice(index, 1);
                                        if (!entry) return prev;
                                        next.splice(index - 1, 0, entry);
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
                                        if (!prev || index >= prev.props.length - 1) return prev;
                                        const next = [...prev.props];
                                        const [entry] = next.splice(index, 1);
                                        if (!entry) return prev;
                                        next.splice(index + 1, 0, entry);
                                        return { ...prev, props: next };
                                      })
                                    }
                                  />
                                </div>
                              )
                            },
                            { key: 'key', header: 'Key', cell: (row, index) => <TextInput value={row.key} onChange={(next) => updateProp(index, { key: next })} /> },
                            { key: 'label', header: 'Label', cell: (row, index) => <TextInput value={row.label} onChange={(next) => updateProp(index, { label: next })} /> },
                            {
                              key: 'type',
                              header: 'Type',
                              cell: (row, index) => (
                                <Select
                                  value={row.type}
                                  options={PROP_TYPE_OPTIONS}
                                  onChange={(next) => {
                                    if (!next) return;
                                    const nextType = next as PropType;
                                    updateProp(index, { type: nextType, control: defaultControlForType(nextType) });
                                  }}
                                />
                              )
                            },
                            { key: 'required', header: 'Required', cell: (row, index) => <Switch value={row.required} onChange={(next) => updateProp(index, { required: next })} /> },
                            { key: 'defaultValue', header: 'Default', cell: (row, index) => <TextInput value={row.defaultValue} onChange={(next) => updateProp(index, { defaultValue: next })} /> },
                            { key: 'control', header: 'Control', cell: (row, index) => <Select value={row.control} options={CONTROL_OPTIONS} onChange={(next) => next && updateProp(index, { control: next as ControlType })} /> },
                            {
                              key: 'refComponentTypesText',
                              header: 'Ref Types',
                              cell: (row, index) => {
                                if (row.type !== 'componentRef' && row.type !== 'objectRef' && row.type !== 'objectList') {
                                  return <span className="muted">-</span>;
                                }
                                const selected = row.refComponentTypesText.split(',').map((v) => v.trim()).filter(Boolean);
                                return (
                                  <MultiSelect
                                    value={selected}
                                    options={componentTypeOptions}
                                    onChange={(next) => updateProp(index, { refComponentTypesText: (next ?? []).join(', ') })}
                                    filter
                                    placeholder="Select component types"
                                    maxSelectedLabels={2}
                                  />
                                );
                              }
                            },
                            {
                              key: '__actions',
                              header: 'Actions',
                              width: '5rem',
                              headerClassName: 'w-5rem',
                              bodyClassName: 'w-5rem',
                              cell: (_row, index) => (
                                <Button
                                  text
                                  severity="danger"
                                  icon="pi pi-trash"
                                  onClick={() => setDraft((prev) => (prev ? { ...prev, props: prev.props.filter((_, i) => i !== index) } : prev))}
                                />
                              )
                            }
                          ] satisfies DataGridColumn<PropDef>[]}
                        />
                      </TabItem>
                      <TabItem header="UI">
                        <p className="muted">Control mapping per prop, with typed JSON source editors for nested schemas.</p>
                        {draft.props.map((prop, index) => (
                          <div key={`${prop.key}-${index}`} className="content-card mb-3">
                            <div className="status-panel mb-2">
                              <strong>{prop.label || prop.key || `Prop ${index + 1}`}</strong>
                              <div className="muted">{prop.key} ({prop.type})</div>
                            </div>
                            <div className="form-grid">
                            <div className="form-row">
                              <label>{prop.key} control</label>
                              <Select value={prop.control} options={CONTROL_OPTIONS} onChange={(next) => next && updateProp(index, { control: next as ControlType })} />
                            </div>
                            {prop.type === 'select' ? (
                              <div className="form-row">
                                <label>{prop.key} options</label>
                                <Textarea rows={3} value={prop.optionsText} onChange={(next) => updateProp(index, { optionsText: next })} />
                              </div>
                            ) : null}
                            {prop.type === 'objectList' ? (
                              <>
                                <div className="form-row">
                                  <label>{prop.key} item label key</label>
                                  <TextInput value={prop.itemLabelKey} onChange={(next) => updateProp(index, { itemLabelKey: next })} placeholder="title" />
                                </div>
                                <div className="form-row">
                                  <label>{prop.key} nested fields JSON</label>
                                  <JsonSourceEditor
                                    editorId={`component-registry-${draft.id}-nested-${prop.key || index}`}
                                    value={prop.nestedFieldsJson}
                                    onChange={(next) => updateProp(index, { nestedFieldsJson: next })}
                                    height={220}
                                    schema={componentFieldsJsonSchema}
                                  />
                                </div>
                              </>
                            ) : null}
                            {prop.type === 'componentRef' || prop.type === 'objectRef' || prop.type === 'objectList' ? (
                              <div className="form-row">
                                <label>{prop.key} allowed component types</label>
                                <MultiSelect
                                  value={prop.refComponentTypesText.split(',').map((value) => value.trim()).filter(Boolean)}
                                  options={componentTypeOptions}
                                  onChange={(next) => {
                                    updateProp(index, { refComponentTypesText: (next ?? []).join(', ') });
                                  }}
                                  display="chip"
                                  filter
                                  placeholder="Select component types"
                                  maxSelectedLabels={3}
                                />
                              </div>
                            ) : null}
                            </div>
                          </div>
                        ))}
                      </TabItem>
                      <TabItem header="Preview">
                        <div className="content-card">
                          <p className="muted">Props inspector preview</p>
                          {draft.props.map((prop) => (
                            <div className="form-row" key={`preview-${prop.key}`}>
                              <label>{prop.label}{prop.required ? ' *' : ''}</label>
                              {prop.type === 'richtext' ? (
                                <Textarea rows={4} value={previewValues[prop.key] ?? ''} onChange={(next) => setPreviewValues((prev) => ({ ...prev, [prop.key]: next }))} />
                              ) : prop.type === 'select' ? (
                                <Select
                                  value={previewValues[prop.key] ?? ''}
                                  options={prop.optionsText
                                    .split('\n')
                                    .map((line) => line.trim())
                                    .filter(Boolean)
                                    .map((line) => {
                                      const [value, label] = line.split(':');
                                      return { value: (value ?? '').trim(), label: (label ?? value ?? '').trim() };
                                    })}
                                  onChange={(next) => setPreviewValues((prev) => ({ ...prev, [prop.key]: next ?? '' }))}
                                />
                              ) : prop.type === 'componentRef' ? (
                                <Select
                                  value={previewValues[prop.key] ?? ''}
                                  options={componentTypeOptions}
                                  onChange={(next) => setPreviewValues((prev) => ({ ...prev, [prop.key]: next ?? '' }))}
                                  filter
                                />
                              ) : prop.type === 'stringList' || prop.type === 'contentLinkList' || prop.type === 'assetList' || prop.type === 'objectList' ? (
                                <JsonSourceEditor
                                  editorId={`component-registry-${draft.id}-preview-${prop.key}`}
                                  value={previewValues[prop.key] ?? (prop.type === 'objectList' ? '[]' : '[]')}
                                  onChange={(next) => setPreviewValues((prev) => ({ ...prev, [prop.key]: next }))}
                                  height={160}
                                  schema={prop.type === 'objectList' ? componentFieldsJsonSchema : null}
                                />
                              ) : prop.type === 'objectRef' ? (
                                <JsonSourceEditor
                                  editorId={`component-registry-${draft.id}-preview-object-ref-${prop.key}`}
                                  value={previewValues[prop.key] ?? '{"componentId":"","path":""}'}
                                  onChange={(next) => setPreviewValues((prev) => ({ ...prev, [prop.key]: next }))}
                                  height={140}
                                  schema={looseJsonObjectSchema}
                                />
                              ) : prop.type === 'json' ? (
                                <JsonSourceEditor
                                  editorId={`component-registry-${draft.id}-preview-json-${prop.key}`}
                                  value={previewValues[prop.key] ?? '{}'}
                                  onChange={(next) => setPreviewValues((prev) => ({ ...prev, [prop.key]: next }))}
                                  height={180}
                                  schema={looseJsonObjectSchema}
                                />
                              ) : (
                                <TextInput value={previewValues[prop.key] ?? ''} onChange={(next) => setPreviewValues((prev) => ({ ...prev, [prop.key]: next }))} />
                              )}
                            </div>
                          ))}
                        </div>
                      </TabItem>
                      <TabItem header="Advanced JSON">
                        <div className="form-row">
                          <label>Schema JSON</label>
                          <JsonSourceEditor
                            editorId={`component-registry-${draft.id}-schema-json`}
                            value={serializeProps(draft.props)}
                            readOnly
                            height={280}
                            schema={componentFieldsJsonSchema}
                          />
                        </div>
                        <div className="form-row">
                          <label>UI Metadata JSON</label>
                          <JsonSourceEditor
                            editorId={`component-registry-${draft.id}-ui-meta-json`}
                            value={draft.uiMetaJsonText || '{}'}
                            onChange={(next) => setDraft((prev) => (prev ? { ...prev, uiMetaJsonText: next } : prev))}
                            height={280}
                            schema={uiMetaJsonSchema}
                          />
                        </div>
                      </TabItem>
                    </Tabs>
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
