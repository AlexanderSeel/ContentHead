import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Tag } from 'primereact/tag';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { MarketLocalePicker } from '../../components/inputs/MarketLocalePicker';
import { SlugEditor } from '../../components/inputs/SlugEditor';
import { useUi } from '../../app/UiContext';
import type { ContentFieldDef } from '../schema/fieldValidationUi';
import { parseFieldsJson } from '../schema/fieldValidationUi';
import { FieldRenderer } from './fieldRenderers/FieldRenderer';
import { validationMessage } from './fieldRenderers/rendererRegistry';
import { buildWebUrl } from './buildWebUrl';
import { ComponentList } from './components/ComponentList';
import { ComponentInspector } from './components/ComponentInspector';
import { componentRegistry, getComponentRegistryEntry } from './components/componentRegistry';
import type { CmsBridgeMessage, CmsSelectMessage } from './previewBridge';

type CType = { id: number; name: string; fieldsJson: string };
type Template = { id: number; name: string; compositionJson: string; componentsJson: string };
type CItem = { id: number; contentTypeId: number; currentDraftVersionId?: number | null; currentPublishedVersionId?: number | null };
type CVersion = { id: number; versionNumber: number; fieldsJson: string; compositionJson: string; componentsJson: string; metadataJson: string; state: string; comment?: string | null };
type CRoute = { id: number; contentItemId: number; marketCode: string; localeCode: string; slug: string; isCanonical: boolean };
type VariantSet = { id: number; contentItemId: number; marketCode: string; localeCode: string; fallbackVariantSetId?: number | null; active: boolean };
type Variant = { id: number; variantSetId: number; key: string; priority: number; ruleJson: string; state: string; trafficAllocation?: number | null; contentVersionId: number };
type CompositionArea = { name: string; components: string[] };
type ComponentRecord = { id: string; type: string; props: Record<string, unknown> };

type AiMode = 'copy' | 'props' | 'translate';
type WorkspaceMode = 'split' | 'properties' | 'onpage';
type PreviewDevice = 'web' | 'tablet' | 'mobile';

type TreeRow = {
  routeId: string;
  slug: string;
  contentItemId: number;
  title: string;
  status: 'Draft' | 'Published' | 'New';
};

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

function getItemStatus(item: CItem | undefined): 'Draft' | 'Published' | 'New' {
  if (item?.currentDraftVersionId) {
    return 'Draft';
  }
  if (item?.currentPublishedVersionId) {
    return 'Published';
  }
  return 'New';
}

function fieldPathToKey(path: string | null): string | null {
  if (!path || !path.startsWith('fields.')) {
    return null;
  }
  return path.slice('fields.'.length);
}

function parseComponentFieldPath(path: string | null): { componentId: string; key: string } | null {
  if (!path || !path.startsWith('components.')) {
    return null;
  }
  const parts = path.split('.');
  if (parts.length < 4 || parts[2] !== 'props') {
    return null;
  }
  const componentId = parts[1];
  const key = parts.slice(3).join('.');
  if (!componentId || !key) {
    return null;
  }
  return { componentId, key };
}

