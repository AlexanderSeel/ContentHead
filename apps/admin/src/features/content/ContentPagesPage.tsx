import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TabPanel, TabView } from 'primereact/tabview';
import { Column } from 'primereact/column';
import { ContextMenu } from 'primereact/contextmenu';
import { Tree } from 'primereact/tree';
import type { TreeNode } from 'primereact/treenode';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Tag } from 'primereact/tag';
import { InputSwitch } from 'primereact/inputswitch';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { EmptyState } from '../../components/common/EmptyState';
import { MarketLocalePicker } from '../../components/inputs/MarketLocalePicker';
import { SlugEditor } from '../../components/inputs/SlugEditor';
import { useUi } from '../../app/UiContext';
import { DEFAULT_RICH_TEXT_FEATURES, type ContentFieldDef, type RichTextFeature } from '../schema/fieldValidationUi';
import { parseFieldsJson } from '../schema/fieldValidationUi';
import { FieldRenderer } from './fieldRenderers/FieldRenderer';
import { validationMessage } from './fieldRenderers/rendererRegistry';
import { buildWebUrl } from './buildWebUrl';
import { ComponentList } from './components/ComponentList';
import { ComponentInspector } from './components/ComponentInspector';
import { VisualBuilderWorkspace } from './builder/VisualBuilderWorkspace';
import {
  cloneProps,
  duplicateComponentInAreas,
  moveComponentInAreas,
  placeComponentInArea,
  removeComponentFromAreas
} from './builder/visualBuilderModel';
import {
  componentRegistry,
  getComponentRegistryEntry,
  resolveComponentRegistry,
  type ComponentTypeSetting
} from './components/componentRegistry';
import type { CmsBridgeMessage } from './previewBridge';
import { extensionInspectorPanels } from '../../extensions/core/registry';
import { InspectorSection } from '../../ui/molecules';
import { CommandMenuButton } from '../../ui/commands/CommandMenuButton';
import { commandRegistry } from '../../ui/commands/registry';
import { toTieredMenuItems } from '../../ui/commands/menuModel';
import type { Command, CommandContext } from '../../ui/commands/types';
import { downloadJson, routeStartsWith } from '../../ui/commands/utils';
import { WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

type CType = {
  id: number;
  name: string;
  fieldsJson: string;
  allowedComponentsJson?: string | null;
  componentAreaRestrictionsJson?: string | null;
};
type Template = { id: number; name: string; compositionJson: string; componentsJson: string };
type CItem = { id: number; contentTypeId: number; currentDraftVersionId?: number | null; currentPublishedVersionId?: number | null };
type CVersion = { id: number; versionNumber: number; fieldsJson: string; compositionJson: string; componentsJson: string; metadataJson: string; state: string; comment?: string | null };
type CRoute = { id: number; contentItemId: number; marketCode: string; localeCode: string; slug: string; isCanonical: boolean };
type VariantSet = { id: number; contentItemId: number; marketCode: string; localeCode: string; fallbackVariantSetId?: number | null; active: boolean };
type Variant = { id: number; variantSetId: number; key: string; priority: number; ruleJson: string; state: string; trafficAllocation?: number | null; contentVersionId: number };
type CompositionArea = { name: string; components: string[] };
type ComponentRecord = { id: string; type: string; props: Record<string, unknown> };
type ComponentTypeSettingRow = { componentTypeId?: string | null; enabled?: boolean | null; groupName?: string | null };

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

type ContentPageHeaderCommandContext = CommandContext & {
  selectedContentItemId: number | null;
  previewToken: string;
  previewUrl: string | null;
  routeSlug: string | null;
  rawEditable: boolean;
  issuePreviewToken: () => Promise<void>;
  copyPreviewToken: () => Promise<void>;
  openPreviewWebsite: () => void;
  copyPreviewUrl: () => Promise<void>;
  copyRoute: () => Promise<void>;
  clearPreviewToken: () => void;
  toggleRawJson: () => Promise<void>;
  openAskAi: () => void;
  openDiagnostics: () => void;
};

type ContentPageRowCommandContext = CommandContext & {
  row: TreeRow;
  openRow: (row: TreeRow) => void;
  duplicateRow: (row: TreeRow) => Promise<void>;
  exportRow: (row: TreeRow) => void;
  deleteRow: (row: TreeRow) => Promise<void>;
};

type ContentPageTreeCommandContext = ContentPageRowCommandContext & {
  treeNode: TreeRow;
  openWebsiteFromRow: (row: TreeRow) => void;
  issueTokenForRow: (row: TreeRow) => Promise<void>;
  copyPreviewUrlForRow: (row: TreeRow) => Promise<void>;
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

function setNestedValue<T>(input: T, path: string, value: unknown): T {
  const parts = path.split('.').filter(Boolean);
  if (parts.length === 0) {
    return input;
  }
  const clone: any = Array.isArray(input)
    ? [...(input as unknown[])]
    : input && typeof input === 'object'
      ? { ...(input as Record<string, unknown>) }
      : {};
  let cursor: any = clone;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const raw = parts[i] ?? '';
    const key: string | number = /^\d+$/.test(raw) ? Number(raw) : raw;
    const current = cursor[key];
    let next: any;
    if (Array.isArray(current)) {
      next = [...current];
    } else if (current && typeof current === 'object') {
      next = { ...current };
    } else {
      const nextRaw = parts[i + 1] ?? '';
      next = /^\d+$/.test(nextRaw) ? [] : {};
    }
    cursor[key] = next;
    cursor = next;
  }

  const lastRaw = parts[parts.length - 1] ?? '';
  const lastKey: string | number = /^\d+$/.test(lastRaw) ? Number(lastRaw) : lastRaw;
  cursor[lastKey] = value;
  return clone as T;
}

function sanitizeForAttribute(value: string): string {
  return value.replace(/"/g, '\\"');
}

function parseTemplateIdFromMetadata(metadataJson: string): number | null {
  try {
    const parsed = JSON.parse(metadataJson) as { templateId?: unknown };
    return typeof parsed.templateId === 'number' ? parsed.templateId : null;
  } catch {
    return null;
  }
}

const contentPageHeaderOverflowCommands: Command<ContentPageHeaderCommandContext>[] = [
  {
    id: 'content-pages.preview.issue-token',
    label: 'Issue token',
    icon: 'pi pi-key',
    group: 'Preview Tools',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    enabled: (ctx) => Boolean(ctx.selectedContentItemId),
    run: (ctx) => ctx.issuePreviewToken()
  },
  {
    id: 'content-pages.preview.copy-token',
    label: 'Copy token',
    icon: 'pi pi-copy',
    group: 'Preview Tools',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    enabled: (ctx) => ctx.previewToken.trim().length > 0,
    run: (ctx) => ctx.copyPreviewToken()
  },
  {
    id: 'content-pages.preview.open-website',
    label: 'Open preview in new tab',
    icon: 'pi pi-external-link',
    group: 'Preview Tools',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    enabled: (ctx) => Boolean(ctx.selectedContentItemId),
    run: (ctx) => ctx.openPreviewWebsite()
  },
  {
    id: 'content-pages.preview.copy-url',
    label: 'Copy preview URL',
    icon: 'pi pi-link',
    group: 'Preview Tools',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    enabled: (ctx) => Boolean(ctx.previewUrl),
    run: (ctx) => ctx.copyPreviewUrl()
  },
  {
    id: 'content-pages.preview.copy-route',
    label: 'Copy route',
    icon: 'pi pi-directions',
    group: 'Preview Tools',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    enabled: (ctx) => Boolean(ctx.routeSlug),
    run: (ctx) => ctx.copyRoute()
  },
  {
    id: 'content-pages.preview.clear-token',
    label: 'Clear token',
    icon: 'pi pi-times',
    group: 'Preview Tools',
    danger: true,
    requiresConfirm: true,
    confirmText: 'Clear the current preview token?',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    enabled: (ctx) => ctx.previewToken.trim().length > 0,
    run: (ctx) => ctx.clearPreviewToken()
  },
  {
    id: 'content-pages.advanced.toggle-raw-json',
    label: 'Toggle raw JSON editing',
    icon: 'pi pi-code',
    group: 'Advanced',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.toggleRawJson()
  },
  {
    id: 'content-pages.advanced.ask-ai',
    label: 'Ask AI',
    icon: 'pi pi-sparkles',
    group: 'Advanced',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    enabled: (ctx) => Boolean(ctx.selectedContentItemId),
    run: (ctx) => ctx.openAskAi()
  },
  {
    id: 'content-pages.advanced.diagnostics',
    label: 'Open diagnostics',
    icon: 'pi pi-wrench',
    group: 'Advanced',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.openDiagnostics()
  }
];

const contentPageRowOverflowCommands: Command<ContentPageRowCommandContext>[] = [
  {
    id: 'content-pages.row.open',
    label: 'Open',
    icon: 'pi pi-folder-open',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.openRow(ctx.row)
  },
  {
    id: 'content-pages.row.duplicate',
    label: 'Duplicate',
    icon: 'pi pi-copy',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.duplicateRow(ctx.row)
  },
  {
    id: 'content-pages.row.export',
    label: 'Export',
    icon: 'pi pi-download',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.exportRow(ctx.row)
  },
  {
    id: 'content-pages.row.delete',
    label: 'Delete',
    icon: 'pi pi-trash',
    danger: true,
    requiresConfirm: true,
    confirmText: 'Archive this page and remove its current route?',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.deleteRow(ctx.row)
  }
];

const contentPageTreeContextCommands: Command<ContentPageTreeCommandContext>[] = [
  {
    id: 'content-pages.tree.open',
    label: 'Open in editor',
    icon: 'pi pi-folder-open',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.openRow(ctx.treeNode)
  },
  {
    id: 'content-pages.tree.open-website',
    label: 'Open website',
    icon: 'pi pi-external-link',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.openWebsiteFromRow(ctx.treeNode)
  },
  {
    id: 'content-pages.tree.issue-token',
    label: 'Issue preview token',
    icon: 'pi pi-key',
    group: 'Preview Tools',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.issueTokenForRow(ctx.treeNode)
  },
  {
    id: 'content-pages.tree.copy-link',
    label: 'Copy preview link',
    icon: 'pi pi-link',
    group: 'Preview Tools',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.copyPreviewUrlForRow(ctx.treeNode)
  },
  {
    id: 'content-pages.tree.duplicate',
    label: 'Duplicate',
    icon: 'pi pi-copy',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.duplicateRow(ctx.treeNode)
  },
  {
    id: 'content-pages.tree.delete',
    label: 'Delete',
    icon: 'pi pi-trash',
    danger: true,
    requiresConfirm: true,
    confirmText: 'Archive this page and remove its current route?',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.deleteRow(ctx.treeNode)
  }
];

commandRegistry.registerCoreCommands([
  {
    placement: 'overflow',
    commands: contentPageHeaderOverflowCommands
  }
]);

commandRegistry.registerCoreCommands([
  {
    placement: 'rowOverflow',
    commands: contentPageRowOverflowCommands
  }
]);

commandRegistry.registerCoreCommands([
  {
    placement: 'treeNodeContext',
    commands: contentPageTreeContextCommands
  }
]);

export function ContentPagesPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { contentItemId } = useParams<{ contentItemId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast, confirm } = useUi();
  const { siteId, marketCode, localeCode, combos, sites } = useAdminContext();

  const selectedItemId = Number(contentItemId ?? 0) || null;
  const [types, setTypes] = useState<CType[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [items, setItems] = useState<CItem[]>([]);
  const [componentSettings, setComponentSettings] = useState<ComponentTypeSetting[]>([]);
  const [routes, setRoutes] = useState<CRoute[]>([]);
  const [versions, setVersions] = useState<CVersion[]>([]);
  const [draft, setDraft] = useState<CVersion | null>(null);
  const [fields, setFields] = useState<Record<string, unknown>>({});
  const [compositionJson, setCompositionJson] = useState('{"areas":[{"name":"main","components":[]}]}');
  const [componentsJson, setComponentsJson] = useState('{}');
  const [metadataJson, setMetadataJson] = useState('{}');
  const [status, setStatus] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
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
  const [treeExpandedKeys, setTreeExpandedKeys] = useState<Record<string, boolean>>({});
  const [itemTitles, setItemTitles] = useState<Record<number, string>>({});
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>('copy');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [targetMarketCode, setTargetMarketCode] = useState(marketCode);
  const [targetLocaleCode, setTargetLocaleCode] = useState(localeCode);
  const [inlineEdit, setInlineEdit] = useState(false);
  const [treeContextRow, setTreeContextRow] = useState<TreeRow | null>(null);
  const [treeContextSelectionKey, setTreeContextSelectionKey] = useState<string | null>(null);

  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const treeContextMenuRef = useRef<ContextMenu>(null);
  const saveTimerRef = useRef<number | null>(null);
  const lastSavedRef = useRef<string>('');
  const saveInFlightRef = useRef(false);
  const pendingSaveRef = useRef(false);

  const selectedType = useMemo(() => {
    const item = items.find((entry) => entry.id === selectedItemId);
    return types.find((entry) => entry.id === item?.contentTypeId) ?? null;
  }, [items, types, selectedItemId]);

  const fieldDefs = useMemo(() => parseFieldsJson(selectedType?.fieldsJson ?? '[]') as ContentFieldDef[], [selectedType]);

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
    const roots: TreeNode[] = [];
    const folderMap = new Map<string, TreeNode>();

    const ensureFolder = (parentKey: string, segment: string, pathLabel: string): TreeNode => {
      const key = `${parentKey}/${segment}`;
      const existing = folderMap.get(key);
      if (existing) {
        return existing;
      }
      const folderNode: TreeNode = {
        key,
        label: segment,
        data: { folder: true, pathLabel },
        selectable: false,
        children: []
      };
      folderMap.set(key, folderNode);
      if (parentKey === 'root') {
        roots.push(folderNode);
      } else {
        const parent = folderMap.get(parentKey);
        if (parent) {
          parent.children = [...(parent.children ?? []), folderNode];
        }
      }
      return folderNode;
    };

    for (const entry of filteredTreeRows) {
      const normalized = entry.slug.replace(/^\/+|\/+$/g, '');
      const segments = normalized ? normalized.split('/') : ['(root)'];
      const leafLabel = segments[segments.length - 1] ?? entry.slug;
      let parentKey = 'root';
      let pathLabel = '';
      for (let i = 0; i < segments.length - 1; i += 1) {
        const segment = segments[i] ?? '';
        pathLabel = pathLabel ? `${pathLabel}/${segment}` : segment;
        const parentNode = ensureFolder(parentKey, segment, pathLabel);
        parentKey = String(parentNode.key);
      }
      const leafNode: TreeNode = {
        key: entry.routeId,
        label: leafLabel,
        data: entry
      };
      if (parentKey === 'root') {
        roots.push(leafNode);
      } else {
        const parent = folderMap.get(parentKey);
        if (parent) {
          parent.children = [...(parent.children ?? []), leafNode];
        }
      }
    }

    return roots;
  }, [filteredTreeRows]);

  const selectedRouteKey = useMemo(() => {
    if (!selectedItemId) {
      return null;
    }
    return String(
      routes.find((entry) => entry.contentItemId === selectedItemId && entry.marketCode === marketCode && entry.localeCode === localeCode)?.id ?? ''
    );
  }, [routes, selectedItemId, marketCode, localeCode]);

  useEffect(() => {
    if (!selectedRouteKey) {
      return;
    }
    const nextExpanded: Record<string, boolean> = {};
    const walk = (nodes: TreeNode[], parents: string[]): boolean => {
      for (const node of nodes) {
        const key = String(node.key ?? '');
        if (key === selectedRouteKey) {
          for (const parentKey of parents) {
            nextExpanded[parentKey] = true;
          }
          return true;
        }
        if (Array.isArray(node.children) && node.children.length > 0) {
          const found = walk(node.children, [...parents, key]);
          if (found) {
            return true;
          }
        }
      }
      return false;
    };
    if (walk(treeNodes, [])) {
      setTreeExpandedKeys((prev) => ({ ...prev, ...nextExpanded }));
    }
  }, [selectedRouteKey, treeNodes]);

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
  const templateComponentIds = useMemo(() => {
    if (!selectedTemplate) {
      return new Set<string>();
    }
    const parsed = parseJson<Record<string, unknown>>(selectedTemplate.componentsJson, {});
    return new Set(Object.keys(parsed));
  }, [selectedTemplate]);
  const componentSourceResolver = (id: string): 'template' | 'override' | null => {
    if (!selectedTemplate) {
      return null;
    }
    return templateComponentIds.has(id) ? 'template' : 'override';
  };
  const resolvedComponentRegistry = useMemo(() => resolveComponentRegistry(componentSettings), [componentSettings]);
  const enabledComponentRegistry = useMemo(
    () => resolvedComponentRegistry.filter((entry) => entry.enabled),
    [resolvedComponentRegistry]
  );
  const allowedComponentIds = useMemo(() => {
    const configured = parseJson<string[]>(selectedType?.allowedComponentsJson ?? '[]', []);
    if (configured.length === 0) {
      return enabledComponentRegistry.map((entry) => entry.id);
    }
    const enabled = new Set(enabledComponentRegistry.map((entry) => entry.id));
    return configured.filter((entry) => enabled.has(entry));
  }, [selectedType?.allowedComponentsJson, enabledComponentRegistry]);
  const areaRestrictions = useMemo(() => {
    return parseJson<Record<string, string[]>>(selectedType?.componentAreaRestrictionsJson ?? '{}', {});
  }, [selectedType?.componentAreaRestrictionsJson]);
  const availableComponentTypeOptions = useMemo(() => {
    return enabledComponentRegistry
      .filter((entry) => {
        if (!allowedComponentIds.includes(entry.id)) {
          return false;
        }
        const restricted = areaRestrictions[newComponentArea];
        if (!Array.isArray(restricted) || restricted.length === 0) {
          return true;
        }
        return restricted.includes(entry.id);
      })
      .map((entry) => ({ label: `${entry.label} (${entry.groupName})`, value: entry.id }));
  }, [enabledComponentRegistry, allowedComponentIds, areaRestrictions, newComponentArea]);

  const resolveRichTextFeatures = (path: string | null): RichTextFeature[] | undefined => {
    if (!path) {
      return undefined;
    }
    if (path.startsWith('fields.')) {
      const key = fieldPathToKey(path);
      if (!key) {
        return undefined;
      }
      const def = fieldDefs.find((entry) => entry.key === key);
      if (!def || def.type !== 'richtext') {
        return undefined;
      }
      return (def.uiConfig?.richTextFeatures ?? DEFAULT_RICH_TEXT_FEATURES) as RichTextFeature[];
    }
    if (path.startsWith('components.')) {
      const parsed = parseComponentFieldPath(path);
      if (!parsed) {
        return undefined;
      }
      const component = componentMap[parsed.componentId];
      const entry = component ? getComponentRegistryEntry(component.type) : null;
      const fieldKey = parsed.key.split('.')[0] ?? '';
      const fieldDef = entry?.fields.find((field) => field.key === fieldKey);
      if (fieldDef?.type === 'richtext') {
        return DEFAULT_RICH_TEXT_FEATURES;
      }
    }
    return undefined;
  };

  const selectedStatus = useMemo(() => {
    if (!selectedItemId) {
      return null;
    }
    const item = items.find((entry) => entry.id === selectedItemId);
    return getItemStatus(item);
  }, [items, selectedItemId]);

  const canInlineEdit = Boolean(draft) && draft?.state !== 'PUBLISHED';

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
      cmsBridge: true,
      inlineEdit: inlineEdit && canInlineEdit
    });
  }, [selectedItemId, activeRoute, draft, webBaseUrl, siteId, site, marketCode, localeCode, previewToken, inlineEdit, canInlineEdit]);

  const sendPreviewMessage = (message: CmsBridgeMessage) => {
    const target = previewIframeRef.current?.contentWindow;
    if (!target) {
      return;
    }
    target.postMessage(message, '*');
  };

  const scheduleDraftSave = (force = false, delay = 1000) => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      saveDraft({ force, silent: true }).catch((e: unknown) => setStatus(String(e)));
    }, delay);
  };

  const refresh = async () => {
    const [typesRes, itemsRes, routesRes, templatesRes] = await Promise.all([
      sdk.listContentTypes({ siteId }),
      sdk.listContentItems({ siteId }),
      sdk.listRoutes({ siteId, marketCode: null, localeCode: null }),
      sdk.listTemplates({ siteId })
    ]);
    const componentSettingsRes = await sdk
      .listComponentTypeSettings({ siteId })
      .catch(() => ({ listComponentTypeSettings: [] as ComponentTypeSettingRow[] }));
    const nextTypes = (typesRes.listContentTypes ?? []) as CType[];
    setTypes(nextTypes);
    setSelectedContentTypeId((prev) => prev ?? nextTypes[0]?.id ?? null);
    setItems((itemsRes.listContentItems ?? []) as CItem[]);
    setRoutes((routesRes.listRoutes ?? []) as CRoute[]);
    setTemplates((templatesRes.listTemplates ?? []) as Template[]);
    setComponentSettings(
      ((componentSettingsRes.listComponentTypeSettings ?? []) as ComponentTypeSettingRow[])
        .filter((entry) => typeof entry.componentTypeId === 'string')
        .map((entry) => ({
          componentTypeId: entry.componentTypeId as string,
          enabled: Boolean(entry.enabled ?? true),
          groupName: entry.groupName ?? null
        }))
    );
  };

  const loadItem = async (id: number) => {
    setLoadingItem(true);
    try {
      const detail = await sdk.getContentItemDetail({ contentItemId: id });
      const activeVersion = (detail.getContentItemDetail?.currentDraftVersion ?? detail.getContentItemDetail?.currentPublishedVersion ?? null) as CVersion | null;
      setDraft(activeVersion);
      if (activeVersion) {
        const parsedFields = parseJson(activeVersion.fieldsJson, {});
        setFields(parsedFields);
        setCompositionJson(activeVersion.compositionJson);
        setComponentsJson(activeVersion.componentsJson);
        setMetadataJson(activeVersion.metadataJson);
        const linkedTemplateId = parseTemplateIdFromMetadata(activeVersion.metadataJson);
        setSelectedTemplate((prev) => {
          if (!linkedTemplateId) {
            return prev;
          }
          return templates.find((entry) => entry.id === linkedTemplateId) ?? prev;
        });
        setVariantDraft((prev) => ({ ...prev, contentVersionId: activeVersion.id }));
        lastSavedRef.current = JSON.stringify({
          fields: parsedFields,
          compositionJson: activeVersion.compositionJson,
          componentsJson: activeVersion.componentsJson,
          metadataJson: activeVersion.metadataJson
        });
      } else {
        lastSavedRef.current = '';
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
    if (!canInlineEdit) {
      setInlineEdit(false);
    }
  }, [canInlineEdit]);

  useEffect(() => {
    const handler = (event: MessageEvent<unknown>) => {
      const payload = event.data as Partial<CmsBridgeMessage> | undefined;
      if (!payload?.type) {
        return;
      }

      if (payload.type === 'CMS_INLINE_EDIT') {
        if (!inlineEdit || !draft) {
          return;
        }
        const fieldPath = typeof payload.fieldPath === 'string' ? payload.fieldPath : null;
        const html = typeof payload.html === 'string' ? payload.html : null;
        if (!fieldPath || html == null) {
          return;
        }
        if (fieldPath.startsWith('fields.')) {
          const key = fieldPathToKey(fieldPath);
          if (!key) {
            return;
          }
          setFields((prev) => ({ ...prev, [key]: html }));
          setSelectedComponentId(null);
          setSelectedFieldPath(fieldPath);
          scheduleDraftSave(true, 50);
          return;
        }
        const parsed = parseComponentFieldPath(fieldPath);
        if (!parsed) {
          return;
        }
        const component = componentMap[parsed.componentId];
        if (!component) {
          return;
        }
        const nextProps = setNestedValue(component.props ?? {}, parsed.key, html);
        const nextMap = { ...componentMap, [parsed.componentId]: { ...component, props: nextProps } };
        updateComponentMap(nextMap);
        setSelectedComponentId(parsed.componentId);
        setSelectedFieldPath(fieldPath);
        scheduleDraftSave(true, 50);
        return;
      }

      if (payload.type !== 'CMS_SELECT') {
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
  }, [selectedItemId, componentMap, inlineEdit, draft, scheduleDraftSave]);

  useEffect(() => {
    if (!draft || loadingItem) {
      return;
    }
    const snapshot = JSON.stringify({
      fields,
      compositionJson,
      componentsJson,
      metadataJson
    });
    if (snapshot === lastSavedRef.current) {
      return;
    }
    scheduleDraftSave(false, 1000);
  }, [draft, loadingItem, fields, compositionJson, componentsJson, metadataJson]);

  useEffect(() => {
    if (!previewIframeUrl) {
      return;
    }

    sendPreviewMessage({
      type: 'CMS_HIGHLIGHT',
      componentId: selectedComponentId ?? undefined,
      fieldPath: selectedFieldPath ?? undefined,
      richTextFeatures: resolveRichTextFeatures(selectedFieldPath)
    });

    if (selectedComponentId) {
      sendPreviewMessage({ type: 'CMS_SCROLL_TO', componentId: selectedComponentId });
    }
  }, [selectedComponentId, selectedFieldPath, previewIframeUrl, previewReloadKey]);

  useEffect(() => {
    if (!previewIframeUrl) {
      return;
    }
    sendPreviewMessage({
      type: 'CMS_INLINE_MODE',
      enabled: inlineEdit && canInlineEdit
    });
  }, [inlineEdit, canInlineEdit, previewIframeUrl, previewReloadKey]);

  useEffect(() => {
    if (availableComponentTypeOptions.length === 0) {
      return;
    }
    if (!availableComponentTypeOptions.some((entry) => entry.value === newComponentType)) {
      setNewComponentType(String(availableComponentTypeOptions[0]?.value ?? ''));
    }
  }, [availableComponentTypeOptions, newComponentType]);

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
      initialComponentsJson: selectedTemplate?.componentsJson ?? '{}',
      metadataJson: JSON.stringify({
        templateId: selectedTemplate?.id ?? null,
        templateName: selectedTemplate?.name ?? null,
        templateAppliedAt: new Date().toISOString()
      })
    });

    const id = created.createContentItem?.id;
    await refresh();
    if (id) {
      navigate(buildContentEditorUrl(id, marketCode, localeCode));
      toast({ severity: 'success', summary: 'Page created', detail: `Content item #${id}` });
    }
  };

  const saveDraft = async (options: { force?: boolean; silent?: boolean } = {}) => {
    if (!draft) {
      return;
    }
    if (saveInFlightRef.current) {
      pendingSaveRef.current = true;
      return;
    }
    const snapshot = JSON.stringify({
      fields,
      compositionJson,
      componentsJson,
      metadataJson
    });
    if (!options.force && snapshot === lastSavedRef.current) {
      return;
    }
    saveInFlightRef.current = true;
    setSavingDraft(true);
    try {
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
      lastSavedRef.current = snapshot;
      if (selectedItemId) {
        if (!options.silent) {
          await loadItem(selectedItemId);
        }
        setPreviewReloadKey((prev) => prev + 1);
        sendPreviewMessage({ type: 'CMS_REFRESH' });
        if (!options.silent) {
          toast({ severity: 'success', summary: 'Draft saved' });
        }
      }
    } finally {
      saveInFlightRef.current = false;
      setSavingDraft(false);
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        scheduleDraftSave(true, 200);
      }
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

  const copyText = async (label: string, value: string) => {
    if (!value.trim()) {
      toast({ severity: 'warn', summary: `${label} is empty.` });
      return;
    }
    await navigator.clipboard.writeText(value);
    toast({ severity: 'success', summary: `${label} copied` });
  };

  const buildPreviewWebsiteUrl = (row?: TreeRow | null) => {
    const targetItemId = row?.contentItemId ?? selectedItemId;
    const targetRoute = row ? routes.find((entry) => String(entry.id) === row.routeId) ?? null : activeRoute;
    if (!targetItemId || !targetRoute) {
      return null;
    }
    return buildWebUrl({
      baseUrl: webBaseUrl,
      siteId,
      siteUrlPattern: site?.urlPattern,
      contentItemId: targetItemId,
      marketCode,
      localeCode,
      slug: targetRoute.slug,
      previewToken,
      versionId: row ? undefined : draft?.id,
      previewMode: draft && draft.state !== 'PUBLISHED' ? 'draft' : 'published',
      cmsBridge: true
    });
  };

  const issuePreviewToken = async (contentItemOverride?: number | null) => {
    const targetId = contentItemOverride ?? selectedItemId;
    if (!targetId) {
      return;
    }
    const res = await sdk.issuePreviewToken({ contentItemId: targetId });
    const tokenValue = res.issuePreviewToken?.token ?? '';
    setPreviewToken(tokenValue);
    toast({ severity: 'success', summary: 'Preview token issued' });
  };

  const openPreviewWebsite = (row?: TreeRow | null) => {
    const url = buildPreviewWebsiteUrl(row);
    if (!url) {
      toast({
        severity: 'warn',
        summary: 'Route missing',
        detail: `Create a route for ${marketCode}/${localeCode} before opening website preview.`
      });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const duplicateTreeRow = async (row: TreeRow) => {
    const sourceItem = items.find((entry) => entry.id === row.contentItemId);
    if (!sourceItem) {
      return;
    }
    const detail = await sdk.getContentItemDetail({ contentItemId: row.contentItemId });
    const sourceVersion = detail.getContentItemDetail?.currentDraftVersion ?? detail.getContentItemDetail?.currentPublishedVersion;
    const created = await sdk.createContentItem({
      siteId,
      contentTypeId: sourceItem.contentTypeId,
      by: 'admin',
      initialFieldsJson: sourceVersion?.fieldsJson ?? '{}',
      initialCompositionJson: sourceVersion?.compositionJson ?? '{"areas":[{"name":"main","components":[]}]}',
      initialComponentsJson: sourceVersion?.componentsJson ?? '{}',
      metadataJson: sourceVersion?.metadataJson ?? '{}'
    });
    const createdId = created.createContentItem?.id ?? null;
    if (!createdId) {
      return;
    }
    await sdk.upsertRoute({
      siteId,
      contentItemId: createdId,
      marketCode,
      localeCode,
      slug: `${row.slug}-copy-${String(createdId).slice(-4)}`,
      isCanonical: true
    });
    await refresh();
    navigate(buildContentEditorUrl(createdId, marketCode, localeCode));
    toast({ severity: 'success', summary: `Duplicated page #${row.contentItemId} to #${createdId}` });
  };

  const deleteTreeRow = async (row: TreeRow) => {
    await sdk.archiveContentItem({ id: row.contentItemId, archived: true });
    const routeId = Number(row.routeId);
    if (routeId) {
      await sdk.deleteRoute({ id: routeId }).catch(() => undefined);
    }
    if (selectedItemId === row.contentItemId) {
      navigate('/content/pages');
    }
    await refresh();
    toast({ severity: 'success', summary: `Archived page #${row.contentItemId}` });
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
    updateComposition({ areas: moveComponentInAreas(composition.areas, id, direction) });
  };

  const removeComponent = (id: string) => {
    const nextAreas = removeComponentFromAreas(composition.areas, id);
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
        props: cloneProps(original.props)
      }
    };

    const nextAreas = duplicateComponentInAreas(composition.areas, id, duplicateId);

    updateComponentMap(nextMap);
    updateComposition({ areas: nextAreas });
    setSelectedComponentId(duplicateId);
    setSelectedFieldPath(`components.${duplicateId}`);
  };

  const addComponent = () => {
    const allowedByType = new Set(allowedComponentIds);
    if (!allowedByType.has(newComponentType)) {
      setStatus(`Component type "${newComponentType}" is not allowed for this content type.`);
      return;
    }
    const areaAllowed =
      Array.isArray(areaRestrictions[newComponentArea]) && areaRestrictions[newComponentArea]!.length > 0
        ? new Set(areaRestrictions[newComponentArea]!)
        : null;
    if (areaAllowed && !areaAllowed.has(newComponentType)) {
      setStatus(`Component type "${newComponentType}" is restricted in area "${newComponentArea}".`);
      return;
    }

    const entry = getComponentRegistryEntry(newComponentType);
    if (!entry) {
      return;
    }
    const id = `${entry.id}_${Date.now()}`;
    const nextMap = { ...componentMap, [id]: { id, type: entry.id, props: cloneProps(entry.defaultProps) } };
    const nextAreas = placeComponentInArea(composition.areas, newComponentArea, id);
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

  const openRow = (row: TreeRow) => {
    navigate(buildContentEditorUrl(row.contentItemId, marketCode, localeCode));
  };

  const exportRow = (row: TreeRow) => {
    const relatedRoute = routes.find((entry) => String(entry.id) === row.routeId) ?? null;
    const payload = {
      row,
      route: relatedRoute,
      exportedAt: new Date().toISOString()
    };
    downloadJson(`content-page-${row.contentItemId}.json`, payload);
    toast({ severity: 'success', summary: `Exported page #${row.contentItemId}` });
  };

  const previewWebsiteUrl = buildPreviewWebsiteUrl(null);

  const baseCommandContext: CommandContext = {
    route: location.pathname,
    siteId,
    selectedSite: site ? { id: site.id, name: site.name } : null,
    marketCode,
    localeCode,
    selectedContentItemId: selectedItemId,
    selectedVersionId: draft?.id ?? null,
    selectionIds: selectedItemId ? [selectedItemId] : [],
    userRoles: [],
    userPermissions: [],
    toast,
    confirm,
    downloadJson
  };

  const headerCommandContext: ContentPageHeaderCommandContext = {
    ...baseCommandContext,
    selectedContentItemId: selectedItemId,
    previewToken,
    previewUrl: previewWebsiteUrl,
    routeSlug: activeRoute?.slug ?? null,
    rawEditable,
    issuePreviewToken: () => issuePreviewToken(),
    copyPreviewToken: () => copyText('Preview token', previewToken),
    openPreviewWebsite: () => openPreviewWebsite(),
    copyPreviewUrl: () => (previewWebsiteUrl ? copyText('Preview URL', previewWebsiteUrl) : Promise.resolve()),
    copyRoute: () => copyText('Route', activeRoute?.slug ?? ''),
    clearPreviewToken: () => setPreviewToken(''),
    toggleRawJson: async () => {
      if (!rawEditable) {
        const confirmEdit = await baseCommandContext.confirm?.({
          header: 'Enable Raw JSON Editing',
          message: 'Enable raw JSON editing? This bypasses visual editors.',
          acceptLabel: 'Enable',
          rejectLabel: 'Cancel'
        });
        if (!confirmEdit) {
          return;
        }
      }
      setRawEditable((prev) => !prev);
    },
    openAskAi: () => setAiDialogOpen(true),
    openDiagnostics: () => navigate('/dev/diagnostics')
  };

  const headerOverflowCommands = commandRegistry.getCommands(headerCommandContext, 'overflow');

  const treeContextMenuItems = (() => {
    if (!treeContextRow) {
      return [];
    }
    const context: ContentPageTreeCommandContext = {
      ...baseCommandContext,
      row: treeContextRow,
      treeNode: treeContextRow,
      selectionIds: [treeContextRow.contentItemId],
      openRow,
      duplicateRow: duplicateTreeRow,
      exportRow,
      deleteRow: deleteTreeRow,
      openWebsiteFromRow: (row) => openPreviewWebsite(row),
      issueTokenForRow: (row) => issuePreviewToken(row.contentItemId),
      copyPreviewUrlForRow: (row) => {
        const url = buildPreviewWebsiteUrl(row);
        return url ? copyText('Preview URL', url) : Promise.resolve();
      }
    };
    return toTieredMenuItems(commandRegistry.getCommands(context, 'treeNodeContext'), context);
  })();

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
            <VisualBuilderWorkspace
              palette={availableComponentTypeOptions.map((entry) => ({
                id: String(entry.value),
                label: String(entry.label)
              }))}
              areas={composition.areas}
              componentMap={componentMap}
              selectedComponentId={selectedComponentId}
              selectedComponentSource={componentSourceResolver}
              onSelect={(id) => {
                setSelectedComponentId(id);
                setSelectedFieldPath(`components.${id}`);
              }}
              onAdd={(componentTypeId, areaName) => {
                setNewComponentType(componentTypeId);
                setNewComponentArea(areaName ?? 'main');
                const allowedByType = new Set(allowedComponentIds);
                if (!allowedByType.has(componentTypeId)) {
                  setStatus(`Component type \"${componentTypeId}\" is not allowed for this content type.`);
                  return;
                }
                const area = areaName ?? 'main';
                const areaAllowed =
                  Array.isArray(areaRestrictions[area]) && areaRestrictions[area]!.length > 0
                    ? new Set(areaRestrictions[area]!)
                    : null;
                if (areaAllowed && !areaAllowed.has(componentTypeId)) {
                  setStatus(`Component type \"${componentTypeId}\" is restricted in area \"${area}\".`);
                  return;
                }
                const entry = getComponentRegistryEntry(componentTypeId);
                if (!entry) {
                  return;
                }
                const id = `${entry.id}_${Date.now()}`;
                const nextMap = { ...componentMap, [id]: { id, type: entry.id, props: cloneProps(entry.defaultProps) } };
                const nextAreas = placeComponentInArea(composition.areas, area, id);
                updateComponentMap(nextMap);
                updateComposition({ areas: nextAreas });
                setSelectedComponentId(id);
                setSelectedFieldPath(`components.${id}`);
              }}
              onMove={moveComponent}
              onDuplicate={duplicateComponent}
              onDelete={removeComponent}
              rightPane={(
                <div className="form-row">
                  <InspectorSection title="Selected Block" defaultCollapsed={!selectedComponent}>
                    <ComponentInspector
                      component={selectedComponent}
                      siteId={siteId}
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
                  </InspectorSection>
                  <InspectorSection title="Template Binding">
                    <small className="muted">
                      {selectedTemplate
                        ? `Template ${selectedTemplate.name} is selected. Blocks marked \"template\" come from template baseline, \"override\" are page-specific.`
                        : 'No template selected for this page.'}
                    </small>
                  </InspectorSection>
                  {extensionInspectorPanels.map((panel) => (
                    <InspectorSection key={panel.id} title={panel.label}>
                      {panel.render({
                        siteId,
                        contentItemId: selectedItemId,
                        metadataJson,
                        compositionJson,
                        componentsJson
                      })}
                    </InspectorSection>
                  ))}
                </div>
              )}
            />
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
          <div className="inline-actions">
            <InputSwitch checked={inlineEdit} onChange={(event) => setInlineEdit(Boolean(event.value))} disabled={!canInlineEdit} />
            <small className={canInlineEdit ? '' : 'muted'}>Inline edit</small>
          </div>
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
              onLoad={() => {
                sendPreviewMessage({
                  type: 'CMS_HIGHLIGHT',
                  componentId: selectedComponentId ?? undefined,
                  fieldPath: selectedFieldPath ?? undefined,
                  richTextFeatures: resolveRichTextFeatures(selectedFieldPath)
                });
                if (selectedComponentId) {
                  sendPreviewMessage({ type: 'CMS_SCROLL_TO', componentId: selectedComponentId });
                }
                sendPreviewMessage({ type: 'CMS_INLINE_MODE', enabled: inlineEdit && canInlineEdit });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Content Pages"
        subtitle="Professional CMS workspace with on-page editing bridge."
        helpTopicKey="content_pages"
        badges={
          <>
            {selectedStatus ? <Tag value={`Status: ${selectedStatus}`} severity={selectedStatus === 'Published' ? 'success' : selectedStatus === 'Draft' ? 'warning' : 'secondary'} /> : null}
            {draft ? <Tag value={`v${draft.versionNumber}`} /> : null}
          </>
        }
      />
      <WorkspaceActionBar
        primary={
          <>
            <Dropdown value={selectedContentTypeId} options={types.map((entry) => ({ label: entry.name, value: entry.id }))} onChange={(event) => setSelectedContentTypeId(Number(event.value))} placeholder="Content type" />
            <Dropdown
              value={selectedTemplate?.id ?? null}
              options={templates.map((entry) => ({ label: entry.name, value: entry.id }))}
              filter
              showClear
              onChange={(event) => {
                const next = templates.find((entry) => entry.id === Number(event.value)) ?? null;
                setSelectedTemplate(next);
                setMetadataJson((prev) => {
                  try {
                    const parsed = JSON.parse(prev || '{}') as Record<string, unknown>;
                    return JSON.stringify({
                      ...parsed,
                      templateId: next?.id ?? null,
                      templateName: next?.name ?? null,
                      templateBoundAt: new Date().toISOString()
                    });
                  } catch {
                    return JSON.stringify({
                      templateId: next?.id ?? null,
                      templateName: next?.name ?? null,
                      templateBoundAt: new Date().toISOString()
                    });
                  }
                });
              }}
              placeholder="Template"
            />
            <Button label="Create Page" onClick={() => createPage().catch((e: unknown) => setStatus(String(e)))} />
            <Button label="Save Draft" severity="secondary" onClick={() => saveDraft().catch((e: unknown) => setStatus(String(e)))} disabled={!draft || savingDraft} loading={savingDraft} />
            <Button label="Publish" severity="success" onClick={() => publish().catch((e: unknown) => setStatus(String(e)))} disabled={!draft} />
          </>
        }
        modeToggle={
          <>
            <Button label="Split" size="small" text={workspaceMode !== 'split'} onClick={() => setWorkspaceMode('split')} />
            <Button label="Properties" size="small" text={workspaceMode !== 'properties'} onClick={() => setWorkspaceMode('properties')} />
            <Button label="On-page" size="small" text={workspaceMode !== 'onpage'} onClick={() => setWorkspaceMode('onpage')} />
          </>
        }
        overflow={
          <CommandMenuButton
            commands={headerOverflowCommands}
            context={headerCommandContext}
            buttonLabel=""
            buttonIcon="pi pi-ellipsis-h"
            text
          />
        }
      />
      <WorkspaceBody>
        <Splitter className="splitFill cms-editor-workspace" style={{ width: '100%' }}>
          <SplitterPanel size={28} minSize={20}>
            <div className="paneRoot paneScroll cms-pane cms-left-pane">
              <TabView activeIndex={leftTabIndex} onTabChange={(event) => setLeftTabIndex(event.index)}>
                <TabPanel header="Tree">
                  <ContextMenu ref={treeContextMenuRef} model={treeContextMenuItems} />
                  <div className="form-row" style={{ marginBottom: '0.75rem' }}>
                    <label>Filter tree</label>
                    <InputText value={treeFilter} onChange={(event) => setTreeFilter(event.target.value)} placeholder="Slug, title, status" />
                  </div>
                  <Tree
                    className="content-pages-tree"
                    value={treeNodes}
                    expandedKeys={treeExpandedKeys}
                    onToggle={(event) => setTreeExpandedKeys((event.value as Record<string, boolean>) ?? {})}
                    selectionMode="single"
                    selectionKeys={selectedRouteKey ?? null}
                    contextMenuSelectionKey={treeContextSelectionKey ?? undefined}
                    onContextMenuSelectionChange={(event) => setTreeContextSelectionKey(typeof event.value === 'string' ? event.value : null)}
                    onContextMenu={(event) => {
                      const row = event.node.data as Partial<TreeRow> | undefined;
                      if (!row || typeof row.contentItemId !== 'number') {
                        return;
                      }
                      const normalizedRow: TreeRow = {
                        routeId: String(row.routeId ?? ''),
                        slug: String(row.slug ?? ''),
                        contentItemId: row.contentItemId,
                        title: String(row.title ?? `Item #${row.contentItemId}`),
                        status: (row.status as TreeRow['status']) ?? 'New'
                      };
                      setTreeContextRow(normalizedRow);
                      setTreeContextSelectionKey(String(event.node.key ?? ''));
                      treeContextMenuRef.current?.show(event.originalEvent);
                    }}
                    onSelectionChange={(event) => {
                      const key = String(event.value ?? '');
                      const route = routes.find((entry) => String(entry.id) === key);
                      if (route) {
                        navigate(buildContentEditorUrl(route.contentItemId, route.marketCode, route.localeCode));
                      }
                    }}
                    nodeTemplate={(node) => {
                      const row = node.data as Partial<TreeRow> | undefined;
                      if (!row || typeof row.contentItemId !== 'number') {
                        return <span>{String(node.label ?? '')}</span>;
                      }
                      const normalizedRow: TreeRow = {
                        routeId: String(row.routeId ?? ''),
                        slug: String(row.slug ?? ''),
                        contentItemId: row.contentItemId,
                        title: String(row.title ?? `Item #${row.contentItemId}`),
                        status: (row.status as TreeRow['status']) ?? 'New'
                      };
                      const rowCommandContext: ContentPageRowCommandContext = {
                        ...baseCommandContext,
                        row: normalizedRow,
                        selectionIds: [normalizedRow.contentItemId],
                        openRow,
                        duplicateRow: duplicateTreeRow,
                        exportRow,
                        deleteRow: deleteTreeRow
                      };
                      const rowCommands = commandRegistry.getCommands(rowCommandContext, 'rowOverflow');
                      return (
                        <div className="content-tree-node-row">
                          <span>{row.slug}</span>
                          <div className="inline-actions">
                            <Tag value={row.status} severity={row.status === 'Published' ? 'success' : row.status === 'Draft' ? 'warning' : 'secondary'} />
                            <span className="content-tree-node-actions">
                              <CommandMenuButton commands={rowCommands} context={rowCommandContext} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
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
                    <Column
                      header="Actions"
                      body={(row: TreeRow) => {
                        const rowCommandContext: ContentPageRowCommandContext = {
                          ...baseCommandContext,
                          row,
                          selectionIds: [row.contentItemId],
                          openRow,
                          duplicateRow: duplicateTreeRow,
                          exportRow,
                          deleteRow: deleteTreeRow
                        };
                        const rowCommands = commandRegistry.getCommands(rowCommandContext, 'rowOverflow');
                        return <CommandMenuButton commands={rowCommands} context={rowCommandContext} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />;
                      }}
                    />
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
      </WorkspaceBody>
      <Dialog header="Add Component" visible={showAddComponent} onHide={() => setShowAddComponent(false)} style={{ width: '30rem' }}>
        <div className="form-row">
          <label>Component Type</label>
          <Dropdown
            value={newComponentType}
            options={availableComponentTypeOptions}
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
          <Button label="Add" onClick={addComponent} disabled={!newComponentType || availableComponentTypeOptions.length === 0} />
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
    </WorkspacePage>
  );
}
