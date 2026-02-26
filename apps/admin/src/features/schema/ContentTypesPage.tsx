import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import { useAdminContext } from '../../app/AdminContext';
import { useAuth } from '../../app/AuthContext';
import { useUi } from '../../app/UiContext';
import { createAdminSdk } from '../../lib/sdk';
import { PaneRoot, PaneScroll, WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';
import { CommandMenuButton } from '../../ui/commands/CommandMenuButton';
import { commandRegistry } from '../../ui/commands/registry';
import type { Command, CommandContext } from '../../ui/commands/types';
import { downloadJson, routeStartsWith } from '../../ui/commands/utils';
import { resolveComponentRegistry, type ComponentTypeSetting } from '../content/components/componentRegistry';
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

type ComponentTypeSettingRow = {
  componentTypeId?: string | null;
  enabled?: boolean | null;
  groupName?: string | null;
};

type ContentTypesHeaderContext = CommandContext & {
  types: CTypeListItem[];
  selected: CTypeListItem | null;
  fields: ContentFieldDef[];
  refresh: () => Promise<void>;
};

const contentTypesHeaderCommands: Command<ContentTypesHeaderContext>[] = [
  {
    id: 'content-types.export-all-json',
    label: 'Export types JSON',
    icon: 'pi pi-download',
    group: 'Export',
    visible: (ctx) => routeStartsWith(ctx.route, '/site/content-types'),
    enabled: (ctx) => ctx.types.length > 0,
    run: (ctx) => {
      downloadJson(`content-types-site-${ctx.siteId ?? 'unknown'}.json`, ctx.types);
      ctx.toast?.({ severity: 'success', summary: 'Content types exported' });
    }
  },
  {
    id: 'content-types.export-selected-json',
    label: 'Export selected type',
    icon: 'pi pi-file',
    group: 'Export',
    visible: (ctx) => routeStartsWith(ctx.route, '/site/content-types'),
    enabled: (ctx) => Boolean(ctx.selected),
    run: (ctx) => {
      if (!ctx.selected) {
        return;
      }
      downloadJson(`content-type-${ctx.selected.id ?? 'draft'}.json`, {
        ...ctx.selected,
        fields: ctx.fields
      });
      ctx.toast?.({ severity: 'success', summary: 'Selected type exported' });
    }
  },
  {
    id: 'content-types.advanced.refresh',
    label: 'Refresh',
    icon: 'pi pi-refresh',
    group: 'Advanced',
    visible: (ctx) => routeStartsWith(ctx.route, '/site/content-types'),
    run: (ctx) => ctx.refresh()
  }
];

commandRegistry.registerCoreCommands([{ placement: 'pageHeaderOverflow', commands: contentTypesHeaderCommands }]);

function parseStringArrayJson(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is string => typeof entry === 'string');
  } catch {
    return [];
  }
}

function parseAreaRestrictionsJson(value: string | null | undefined): Record<string, string[]> {
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const out: Record<string, string[]> = {};
    for (const [key, entry] of Object.entries(parsed)) {
      if (!Array.isArray(entry)) {
        continue;
      }
      out[key] = entry.filter((item): item is string => typeof item === 'string');
    }
    return out;
  } catch {
    return {};
  }
}