function sanitizeForAttribute(value: string): string {
  return value.replace(/"/g, '\\"');
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
  const [selectedFieldPath, setSelectedFieldPath] = useState<string | null>(null);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newComponentType, setNewComponentType] = useState(componentRegistry[0]?.id ?? 'hero');
  const [newComponentArea, setNewComponentArea] = useState('main');
  const [leftTabIndex, setLeftTabIndex] = useState(0);
  const [centerTabIndex, setCenterTabIndex] = useState(0);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('split');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('web');
  const [treeFilter, setTreeFilter] = useState('');
  const [itemTitles, setItemTitles] = useState<Record<number, string>>({});
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>('copy');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [targetMarketCode, setTargetMarketCode] = useState(marketCode);
  const [targetLocaleCode, setTargetLocaleCode] = useState(localeCode);

  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);

  const selectedType = useMemo(() => {
    const item = items.find((entry) => entry.id === selectedItemId);
    return types.find((entry) => entry.id === item?.contentTypeId) ?? null;
  }, [items, types, selectedItemId]);

  const fieldDefs = useMemo(() => parseFieldsJson(selectedType?.fieldsJson ?? '[]') as ContentFieldDef[], [selectedType]);

  const templateSuggestions = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();
    if (!query) {
      return templates;
    }
    return templates.filter((entry) => entry.name.toLowerCase().includes(query));
  }, [templates, templateSearch]);

  const site = sites.find((entry) => entry.id === siteId);
  const webBaseUrl = import.meta.env.VITE_WEB_URL ?? 'http://localhost:3000';

  const activeRoute = useMemo(
    () => routes.find((entry) => entry.contentItemId === selectedItemId && entry.marketCode === marketCode && entry.localeCode === localeCode) ?? null,
    [routes, selectedItemId, marketCode, localeCode]
  );

  const treeRows = useMemo<TreeRow[]>(() => {
    return routes
      .filter((entry) => entry.marketCode === marketCode && entry.localeCode === localeCode)
      .map((route) => {
        const item = items.find((entry) => entry.id === route.contentItemId);
        return {
          routeId: String(route.id),
          slug: route.slug,
          contentItemId: route.contentItemId,
          title: itemTitles[route.contentItemId] ?? `Item #${route.contentItemId}`,
          status: getItemStatus(item)
        };
      })
      .sort((a, b) => a.slug.localeCompare(b.slug));
  }, [routes, marketCode, localeCode, items, itemTitles]);

  const filteredTreeRows = useMemo(() => {
    const query = treeFilter.trim().toLowerCase();
    if (!query) {
      return treeRows;
    }
    return treeRows.filter((entry) => {
      return (
        entry.slug.toLowerCase().includes(query) ||
        entry.title.toLowerCase().includes(query) ||
        String(entry.contentItemId).includes(query) ||
        entry.status.toLowerCase().includes(query)
      );
    });
  }, [treeRows, treeFilter]);

  const treeNodes = useMemo<TreeNode[]>(() => {
    return filteredTreeRows.map((entry) => ({
      key: entry.routeId,
      data: entry
    }));
  }, [filteredTreeRows]);

  const selectedRouteKey = useMemo(() => {
    if (!selectedItemId) {
      return null;
    }
    return String(
      routes.find((entry) => entry.contentItemId === selectedItemId && entry.marketCode === marketCode && entry.localeCode === localeCode)?.id ?? ''
    );
  }, [routes, selectedItemId, marketCode, localeCode]);

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

  const selectedStatus = useMemo(() => {
    if (!selectedItemId) {
      return null;
    }
    const item = items.find((entry) => entry.id === selectedItemId);
    return getItemStatus(item);
  }, [items, selectedItemId]);

  const previewIframeUrl = useMemo(() => {
    if (!selectedItemId || !activeRoute) {
      return null;
    }

    const previewMode = draft && draft.state !== 'PUBLISHED' ? 'draft' : 'published';
    return buildWebUrl({
      baseUrl: webBaseUrl,
      siteId,
      siteUrlPattern: site?.urlPattern,
      contentItemId: selectedItemId,
      marketCode,
      localeCode,
      slug: activeRoute.slug,
      previewToken,
      versionId: draft?.id,
      previewMode,
      cmsBridge: true
    });
  }, [selectedItemId, activeRoute, draft, webBaseUrl, siteId, site, marketCode, localeCode, previewToken]);

  const sendPreviewMessage = (message: CmsBridgeMessage) => {
    const target = previewIframeRef.current?.contentWindow;
    if (!target) {
      return;
    }
    target.postMessage(message, '*');
  };

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

  const loadTitles = async () => {
    const relevantItemIds = Array.from(
      new Set(routes.filter((entry) => entry.marketCode === marketCode && entry.localeCode === localeCode).map((entry) => entry.contentItemId))
    );

    const uncached = relevantItemIds.filter((id) => !itemTitles[id]);
    if (uncached.length === 0) {
      return;
    }

    const results = await Promise.all(
      uncached.map(async (id) => {
        try {
          const detail = await sdk.getContentItemDetail({ contentItemId: id });
          const version = detail.getContentItemDetail?.currentDraftVersion ?? detail.getContentItemDetail?.currentPublishedVersion;
          const parsedFields = parseJson<Record<string, unknown>>(version?.fieldsJson ?? '{}', {});
          const title =
            (typeof parsedFields.title === 'string' && parsedFields.title.trim()) ||
            (typeof parsedFields.name === 'string' && parsedFields.name.trim()) ||
            (typeof parsedFields.headline === 'string' && parsedFields.headline.trim()) ||
            `Item #${id}`;
          return [id, title] as const;
        } catch {
          return [id, `Item #${id}`] as const;
        }
      })
    );

    setItemTitles((prev) => ({ ...prev, ...Object.fromEntries(results) }));
  };

  const focusEditorByPath = (path: string | null) => {
    if (!path) {
      return;
    }
    window.requestAnimationFrame(() => {
      const selector = `[data-editor-path="${sanitizeForAttribute(path)}"]`;
      const element = document.querySelector(selector);
      if (element instanceof HTMLElement) {
        element.scrollIntoView({ block: 'center', behavior: 'smooth' });
        element.focus({ preventScroll: true });
      }
    });
  };

  useEffect(() => {
    refresh().catch((error: unknown) => setStatus(String(error)));
  }, [siteId]);

  useEffect(() => {
    loadTitles().catch(() => undefined);
  }, [routes, marketCode, localeCode]);

  useEffect(() => {
    setRouteDraft((prev) => ({ ...prev, marketCode, localeCode }));
    setTargetMarketCode(marketCode);
    setTargetLocaleCode(localeCode);
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
      setSelectedComponentId(null);
      setSelectedFieldPath(null);
      return;
    }
    loadItem(selectedItemId).catch((error: unknown) => setStatus(String(error)));
  }, [selectedItemId, siteId, marketCode, localeCode]);

  useEffect(() => {
    const handler = (event: MessageEvent<unknown>) => {
      const payload = event.data as Partial<CmsSelectMessage> | undefined;
      if (!payload || payload.type !== 'CMS_SELECT') {
        return;
      }

      if (!selectedItemId || Number(payload.contentItemId) !== selectedItemId) {
        return;
      }

      const fieldPath = typeof payload.fieldPath === 'string' ? payload.fieldPath : null;
      const componentId = typeof payload.componentId === 'string' ? payload.componentId : null;

      if (componentId) {
        setSelectedComponentId(componentId);
        setCenterTabIndex(1);
      }

      if (fieldPath) {
        setSelectedFieldPath(fieldPath);
        if (fieldPath.startsWith('fields.')) {
          setSelectedComponentId(null);
          setCenterTabIndex(0);
        }
        if (fieldPath.startsWith('components.')) {
          setCenterTabIndex(1);
        }
        focusEditorByPath(fieldPath);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [selectedItemId]);

  useEffect(() => {
    if (!previewIframeUrl) {
      return;
    }

    sendPreviewMessage({
      type: 'CMS_HIGHLIGHT',
      componentId: selectedComponentId ?? undefined,
      fieldPath: selectedFieldPath ?? undefined
    });

    if (selectedComponentId) {
      sendPreviewMessage({ type: 'CMS_SCROLL_TO', componentId: selectedComponentId });
    }
  }, [selectedComponentId, selectedFieldPath, previewIframeUrl, previewReloadKey]);

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
      setPreviewReloadKey((prev) => prev + 1);
      sendPreviewMessage({ type: 'CMS_REFRESH' });
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
      setPreviewReloadKey((prev) => prev + 1);
      toast({ severity: 'success', summary: 'Version published' });
    }
  };

  const issuePreviewToken = async () => {
    if (!selectedItemId) {
      return;
    }
    const res = await sdk.issuePreviewToken({ contentItemId: selectedItemId });
    const tokenValue = res.issuePreviewToken?.token ?? '';
    setPreviewToken(tokenValue);
    toast({ severity: 'success', summary: 'Preview token issued' });
  };

  const openPreviewWebsite = () => {
    if (!selectedItemId) {
      return;
    }
    if (!activeRoute) {
      toast({
        severity: 'warn',
        summary: 'Route missing',
        detail: `Create a route for ${marketCode}/${localeCode} before opening website preview.`
      });
      return;
    }

    const url = buildWebUrl({
      baseUrl: webBaseUrl,
      siteId,
      siteUrlPattern: site?.urlPattern,
      contentItemId: selectedItemId,
      marketCode,
      localeCode,
      slug: activeRoute.slug,
      previewToken,
      versionId: draft?.id,
      previewMode: draft && draft.state !== 'PUBLISHED' ? 'draft' : 'published',
      cmsBridge: true
    });

    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
      setSelectedFieldPath(null);
    }
  };

  const duplicateComponent = (id: string) => {
    const original = componentMap[id];
    if (!original) {
      return;
    }

    const duplicateId = `${original.type}_${Date.now()}`;
    const nextMap = {
      ...componentMap,
      [duplicateId]: {
        id: duplicateId,
        type: original.type,
        props: JSON.parse(JSON.stringify(original.props)) as Record<string, unknown>
      }
    };

    const nextAreas = composition.areas.map((area) => {
      const index = area.components.findIndex((entry) => entry === id);
      if (index < 0) {
        return area;
      }
      const nextComponents = [...area.components];
      nextComponents.splice(index + 1, 0, duplicateId);
      return { ...area, components: nextComponents };
    });

    updateComponentMap(nextMap);
    updateComposition({ areas: nextAreas });
    setSelectedComponentId(duplicateId);
    setSelectedFieldPath(`components.${duplicateId}`);
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
    setSelectedFieldPath(`components.${id}`);
    setShowAddComponent(false);
  };

  const applyAiSuggestion = () => {
    const key = fieldPathToKey(selectedFieldPath);
    if (aiMode === 'copy' && key) {
      setFields((prev) => ({ ...prev, [key]: aiSuggestion }));
      return;
    }

    const componentField = parseComponentFieldPath(selectedFieldPath);
    if (aiMode === 'props' && componentField) {
      const next = { ...componentMap };
      const component = next[componentField.componentId];
      if (component) {
        next[componentField.componentId] = {
          ...component,
          props: {
            ...component.props,
            [componentField.key]: aiSuggestion
          }
        };
        updateComponentMap(next);
      }
      return;
    }

    setMetadataJson((prev) => `${prev}\n${aiSuggestion}`.trim());
  };

  const generateAiSuggestion = () => {
    const selectedFieldKey = fieldPathToKey(selectedFieldPath);
    const selectedFieldValue = selectedFieldKey ? String(fields[selectedFieldKey] ?? '') : '';
    const selectedComponentField = parseComponentFieldPath(selectedFieldPath);
    const selectedComponentValue = selectedComponentField
      ? String(componentMap[selectedComponentField.componentId]?.props[selectedComponentField.key] ?? '')
      : '';

    if (aiMode === 'copy') {
      const output = [
        `Rewrite (${marketCode}/${localeCode})`,
        selectedFieldValue,
        aiPrompt ? `Notes: ${aiPrompt}` : null
      ]
        .filter(Boolean)
        .join('\n\n');
      setAiSuggestion(output.trim() || 'Add your rewrite prompt to generate a suggestion.');
      return;
    }

    if (aiMode === 'props') {
      const output = [
        `Props suggestion for ${selectedComponentId ?? 'component'}`,
        selectedComponentValue,
        aiPrompt ? `Goal: ${aiPrompt}` : null
      ]
        .filter(Boolean)
        .join('\n\n');
      setAiSuggestion(output.trim() || 'Select a component field and add a prompt.');
      return;
    }

    const output = [
      `Translate to ${targetMarketCode}/${targetLocaleCode}`,
      selectedFieldValue || selectedComponentValue,
      aiPrompt ? `Context: ${aiPrompt}` : null
    ]
      .filter(Boolean)
      .join('\n\n');
    setAiSuggestion(output.trim() || 'Select a field and add translation instructions.');
  };

  const runAiTranslateVersion = async () => {
    if (!draft) {
      return;
    }
    try {
      await sdk.aiTranslateVersion({
        versionId: draft.id,
        targetMarketCode,
        targetLocaleCode,
        by: 'admin'
      });
      toast({ severity: 'success', summary: 'AI translation draft created' });
      if (selectedItemId) {
        await loadItem(selectedItemId);
      }
    } catch (error) {
      toast({
        severity: 'warn',
        summary: 'Translation unavailable',
        detail: `AI provider might be disabled. ${String(error)}`
      });
    }
  };

  const renderEditorPane = () => {
    if (!selectedItemId) {
      return (
        <div className="pane paneScroll cms-pane">
          <EmptyState
            title="No page selected"
            description="Pick a page from the tree or search results."
            actionLabel="Create Page"
            onAction={() => createPage().catch((e: unknown) => setStatus(String(e)))}
          />
        </div>
      );
    }

    return (
      <div className="pane paneScroll cms-pane">
        {loadingItem ? <div className="status-panel">Loading content item #{selectedItemId}...</div> : null}
        <TabView activeIndex={centerTabIndex} onTabChange={(event) => setCenterTabIndex(event.index)}>
          <TabPanel header="Fields">
            <div className="content-card">
              {fieldDefs.length === 0 ? <p className="muted">No fields defined for this content type.</p> : null}
              {fieldDefs.map((def) => {
                const message = validationMessage(def, fields[def.key]);
                const editorPath = `fields.${def.key}`;
                const isSelected = selectedFieldPath === editorPath;
                return (
                  <div
                    className={`form-row ${isSelected ? 'cms-selected-editor-row' : ''}`}
                    key={def.key}
                    data-editor-path={editorPath}
                    onClick={() => {
                      setSelectedComponentId(null);
                      setSelectedFieldPath(editorPath);
                    }}
                  >
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
          </TabPanel>

          <TabPanel header="Components">
            <div className="content-card">
              <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0 }}>Composition</h4>
                <Button label="Add Component" onClick={() => setShowAddComponent(true)} />
              </div>
              <ComponentList
                areas={composition.areas}
                componentMap={componentMap}
                selected={selectedComponentId}
                onSelect={(id) => {
                  setSelectedComponentId(id);
                  setSelectedFieldPath(`components.${id}`);
                }}
                onMove={moveComponent}
                onDuplicate={duplicateComponent}
                onDelete={removeComponent}
              />
            </div>
            <div className="content-card" style={{ marginTop: '0.75rem' }}>
              <ComponentInspector
                component={selectedComponent}
                selectedFieldPath={selectedFieldPath}
                onSelectFieldPath={(path) => {
                  setSelectedFieldPath(path);
                  const parsed = parseComponentFieldPath(path);
                  if (parsed) {
                    setSelectedComponentId(parsed.componentId);
                  }
                }}
                onChange={(next) => {
                  const nextMap = { ...componentMap, [next.id]: next };
                  updateComponentMap(nextMap);
                }}
              />
            </div>
          </TabPanel>
          <TabPanel header="Routes">
            <DataTable value={routes.filter((route) => route.contentItemId === selectedItemId)} size="small">
              <Column field="slug" header="Slug" />
              <Column field="marketCode" header="Market" />
              <Column field="localeCode" header="Locale" />
              <Column field="isCanonical" header="Canonical" body={(row: CRoute) => (row.isCanonical ? 'Yes' : 'No')} />
              <Column
                header="Edit"
                body={(row: CRoute) => (
                  <Button
                    text
                    label="Edit"
                    onClick={() => setRouteDraft({ id: row.id, slug: row.slug, marketCode: row.marketCode, localeCode: row.localeCode, isCanonical: row.isCanonical })}
                  />
                )}
              />
            </DataTable>
            <div className="form-grid" style={{ marginTop: '0.75rem' }}>
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
              <Column
                header="Rollback"
                body={(row: CVersion) => (
                  <Button text label="Rollback" onClick={() => sdk.rollbackToVersion({ contentItemId: selectedItemId, versionId: row.id, by: 'admin' }).then(() => loadItem(selectedItemId))} />
                )}
              />
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
              <Button
                label="Create/Update Variant Set"
                onClick={() =>
                  sdk
                    .upsertVariantSet({ id: variantSetId, siteId, contentItemId: selectedItemId, marketCode, localeCode, active: true, fallbackVariantSetId: null })
                    .then((res) => {
                      const id = res.upsertVariantSet?.id ?? null;
                      setVariantSetId(id);
                      return loadItem(selectedItemId);
                    })
                }
              />
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
              <Dropdown
                value={variantDraft.contentVersionId}
                options={versions.map((entry) => ({ label: `v${entry.versionNumber}`, value: entry.id }))}
                onChange={(e) => setVariantDraft((prev) => ({ ...prev, contentVersionId: Number(e.value) }))}
                placeholder="version"
              />
            </div>
            <div className="form-row"><label>Rule JSON</label><InputTextarea rows={4} value={variantDraft.ruleJson} onChange={(e) => setVariantDraft((prev) => ({ ...prev, ruleJson: e.target.value }))} /></div>
            <Button
              label="Save Variant"
              onClick={() =>
                (variantSetId
                  ? sdk.upsertVariant({
                    variantSetId,
                    key: variantDraft.key,
                    priority: variantDraft.priority,
                    state: variantDraft.state,
                    ruleJson: variantDraft.ruleJson,
                    trafficAllocation: variantDraft.trafficAllocation,
                    contentVersionId: variantDraft.contentVersionId
                  }).then(() => loadItem(selectedItemId))
                  : Promise.resolve())
              }
            />
          </TabPanel>
          <TabPanel header="Advanced">
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
            <div className="form-row"><label>Fields JSON</label><InputTextarea rows={5} value={JSON.stringify(fields, null, 2)} readOnly={!rawEditable} onChange={(event) => {
              if (!rawEditable) {
                return;
              }
              try {
                const parsed = JSON.parse(event.target.value) as Record<string, unknown>;
                setFields(parsed);
              } catch {
                // keep valid data only
              }
            }} /></div>
            <div className="form-row"><label>Composition JSON</label><InputTextarea rows={5} value={compositionJson} onChange={(e) => setCompositionJson(e.target.value)} readOnly={!rawEditable} /></div>
            <div className="form-row"><label>Components JSON</label><InputTextarea rows={5} value={componentsJson} onChange={(e) => setComponentsJson(e.target.value)} readOnly={!rawEditable} /></div>
            <div className="form-row"><label>Metadata JSON</label><InputTextarea rows={4} value={metadataJson} onChange={(e) => setMetadataJson(e.target.value)} readOnly={!rawEditable} /></div>
          </TabPanel>
        </TabView>
      </div>
    );
  };

  const renderPreviewPane = () => (
    <div className="pane splitFill cms-pane cms-preview-pane">
      <div className="cms-preview-head inline-actions">
        <strong>On-page Preview</strong>
        <div className="inline-actions">
          <Button label="Web" size="small" text={previewDevice !== 'web'} onClick={() => setPreviewDevice('web')} />
          <Button label="Tablet" size="small" text={previewDevice !== 'tablet'} onClick={() => setPreviewDevice('tablet')} />
          <Button label="Mobile" size="small" text={previewDevice !== 'mobile'} onClick={() => setPreviewDevice('mobile')} />
          <Button text icon="pi pi-refresh" label="Reload" onClick={() => setPreviewReloadKey((prev) => prev + 1)} disabled={!previewIframeUrl} />
        </div>
      </div>
      {!previewIframeUrl ? (
        <div className="status-panel">No route found for {marketCode}/{localeCode}. Create one in the Routes tab to enable preview.</div>
      ) : (
        <div className={`cms-preview-stage cms-preview-device-${previewDevice}`}>
          <div className="cms-preview-frame">
            <iframe
              key={`${previewReloadKey}-${previewIframeUrl}`}
              ref={previewIframeRef}
              title="Content Preview"
              src={previewIframeUrl}
              className="cms-preview-iframe"
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="pageRoot cms-editor-page">
      <PageHeader
        title="Content Pages"
        subtitle="Professional CMS workspace with on-page editing bridge."
        helpTopicKey="content_pages"
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
            <div className="inline-actions">
              <Button label="Split" size="small" text={workspaceMode !== 'split'} onClick={() => setWorkspaceMode('split')} />
              <Button label="Properties" size="small" text={workspaceMode !== 'properties'} onClick={() => setWorkspaceMode('properties')} />
              <Button label="On-page" size="small" text={workspaceMode !== 'onpage'} onClick={() => setWorkspaceMode('onpage')} />
            </div>
            <Button label="Preview website" icon="pi pi-external-link" severity="info" onClick={openPreviewWebsite} disabled={!selectedItemId} />
            <InputText value={previewToken} onChange={(event) => setPreviewToken(event.target.value)} placeholder="preview token" style={{ width: 180 }} />
            <Button label="Issue token" text onClick={() => issuePreviewToken().catch((e: unknown) => setStatus(String(e)))} disabled={!selectedItemId} />
            <Button label="Ask AI" text icon="pi pi-sparkles" onClick={() => setAiDialogOpen(true)} disabled={!selectedItemId} />
            {selectedStatus ? <Tag value={selectedStatus} severity={selectedStatus === 'Published' ? 'success' : selectedStatus === 'Draft' ? 'warning' : 'secondary'} /> : null}
            {draft ? <Tag value={`v${draft.versionNumber}`} /> : null}
          </div>
        }
      />

      <div className="pageBodyFlex splitFill">
        <Splitter className="splitFill cms-editor-workspace" style={{ width: '100%' }}>
          <SplitterPanel size={28} minSize={20}>
            <div className="pane paneScroll cms-pane cms-left-pane">
              <TabView activeIndex={leftTabIndex} onTabChange={(event) => setLeftTabIndex(event.index)}>
                <TabPanel header="Tree">
                  <div className="form-row" style={{ marginBottom: '0.75rem' }}>
                    <label>Filter tree</label>
                    <InputText value={treeFilter} onChange={(event) => setTreeFilter(event.target.value)} placeholder="Slug, title, status" />
                  </div>
                  <TreeTable
                    value={treeNodes}
                    selectionMode="single"
                    selectionKeys={selectedRouteKey ?? undefined}
                    onSelectionChange={(event) => {
                      const value = event.value as string | Record<string, boolean> | null;
                      const key = typeof value === 'string' ? value : String(Object.keys(value ?? {})[0] ?? '');
                      const route = routes.find((entry) => String(entry.id) === key);
                      if (route) {
                        navigate(buildContentEditorUrl(route.contentItemId, route.marketCode, route.localeCode));
                      }
                    }}
                  >
                    <Column field="slug" header="Slug" expander />
                    <Column field="title" header="Title" />
                    <Column
                      field="status"
                      header="Status"
                      body={(node: TreeNode) => {
                        const row = node.data as TreeRow;
                        return <Tag value={row.status} severity={row.status === 'Published' ? 'success' : row.status === 'Draft' ? 'warning' : 'secondary'} />;
                      }}
                    />
                  </TreeTable>
                </TabPanel>
                <TabPanel header="Search">
                  <div className="form-row">
                    <label>Find by slug, title, item id, status</label>
                    <InputText value={treeFilter} onChange={(event) => setTreeFilter(event.target.value)} placeholder="Search pages" />
                  </div>
                  <DataTable value={filteredTreeRows} size="small">
                    <Column field="slug" header="Slug" />
                    <Column field="title" header="Title" />
                    <Column field="status" header="Status" />
                    <Column header="Open" body={(row: TreeRow) => <Button text label="Open" onClick={() => navigate(buildContentEditorUrl(row.contentItemId, marketCode, localeCode))} />} />
                  </DataTable>
                </TabPanel>
              </TabView>
            </div>
          </SplitterPanel>
          <SplitterPanel size={72} minSize={35}>
            {workspaceMode === 'split' ? (
              <Splitter className="splitFill cms-editor-detail-workspace" style={{ width: '100%' }}>
                <SplitterPanel size={62} minSize={35}>
                  {renderEditorPane()}
                </SplitterPanel>
                <SplitterPanel size={38} minSize={22}>
                  {renderPreviewPane()}
                </SplitterPanel>
              </Splitter>
            ) : workspaceMode === 'properties' ? renderEditorPane() : renderPreviewPane()}
          </SplitterPanel>
        </Splitter>
      </div>
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
      <Dialog header="Ask AI" visible={aiDialogOpen} onHide={() => setAiDialogOpen(false)} style={{ width: '42rem' }}>
        <div className="form-grid">
          <div className="form-row">
            <label>Mode</label>
            <Dropdown
              value={aiMode}
              options={[
                { label: 'Propose copy for selected field', value: 'copy' },
                { label: 'Suggest selected component props', value: 'props' },
                { label: 'Translate selected text', value: 'translate' }
              ]}
              onChange={(event) => setAiMode(event.value as AiMode)}
            />
          </div>
          <div className="form-row">
            <label>Selected path</label>
            <InputText value={selectedFieldPath ?? ''} readOnly />
          </div>
        </div>
        {aiMode === 'translate' ? (
          <div className="form-grid">
            <div className="form-row">
              <label>Target market</label>
              <Dropdown value={targetMarketCode} options={Array.from(new Set(combos.map((entry) => entry.marketCode))).map((entry) => ({ label: entry, value: entry }))} onChange={(event) => setTargetMarketCode(String(event.value))} />
            </div>
            <div className="form-row">
              <label>Target locale</label>
              <Dropdown value={targetLocaleCode} options={combos.filter((entry) => entry.marketCode === targetMarketCode).map((entry) => ({ label: entry.localeCode, value: entry.localeCode }))} onChange={(event) => setTargetLocaleCode(String(event.value))} />
            </div>
          </div>
        ) : null}
        <div className="form-row">
          <label>Prompt</label>
          <InputTextarea rows={4} value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder="Tone, audience, constraints" />
        </div>
        <div className="inline-actions" style={{ marginTop: '0.75rem' }}>
          <Button label="Generate Suggestion" onClick={generateAiSuggestion} />
          <Button label="Apply Manually" severity="success" onClick={applyAiSuggestion} disabled={!aiSuggestion} />
          {aiMode === 'translate' ? <Button label="Run AI Translate Version" severity="secondary" onClick={() => runAiTranslateVersion().catch((e) => setStatus(String(e)))} disabled={!draft} /> : null}
        </div>
        <div className="form-row" style={{ marginTop: '0.75rem' }}>
          <label>Suggestion</label>
          <InputTextarea rows={8} value={aiSuggestion} onChange={(event) => setAiSuggestion(event.target.value)} />
        </div>
      </Dialog>
      {status ? <div className="status-panel"><pre>{status}</pre></div> : null}
    </div>
  );
}
