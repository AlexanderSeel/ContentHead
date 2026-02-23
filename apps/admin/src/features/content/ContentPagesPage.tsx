import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TabPanel, TabView } from 'primereact/tabview';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import type { TreeNode } from 'primereact/treenode';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { AutoComplete } from 'primereact/autocomplete';
import { Dialog } from 'primereact/dialog';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { buildLocalizedPath } from '@contenthead/shared';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { SplitView } from '../../components/common/SplitView';
import { MarketLocalePicker } from '../../components/inputs/MarketLocalePicker';
import { SlugEditor } from '../../components/inputs/SlugEditor';
import { useUi } from '../../app/UiContext';
import type { ContentFieldDef } from '../schema/fieldValidationUi';
import { parseFieldsJson } from '../schema/fieldValidationUi';
import { FieldRenderer } from './fieldRenderers/FieldRenderer';
import { validationMessage } from './fieldRenderers/rendererRegistry';
import { ComponentList } from './components/ComponentList';
import { ComponentInspector } from './components/ComponentInspector';
import { componentRegistry, getComponentRegistryEntry } from './components/componentRegistry';

type CType = { id: number; name: string; fieldsJson: string };
type Template = { id: number; name: string; compositionJson: string; componentsJson: string };
type CItem = { id: number; contentTypeId: number };
type CVersion = { id: number; versionNumber: number; fieldsJson: string; compositionJson: string; componentsJson: string; metadataJson: string; state: string; comment?: string | null };
type CRoute = { id: number; contentItemId: number; marketCode: string; localeCode: string; slug: string; isCanonical: boolean };
type VariantSet = { id: number; contentItemId: number; marketCode: string; localeCode: string; fallbackVariantSetId?: number | null; active: boolean };
type Variant = { id: number; variantSetId: number; key: string; priority: number; ruleJson: string; state: string; trafficAllocation?: number | null; contentVersionId: number };
type CompositionArea = { name: string; components: string[] };
type ComponentRecord = { id: string; type: string; props: Record<string, unknown> };

const parseJson = <T,>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

function buildContentEditorUrl(contentItemId: number, marketCode: string, localeCode: string): string {
  return `/content/pages/${contentItemId}?market=${encodeURIComponent(marketCode)}&locale=${encodeURIComponent(localeCode)}`;
}