export function ContentTypesPage() {
  const location = useLocation();
  const { token } = useAuth();
  const { toast } = useUi();
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
  const [allowedComponents, setAllowedComponents] = useState<string[]>([]);
  const [areaRestrictions, setAreaRestrictions] = useState<Record<string, string[]>>({});
  const [newAreaName, setNewAreaName] = useState('');
  const [componentSettings, setComponentSettings] = useState<ComponentTypeSetting[]>([]);
  const [allItems, setAllItems] = useState<Array<{ id?: number | null; contentTypeId?: number | null }>>([]);
  const [allRoutes, setAllRoutes] = useState<Array<{ contentItemId?: number | null; slug?: string | null; marketCode?: string | null; localeCode?: string | null }>>([]);

  const refresh = async () => {
    const contentTypesResult = await sdk.listContentTypes({ siteId });
    const componentSettingsResult = await sdk
      .listComponentTypeSettings({ siteId })
      .catch(() => ({ listComponentTypeSettings: [] as ComponentTypeSettingRow[] }));
    const settingsRows = (componentSettingsResult.listComponentTypeSettings ?? []) as ComponentTypeSettingRow[];
    setComponentSettings(
      settingsRows
        .filter((entry) => typeof entry.componentTypeId === 'string')
        .map((entry) => ({
          componentTypeId: entry.componentTypeId as string,
          enabled: Boolean(entry.enabled ?? true),
          groupName: entry.groupName ?? null
        }))
    );

    const all = (contentTypesResult.listContentTypes ?? []) as CTypeListItem[];
    setTypes(all);
    if (selected) {
      const nextSelected = all.find((entry) => entry.id === selected.id) ?? null;
      setSelected(nextSelected);
      setFields(parseFieldsJson(nextSelected?.fieldsJson ?? '[]'));
      setAllowedComponents(parseStringArrayJson(nextSelected?.allowedComponentsJson));
      setAreaRestrictions(parseAreaRestrictionsJson(nextSelected?.componentAreaRestrictionsJson));
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

  useEffect(() => {
    setAreaRestrictions((prev) => {
      const allowed = new Set(allowedComponents);
      const next: Record<string, string[]> = {};
      for (const [area, entries] of Object.entries(prev)) {
        next[area] = entries.filter((entry) => allowed.has(entry));
      }
      return next;
    });
  }, [allowedComponents]);

  const selectedField = fields.find((entry) => entry.key === selectedFieldKey) ?? null;
  const registryOptions = useMemo(() => {
    return resolveComponentRegistry(componentSettings)
      .filter((entry) => entry.enabled)
      .map((entry) => ({
        label: `${entry.label} (${entry.groupName})`,
        value: entry.id
      }));
  }, [componentSettings]);
  const areaNames = useMemo(() => {
    const keys = Object.keys(areaRestrictions).map((entry) => entry.trim()).filter(Boolean);
    if (keys.length === 0) {
      return ['main', 'sidebar'];
    }
    return Array.from(new Set(keys));
  }, [areaRestrictions]);

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
    setAllowedComponents([]);
    setAreaRestrictions({});
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
      allowedComponentsJson: JSON.stringify(allowedComponents),
      componentAreaRestrictionsJson: JSON.stringify(areaRestrictions),
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

  const addArea = () => {
    const normalized = newAreaName.trim();
    if (!normalized) {
      return;
    }
    setAreaRestrictions((prev) => ({ ...prev, [normalized]: prev[normalized] ?? [] }));
    setNewAreaName('');
  };

  const removeArea = (areaName: string) => {
    setAreaRestrictions((prev) => {
      const next = { ...prev };
      delete next[areaName];
      return next;
    });
  };

  const headerContext: ContentTypesHeaderContext = {
    route: location.pathname,
    siteId,
    selectedContentItemId: null,
    selected,
    types,
    fields,
    refresh,
    toast
  };
  const headerOverflowCommands = commandRegistry.getCommands(headerContext, 'pageHeaderOverflow');

  return (
    <WorkspacePage className="content-types-page">
      <WorkspaceHeader
        title="Content Types"
        subtitle="Visual schema builder with field inspector and preview"
        helpTopicKey="content_types"
        askAiContext="types"
        askAiPayload={{ siteId, selectedType: selected, fields }}
        onAskAiInsert={(value) => {
          setSelected((prev) => (prev ? { ...prev, description: `${prev.description ?? ''}\n${value}`.trim() } : prev));
        }}
      />
      <WorkspaceActionBar
        primary={
          <>
            <Button label="New Type" onClick={createType} />
            <Button label="Save Type" severity="success" onClick={() => saveType().catch(() => undefined)} disabled={!selected} />
            <Button label="Add Field" onClick={() => setShowAddField(true)} disabled={!selected} />
          </>
        }
        overflow={<CommandMenuButton commands={headerOverflowCommands} context={headerContext} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />}
      />
      <WorkspaceBody>
        <Splitter className="splitFill">
          <SplitterPanel size={24} minSize={16}>
            <PaneRoot className="content-card">
              <PaneScroll>
                <ContentTypeList
                  items={types}
                  selectedId={selected?.id ?? null}
                  onCreate={createType}
                  onSelect={(item) => {
                    setSelected(item);
                    const parsed = parseFieldsJson(item.fieldsJson);
                    setFields(parsed);
                    setSelectedFieldKey(parsed[0]?.key ?? null);
                    setAllowedComponents(parseStringArrayJson(item.allowedComponentsJson));
                    setAreaRestrictions(parseAreaRestrictionsJson(item.componentAreaRestrictionsJson));
                  }}
                />
              </PaneScroll>
            </PaneRoot>
          </SplitterPanel>
          <SplitterPanel size={46} minSize={28}>
            <PaneRoot className="content-card content-types-editor-pane">
              <PaneScroll className="content-types-editor-scroll">
                {!selected ? <p>Select a content type.</p> : (
                  <>
                    <section className="content-types-section content-types-editor-meta">
                      <div className="content-types-section-head">
                        <h3>Type</h3>
                      </div>
                      <div className="content-types-meta-grid">
                        <div className="form-row">
                          <label>Name</label>
                          <InputText value={selected.name} onChange={(event) => setSelected((prev) => (prev ? { ...prev, name: event.target.value } : prev))} />
                        </div>
                        <div className="form-row">
                          <label>Description</label>
                          <InputText value={selected.description ?? ''} onChange={(event) => setSelected((prev) => (prev ? { ...prev, description: event.target.value } : prev))} />
                        </div>
                      </div>
                    </section>
                    <section className="content-types-section content-types-editor-rules">
                      <div className="content-types-section-head">
                        <h3>Component Rules</h3>
                      </div>
                      <div className="content-types-rule-row">
                        <div className="form-row">
                          <label>Allowed Components</label>
                          <MultiSelect
                            className="w-full"
                            value={allowedComponents}
                            options={registryOptions}
                            onChange={(event) => setAllowedComponents((event.value as string[]) ?? [])}
                            placeholder="Select allowed component types"
                            display="chip"
                            filter
                          />
                          <small className="muted">Editors can only add these component types.</small>
                        </div>
                        <div className="form-row">
                          <label>Add Area</label>
                          <div className="content-types-area-add">
                            <InputText
                              value={newAreaName}
                              onChange={(event) => setNewAreaName(event.target.value)}
                              placeholder="e.g. header"
                            />
                            <Button label="Add" onClick={addArea} disabled={!newAreaName.trim()} />
                          </div>
                          <small className="muted">Define content zones used by the page builder.</small>
                        </div>
                      </div>
                      <div className="content-types-area-list">
                        {areaNames.map((areaName) => (
                          <div className="content-types-area-row" key={areaName}>
                            <div className="content-types-area-row-head">
                              <label>{`Allowed (${areaName})`}</label>
                              <Button
                                text
                                size="small"
                                icon="pi pi-trash"
                                severity="danger"
                                onClick={() => removeArea(areaName)}
                                disabled={areaNames.length <= 1}
                              />
                            </div>
                            <MultiSelect
                              className="w-full"
                              value={areaRestrictions[areaName] ?? []}
                              options={registryOptions.filter((option) => allowedComponents.includes(option.value))}
                              onChange={(event) =>
                                setAreaRestrictions((prev) => ({
                                  ...prev,
                                  [areaName]: (event.value as string[]) ?? []
                                }))
                              }
                              placeholder={`Restrict ${areaName} area (optional)`}
                              display="chip"
                              filter
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="form-row content-types-editor-fields">
                      <div className="content-types-section-head">
                        <h3>Fields</h3>
                      </div>
                      <FieldList
                        fields={fields}
                        selectedKey={selectedFieldKey}
                        onSelect={setSelectedFieldKey}
                        onReorder={setFields}
                        onDuplicate={duplicateField}
                        onDelete={removeField}
                        onRequired={(key, required) => setFields((prev) => prev.map((entry) => (entry.key === key ? { ...entry, required } : entry)))}
                        className="content-types-field-table"
                      />
                    </section>
                  </>
                )}
              </PaneScroll>
            </PaneRoot>
          </SplitterPanel>
          <SplitterPanel size={30} minSize={20}>
            <PaneRoot className="content-card">
              <PaneScroll>
                <FieldInspector selected={selectedField} fields={fields} onChange={setFields} />
                <div className="form-row mt-3">
                  <label>Preview</label>
                  <FieldPreview field={selectedField} />
                </div>
                <div className="form-row mt-3">
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
              </PaneScroll>
            </PaneRoot>
          </SplitterPanel>
        </Splitter>
      </WorkspaceBody>

      <Dialog header="Add Field" visible={showAddField} onHide={() => setShowAddField(false)} className="w-11 md:w-8 lg:w-6 xl:w-4">
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
        <div className="inline-actions mt-3">
          <Button label="Cancel" text onClick={() => setShowAddField(false)} />
          <Button label="Add" onClick={addField} disabled={!newFieldLabel.trim() || fields.some((entry) => entry.key === newFieldKey)} />
        </div>
      </Dialog>
    </WorkspacePage>
  );
}