export function ContentPagesPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { contentItemId } = useParams<{ contentItemId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useUi();
  const { siteId, marketCode, localeCode, combos, sites } = useAdminContext();

  const selectedItemId = Number(contentItemId ?? 0) || null;
  const [types, setTypes] = useState<CType[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [items, setItems] = useState<CItem[]>([]);
  const [routes, setRoutes] = useState<CRoute[]>([]);
  const [versions, setVersions] = useState<CVersion[]>([]);
  const [draft, setDraft] = useState<CVersion | null>(null);
  const [fields, setFields] = useState<Record<string, unknown>>({});
  const [compositionJson, setCompositionJson] = useState('{"areas":[{"name":"main","components":[]}]}');
  const [componentsJson, setComponentsJson] = useState('{}');
  const [metadataJson, setMetadataJson] = useState('{}');
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState('');
  const [loadingItem, setLoadingItem] = useState(false);
  const [previewToken, setPreviewToken] = useState('');
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [routeDraft, setRouteDraft] = useState<{ id?: number | null; slug: string; marketCode: string; localeCode: string; isCanonical: boolean }>({
    slug: '',
    marketCode,
    localeCode,
    isCanonical: true
  });
  const [variantSets, setVariantSets] = useState<VariantSet[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantSetId, setVariantSetId] = useState<number | null>(null);
  const [variantDraft, setVariantDraft] = useState({
    key: 'default',
    priority: 100,
    state: 'ACTIVE',
    ruleJson: '{}',
    trafficAllocation: 100,
    contentVersionId: 0
  });
  const [rawEditable, setRawEditable] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newComponentType, setNewComponentType] = useState(componentRegistry[0]?.id ?? 'hero');
  const [newComponentArea, setNewComponentArea] = useState('main');

  const selectedType = useMemo(() => {
    const item = items.find((entry) => entry.id === selectedItemId);
    return types.find((entry) => entry.id === item?.contentTypeId) ?? null;
  }, [items, types, selectedItemId]);

  const fieldDefs = useMemo(() => parseFieldsJson(selectedType?.fieldsJson ?? '[]') as ContentFieldDef[], [selectedType]);

  const filteredItems = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    if (!text) {
      return items;
    }
    return items.filter((entry) => {
      const hasRoute = routes.some((route) => route.contentItemId === entry.id && route.slug.toLowerCase().includes(text));
      return hasRoute || String(entry.id).includes(text);
    });
  }, [items, routes, searchText]);

  const treeNodes = useMemo<TreeNode[]>(() => {
    return routes
      .filter((entry) => entry.marketCode === marketCode && entry.localeCode === localeCode)
      .map((route) => ({
        key: String(route.id),
        data: { slug: route.slug, contentItemId: route.contentItemId }
      }));
  }, [routes, marketCode, localeCode]);

  const selectedRouteKey = useMemo(() => {
    if (!selectedItemId) {
      return null;
    }
    return String(
      routes.find((entry) => entry.contentItemId === selectedItemId && entry.marketCode === marketCode && entry.localeCode === localeCode)?.id ?? ''
    );
  }, [routes, selectedItemId, marketCode, localeCode]);

  const templateSuggestions = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();
    if (!query) {
      return templates;
    }
    return templates.filter((entry) => entry.name.toLowerCase().includes(query));
  }, [templates, templateSearch]);

  const site = sites.find((entry) => entry.id === siteId);

  const refresh = async () => {
    const [typesRes, itemsRes, routesRes, templatesRes] = await Promise.all([
      sdk.listContentTypes({ siteId }),
      sdk.listContentItems({ siteId }),
      sdk.listRoutes({ siteId, marketCode: null, localeCode: null }),
      sdk.listTemplates({ siteId })
    ]);
    const nextTypes = (typesRes.listContentTypes ?? []) as CType[];
    setTypes(nextTypes);
    setSelectedContentTypeId((prev) => prev ?? nextTypes[0]?.id ?? null);
    setItems((itemsRes.listContentItems ?? []) as CItem[]);
    setRoutes((routesRes.listRoutes ?? []) as CRoute[]);
    setTemplates((templatesRes.listTemplates ?? []) as Template[]);
  };

  const loadItem = async (id: number) => {
    setLoadingItem(true);
    try {
      const detail = await sdk.getContentItemDetail({ contentItemId: id });
      const activeVersion = (detail.getContentItemDetail?.currentDraftVersion ?? detail.getContentItemDetail?.currentPublishedVersion ?? null) as CVersion | null;
      setDraft(activeVersion);
      if (activeVersion) {
        setFields(parseJson(activeVersion.fieldsJson, {}));
        setCompositionJson(activeVersion.compositionJson);
        setComponentsJson(activeVersion.componentsJson);
        setMetadataJson(activeVersion.metadataJson);
        setVariantDraft((prev) => ({ ...prev, contentVersionId: activeVersion.id }));
      }

      const versionsRes = await sdk.listVersions({ contentItemId: id });
      setVersions((versionsRes.listVersions ?? []) as CVersion[]);
      const setsRes = await sdk.listVariantSets({ siteId, contentItemId: id, marketCode, localeCode });
      const sets = (setsRes.listVariantSets ?? []) as VariantSet[];
      setVariantSets(sets);
      const setId = sets[0]?.id ?? null;
      setVariantSetId(setId);
      if (setId) {
        const variantsRes = await sdk.listVariants({ variantSetId: setId });
        setVariants((variantsRes.listVariants ?? []) as Variant[]);
      } else {
        setVariants([]);
      }
    } finally {
      setLoadingItem(false);
    }
  };

  useEffect(() => {
    refresh().catch((error: unknown) => setStatus(String(error)));
  }, [siteId]);

  useEffect(() => {
    setRouteDraft((prev) => ({ ...prev, marketCode, localeCode }));
  }, [marketCode, localeCode]);

  useEffect(() => {
    const marketQuery = searchParams.get('market');
    const localeQuery = searchParams.get('locale');
    if (marketQuery || localeQuery) {
      setRouteDraft((prev) => ({
        ...prev,
        marketCode: marketQuery ?? prev.marketCode,
        localeCode: localeQuery ?? prev.localeCode
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedItemId) {
      setDraft(null);
      setVersions([]);
      setVariantSets([]);
      setVariants([]);
      return;
    }
    loadItem(selectedItemId).catch((error: unknown) => setStatus(String(error)));
  }, [selectedItemId, siteId, marketCode, localeCode]);

  const createPage = async () => {
    const contentTypeId = selectedContentTypeId ?? types[0]?.id;
    if (!contentTypeId) {
      setStatus('Create a content type first.');
      return;
    }

    const created = await sdk.createContentItem({
      siteId,
      contentTypeId,
      by: 'admin',
      initialFieldsJson: '{}',
      initialCompositionJson: selectedTemplate?.compositionJson ?? '{"areas":[{"name":"main","components":[]}]}',
      initialComponentsJson: selectedTemplate?.componentsJson ?? '{}'
    });

    const id = created.createContentItem?.id;
    await refresh();
    if (id) {
      navigate(buildContentEditorUrl(id, marketCode, localeCode));
      toast({ severity: 'success', summary: 'Page created', detail: `Content item #${id}` });
    }
  };

  const saveDraft = async () => {
    if (!draft) {
      return;
    }
    const updated = await sdk.updateDraftVersion({
      versionId: draft.id,
      expectedVersionNumber: draft.versionNumber,
      patch: {
        fieldsJson: JSON.stringify(fields),
        compositionJson,
        componentsJson,
        metadataJson,
        comment: 'Save draft',
        createdBy: 'admin'
      }
    });
    setDraft((updated.updateDraftVersion ?? null) as CVersion | null);
    if (selectedItemId) {
      await loadItem(selectedItemId);
      toast({ severity: 'success', summary: 'Draft saved' });
    }
  };

  const publish = async () => {
    if (!draft) {
      return;
    }
    await sdk.publishVersion({ versionId: draft.id, expectedVersionNumber: draft.versionNumber, by: 'admin' });
    if (selectedItemId) {
      await loadItem(selectedItemId);
      toast({ severity: 'success', summary: 'Version published' });
    }
  };

  const composition = useMemo<{ areas: CompositionArea[] }>(() => {
    const parsed = parseJson<{ areas?: CompositionArea[] }>(compositionJson, { areas: [] });
    const areas = Array.isArray(parsed.areas) ? parsed.areas : [];
    return { areas };
  }, [compositionJson]);

  const componentMap = useMemo<Record<string, ComponentRecord>>(() => {
    const parsed = parseJson<Record<string, { type?: string; props?: Record<string, unknown> }>>(componentsJson, {});
    const mapped: Record<string, ComponentRecord> = {};
    for (const [id, value] of Object.entries(parsed)) {
      mapped[id] = {
        id,
        type: typeof value?.type === 'string' ? value.type : 'text_block',
        props: value?.props && typeof value.props === 'object' ? value.props : {}
      };
    }
    return mapped;
  }, [componentsJson]);

  const selectedComponent = selectedComponentId ? componentMap[selectedComponentId] ?? null : null;

  const updateComponentMap = (next: Record<string, ComponentRecord>) => {
    const normalized = Object.fromEntries(
      Object.entries(next).map(([id, value]) => [id, { type: value.type, props: value.props }])
    );
    setComponentsJson(JSON.stringify(normalized));
  };

  const updateComposition = (next: { areas: CompositionArea[] }) => {
    setCompositionJson(JSON.stringify(next));
  };

  const moveComponent = (id: string, direction: -1 | 1) => {
    const nextAreas = composition.areas.map((area) => {
      const index = area.components.findIndex((entry) => entry === id);
      if (index < 0) {
        return area;
      }
      const target = index + direction;
      if (target < 0 || target >= area.components.length) {
        return area;
      }
      const nextComponents = [...area.components];
      const [current] = nextComponents.splice(index, 1);
      if (!current) {
        return area;
      }
      nextComponents.splice(target, 0, current);
      return { ...area, components: nextComponents };
    });
    updateComposition({ areas: nextAreas });
  };

  const removeComponent = (id: string) => {
    const nextAreas = composition.areas.map((area) => ({ ...area, components: area.components.filter((entry) => entry !== id) }));
    const nextMap = { ...componentMap };
    delete nextMap[id];
    updateComposition({ areas: nextAreas });
    updateComponentMap(nextMap);
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
  };

  const addComponent = () => {
    const entry = getComponentRegistryEntry(newComponentType);
    if (!entry) {
      return;
    }
    const id = `${entry.id}_${Date.now()}`;
    const nextMap = { ...componentMap, [id]: { id, type: entry.id, props: { ...entry.defaultProps } } };
    const areas = composition.areas.length > 0 ? composition.areas : [{ name: 'main', components: [] }];
    const hasArea = areas.some((area) => area.name === newComponentArea);
    const nextAreas = (hasArea ? areas : [...areas, { name: newComponentArea, components: [] }]).map((area) =>
      area.name === newComponentArea ? { ...area, components: [...area.components, id] } : area
    );
    updateComponentMap(nextMap);
    updateComposition({ areas: nextAreas });
    setSelectedComponentId(id);
    setShowAddComponent(false);
  };

  const rightPanel = !selectedItemId ? (
    <EmptyState title="No page selected" description="Pick a page from the tree or search results." actionLabel="Create Page" onAction={() => createPage().catch((e: unknown) => setStatus(String(e)))} />
  ) : (
    <TabView>
      <TabPanel header="Edit">
        {loadingItem ? <div className="status-panel">Loading content item #{selectedItemId}...</div> : null}
        <div className="form-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
          <div className="content-card">
            <h4>Content Fields</h4>
            {fieldDefs.map((def) => {
              const message = validationMessage(def, fields[def.key]);
              return (
                <div className="form-row" key={def.key}>
                  <label>{def.label}{def.required ? ' *' : ''}</label>
                  <FieldRenderer
                    field={def}
                    value={fields[def.key]}
                    onChange={(value) => setFields((prev) => ({ ...prev, [def.key]: value }))}
                    siteId={siteId}
                    token={token}
                  />
                  {message ? <small className="error-text">{message}</small> : null}
                  {def.description ? <small className="muted">{def.description}</small> : null}
                </div>
              );
            })}
          </div>
          <div className="content-card">
            <div className="inline-actions">
              <h4 style={{ margin: 0 }}>Composition</h4>
              <Button label="Add Component" onClick={() => setShowAddComponent(true)} />
            </div>
            <ComponentList
              areas={composition.areas}
              selected={selectedComponentId}
              onSelect={setSelectedComponentId}
              onMove={moveComponent}
              onDelete={removeComponent}
            />
            <ComponentInspector
              component={selectedComponent}
              onChange={(next) => {
                const nextMap = { ...componentMap, [next.id]: next };
                updateComponentMap(nextMap);
              }}
            />
          </div>
        </div>

        <Accordion>
          <AccordionTab header="Advanced JSON">
            <div className="inline-actions">
              <Button
                label={rawEditable ? 'Lock JSON Editing' : 'Enable JSON Editing'}
                severity={rawEditable ? 'danger' : 'secondary'}
                onClick={() => {
                  if (!rawEditable) {
                    const confirmEdit = window.confirm('Enable raw JSON editing? This bypasses visual editors.');
                    if (!confirmEdit) {
                      return;
                    }
                  }
                  setRawEditable((prev) => !prev);
                }}
              />
            </div>
            <div className="form-row"><label>Fields JSON</label><InputTextarea rows={4} value={JSON.stringify(fields, null, 2)} readOnly /></div>
            <div className="form-row"><label>Composition JSON</label><InputTextarea rows={4} value={compositionJson} onChange={(e) => setCompositionJson(e.target.value)} readOnly={!rawEditable} /></div>
            <div className="form-row"><label>Components JSON</label><InputTextarea rows={4} value={componentsJson} onChange={(e) => setComponentsJson(e.target.value)} readOnly={!rawEditable} /></div>
            <div className="form-row"><label>Metadata JSON</label><InputTextarea rows={3} value={metadataJson} onChange={(e) => setMetadataJson(e.target.value)} readOnly={!rawEditable} /></div>
          </AccordionTab>
        </Accordion>
      </TabPanel>
      <TabPanel header="Routes">
        <DataTable value={routes.filter((route) => route.contentItemId === selectedItemId)} size="small">
          <Column field="slug" header="Slug" />
          <Column field="marketCode" header="Market" />
          <Column field="localeCode" header="Locale" />
          <Column field="isCanonical" header="Canonical" body={(row: CRoute) => (row.isCanonical ? 'Yes' : 'No')} />
          <Column header="Edit" body={(row: CRoute) => <Button text label="Edit" onClick={() => setRouteDraft({ id: row.id, slug: row.slug, marketCode: row.marketCode, localeCode: row.localeCode, isCanonical: row.isCanonical })} />} />
        </DataTable>
        <div className="form-grid">
          <MarketLocalePicker
            combos={combos}
            marketCode={routeDraft.marketCode}
            localeCode={routeDraft.localeCode}
            onChange={(value) => setRouteDraft((prev) => ({ ...prev, ...value }))}
          />
          <SlugEditor value={routeDraft.slug} onChange={(value) => setRouteDraft((prev) => ({ ...prev, slug: value }))} />
          <label><Checkbox checked={routeDraft.isCanonical} onChange={(event) => setRouteDraft((prev) => ({ ...prev, isCanonical: Boolean(event.checked) }))} /> Canonical</label>
          <Button
            label="Save Route"
            onClick={() =>
              sdk
                .upsertRoute({
                  ...(routeDraft.id ? { id: routeDraft.id } : {}),
                  siteId,
                  contentItemId: selectedItemId,
                  marketCode: routeDraft.marketCode,
                  localeCode: routeDraft.localeCode,
                  slug: routeDraft.slug,
                  isCanonical: routeDraft.isCanonical
                })
                .then(() => refresh())
                .catch((err: unknown) => setStatus(String(err)))
            }
          />
        </div>
      </TabPanel>
      <TabPanel header="Versions">
        <DataTable value={versions} size="small">
          <Column field="versionNumber" header="Version" />
          <Column field="state" header="State" />
          <Column field="comment" header="Comment" />
          <Column header="Rollback" body={(row: CVersion) => <Button text label="Rollback" onClick={() => sdk.rollbackToVersion({ contentItemId: selectedItemId, versionId: row.id, by: 'admin' }).then(() => loadItem(selectedItemId))} />} />
        </DataTable>
      </TabPanel>
      <TabPanel header="Variants">
        <div className="form-grid">
          <Dropdown
            value={variantSetId}
            options={variantSets.map((entry) => ({ label: `Set #${entry.id}`, value: entry.id }))}
            onChange={(event) => {
              const id = Number(event.value);
              setVariantSetId(id);
              sdk.listVariants({ variantSetId: id }).then((res) => setVariants((res.listVariants ?? []) as Variant[]));
            }}
            placeholder="Variant set"
          />
          <Button label="Create/Update Variant Set" onClick={() => sdk.upsertVariantSet({ id: variantSetId, siteId, contentItemId: selectedItemId, marketCode, localeCode, active: true, fallbackVariantSetId: null }).then((res) => { const id = res.upsertVariantSet?.id ?? null; setVariantSetId(id); return loadItem(selectedItemId); })} />
        </div>
        <DataTable value={variants} size="small">
          <Column field="key" header="Key" />
          <Column field="priority" header="Priority" />
          <Column field="state" header="State" />
          <Column field="trafficAllocation" header="Traffic" />
          <Column field="contentVersionId" header="Version" />
        </DataTable>
        <div className="form-grid">
          <InputText value={variantDraft.key} onChange={(e) => setVariantDraft((prev) => ({ ...prev, key: e.target.value }))} placeholder="key" />
          <InputText value={String(variantDraft.priority)} onChange={(e) => setVariantDraft((prev) => ({ ...prev, priority: Number(e.target.value || '0') }))} placeholder="priority" />
          <InputText value={String(variantDraft.trafficAllocation)} onChange={(e) => setVariantDraft((prev) => ({ ...prev, trafficAllocation: Number(e.target.value || '0') }))} placeholder="traffic" />
          <Dropdown value={variantDraft.contentVersionId} options={versions.map((entry) => ({ label: `v${entry.versionNumber}`, value: entry.id }))} onChange={(e) => setVariantDraft((prev) => ({ ...prev, contentVersionId: Number(e.value) }))} placeholder="version" />
        </div>
        <div className="form-row"><label>Rule JSON</label><InputTextarea rows={4} value={variantDraft.ruleJson} onChange={(e) => setVariantDraft((prev) => ({ ...prev, ruleJson: e.target.value }))} /></div>
        <Button label="Save Variant" onClick={() => (variantSetId ? sdk.upsertVariant({ variantSetId, key: variantDraft.key, priority: variantDraft.priority, state: variantDraft.state, ruleJson: variantDraft.ruleJson, trafficAllocation: variantDraft.trafficAllocation, contentVersionId: variantDraft.contentVersionId }).then(() => loadItem(selectedItemId)) : Promise.resolve())} />
      </TabPanel>
      <TabPanel header="Preview">
        <div className="form-grid">
          <InputText value={previewToken} onChange={(event) => setPreviewToken(event.target.value)} placeholder="preview token" />
          <Button label="Issue Preview Token" onClick={() => sdk.issuePreviewToken({ contentItemId: selectedItemId }).then((res) => setPreviewToken(res.issuePreviewToken?.token ?? ''))} />
        </div>
        {(() => {
          const activeRoute = routes.find((entry) => entry.contentItemId === selectedItemId && entry.marketCode === marketCode && entry.localeCode === localeCode);
          const path = buildLocalizedPath(site?.urlPattern, marketCode, localeCode, activeRoute?.slug ?? '');
          const url = `http://localhost:3000${path}?siteId=${siteId}&preview=true&previewToken=${encodeURIComponent(previewToken)}`;
          return <iframe title="Content Preview" src={url} style={{ width: '100%', height: 500, border: '1px solid var(--surface-border)', borderRadius: 8 }} />;
        })()}
      </TabPanel>
    </TabView>
  );

  return (
    <div>
      <PageHeader
        title="Content Pages"
        subtitle="URL-driven tree navigation with synchronized editor."
        actions={
          <div className="inline-actions">
            <Dropdown value={selectedContentTypeId} options={types.map((entry) => ({ label: entry.name, value: entry.id }))} onChange={(event) => setSelectedContentTypeId(Number(event.value))} placeholder="Content type" />
            <AutoComplete
              value={selectedTemplate}
              suggestions={templateSuggestions}
              completeMethod={(event) => setTemplateSearch(event.query)}
              field="name"
              dropdown
              onChange={(event) => setSelectedTemplate((event.value as Template) ?? null)}
              placeholder="Template"
            />
            <Button label="Create Page" onClick={() => createPage().catch((e: unknown) => setStatus(String(e)))} />
            <Button label="Save Draft" severity="secondary" onClick={() => saveDraft().catch((e: unknown) => setStatus(String(e)))} disabled={!draft} />
            <Button label="Publish" severity="success" onClick={() => publish().catch((e: unknown) => setStatus(String(e)))} disabled={!draft} />
          </div>
        }
      />
      <SplitView
        left={
          <TabView>
            <TabPanel header="Tree">
              <TreeTable
                value={treeNodes}
                selectionMode="single"
                selectionKeys={selectedRouteKey ?? undefined}
                onSelectionChange={(event) => {
                  const value = event.value as string | Record<string, boolean> | null;
                  const key = typeof value === 'string' ? value : String(Object.keys(value ?? {})[0] ?? '');
                  const route = routes.find((entry) => String(entry.id) === key);
                  if (route) {
                    navigate(buildContentEditorUrl(route.contentItemId, marketCode, localeCode));
                  }
                }}
              >
                <Column field="slug" header="Slug" expander />
                <Column field="contentItemId" header="Item" />
              </TreeTable>
            </TabPanel>
            <TabPanel header="Search">
              <div className="form-row">
                <label>Find by route slug or item id</label>
                <InputText value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search pages" />
              </div>
              <DataTable value={filteredItems} size="small">
                <Column field="id" header="Item" />
                <Column field="contentTypeId" header="Type" />
                <Column header="Open" body={(row: CItem) => <Button text label="Open" onClick={() => navigate(buildContentEditorUrl(row.id, marketCode, localeCode))} />} />
              </DataTable>
            </TabPanel>
          </TabView>
        }
        right={rightPanel}
      />
      <Dialog header="Add Component" visible={showAddComponent} onHide={() => setShowAddComponent(false)} style={{ width: '30rem' }}>
        <div className="form-row">
          <label>Component Type</label>
          <Dropdown
            value={newComponentType}
            options={componentRegistry.map((entry) => ({ label: entry.label, value: entry.id }))}
            onChange={(event) => setNewComponentType(String(event.value))}
            filter
          />
        </div>
        <div className="form-row">
          <label>Area</label>
          <Dropdown
            value={newComponentArea}
            options={(composition.areas.length > 0 ? composition.areas : [{ name: 'main', components: [] }]).map((area) => ({ label: area.name, value: area.name }))}
            onChange={(event) => setNewComponentArea(String(event.value))}
            editable
          />
        </div>
        <div className="inline-actions" style={{ marginTop: '0.75rem' }}>
          <Button label="Cancel" text onClick={() => setShowAddComponent(false)} />
          <Button label="Add" onClick={addComponent} />
        </div>
      </Dialog>
      {status ? <div className="status-panel"><pre>{status}</pre></div> : null}
    </div>
  );
}
