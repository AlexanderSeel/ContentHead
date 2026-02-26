import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TabPanel, TabView } from 'primereact/tabview';
import { Column } from 'primereact/column';
import { ContextMenu } from 'primereact/contextmenu';
import { TreeTable } from 'primereact/treetable';
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
import { MultiSelect } from 'primereact/multiselect';

import { formatErrorMessage } from '../../lib/graphqlErrorUi';
import { getApiGraphqlUrl } from '../../lib/api';
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
import { AssetPickerDialog } from '../../components/inputs/AssetPickerDialog';
import { ComponentList } from './components/ComponentList';
import { ComponentInspector } from './components/ComponentInspector';
import { VisualBuilderWorkspace } from './builder/VisualBuilderWorkspace';
import { LinkSelectorDialog, type ContentLinkValue } from './fieldRenderers/LinkSelectorDialog';
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
  type ComponentTypeSetting,
  type ComponentUiField
} from './components/componentRegistry';
import type { CmsActionId, CmsBridgeMessage, CmsActionsMessage, CmsActionRequestMessage } from './previewBridge';
import { handleInlineEditPatchMessage } from './inlineEditBridge';
import { recordPreviewDiagnostics } from './previewDiagnostics';
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
type CItem = {
  id: number;
  contentTypeId: number;
  parentId?: number | null;
  sortOrder?: number | null;
  currentDraftVersionId?: number | null;
  currentPublishedVersionId?: number | null;
};
type CVersion = {
  id: number;
  versionNumber: number;
  fieldsJson: string;
  compositionJson: string;
  componentsJson: string;
  metadataJson: string;
  state: string;
  comment?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
};
type CRoute = { id: number; contentItemId: number; marketCode: string; localeCode: string; slug: string; isCanonical: boolean };
type PageTreeNodeDto = {
  id: number;
  title: string;
  slug: string;
  status: 'Draft' | 'Published' | 'New';
  parentId?: number | null;
  sortOrder: number;
  route?: CRoute | null;
  children: PageTreeNodeDto[];
};
type VariantSet = { id: number; contentItemId: number; marketCode: string; localeCode: string; fallbackVariantSetId?: number | null; active: boolean };
type Variant = { id: number; variantSetId: number; key: string; priority: number; ruleJson: string; state: string; trafficAllocation?: number | null; contentVersionId: number };
type CompositionArea = { name: string; components: string[] };
type ComponentRecord = { id: string; type: string; props: Record<string, unknown> };
type ComponentInstance = { instanceId: string; componentTypeId: string; area: string; sortOrder: number; props: Record<string, unknown> };
type ComponentTypeSettingRow = {
  componentTypeId?: string | null;
  enabled?: boolean | null;
  label?: string | null;
  groupName?: string | null;
  schemaJson?: string | null;
  uiMetaJson?: string | null;
  defaultPropsJson?: string | null;
};
type AclEntry = {
  principalType: 'ROLE' | 'USER' | 'GROUP';
  principalId: string;
  permissionKey: string;
  effect: 'ALLOW' | 'DENY';
};
type PrincipalGroup = { id: number; name: string; description?: string | null };
type VisitorGroup = { id: number; siteId: number; name: string; ruleJson: string };
type InternalRole = { id: number; name: string };
type InternalUser = { id: number; username: string; displayName?: string | null };
type FormListRow = { id: number; name: string };

type OnPageTargetType = 'text' | 'richtext' | 'asset' | 'link' | 'form' | 'component' | 'unknown';
type OnPageActionItem = { id: CmsActionId; label: string; primary?: boolean };
type OnPageTarget = {
  contentItemId: number;
  versionId: number;
  editTargetId?: string | null;
  editKind?: 'text' | 'richtext' | 'link' | 'asset' | 'list' | null;
  editMeta?: string | null;
  componentId: string | null;
  fieldPath: string | null;
  targetType: OnPageTargetType;
};

type OnPageListMode = 'object' | 'string' | 'number' | 'boolean' | 'json';

type OnPageListDialogState = {
  visible: boolean;
  path: string;
  items: unknown[];
  draftJson: string;
  mode: OnPageListMode;
  objectKeys: string[];
  itemFields: ComponentUiField[];
};

type OnPageListItemEditorState = {
  index: number;
  mode: Exclude<OnPageListMode, 'json'>;
  value: unknown;
  objectKeys: string[];
  itemFields: ComponentUiField[];
};

type AiMode = 'copy' | 'props' | 'translate';
type WorkspaceMode = 'split' | 'properties' | 'onpage';
type PreviewDevice = 'web' | 'tablet' | 'mobile';

type TreeRow = {
  routeId: string;
  slug: string;
  contentItemId: number;
  title: string;
  status: 'Draft' | 'Published' | 'New';
  parentId: number | null;
  sortOrder: number;
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
  addChildRow: (row: TreeRow) => Promise<void>;
  renameRow: (row: TreeRow) => void;
  openPermissions: (row: TreeRow) => void;
  moveRowUp: (row: TreeRow) => Promise<void>;
  moveRowDown: (row: TreeRow) => Promise<void>;
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

function parseComponentInstances(componentsJson: string): ComponentInstance[] {
  const parsed = parseJson<unknown>(componentsJson, []);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed
    .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
    .map((entry) => {
      const typed = entry as Record<string, unknown>;
      const props = typed.props;
      return {
        instanceId: typeof typed.instanceId === 'string' ? typed.instanceId : '',
        componentTypeId: typeof typed.componentTypeId === 'string' ? typed.componentTypeId : 'text_block',
        area: typeof typed.area === 'string' && typed.area.trim() ? typed.area : 'main',
        sortOrder: typeof typed.sortOrder === 'number' && Number.isFinite(typed.sortOrder) ? typed.sortOrder : 0,
        props: props && typeof props === 'object' && !Array.isArray(props) ? (props as Record<string, unknown>) : {}
      };
    })
    .filter((entry) => entry.instanceId.length > 0);
}

function parseLegacyComponentMap(componentsJson: string): Record<string, ComponentRecord> {
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
}

function componentMapFromInstances(instances: ComponentInstance[]): Record<string, ComponentRecord> {
  const mapped: Record<string, ComponentRecord> = {};
  for (const instance of instances) {
    mapped[instance.instanceId] = {
      id: instance.instanceId,
      type: instance.componentTypeId,
      props: instance.props
    };
  }
  return mapped;
}

function compositionFromInstances(instances: ComponentInstance[]): { areas: CompositionArea[] } {
  const grouped = new Map<string, Array<{ id: string; sortOrder: number }>>();
  for (const instance of instances) {
    const bucket = grouped.get(instance.area) ?? [];
    bucket.push({ id: instance.instanceId, sortOrder: instance.sortOrder });
    grouped.set(instance.area, bucket);
  }
  return {
    areas: Array.from(grouped.entries()).map(([name, rows]) => ({
      name,
      components: rows.sort((a, b) => a.sortOrder - b.sortOrder).map((entry) => entry.id)
    }))
  };
}

function serializeComponentInstances(areas: CompositionArea[], componentMap: Record<string, ComponentRecord>): string {
  const instances: ComponentInstance[] = [];
  areas.forEach((area) => {
    area.components.forEach((id, index) => {
      const component = componentMap[id];
      if (!component) {
        return;
      }
      instances.push({
        instanceId: id,
        componentTypeId: component.type,
        area: area.name,
        sortOrder: index,
        props: component.props
      });
    });
  });
  return JSON.stringify(instances);
}

const PAGE_ACL_ACTIONS = [
  'page.view',
  'page.create',
  'page.update',
  'page.delete',
  'page.publish',
  'page.admin',
  'component.update',
  'component.delete',
  'component.admin'
] as const;

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
  const parsed = parseComponentPath(path);
  if (!parsed?.propPath) {
    return null;
  }
  return { componentId: parsed.componentId, key: parsed.propPath };
}

function parseComponentPath(path: string | null): { componentId: string; propPath: string | null } | null {
  if (!path || !path.startsWith('components.')) {
    return null;
  }
  const parts = path.split('.');
  const componentId = parts[1];
  if (!componentId) {
    return null;
  }
  if (parts.length === 2) {
    return { componentId, propPath: null };
  }
  if (parts.length === 3 && parts[2] === 'props') {
    return { componentId, propPath: null };
  }
  if (parts.length < 4 || parts[2] !== 'props') {
    return null;
  }
  const key = parts.slice(3).join('.');
  if (!key) {
    return null;
  }
  return { componentId, propPath: key };
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

function looksLikeContentLinkValue(value: unknown): value is Partial<ContentLinkValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const kind = candidate.kind;
  if (kind === 'internal' || kind === 'external') {
    return true;
  }
  return (
    typeof candidate.url === 'string' ||
    typeof candidate.text === 'string' ||
    typeof candidate.target === 'string' ||
    typeof candidate.contentItemId === 'number' ||
    typeof candidate.routeSlug === 'string'
  );
}

function sanitizeForAttribute(value: string): string {
  return value.replace(/"/g, '\\"');
}

function getNestedValue(input: unknown, path: string): unknown {
  const parts = path.split('.').filter(Boolean);
  let cursor: unknown = input;
  for (const part of parts) {
    if (Array.isArray(cursor)) {
      const index = Number(part);
      if (!Number.isFinite(index)) {
        return undefined;
      }
      cursor = cursor[index];
      continue;
    }
    if (cursor && typeof cursor === 'object') {
      cursor = (cursor as Record<string, unknown>)[part];
      continue;
    }
    return undefined;
  }
  return cursor;
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
    id: 'content-pages.row.add-child',
    label: 'Add child',
    icon: 'pi pi-plus',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.addChildRow(ctx.row)
  },
  {
    id: 'content-pages.row.rename',
    label: 'Rename',
    icon: 'pi pi-pencil',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.renameRow(ctx.row)
  },
  {
    id: 'content-pages.row.open',
    label: 'Open',
    icon: 'pi pi-folder-open',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.openRow(ctx.row)
  },
  {
    id: 'content-pages.row.move-up',
    label: 'Move up',
    icon: 'pi pi-arrow-up',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.moveRowUp(ctx.row)
  },
  {
    id: 'content-pages.row.move-down',
    label: 'Move down',
    icon: 'pi pi-arrow-down',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.moveRowDown(ctx.row)
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
    id: 'content-pages.row.permissions',
    label: 'Permissions',
    icon: 'pi pi-shield',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.openPermissions(ctx.row)
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
    id: 'content-pages.tree.add-child',
    label: 'Add child',
    icon: 'pi pi-plus',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.addChildRow(ctx.treeNode)
  },
  {
    id: 'content-pages.tree.rename',
    label: 'Rename',
    icon: 'pi pi-pencil',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.renameRow(ctx.treeNode)
  },
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
    id: 'content-pages.tree.move-up',
    label: 'Move up',
    icon: 'pi pi-arrow-up',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.moveRowUp(ctx.treeNode)
  },
  {
    id: 'content-pages.tree.move-down',
    label: 'Move down',
    icon: 'pi pi-arrow-down',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.moveRowDown(ctx.treeNode)
  },
  {
    id: 'content-pages.tree.duplicate',
    label: 'Duplicate',
    icon: 'pi pi-copy',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.duplicateRow(ctx.treeNode)
  },
  {
    id: 'content-pages.tree.permissions',
    label: 'Permissions',
    icon: 'pi pi-shield',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.openPermissions(ctx.treeNode)
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
  const [pageTree, setPageTree] = useState<PageTreeNodeDto[]>([]);
  const [versions, setVersions] = useState<CVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
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
  const [internalUsers, setInternalUsers] = useState<InternalUser[]>([]);
  const [internalRoles, setInternalRoles] = useState<InternalRole[]>([]);
  const [principalGroups, setPrincipalGroups] = useState<PrincipalGroup[]>([]);
  const [aclInheritFromParent, setAclInheritFromParent] = useState(true);
  const [aclEntries, setAclEntries] = useState<AclEntry[]>([]);
  const [visitorGroups, setVisitorGroups] = useState<VisitorGroup[]>([]);
  const [targetingInheritFromParent, setTargetingInheritFromParent] = useState(true);
  const [targetingAllowGroupIds, setTargetingAllowGroupIds] = useState<number[]>([]);
  const [targetingDenyGroupIds, setTargetingDenyGroupIds] = useState<number[]>([]);
  const [targetingDenyBehavior, setTargetingDenyBehavior] = useState<'NOT_FOUND' | 'FALLBACK'>('NOT_FOUND');
  const [targetingFallbackContentItemId, setTargetingFallbackContentItemId] = useState<number | null>(null);
  const [targetingPreviewContextJson, setTargetingPreviewContextJson] = useState('{"segments":[],"query":{}}');
  const [targetingPreviewResult, setTargetingPreviewResult] = useState<{
    allowed: boolean;
    reason: string;
    matchedAllowGroupIds: number[];
    matchedDenyGroupIds: number[];
    fallbackContentItemId?: number | null;
  } | null>(null);
  const [rawEditable, setRawEditable] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedFieldPath, setSelectedFieldPath] = useState<string | null>(null);
  const [selectedEditTargetId, setSelectedEditTargetId] = useState<string | null>(null);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newComponentType, setNewComponentType] = useState(componentRegistry[0]?.id ?? 'hero');
  const [newComponentArea, setNewComponentArea] = useState('main');
  const [centerTabIndex, setCenterTabIndex] = useState(0);
  const [leftPaneCollapsed, setLeftPaneCollapsed] = useState(false);
  const [workspaceSizes, setWorkspaceSizes] = useState<number[]>([28, 72]);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('split');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('web');
  const [treeFilter, setTreeFilter] = useState('');
  const [treeExpandedKeys, setTreeExpandedKeys] = useState<Record<string, boolean>>({});
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>('copy');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [targetMarketCode, setTargetMarketCode] = useState(marketCode);
  const [targetLocaleCode, setTargetLocaleCode] = useState(localeCode);
  const [inlineSaveError, setInlineSaveError] = useState('');
  const [treeContextRow, setTreeContextRow] = useState<TreeRow | null>(null);
  const [treeContextSelectionKey, setTreeContextSelectionKey] = useState<string | null>(null);
  const [onPageAssetPicker, setOnPageAssetPicker] = useState<{ visible: boolean; path: string; multiple: boolean; selected: number[] } | null>(null);
  const [onPageLinkPicker, setOnPageLinkPicker] = useState<{ visible: boolean; path: string; value: ContentLinkValue | null } | null>(null);
  const [onPageFormPicker, setOnPageFormPicker] = useState<{ visible: boolean; path: string; value: number | null } | null>(null);
  const [onPageListDialog, setOnPageListDialog] = useState<OnPageListDialogState | null>(null);
  const [onPageListItemEditor, setOnPageListItemEditor] = useState<OnPageListItemEditorState | null>(null);
  const [formOptions, setFormOptions] = useState<FormListRow[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem('content-pages.workspace.sizes');
    if (!saved) {
      return;
    }
    try {
      const parsed = JSON.parse(saved) as number[];
      if (parsed.length === 2) {
        setWorkspaceSizes(parsed);
      }
    } catch {
      // ignore invalid saved layout
    }
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      if (inlineSaveTimerRef.current) {
        window.clearTimeout(inlineSaveTimerRef.current);
      }
    };
  }, []);

  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const treeContextMenuRef = useRef<ContextMenu>(null);
  const leftPaneExpandedSizeRef = useRef(28);
  const saveTimerRef = useRef<number | null>(null);
  const inlineSaveTimerRef = useRef<number | null>(null);
  const lastSavedRef = useRef<string>('');
  const saveInFlightRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const inlineBridgeSaveRef = useRef(false);

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

  const permissionPrincipalRows = useMemo(
    () => [
      ...internalRoles.map((role) => ({
        key: `ROLE:${role.id}`,
        label: `Role: ${role.name}`,
        principalType: 'ROLE' as const,
        principalId: String(role.id)
      })),
      ...internalUsers.map((user) => ({
        key: `USER:${user.id}`,
        label: `User: ${user.displayName?.trim() || user.username} (@${user.username})`,
        principalType: 'USER' as const,
        principalId: String(user.id)
      })),
      ...principalGroups.map((group) => ({
        key: `GROUP:${group.id}`,
        label: `Group: ${group.name}`,
        principalType: 'GROUP' as const,
        principalId: String(group.id)
      }))
    ],
    [internalRoles, internalUsers, principalGroups]
  );

  const filteredPageTree = useMemo(() => {
    const query = treeFilter.trim().toLowerCase();
    if (!query) {
      return pageTree;
    }

    const walk = (nodes: PageTreeNodeDto[]): PageTreeNodeDto[] => {
      const next: PageTreeNodeDto[] = [];
      for (const node of nodes) {
        const childMatches = walk(node.children ?? []);
        const selfMatches =
          node.title.toLowerCase().includes(query) ||
          node.slug.toLowerCase().includes(query) ||
          String(node.id).includes(query) ||
          node.status.toLowerCase().includes(query);
        if (selfMatches || childMatches.length > 0) {
          next.push({
            ...node,
            children: childMatches
          });
        }
      }
      return next;
    };

    return walk(pageTree);
  }, [pageTree, treeFilter]);

  const treeNodes = useMemo<TreeNode[]>(() => {
    const toNode = (entry: PageTreeNodeDto): TreeNode => ({
      key: String(entry.id),
      data: {
        routeId: String(entry.route?.id ?? ''),
        slug: entry.slug ?? '',
        contentItemId: entry.id,
        title: entry.title,
        status: entry.status,
        parentId: entry.parentId ?? null,
        sortOrder: entry.sortOrder
      } satisfies TreeRow,
      children: (entry.children ?? []).map(toNode)
    });

    return filteredPageTree.map(toNode);
  }, [filteredPageTree]);

  const selectedRouteKey = useMemo(() => {
    if (!selectedItemId) {
      return null;
    }
    return String(selectedItemId);
  }, [selectedItemId]);

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

  const componentInstances = useMemo(() => parseComponentInstances(componentsJson), [componentsJson]);

  const composition = useMemo<{ areas: CompositionArea[] }>(() => {
    if (componentInstances.length > 0) {
      return compositionFromInstances(componentInstances);
    }
    const parsed = parseJson<{ areas?: CompositionArea[] }>(compositionJson, { areas: [] });
    const areas = Array.isArray(parsed.areas) ? parsed.areas : [];
    return { areas };
  }, [compositionJson, componentInstances]);

  const componentMap = useMemo<Record<string, ComponentRecord>>(() => {
    if (componentInstances.length > 0) {
      return componentMapFromInstances(componentInstances);
    }
    return parseLegacyComponentMap(componentsJson);
  }, [componentsJson, componentInstances]);

  const selectedComponent = selectedComponentId ? componentMap[selectedComponentId] ?? null : null;
  const templateComponentIds = useMemo(() => {
    if (!selectedTemplate) {
      return new Set<string>();
    }
    const templateInstances = parseComponentInstances(selectedTemplate.componentsJson);
    if (templateInstances.length > 0) {
      return new Set(templateInstances.map((entry) => entry.instanceId));
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
  const resolvedComponentRegistryMap = useMemo(
    () => new Map(resolvedComponentRegistry.map((entry) => [entry.id, entry])),
    [resolvedComponentRegistry]
  );
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
  const configuredAreaNames = useMemo(() => {
    const fromRestrictions = Object.keys(areaRestrictions).map((entry) => entry.trim()).filter(Boolean);
    const fromComposition = composition.areas.map((entry) => entry.name).filter(Boolean);
    const merged = [...fromRestrictions, ...fromComposition];
    if (merged.length === 0) {
      return ['main', 'sidebar'];
    }
    return Array.from(new Set(merged));
  }, [areaRestrictions, composition.areas]);
  const builderAreas = useMemo(() => {
    const byName = new Map(composition.areas.map((entry) => [entry.name, entry]));
    return configuredAreaNames.map((name) => byName.get(name) ?? { name, components: [] });
  }, [composition.areas, configuredAreaNames]);
  useEffect(() => {
    if (configuredAreaNames.length === 0) {
      return;
    }
    if (!configuredAreaNames.includes(newComponentArea)) {
      setNewComponentArea(configuredAreaNames[0] ?? 'main');
    }
  }, [configuredAreaNames, newComponentArea]);
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
      const entry = component ? resolvedComponentRegistryMap.get(component.type) ?? getComponentRegistryEntry(component.type) : null;
      const fieldKey = parsed.key.split('.')[0] ?? '';
      const fieldDef = entry?.fields.find((field) => field.key === fieldKey);
      if (fieldDef?.type === 'richtext') {
        return DEFAULT_RICH_TEXT_FEATURES;
      }
    }
    return undefined;
  };

  const resolvePathFieldType = (path: string | null): string | null => {
    if (!path) {
      return null;
    }
    if (path.startsWith('fields.')) {
      const key = fieldPathToKey(path);
      if (!key) {
        return null;
      }
      const def = fieldDefs.find((entry) => entry.key === key);
      return def?.type ?? null;
    }
    const parsed = parseComponentFieldPath(path);
    if (!parsed) {
      return null;
    }
    const component = componentMap[parsed.componentId];
    const entry = component ? resolvedComponentRegistryMap.get(component.type) ?? getComponentRegistryEntry(component.type) : null;
    const fieldKey = parsed.key.split('.')[0] ?? '';
    const fieldDef = entry?.fields.find((field) => field.key === fieldKey);
    return fieldDef?.type ?? null;
  };

  const resolveOnPageTargetType = (
    fieldPath: string | null,
    componentId: string | null,
    editKind?: string | null
  ): OnPageTargetType => {
    if (editKind === 'text') {
      return 'text';
    }
    if (editKind === 'richtext') {
      return 'richtext';
    }
    if (editKind === 'asset') {
      return 'asset';
    }
    if (editKind === 'link') {
      return 'link';
    }
    if (editKind === 'list') {
      return componentId && !fieldPath ? 'component' : 'unknown';
    }
    if (!fieldPath && componentId) {
      return 'component';
    }
    const fieldType = resolvePathFieldType(fieldPath);
    if (!fieldType) {
      return componentId ? 'component' : 'unknown';
    }
    if (fieldType === 'richtext') {
      return 'richtext';
    }
    if (fieldType === 'text' || fieldType === 'multiline' || fieldType === 'string') {
      return 'text';
    }
    if (fieldType === 'assetRef' || fieldType === 'assetList') {
      return 'asset';
    }
    if (fieldType === 'contentLink' || fieldType === 'contentLinkList') {
      return 'link';
    }
    if (fieldType === 'formRef') {
      return 'form';
    }
    return componentId && !fieldPath ? 'component' : 'unknown';
  };

  const readCurrentValueByPath = (fieldPath: string): unknown => {
    if (fieldPath.startsWith('fields.')) {
      return fields[fieldPathToKey(fieldPath) ?? ''];
    }
    const parsedFieldPath = parseComponentFieldPath(fieldPath);
    if (parsedFieldPath) {
      const component = componentMap[parsedFieldPath.componentId];
      return getNestedValue(component?.props ?? {}, parsedFieldPath.key);
    }
    const parsedComponentPath = parseComponentPath(fieldPath);
    if (parsedComponentPath && parsedComponentPath.propPath == null) {
      return componentMap[parsedComponentPath.componentId]?.props ?? null;
    }
    return null;
  };

  const findFirstArrayPath = (value: unknown, prefix = ''): string | null => {
    if (Array.isArray(value)) {
      return prefix || null;
    }
    if (!value || typeof value !== 'object') {
      return null;
    }
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      if (Array.isArray(entry)) {
        return nextPrefix;
      }
      const nested = findFirstArrayPath(entry, nextPrefix);
      if (nested) {
        return nested;
      }
    }
    return null;
  };

  const resolveNearestArrayPath = (fieldPath: string, componentId: string | null): string => {
    let candidate = fieldPath;
    let current = readCurrentValueByPath(candidate);
    if (Array.isArray(current)) {
      return candidate;
    }
    while (candidate.includes('.')) {
      candidate = candidate.slice(0, candidate.lastIndexOf('.'));
      current = readCurrentValueByPath(candidate);
      if (Array.isArray(current)) {
        return candidate;
      }
    }

    const parsedComponentPath = parseComponentPath(fieldPath);
    const resolvedComponentId = componentId ?? parsedComponentPath?.componentId ?? null;
    if (!resolvedComponentId) {
      return fieldPath;
    }
    const component = componentMap[resolvedComponentId];
    if (!component) {
      return fieldPath;
    }
    const registryEntry = resolvedComponentRegistryMap.get(component.type) ?? getComponentRegistryEntry(component.type);
    const listField = registryEntry?.fields.find(
      (entry) =>
        entry.type === 'objectList' ||
        entry.type === 'stringList' ||
        entry.type === 'assetList' ||
        entry.type === 'contentLinkList'
    );
    if (listField) {
      const registryPath = `components.${resolvedComponentId}.props.${listField.key}`;
      if (Array.isArray(readCurrentValueByPath(registryPath))) {
        return registryPath;
      }
    }

    const fallbackPath = findFirstArrayPath(component.props ?? {});
    if (fallbackPath) {
      return `components.${resolvedComponentId}.props.${fallbackPath}`;
    }
    return fieldPath;
  };

  const resolveComponentFieldByPath = (fieldPath: string): ComponentUiField | null => {
    const parsed = parseComponentFieldPath(fieldPath);
    if (!parsed) {
      return null;
    }
    const component = componentMap[parsed.componentId];
    if (!component) {
      return null;
    }
    const entry = resolvedComponentRegistryMap.get(component.type) ?? getComponentRegistryEntry(component.type);
    if (!entry) {
      return null;
    }

    const segments = parsed.key.split('.').filter(Boolean);
    let fieldsCursor: ComponentUiField[] = entry.fields;
    let current: ComponentUiField | null = null;

    for (const segment of segments) {
      if (/^\d+$/.test(segment)) {
        if (current?.type === 'objectList' && Array.isArray(current.fields) && current.fields.length > 0) {
          fieldsCursor = current.fields;
          current = null;
        }
        continue;
      }
      const next = fieldsCursor.find((field) => field.key === segment) ?? null;
      if (!next) {
        return null;
      }
      current = next;
      fieldsCursor = next.type === 'objectList' && Array.isArray(next.fields) ? next.fields : [];
    }

    return current;
  };

  const inferObjectKeysFromItems = (items: unknown[]): string[] => {
    const keySet = new Set<string>();
    for (const item of items) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        continue;
      }
      Object.keys(item).forEach((key) => keySet.add(key));
    }
    return Array.from(keySet);
  };

  const inferListMode = (items: unknown[], itemFields: ComponentUiField[], objectKeys: string[]): OnPageListMode => {
    if (itemFields.length > 0) {
      return 'object';
    }
    if (items.length === 0) {
      return objectKeys.length > 0 ? 'object' : 'json';
    }
    if (items.every((item) => typeof item === 'string')) {
      return 'string';
    }
    if (items.every((item) => typeof item === 'number')) {
      return 'number';
    }
    if (items.every((item) => typeof item === 'boolean')) {
      return 'boolean';
    }
    if (items.every((item) => item && typeof item === 'object' && !Array.isArray(item))) {
      return objectKeys.length > 0 ? 'object' : 'json';
    }
    return 'json';
  };

  const buildOnPageListDialogState = (path: string, items: unknown[]): OnPageListDialogState => {
    const listField = resolveComponentFieldByPath(path);
    const itemFields = listField?.type === 'objectList' && Array.isArray(listField.fields) ? listField.fields : [];
    const objectKeys = itemFields.length > 0 ? itemFields.map((field) => field.key) : inferObjectKeysFromItems(items);
    const mode = inferListMode(items, itemFields, objectKeys);
    return {
      visible: true,
      path,
      items,
      draftJson: JSON.stringify(items, null, 2),
      mode,
      objectKeys,
      itemFields
    };
  };

  const resolveOnPageActions = (target: OnPageTarget): OnPageActionItem[] => {
    const actions: OnPageActionItem[] = [];
    const isComponentRoot = Boolean(target.componentId) && (!target.fieldPath || target.fieldPath === `components.${target.componentId}`);
    const canMutate = draft != null && draft.state !== 'PUBLISHED';
    const fieldType = resolvePathFieldType(target.fieldPath);
    const isLinkListField = fieldType === 'contentLinkList';
    const push = (id: CmsActionId, label: string, primary = false) => {
      if (!actions.some((entry) => entry.id === id)) {
        actions.push({ id, label, primary });
      }
    };

    if (!canMutate) {
      return actions;
    }
    if (target.targetType === 'text' || target.targetType === 'richtext') {
      push('clear', 'Clear');
    }
    if (target.targetType === 'asset' || target.targetType === 'form') {
      push('replace', 'Replace', true);
    }
    if (target.targetType === 'asset') {
      push('clear', 'Clear');
    }
    if (target.targetType === 'link') {
      if (isLinkListField) {
        push('manage_items', 'Manage Items', true);
      } else {
        push('replace', 'Replace', true);
        push('open', 'Open');
        push('unlink', 'Unlink');
      }
    }
    if (target.editKind === 'list') {
      const listPath = target.fieldPath ? resolveNearestArrayPath(target.fieldPath, target.componentId) : null;
      if (listPath && Array.isArray(readCurrentValueByPath(listPath))) {
        push('manage_items', 'Manage Items', true);
      }
    }
    if (isComponentRoot) {
      push('duplicate', 'Duplicate');
      push('move_up', 'Move Up');
      push('move_down', 'Move Down');
      push('delete', 'Delete');
    }
    return actions;
  };

  const selectedStatus = useMemo(() => {
    if (!selectedItemId) {
      return null;
    }
    const item = items.find((entry) => entry.id === selectedItemId);
    return getItemStatus(item);
  }, [items, selectedItemId]);

  const selectedVersion = useMemo(
    () => versions.find((entry) => entry.id === selectedVersionId) ?? null,
    [versions, selectedVersionId]
  );

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
        authToken: token ?? undefined,
        apiUrl: getApiGraphqlUrl(),
        versionId: draft?.id,
        previewMode,
        cmsBridge: true,
        inlineEdit: canInlineEdit
      });
  }, [selectedItemId, activeRoute, draft, webBaseUrl, siteId, site, marketCode, localeCode, previewToken, canInlineEdit]);

  const sendPreviewMessage = (message: CmsBridgeMessage) => {
    const target = previewIframeRef.current?.contentWindow;
    if (!target) {
      return;
    }
    recordPreviewDiagnostics({
      direction: 'to_preview',
      event: message.type,
      payload: message
    });
    target.postMessage(message, '*');
  };

  const scheduleDraftSave = (force = false, delay = 1000) => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      saveDraft({ force, silent: true }).catch((e: unknown) => setStatus(formatErrorMessage(e)));
    }, delay);
  };

  const scheduleInlineSave = (request: { force: boolean; delay: number; fieldPath: string; editTargetId?: string }) => {
    if (inlineSaveTimerRef.current) {
      window.clearTimeout(inlineSaveTimerRef.current);
    }
    inlineSaveTimerRef.current = window.setTimeout(() => {
      inlineBridgeSaveRef.current = true;
      saveDraft({ force: request.force, silent: true, refreshPreview: false })
        .then(() => {
          setInlineSaveError('');
          recordPreviewDiagnostics({
            direction: 'save',
            event: request.force ? 'INLINE_COMMIT_SAVE' : 'INLINE_PATCH_SAVE',
            ok: true,
            payload: request
          });
          if (request.force) {
            sendPreviewMessage({
              type: 'CMS_ACTION_RESULT',
              ok: true,
              requestType: 'inline_commit',
              editTargetId: request.editTargetId,
              fieldPath: request.fieldPath
            });
          }
        })
        .catch((error: unknown) => {
          const message = formatErrorMessage(error);
          setInlineSaveError(message);
          recordPreviewDiagnostics({
            direction: 'save',
            event: request.force ? 'INLINE_COMMIT_SAVE' : 'INLINE_PATCH_SAVE',
            ok: false,
            payload: { ...request, message }
          });
          sendPreviewMessage({
            type: 'CMS_ACTION_RESULT',
            ok: false,
            requestType: request.force ? 'inline_commit' : 'inline_patch',
            editTargetId: request.editTargetId,
            fieldPath: request.fieldPath,
            message
          });
          sendPreviewMessage({
            type: 'CMS_INLINE_EDIT_ERROR',
            editTargetId: request.editTargetId,
            fieldPath: request.fieldPath,
            message
          });
          setStatus(message);
        })
        .finally(() => {
          inlineBridgeSaveRef.current = false;
        });
    }, request.delay);
  };

  const hasAclAllow = (principalType: AclEntry['principalType'], principalId: string, permissionKey: string) =>
    aclEntries.some(
      (entry) =>
        entry.principalType === principalType &&
        entry.principalId === principalId &&
        entry.permissionKey === permissionKey &&
        entry.effect === 'ALLOW'
    );

  const toggleAclAllow = (
    principalType: AclEntry['principalType'],
    principalId: string,
    permissionKey: string,
    checked: boolean
  ) => {
    setAclEntries((prev) => {
      const filtered = prev.filter(
        (entry) =>
          !(
            entry.principalType === principalType &&
            entry.principalId === principalId &&
            entry.permissionKey === permissionKey
          )
      );
      if (!checked) {
        return filtered;
      }
      return [
        ...filtered,
        {
          principalType,
          principalId,
          permissionKey,
          effect: 'ALLOW'
        }
      ];
    });
  };

  const updateBuilder = (nextAreas: CompositionArea[], nextMap: Record<string, ComponentRecord>) => {
    setCompositionJson(JSON.stringify({ areas: nextAreas }));
    setComponentsJson(serializeComponentInstances(nextAreas, nextMap));
  };

  const setValueByPath = (
    fieldPath: string,
    nextValue: unknown,
    options?: { scheduleSave?: boolean; forceSave?: boolean; delay?: number }
  ) => {
    const scheduleNextSave = options?.scheduleSave ?? true;
    if (fieldPath.startsWith('fields.')) {
      const key = fieldPathToKey(fieldPath);
      if (!key) {
        return false;
      }
      setFields((prev) => ({ ...prev, [key]: nextValue }));
      setSelectedComponentId(null);
      setSelectedFieldPath(fieldPath);
      if (scheduleNextSave) {
        scheduleDraftSave(options?.forceSave ?? true, options?.delay ?? 50);
      }
      return true;
    }

    const parsed = parseComponentFieldPath(fieldPath);
    if (!parsed) {
      return false;
    }
    const component = componentMap[parsed.componentId];
    if (!component) {
      return false;
    }
    const nextProps = setNestedValue(component.props ?? {}, parsed.key, nextValue);
    const nextMap = {
      ...componentMap,
      [parsed.componentId]: {
        ...component,
        props: nextProps
      }
    };
    updateBuilder(composition.areas, nextMap);
    setSelectedComponentId(parsed.componentId);
    setSelectedFieldPath(fieldPath);
    if (scheduleNextSave) {
      scheduleDraftSave(options?.forceSave ?? true, options?.delay ?? 50);
    }
    return true;
  };

  const resolveOnPageTarget = (
    message: Pick<
      CmsActionRequestMessage,
      'contentItemId' | 'versionId' | 'componentId' | 'fieldPath' | 'editTargetId' | 'editKind' | 'editMeta'
    >
  ): OnPageTarget | null => {
    if (!selectedItemId || Number(message.contentItemId) !== selectedItemId) {
      return null;
    }
    const componentId = typeof message.componentId === 'string' ? message.componentId : null;
    const fieldPath = typeof message.fieldPath === 'string' ? message.fieldPath : null;
    const editKind = typeof message.editKind === 'string' ? message.editKind : null;
    const targetType = resolveOnPageTargetType(fieldPath, componentId, editKind);
    return {
      contentItemId: Number(message.contentItemId),
      versionId: Number(message.versionId),
      editTargetId: typeof message.editTargetId === 'string' ? message.editTargetId : null,
      editKind,
      editMeta: typeof message.editMeta === 'string' ? message.editMeta : null,
      componentId,
      fieldPath,
      targetType
    };
  };

  const sendOnPageActions = (target: OnPageTarget | null) => {
    const message: CmsActionsMessage = {
      type: 'CMS_ACTIONS',
      contentItemId: target?.contentItemId ?? selectedItemId ?? 0,
      versionId: target?.versionId ?? (draft?.id ?? 0),
      editTargetId: target?.editTargetId ?? undefined,
      componentId: target?.componentId ?? undefined,
      fieldPath: target?.fieldPath ?? undefined,
      targetType: target?.targetType ?? 'unknown',
      actions: target ? resolveOnPageActions(target) : []
    };
    sendPreviewMessage(message);
  };

  const executeOnPageAction = (request: CmsActionRequestMessage) => {
    const target = resolveOnPageTarget(request);
    if (!target || !request.action) {
      return;
    }

    if (request.action === 'open' && target.fieldPath) {
      const current = readCurrentValueByPath(target.fieldPath);
      let href = '';
      if (current && typeof current === 'object' && !Array.isArray(current)) {
        const link = current as ContentLinkValue;
        href = link.url ?? '';
      } else if (Array.isArray(current) && current[0] && typeof current[0] === 'object') {
        const link = current[0] as ContentLinkValue;
        href = link.url ?? '';
      }
      if (href.trim()) {
        window.open(href, '_blank', 'noopener,noreferrer');
        sendPreviewMessage({
          type: 'CMS_ACTION_RESULT',
          ok: true,
          requestType: 'action',
          editTargetId: target.editTargetId ?? undefined,
          fieldPath: target.fieldPath,
          componentId: target.componentId ?? undefined,
          message: 'Opened link'
        });
      } else {
        sendPreviewMessage({
          type: 'CMS_ACTION_RESULT',
          ok: false,
          requestType: 'action',
          editTargetId: target.editTargetId ?? undefined,
          fieldPath: target.fieldPath,
          componentId: target.componentId ?? undefined,
          message: 'No link URL configured'
        });
      }
      return;
    }

    if (!draft || draft.state === 'PUBLISHED') {
      return;
    }

    if (request.action === 'replace' && target.fieldPath) {
      setSelectedFieldPath(target.fieldPath);
      if (target.componentId) {
        setSelectedComponentId(target.componentId);
      }
      if (target.targetType === 'asset') {
        const current = readCurrentValueByPath(target.fieldPath);
        const selected =
          typeof current === 'number'
            ? [current]
            : Array.isArray(current)
              ? current.filter((entry): entry is number => typeof entry === 'number')
              : [];
        const multiple = Array.isArray(current);
        setOnPageAssetPicker({ visible: true, path: target.fieldPath, multiple, selected });
        return;
      }
      if (target.targetType === 'link') {
        const current = readCurrentValueByPath(target.fieldPath);
        const value = current && typeof current === 'object' && !Array.isArray(current) ? (current as ContentLinkValue) : null;
        setOnPageLinkPicker({ visible: true, path: target.fieldPath, value });
        return;
      }
      if (target.targetType === 'form') {
        const current = readCurrentValueByPath(target.fieldPath);
        setOnPageFormPicker({
          visible: true,
          path: target.fieldPath,
          value: typeof current === 'number' ? current : null
        });
      }
      return;
    }

    if (request.action === 'manage_items' && target.fieldPath) {
      const listPath = resolveNearestArrayPath(target.fieldPath, target.componentId);
      const current = readCurrentValueByPath(listPath);
      if (!Array.isArray(current)) {
        sendPreviewMessage({
          type: 'CMS_ACTION_RESULT',
          ok: false,
          requestType: 'action',
          editTargetId: target.editTargetId ?? undefined,
          fieldPath: target.fieldPath,
          componentId: target.componentId ?? undefined,
          message: 'No list field resolved for this target'
        });
        return;
      }
      setOnPageListItemEditor(null);
      setOnPageListDialog(buildOnPageListDialogState(listPath, [...current]));
      return;
    }

    if (request.action === 'unlink' && target.fieldPath) {
      const current = readCurrentValueByPath(target.fieldPath);
      const nextValue = Array.isArray(current) ? [] : null;
      setValueByPath(target.fieldPath, nextValue);
      sendPreviewMessage({
        type: 'CMS_ACTION_RESULT',
        ok: true,
        requestType: 'action',
        editTargetId: target.editTargetId ?? undefined,
        fieldPath: target.fieldPath,
        componentId: target.componentId ?? undefined,
        message: 'Link cleared'
      });
      return;
    }

    if (request.action === 'clear' && target.fieldPath) {
      const current = readCurrentValueByPath(target.fieldPath);
      const nextValue =
        target.targetType === 'asset' || target.targetType === 'link' || target.targetType === 'form'
          ? Array.isArray(current) ? [] : null
          : Array.isArray(current) ? [] : '';
      setValueByPath(target.fieldPath, nextValue);
      sendPreviewMessage({
        type: 'CMS_ACTION_RESULT',
        ok: true,
        requestType: 'action',
        editTargetId: target.editTargetId ?? undefined,
        fieldPath: target.fieldPath,
        componentId: target.componentId ?? undefined,
        message: 'Cleared'
      });
      return;
    }

    if (!target.componentId) {
      return;
    }

    if (request.action === 'delete') {
      const nextAreas = removeComponentFromAreas(composition.areas, target.componentId);
      const nextMap = { ...componentMap };
      delete nextMap[target.componentId];
      updateBuilder(nextAreas, nextMap);
      setSelectedComponentId(null);
      setSelectedFieldPath(null);
      scheduleDraftSave(true, 50);
      sendPreviewMessage({
        type: 'CMS_ACTION_RESULT',
        ok: true,
        requestType: 'action',
        editTargetId: target.editTargetId ?? undefined,
        componentId: target.componentId ?? undefined,
        message: 'Component deleted'
      });
      return;
    }

    if (request.action === 'duplicate') {
      const original = componentMap[target.componentId];
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
      const nextAreas = duplicateComponentInAreas(composition.areas, target.componentId, duplicateId);
      updateBuilder(nextAreas, nextMap);
      setSelectedComponentId(duplicateId);
      setSelectedFieldPath(`components.${duplicateId}`);
      scheduleDraftSave(true, 50);
      sendPreviewMessage({
        type: 'CMS_ACTION_RESULT',
        ok: true,
        requestType: 'action',
        editTargetId: target.editTargetId ?? undefined,
        componentId: duplicateId,
        message: 'Component duplicated'
      });
      return;
    }

    if (request.action === 'move_up' || request.action === 'move_down') {
      const nextAreas = moveComponentInAreas(composition.areas, target.componentId, request.action === 'move_up' ? -1 : 1);
      updateBuilder(nextAreas, componentMap);
      setSelectedComponentId(target.componentId);
      setSelectedFieldPath(`components.${target.componentId}`);
      scheduleDraftSave(true, 50);
      sendPreviewMessage({
        type: 'CMS_ACTION_RESULT',
        ok: true,
        requestType: 'action',
        editTargetId: target.editTargetId ?? undefined,
        componentId: target.componentId ?? undefined,
        message: request.action === 'move_up' ? 'Moved up' : 'Moved down'
      });
    }
  };

  const refresh = async () => {
    const [typesRes, itemsRes, routesRes, templatesRes, pageTreeRes, usersRes, rolesRes, groupsRes, visitorGroupsRes] =
      await Promise.all([
      sdk.listContentTypes({ siteId }),
      sdk.listContentItems({ siteId }),
      sdk.listRoutes({ siteId, marketCode: null, localeCode: null }),
      sdk.listTemplates({ siteId }),
      sdk.getPageTree({ siteId, marketCode, localeCode }),
      sdk.listInternalUsers(),
      sdk.listInternalRoles(),
      sdk.listPrincipalGroups(),
      sdk.listVisitorGroups({ siteId })
      ]);
    const componentSettingsRes = await sdk
      .listComponentTypeSettings({ siteId })
      .catch(() => ({ listComponentTypeSettings: [] as ComponentTypeSettingRow[] }));
    const nextTypes = (typesRes.listContentTypes ?? []) as CType[];
    setTypes(nextTypes);
    setSelectedContentTypeId((prev) => prev ?? nextTypes[0]?.id ?? null);
    setItems((itemsRes.listContentItems ?? []) as CItem[]);
    setRoutes((routesRes.listRoutes ?? []) as CRoute[]);
    setPageTree((pageTreeRes.getPageTree ?? []) as PageTreeNodeDto[]);
    setTemplates((templatesRes.listTemplates ?? []) as Template[]);
    setInternalUsers((usersRes.listInternalUsers ?? []) as InternalUser[]);
    setInternalRoles((rolesRes.listInternalRoles ?? []) as InternalRole[]);
    setPrincipalGroups((groupsRes.listPrincipalGroups ?? []) as PrincipalGroup[]);
    setVisitorGroups((visitorGroupsRes.listVisitorGroups ?? []) as VisitorGroup[]);
    setComponentSettings(
      ((componentSettingsRes.listComponentTypeSettings ?? []) as ComponentTypeSettingRow[])
        .filter((entry) => typeof entry.componentTypeId === 'string')
        .map((entry) => ({
          componentTypeId: entry.componentTypeId as string,
          enabled: Boolean(entry.enabled ?? true),
          label: entry.label ?? null,
          groupName: entry.groupName ?? null,
          schemaJson: entry.schemaJson ?? null,
          uiMetaJson: entry.uiMetaJson ?? null,
          defaultPropsJson: entry.defaultPropsJson ?? null
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
        const instances = parseComponentInstances(activeVersion.componentsJson);
        const normalizedCompositionJson =
          instances.length > 0
            ? JSON.stringify(compositionFromInstances(instances))
            : activeVersion.compositionJson;
        setFields(parsedFields);
        setCompositionJson(normalizedCompositionJson);
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
          compositionJson: normalizedCompositionJson,
          componentsJson: activeVersion.componentsJson,
          metadataJson: activeVersion.metadataJson
        });
      } else {
        lastSavedRef.current = '';
      }

      const versionsRes = await sdk.listVersions({ contentItemId: id });
      const listedVersions = (versionsRes.listVersions ?? []) as CVersion[];
      setVersions(listedVersions);
      setSelectedVersionId((prev) => {
        if (prev && listedVersions.some((entry) => entry.id === prev)) {
          return prev;
        }
        if (activeVersion && listedVersions.some((entry) => entry.id === activeVersion.id)) {
          return activeVersion.id;
        }
        return listedVersions[0]?.id ?? null;
      });
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

      const [aclSettingsRes, aclEntriesRes, targetingRes] = await Promise.all([
        sdk.getPageAclSettings({ contentItemId: id }),
        sdk.listEntityAcls({ entityType: 'PAGE', entityId: String(id) }),
        sdk.getPageTargeting({ contentItemId: id })
      ]);
      setAclInheritFromParent(Boolean(aclSettingsRes.getPageAclSettings?.inheritFromParent ?? true));
      setAclEntries(((aclEntriesRes.listEntityAcls ?? []) as AclEntry[]).filter((entry) => entry.effect === 'ALLOW'));

      const targeting = targetingRes.getPageTargeting;
      const allowIds = targeting?.allowVisitorGroupIdsJson
        ? (parseJson(targeting.allowVisitorGroupIdsJson, []) as number[])
        : [];
      const denyIds = targeting?.denyVisitorGroupIdsJson
        ? (parseJson(targeting.denyVisitorGroupIdsJson, []) as number[])
        : [];
      setTargetingInheritFromParent(Boolean(targeting?.inheritFromParent ?? true));
      setTargetingAllowGroupIds(allowIds.filter((entry) => Number.isFinite(Number(entry))).map((entry) => Number(entry)));
      setTargetingDenyGroupIds(denyIds.filter((entry) => Number.isFinite(Number(entry))).map((entry) => Number(entry)));
      setTargetingDenyBehavior(targeting?.denyBehavior === 'FALLBACK' ? 'FALLBACK' : 'NOT_FOUND');
      setTargetingFallbackContentItemId(
        typeof targeting?.fallbackContentItemId === 'number' ? targeting.fallbackContentItemId : null
      );
      setTargetingPreviewResult(null);
    } finally {
      setLoadingItem(false);
    }
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
    refresh().catch((error: unknown) => setStatus(formatErrorMessage(error)));
  }, [siteId, marketCode, localeCode]);

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
      setSelectedVersionId(null);
      setVariantSets([]);
      setVariants([]);
      setSelectedComponentId(null);
      setSelectedFieldPath(null);
      setSelectedEditTargetId(null);
      return;
    }
    loadItem(selectedItemId).catch((error: unknown) => setStatus(formatErrorMessage(error)));
  }, [selectedItemId, siteId, marketCode, localeCode]);

  useEffect(() => {
    if (!selectedVersion) {
      return;
    }
    setVariantDraft((prev) => ({ ...prev, contentVersionId: selectedVersion.id }));
  }, [selectedVersion]);

  useEffect(() => {
    sdk
      .listForms({ siteId })
      .then((res) =>
        setFormOptions(
          (res.listForms ?? [])
            .filter((entry) => typeof entry.id === 'number' && typeof entry.name === 'string')
            .map((entry) => ({ id: entry.id as number, name: entry.name as string }))
        )
      )
      .catch(() => setFormOptions([]));
  }, [sdk, siteId]);

  useEffect(() => {
    const handler = (event: MessageEvent<unknown>) => {
      const payload = event.data as Partial<CmsBridgeMessage> | undefined;
      if (!payload?.type) {
        return;
      }
      recordPreviewDiagnostics({
        direction: 'from_preview',
        event: payload.type,
        payload
      });

      if (payload.type === 'CMS_ACTION_REQUEST') {
        const request = payload as CmsActionRequestMessage;
        const target = resolveOnPageTarget(request);
        if (request.mode === 'list') {
          sendOnPageActions(target);
          return;
        }
        executeOnPageAction(request);
        sendOnPageActions(target);
        return;
      }

      if (payload.type === 'CMS_INLINE_EDIT_PATCH' || payload.type === 'CMS_INLINE_EDIT_COMMIT') {
        inlineBridgeSaveRef.current = true;
        const result = handleInlineEditPatchMessage({
          selectedItemId,
          hasDraft: Boolean(draft),
          message: payload,
          applyValueByPath: (fieldPath, value) => setValueByPath(fieldPath, value, { scheduleSave: false }),
          scheduleSave: scheduleInlineSave
        });
        if (result.handled && !result.applied && result.fieldPath) {
          inlineBridgeSaveRef.current = false;
          sendPreviewMessage({
            type: 'CMS_INLINE_EDIT_ERROR',
            editTargetId: result.editTargetId,
            fieldPath: result.fieldPath,
            message: 'Inline change was not applied.'
          });
          sendPreviewMessage({
            type: 'CMS_ACTION_RESULT',
            ok: false,
            requestType: payload.type === 'CMS_INLINE_EDIT_COMMIT' ? 'inline_commit' : 'inline_patch',
            editTargetId: result.editTargetId,
            fieldPath: result.fieldPath,
            message: 'Inline change was not applied.'
          });
        }
        if (!result.handled) {
          inlineBridgeSaveRef.current = false;
        }
        return;
      }

      if (payload.type === 'CMS_INLINE_EDIT_CANCEL') {
        return;
      }

      if (payload.type !== 'CMS_SELECT') {
        return;
      }

      if (!selectedItemId || Number(payload.contentItemId) !== selectedItemId) {
        return;
      }

      const componentId = typeof payload.componentId === 'string' ? payload.componentId : null;
      const fieldPath = typeof payload.fieldPath === 'string' ? payload.fieldPath : null;
      const editTargetId = typeof payload.editTargetId === 'string' ? payload.editTargetId : null;
      const editKind = typeof payload.editKind === 'string' ? payload.editKind : null;
      const isInlineTextSelection = canInlineEdit && (editKind === 'text' || editKind === 'richtext');

      const targetType = resolveOnPageTargetType(fieldPath, componentId, editKind);
      const target: OnPageTarget = {
        contentItemId: selectedItemId,
        versionId: draft?.id ?? 0,
        editTargetId,
        editKind,
        editMeta: null,
        componentId,
        fieldPath,
        targetType
      };

      if (isInlineTextSelection) {
        // Root cause fix: parent-side React state updates on every CMS_SELECT can steal focus
        // from the iframe right after the caret appears. For inline text/richtext we avoid
        // selection state churn and only return available actions.
        sendOnPageActions(target);
        return;
      }

      setSelectedEditTargetId(editTargetId);

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

      sendOnPageActions(target);
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [
    selectedItemId,
    componentMap,
    composition,
    fields,
    draft,
    resolveOnPageTarget,
    resolveOnPageTargetType,
    sendOnPageActions,
    executeOnPageAction,
    canInlineEdit,
    scheduleDraftSave,
    scheduleInlineSave
  ]);

  useEffect(() => {
    if (!draft || loadingItem) {
      return;
    }
    if (inlineBridgeSaveRef.current) {
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
      editTargetId: selectedEditTargetId ?? undefined,
      componentId: selectedComponentId ?? undefined,
      fieldPath: selectedFieldPath ?? undefined,
      richTextFeatures: resolveRichTextFeatures(selectedFieldPath)
    });

    if (selectedComponentId) {
      sendPreviewMessage({ type: 'CMS_SCROLL_TO', componentId: selectedComponentId });
    }
  }, [selectedEditTargetId, selectedComponentId, selectedFieldPath, previewIframeUrl, previewReloadKey]);

  useEffect(() => {
    if (!previewIframeUrl) {
      return;
    }
    sendPreviewMessage({
      type: 'CMS_INLINE_MODE',
      enabled: canInlineEdit
    });
  }, [canInlineEdit, previewIframeUrl, previewReloadKey]);

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

  const saveDraft = async (options: { force?: boolean; silent?: boolean; refreshPreview?: boolean } = {}) => {
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
        if (options.refreshPreview !== false) {
          setPreviewReloadKey((prev) => prev + 1);
          sendPreviewMessage({ type: 'CMS_REFRESH' });
        }
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

  const publishSelectedVersion = async () => {
    if (!selectedVersion || selectedVersion.state === 'ARCHIVED') {
      return;
    }
    await sdk.publishVersion({
      versionId: selectedVersion.id,
      expectedVersionNumber: selectedVersion.versionNumber,
      by: 'admin'
    });
    if (selectedItemId) {
      await loadItem(selectedItemId);
      setPreviewReloadKey((prev) => prev + 1);
      toast({ severity: 'success', summary: `Published v${selectedVersion.versionNumber}` });
    }
  };

  const rollbackToSelectedVersion = async () => {
    if (!selectedItemId || !selectedVersion) {
      return;
    }
    await sdk.rollbackToVersion({
      contentItemId: selectedItemId,
      versionId: selectedVersion.id,
      by: 'admin'
    });
    await loadItem(selectedItemId);
    setPreviewReloadKey((prev) => prev + 1);
    toast({ severity: 'success', summary: `Loaded v${selectedVersion.versionNumber} into draft` });
  };

  const archiveSelectedVersion = async () => {
    if (!selectedVersion || selectedVersion.state === 'ARCHIVED') {
      return;
    }
    await sdk.archiveVersion({ versionId: selectedVersion.id, by: 'admin' });
    if (selectedItemId) {
      await loadItem(selectedItemId);
      toast({ severity: 'success', summary: `Deleted v${selectedVersion.versionNumber}` });
    }
  };

  const createVariantFromSelectedVersion = async () => {
    if (!selectedItemId || !selectedVersion) {
      return;
    }

    let targetVariantSetId = variantSetId;
    if (!targetVariantSetId) {
      const upserted = await sdk.upsertVariantSet({
        id: null,
        siteId,
        contentItemId: selectedItemId,
        marketCode,
        localeCode,
        active: true,
        fallbackVariantSetId: null
      });
      targetVariantSetId = upserted.upsertVariantSet?.id ?? null;
      setVariantSetId(targetVariantSetId);
    }

    if (!targetVariantSetId) {
      return;
    }

    const existingKeys = new Set(variants.map((entry) => entry.key));
    const baseKey = `v${selectedVersion.versionNumber}`;
    let key = baseKey;
    let suffix = 2;
    while (existingKeys.has(key)) {
      key = `${baseKey}_${suffix}`;
      suffix += 1;
    }

    await sdk.upsertVariant({
      variantSetId: targetVariantSetId,
      key,
      priority: 100,
      state: 'ACTIVE',
      ruleJson: '{}',
      trafficAllocation: 100,
      contentVersionId: selectedVersion.id
    });
    if (selectedItemId) {
      await loadItem(selectedItemId);
      setCenterTabIndex(4);
      toast({ severity: 'success', summary: `Variant ${key} created from v${selectedVersion.versionNumber}` });
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
      authToken: token ?? undefined,
      apiUrl: getApiGraphqlUrl(),
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
      parentId: row.parentId,
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
    await sdk.movePage({
      pageId: createdId,
      newParentId: row.parentId,
      newSortOrder: row.sortOrder + 1
    });
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

  const createChildFromRow = async (row: TreeRow) => {
    const sourceItem = items.find((entry) => entry.id === row.contentItemId);
    if (!sourceItem) {
      return;
    }
    const created = await sdk.createChildPage({
      parentId: row.contentItemId,
      siteId,
      contentTypeId: sourceItem.contentTypeId,
      by: 'admin',
      initialFieldsJson: '{}',
      initialCompositionJson: '{"areas":[{"name":"main","components":[]}]}',
      initialComponentsJson: '{}',
      metadataJson: '{}'
    });
    const id = created.createChildPage?.id ?? null;
    await refresh();
    if (id) {
      navigate(buildContentEditorUrl(id, marketCode, localeCode));
      toast({ severity: 'success', summary: `Created child page #${id}` });
    }
  };

  const savePagePermissions = async () => {
    if (!selectedItemId) {
      return;
    }
    await sdk.upsertPageAclSettings({
      contentItemId: selectedItemId,
      inheritFromParent: aclInheritFromParent
    });
    await sdk.replaceEntityAcls({
      entityType: 'PAGE',
      entityId: String(selectedItemId),
      entries: aclEntries.map((entry) => ({
        principalType: entry.principalType,
        principalId: entry.principalId,
        permissionKey: entry.permissionKey,
        effect: entry.effect
      }))
    });
    toast({ severity: 'success', summary: 'Permissions saved' });
  };

  const savePageTargeting = async () => {
    if (!selectedItemId) {
      return;
    }
    await sdk.upsertPageTargeting({
      contentItemId: selectedItemId,
      inheritFromParent: targetingInheritFromParent,
      allowVisitorGroupIdsJson: JSON.stringify(targetingAllowGroupIds),
      denyVisitorGroupIdsJson: JSON.stringify(targetingDenyGroupIds),
      denyBehavior: targetingDenyBehavior,
      fallbackContentItemId: targetingFallbackContentItemId
    });
    toast({ severity: 'success', summary: 'Targeting saved' });
  };

  const previewPageTargeting = async () => {
    if (!selectedItemId) {
      return;
    }
    const result = await sdk.evaluatePageTargeting({
      contentItemId: selectedItemId,
      contextJson: targetingPreviewContextJson
    });
    const evaluation = result.evaluatePageTargeting;
    if (!evaluation) {
      setTargetingPreviewResult(null);
      return;
    }
    setTargetingPreviewResult({
      allowed: Boolean(evaluation.allowed),
      reason: String(evaluation.reason ?? ''),
      matchedAllowGroupIds: (evaluation.matchedAllowGroupIds ?? []) as number[],
      matchedDenyGroupIds: (evaluation.matchedDenyGroupIds ?? []) as number[],
      fallbackContentItemId:
        typeof evaluation.fallbackContentItemId === 'number' ? evaluation.fallbackContentItemId : null
    });
  };

  const moveRowUp = async (row: TreeRow) => {
    if (row.sortOrder <= 0) {
      return;
    }
    await sdk.movePage({
      pageId: row.contentItemId,
      newParentId: row.parentId,
      newSortOrder: row.sortOrder - 1
    });
    await refresh();
  };

  const moveRowDown = async (row: TreeRow) => {
    await sdk.movePage({
      pageId: row.contentItemId,
      newParentId: row.parentId,
      newSortOrder: row.sortOrder + 1
    });
    await refresh();
  };

  const renameRow = (row: TreeRow) => {
    navigate(buildContentEditorUrl(row.contentItemId, marketCode, localeCode));
    setCenterTabIndex(0);
    toast({ severity: 'info', summary: 'Rename in fields', detail: 'Edit title/name field in the editor.' });
  };

  const openPermissions = (row: TreeRow) => {
    navigate(buildContentEditorUrl(row.contentItemId, marketCode, localeCode));
    setCenterTabIndex(5);
  };

  const deleteTreeRow = async (row: TreeRow) => {
    await sdk.deletePage({ pageId: row.contentItemId });
    if (selectedItemId === row.contentItemId) {
      navigate('/content/pages');
    }
    await refresh();
    toast({ severity: 'success', summary: `Archived page #${row.contentItemId}` });
  };

  const moveComponent = (id: string, direction: -1 | 1) => {
    const nextAreas = moveComponentInAreas(composition.areas, id, direction);
    updateBuilder(nextAreas, componentMap);
  };

  const moveComponentToArea = (id: string, areaName: string) => {
    if (!configuredAreaNames.includes(areaName)) {
      setStatus(`Area "${areaName}" is not configured for this content type.`);
      return;
    }
    const without = removeComponentFromAreas(composition.areas, id);
    const nextAreas = placeComponentInArea(without, areaName, id);
    updateBuilder(nextAreas, componentMap);
  };

  const removeComponent = (id: string) => {
    const nextAreas = removeComponentFromAreas(composition.areas, id);
    const nextMap = { ...componentMap };
    delete nextMap[id];
    updateBuilder(nextAreas, nextMap);
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

    updateBuilder(nextAreas, nextMap);
    setSelectedComponentId(duplicateId);
    setSelectedFieldPath(`components.${duplicateId}`);
  };

  const addComponent = () => {
    if (!configuredAreaNames.includes(newComponentArea)) {
      setStatus(`Area "${newComponentArea}" is not configured for this content type.`);
      return;
    }
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

    const entry = resolvedComponentRegistryMap.get(newComponentType) ?? getComponentRegistryEntry(newComponentType);
    if (!entry) {
      return;
    }
    const id = `${entry.id}_${Date.now()}`;
    const nextMap = { ...componentMap, [id]: { id, type: entry.id, props: cloneProps(entry.defaultProps) } };
    const nextAreas = placeComponentInArea(composition.areas, newComponentArea, id);
    updateBuilder(nextAreas, nextMap);
    setSelectedComponentId(id);
    setSelectedFieldPath(`components.${id}`);
    setShowAddComponent(false);
  };

  const applyOnPageAssetSelection = (assetIds: number[]) => {
    if (!onPageAssetPicker) {
      return;
    }
    const value = onPageAssetPicker.multiple ? assetIds : (assetIds[0] ?? null);
    setValueByPath(onPageAssetPicker.path, value);
    setOnPageAssetPicker(null);
  };

  const applyOnPageLinkSelection = (value: ContentLinkValue) => {
    if (!onPageLinkPicker) {
      return;
    }
    const fieldType = resolvePathFieldType(onPageLinkPicker.path);
    setValueByPath(onPageLinkPicker.path, fieldType === 'contentLinkList' ? [value] : value);
    setOnPageLinkPicker(null);
  };

  const applyOnPageFormSelection = (formId: number | null) => {
    if (!onPageFormPicker) {
      return;
    }
    setValueByPath(onPageFormPicker.path, formId);
    setOnPageFormPicker(null);
  };

  const applyOnPageListSelection = () => {
    if (!onPageListDialog) {
      return;
    }
    const source = onPageListDialog.mode === 'json' ? onPageListDialog.draftJson : JSON.stringify(onPageListDialog.items);
    try {
      const parsed = JSON.parse(source) as unknown;
      if (!Array.isArray(parsed)) {
        setStatus('List dialog expects a JSON array.');
        return;
      }
      setValueByPath(onPageListDialog.path, parsed);
      setOnPageListItemEditor(null);
      setOnPageListDialog(null);
      setStatus('');
    } catch {
      setStatus('Invalid list JSON. Keep a valid array structure.');
    }
  };

  const setOnPageListItems = (items: unknown[]) => {
    setOnPageListDialog((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        items,
        draftJson: JSON.stringify(items, null, 2)
      };
    });
  };

  const addOnPageListItem = () => {
    if (!onPageListDialog) {
      return;
    }
    const base = [...onPageListDialog.items];
    if (onPageListDialog.mode === 'object') {
      const nextObject: Record<string, unknown> = {};
      const keys = onPageListDialog.objectKeys.length > 0 ? onPageListDialog.objectKeys : ['value'];
      keys.forEach((key) => {
        const field = onPageListDialog.itemFields.find((entry) => entry.key === key);
        if (field?.type === 'number') {
          nextObject[key] = 0;
        } else if (field?.type === 'boolean') {
          nextObject[key] = false;
        } else if (field?.type === 'stringList') {
          nextObject[key] = [];
        } else {
          nextObject[key] = '';
        }
      });
      base.push(nextObject);
      setOnPageListItems(base);
      return;
    }
    if (onPageListDialog.mode === 'number') {
      base.push(0);
    } else if (onPageListDialog.mode === 'boolean') {
      base.push(false);
    } else {
      base.push('');
    }
    setOnPageListItems(base);
  };

  const moveOnPageListItem = (index: number, direction: -1 | 1) => {
    if (!onPageListDialog) {
      return;
    }
    const target = index + direction;
    if (target < 0 || target >= onPageListDialog.items.length) {
      return;
    }
    const next = [...onPageListDialog.items];
    const [current] = next.splice(index, 1);
    next.splice(target, 0, current);
    setOnPageListItems(next);
  };

  const removeOnPageListItem = (index: number) => {
    if (!onPageListDialog) {
      return;
    }
    const next = onPageListDialog.items.filter((_, entryIndex) => entryIndex !== index);
    setOnPageListItems(next);
  };

  const openOnPageListItemEditor = (index: number) => {
    if (!onPageListDialog) {
      return;
    }
    const value = onPageListDialog.items[index];
    if (onPageListDialog.mode === 'json') {
      return;
    }
    setOnPageListItemEditor({
      index,
      mode: onPageListDialog.mode,
      value:
        onPageListDialog.mode === 'object' && value && typeof value === 'object' && !Array.isArray(value)
          ? { ...(value as Record<string, unknown>) }
          : value,
      objectKeys: onPageListDialog.objectKeys,
      itemFields: onPageListDialog.itemFields
    });
  };

  const applyOnPageListItemEditor = () => {
    if (!onPageListDialog || !onPageListItemEditor) {
      return;
    }
    const next = [...onPageListDialog.items];
    next[onPageListItemEditor.index] = onPageListItemEditor.value;
    setOnPageListItems(next);
    setOnPageListItemEditor(null);
  };

  const setOnPageListObjectFieldValue = (key: string, nextValue: unknown) => {
    setOnPageListItemEditor((prev) => {
      if (!prev || !prev.value || typeof prev.value !== 'object' || Array.isArray(prev.value)) {
        return prev;
      }
      return {
        ...prev,
        value: {
          ...(prev.value as Record<string, unknown>),
          [key]: nextValue
        }
      };
    });
  };

  const applyOnPageListJsonDraft = () => {
    if (!onPageListDialog) {
      return;
    }
    try {
      const parsed = JSON.parse(onPageListDialog.draftJson) as unknown;
      if (!Array.isArray(parsed)) {
        setStatus('List dialog expects a JSON array.');
        return;
      }
      setOnPageListDialog(buildOnPageListDialogState(onPageListDialog.path, parsed));
      setOnPageListItemEditor(null);
      setStatus('');
    } catch {
      setStatus('Invalid list JSON. Keep a valid array structure.');
    }
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
        updateBuilder(composition.areas, next);
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
        detail: `AI provider might be disabled. ${formatErrorMessage(error)}`
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

  const toggleLeftPaneCollapsed = () => {
    setLeftPaneCollapsed((prev) => {
      const nextCollapsed = !prev;
      if (nextCollapsed) {
        const currentLeft = workspaceSizes[0] ?? 28;
        if (currentLeft > 10) {
          leftPaneExpandedSizeRef.current = currentLeft;
        }
        const collapsedSizes: number[] = [4, 96];
        setWorkspaceSizes(collapsedSizes);
        window.localStorage.setItem('content-pages.workspace.sizes', JSON.stringify(collapsedSizes));
      } else {
        const restoredLeft = Math.max(20, Math.min(45, leftPaneExpandedSizeRef.current || 28));
        const restoredSizes: number[] = [restoredLeft, 100 - restoredLeft];
        setWorkspaceSizes(restoredSizes);
        window.localStorage.setItem('content-pages.workspace.sizes', JSON.stringify(restoredSizes));
      }
      return nextCollapsed;
    });
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
      addChildRow: createChildFromRow,
      renameRow,
      openPermissions,
      moveRowUp,
      moveRowDown,
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
        <div className="pane cms-pane">
          <EmptyState
            title="No page selected"
            description="Pick a page from the tree or search results."
            actionLabel="Create Page"
            onAction={() => createPage().catch((e: unknown) => setStatus(formatErrorMessage(e)))}
          />
        </div>
      );
    }

    const editorPaneClassName = centerTabIndex === 1 ? 'pane cms-pane cms-pane-components-active' : 'pane cms-pane';

    return (
      <div className={editorPaneClassName}>
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
                    className={`form-row cms-field-row ${isSelected ? 'cms-selected-editor-row' : ''}`}
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
            <div className="components-tab-shell splitFill">
              <VisualBuilderWorkspace
                palette={availableComponentTypeOptions.map((entry) => ({
                  id: String(entry.value),
                  label: String(entry.label)
                }))}
                areaNames={configuredAreaNames}
                areas={builderAreas}
                componentMap={componentMap}
                selectedComponentId={selectedComponentId}
                selectedComponentSource={componentSourceResolver}
                componentTypeLabelResolver={(typeId) => resolvedComponentRegistryMap.get(typeId)?.label ?? null}
                onSelect={(id) => {
                  setSelectedComponentId(id);
                  setSelectedFieldPath(`components.${id}`);
                }}
                onAdd={(componentTypeId, areaName) => {
                  const targetArea =
                    areaName && configuredAreaNames.includes(areaName)
                      ? areaName
                      : configuredAreaNames[0] ?? 'main';
                  setNewComponentType(componentTypeId);
                  setNewComponentArea(targetArea);
                  const allowedByType = new Set(allowedComponentIds);
                  if (!allowedByType.has(componentTypeId)) {
                    setStatus(`Component type \"${componentTypeId}\" is not allowed for this content type.`);
                    return;
                  }
                  const area = targetArea;
                  const areaAllowed =
                    Array.isArray(areaRestrictions[area]) && areaRestrictions[area]!.length > 0
                      ? new Set(areaRestrictions[area]!)
                      : null;
                  if (areaAllowed && !areaAllowed.has(componentTypeId)) {
                    setStatus(`Component type \"${componentTypeId}\" is restricted in area \"${area}\".`);
                    return;
                  }
                  const entry = resolvedComponentRegistryMap.get(componentTypeId) ?? getComponentRegistryEntry(componentTypeId);
                  if (!entry) {
                    return;
                  }
                  const id = `${entry.id}_${Date.now()}`;
                  const nextMap = { ...componentMap, [id]: { id, type: entry.id, props: cloneProps(entry.defaultProps) } };
                  const nextAreas = placeComponentInArea(composition.areas, area, id);
                  updateBuilder(nextAreas, nextMap);
                  setSelectedComponentId(id);
                  setSelectedFieldPath(`components.${id}`);
                }}
                onMove={moveComponent}
                onMoveToArea={moveComponentToArea}
                onDuplicate={duplicateComponent}
                onDelete={removeComponent}
                rightPane={(
                  <div className="form-row builder-inspector">
                    <InspectorSection title="Selected Block" defaultCollapsed={!selectedComponent}>
                      <ComponentInspector
                        component={selectedComponent}
                        siteId={siteId}
                        registryEntry={
                          selectedComponent ? resolvedComponentRegistryMap.get(selectedComponent.type) ?? null : null
                        }
                        availableComponentRefs={Object.values(componentMap)
                          .filter((entry) => entry.id !== selectedComponentId)
                          .map((entry) => ({
                            id: entry.id,
                            label: `${resolvedComponentRegistryMap.get(entry.type)?.label ?? entry.type} (${entry.id})`,
                            type: entry.type
                          }))}
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
                          updateBuilder(composition.areas, nextMap);
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
            <div className="form-grid mt-3">
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
            <div className="inline-actions mb-2">
              <Button
                label="Use Selected As Draft"
                severity="secondary"
                onClick={() => rollbackToSelectedVersion().catch((e: unknown) => setStatus(formatErrorMessage(e)))}
                disabled={!selectedVersion}
              />
              <Button
                label="Publish Selected"
                severity="success"
                onClick={() => publishSelectedVersion().catch((e: unknown) => setStatus(formatErrorMessage(e)))}
                disabled={!selectedVersion || selectedVersion.state === 'ARCHIVED'}
              />
              <Button
                label="Create Variant From Selected"
                severity="secondary"
                onClick={() => createVariantFromSelectedVersion().catch((e: unknown) => setStatus(formatErrorMessage(e)))}
                disabled={!selectedVersion}
              />
              <Button
                label="Delete Selected"
                severity="danger"
                onClick={() => archiveSelectedVersion().catch((e: unknown) => setStatus(formatErrorMessage(e)))}
                disabled={!selectedVersion || selectedVersion.state === 'ARCHIVED'}
              />
            </div>
            <DataTable
              value={versions}
              size="small"
              className="cms-version-table"
              selectionMode="single"
              selection={selectedVersion}
              onSelectionChange={(event) => setSelectedVersionId((event.value as CVersion | null)?.id ?? null)}
              dataKey="id"
              rowClassName={(row: CVersion) => (selectedVersionId === row.id ? 'cms-version-row-selected' : '')}
            >
              <Column field="versionNumber" header="Version" body={(row: CVersion) => `v${row.versionNumber}`} />
              <Column field="state" header="State" />
              <Column field="createdAt" header="Created" />
              <Column field="createdBy" header="By" />
              <Column field="comment" header="Comment" />
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
          <TabPanel header="Permissions">
            <details className="cms-collapsible" open>
              <summary>ACL Matrix</summary>
              <div className="form-row">
                <label>
                  <Checkbox
                    checked={aclInheritFromParent}
                    onChange={(event) => setAclInheritFromParent(Boolean(event.checked))}
                  />{' '}
                  Inherit permissions from parent page
                </label>
                <small className="muted">Disable inheritance to override with local ACL entries.</small>
              </div>
              <div className="form-row">
                <label>Page ACL matrix (allow grants)</label>
                <div className="acl-matrix-wrap">
                  <table className="acl-matrix-table">
                    <thead>
                      <tr>
                        <th>Principal</th>
                        {PAGE_ACL_ACTIONS.map((action) => (
                          <th key={action}>{action}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {permissionPrincipalRows.map((principal) => (
                        <tr key={principal.key}>
                          <td>{principal.label}</td>
                          {PAGE_ACL_ACTIONS.map((action) => (
                            <td key={`${principal.key}-${action}`}>
                              <Checkbox
                                checked={hasAclAllow(principal.principalType, principal.principalId, action)}
                                onChange={(event) =>
                                  toggleAclAllow(
                                    principal.principalType,
                                    principal.principalId,
                                    action,
                                    Boolean(event.checked)
                                  )
                                }
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="inline-actions mt-2">
                  <Button label="Save Permissions" onClick={() => savePagePermissions().catch((e: unknown) => setStatus(formatErrorMessage(e)))} />
                </div>
              </div>
            </details>
            <details className="cms-collapsible" open>
              <summary>Visitor Targeting</summary>
              <div className="form-row">
                <label>
                  <Checkbox
                    checked={targetingInheritFromParent}
                    onChange={(event) => setTargetingInheritFromParent(Boolean(event.checked))}
                  />{' '}
                  Inherit targeting from parent page
                </label>
                <small className="muted">Disable inheritance to override allow/deny visitor groups locally.</small>
              </div>
              <div className="form-grid">
                <div className="form-row">
                  <label>Allow visitor groups</label>
                  <MultiSelect
                    value={targetingAllowGroupIds}
                    options={visitorGroups.map((entry) => ({ label: entry.name, value: entry.id }))}
                    onChange={(event) => setTargetingAllowGroupIds((event.value as number[]) ?? [])}
                    display="chip"
                    filter
                  />
                </div>
                <div className="form-row">
                  <label>Deny visitor groups</label>
                  <MultiSelect
                    value={targetingDenyGroupIds}
                    options={visitorGroups.map((entry) => ({ label: entry.name, value: entry.id }))}
                    onChange={(event) => setTargetingDenyGroupIds((event.value as number[]) ?? [])}
                    display="chip"
                    filter
                  />
                </div>
                <div className="form-row">
                  <label>When denied</label>
                  <Dropdown
                    value={targetingDenyBehavior}
                    options={[
                      { label: 'Return 404', value: 'NOT_FOUND' },
                      { label: 'Fallback page', value: 'FALLBACK' }
                    ]}
                    onChange={(event) =>
                      setTargetingDenyBehavior((event.value as 'NOT_FOUND' | 'FALLBACK') ?? 'NOT_FOUND')
                    }
                  />
                </div>
                <div className="form-row">
                  <label>Fallback page (content item id)</label>
                  <InputText
                    value={targetingFallbackContentItemId == null ? '' : String(targetingFallbackContentItemId)}
                    onChange={(event) => {
                      const value = event.target.value.trim();
                      setTargetingFallbackContentItemId(value ? Number(value) : null);
                    }}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="inline-actions mb-3">
                <Button label="Save Targeting" onClick={() => savePageTargeting().catch((e: unknown) => setStatus(formatErrorMessage(e)))} />
              </div>
              <div className="form-row">
                <label>Preview targeting with sample context JSON</label>
                <InputTextarea
                  rows={4}
                  value={targetingPreviewContextJson}
                  onChange={(event) => setTargetingPreviewContextJson(event.target.value)}
                />
                <div className="inline-actions">
                  <Button
                    label="Evaluate Targeting"
                    severity="secondary"
                    onClick={() => previewPageTargeting().catch((e: unknown) => setStatus(formatErrorMessage(e)))}
                  />
                </div>
                {targetingPreviewResult ? (
                  <small className="muted">
                    Allowed: {targetingPreviewResult.allowed ? 'yes' : 'no'} | Reason: {targetingPreviewResult.reason} |
                    Allow matches: {targetingPreviewResult.matchedAllowGroupIds.join(', ') || 'none'} | Deny matches:{' '}
                    {targetingPreviewResult.matchedDenyGroupIds.join(', ') || 'none'}
                  </small>
                ) : null}
              </div>
            </details>
          </TabPanel>
          <TabPanel header="Advanced">
            <div className="inline-actions">
              <Button
                label={rawEditable ? 'Lock JSON Editing' : 'Enable JSON Editing'}
                severity={rawEditable ? 'danger' : 'secondary'}
                onClick={() => setRawEditable((prev) => !prev)}
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
          {!canInlineEdit ? <small className="muted">Inline editing unavailable for published-only state</small> : null}
          {inlineSaveError ? <small className="error-text">Inline save failed: {inlineSaveError}</small> : null}
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
                  editTargetId: selectedEditTargetId ?? undefined,
                  componentId: selectedComponentId ?? undefined,
                  fieldPath: selectedFieldPath ?? undefined,
                  richTextFeatures: resolveRichTextFeatures(selectedFieldPath)
                });
                if (selectedComponentId) {
                  sendPreviewMessage({ type: 'CMS_SCROLL_TO', componentId: selectedComponentId });
                }
                sendPreviewMessage({ type: 'CMS_INLINE_MODE', enabled: canInlineEdit });
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
            <Button label="Create Page" onClick={() => createPage().catch((e: unknown) => setStatus(formatErrorMessage(e)))} />
            <Button label="Save Draft" severity="secondary" onClick={() => saveDraft().catch((e: unknown) => setStatus(formatErrorMessage(e)))} disabled={!draft || savingDraft} loading={savingDraft} />
            <Button label="Publish" severity="success" onClick={() => publish().catch((e: unknown) => setStatus(formatErrorMessage(e)))} disabled={!draft} />
          </>
        }
        modeToggle={
          <>
            <Button
              label={leftPaneCollapsed ? 'Expand tree' : 'Collapse tree'}
              size="small"
              text
              icon={leftPaneCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'}
              onClick={toggleLeftPaneCollapsed}
            />
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
        <Splitter
          className="splitFill cms-editor-workspace"
          onResizeEnd={(event) => {
            const next = (event.sizes as number[]) ?? [28, 72];
            setWorkspaceSizes(next);
            if (!leftPaneCollapsed && (next[0] ?? 0) > 10) {
              leftPaneExpandedSizeRef.current = next[0] ?? leftPaneExpandedSizeRef.current;
            }
            window.localStorage.setItem('content-pages.workspace.sizes', JSON.stringify(next));
          }}
        >
          <SplitterPanel size={workspaceSizes[0] ?? 28} minSize={leftPaneCollapsed ? 4 : 20}>
            <div className={`paneRoot paneScroll cms-pane cms-left-pane${leftPaneCollapsed ? ' cms-left-pane-collapsed' : ''}`}>
              <ContextMenu ref={treeContextMenuRef} model={treeContextMenuItems} />
              <div className="inline-actions justify-content-between mb-2">
                <strong>Page Tree</strong>
                <Button
                  label={leftPaneCollapsed ? '' : 'Collapse'}
                  text
                  size="small"
                  icon={leftPaneCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'}
                  aria-label={leftPaneCollapsed ? 'Expand tree' : 'Collapse tree'}
                  tooltip={leftPaneCollapsed ? 'Expand tree' : 'Collapse tree'}
                  tooltipOptions={{ position: 'right' }}
                  onClick={toggleLeftPaneCollapsed}
                />
              </div>
              {!leftPaneCollapsed ? (
                <>
                  <div className="form-row mb-3">
                    <label>Filter tree</label>
                    <InputText value={treeFilter} onChange={(event) => setTreeFilter(event.target.value)} placeholder="Slug, title, status" />
                  </div>
                  <TreeTable
                    className="content-pages-tree"
                    value={treeNodes}
                    expandedKeys={treeExpandedKeys}
                    onToggle={(event) => setTreeExpandedKeys((event.value as Record<string, boolean>) ?? {})}
                    selectionMode="single"
                    selectionKeys={selectedRouteKey ?? undefined}
                    contextMenuSelectionKey={treeContextSelectionKey ?? undefined}
                    onContextMenuSelectionChange={(event) =>
                      setTreeContextSelectionKey(typeof event.value === 'string' ? event.value : null)
                    }
                    onContextMenu={(event) => {
                      const row = event.node?.data as Partial<TreeRow> | undefined;
                      if (!row || typeof row.contentItemId !== 'number') {
                        return;
                      }
                      const normalizedRow: TreeRow = {
                        routeId: String(row.routeId ?? ''),
                        slug: String(row.slug ?? ''),
                        contentItemId: row.contentItemId,
                        title: String(row.title ?? `Item #${row.contentItemId}`),
                        status: (row.status as TreeRow['status']) ?? 'New',
                        parentId: typeof row.parentId === 'number' ? row.parentId : null,
                        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0
                      };
                      setTreeContextRow(normalizedRow);
                      setTreeContextSelectionKey(String(event.node?.key ?? ''));
                      treeContextMenuRef.current?.show(event.originalEvent);
                    }}
                    onSelectionChange={(event) => {
                      const key = String(event.value ?? '');
                      const itemId = Number(key);
                      if (itemId > 0) {
                        navigate(buildContentEditorUrl(itemId, marketCode, localeCode));
                      }
                    }}
                  >
                    <Column
                      field="title"
                      header="Page"
                      expander
                      body={(node: TreeNode) => {
                        const row = node.data as TreeRow;
                        return (
                          <div className="content-tree-node-row">
                            <span className="content-tree-node-title">{row.title}</span>
                            {row.slug ? <small className="muted content-tree-node-slug">/{row.slug}</small> : null}
                          </div>
                        );
                      }}
                    />
                    <Column
                      field="status"
                      header="Status"
                      body={(node: TreeNode) => {
                        const row = node.data as TreeRow;
                        return (
                          <Tag
                            value={row.status}
                            severity={row.status === 'Published' ? 'success' : row.status === 'Draft' ? 'warning' : 'secondary'}
                          />
                        );
                      }}
                      headerClassName="w-7rem"
                      bodyClassName="w-7rem"
                    />
                    <Column
                      header="Actions"
                      body={(node: TreeNode) => {
                        const row = node.data as TreeRow;
                        const rowCommandContext: ContentPageRowCommandContext = {
                          ...baseCommandContext,
                          row,
                          selectionIds: [row.contentItemId],
                          openRow,
                          addChildRow: createChildFromRow,
                          renameRow,
                          openPermissions,
                          moveRowUp,
                          moveRowDown,
                          duplicateRow: duplicateTreeRow,
                          exportRow,
                          deleteRow: deleteTreeRow
                        };
                        const rowCommands = commandRegistry.getCommands(rowCommandContext, 'rowOverflow');
                        return (
                          <div className="inline-actions content-tree-row-actions">
                            <Button
                              icon="pi pi-arrow-up"
                              text
                              rounded
                              size="small"
                              onClick={() => moveRowUp(row).catch((e: unknown) => setStatus(formatErrorMessage(e)))}
                            />
                            <Button
                              icon="pi pi-arrow-down"
                              text
                              rounded
                              size="small"
                              onClick={() => moveRowDown(row).catch((e: unknown) => setStatus(formatErrorMessage(e)))}
                            />
                            <CommandMenuButton
                              commands={rowCommands}
                              context={rowCommandContext}
                              buttonLabel=""
                              buttonIcon="pi pi-ellipsis-h"
                              text
                            />
                          </div>
                        );
                      }}
                      headerClassName="w-8rem"
                      bodyClassName="w-8rem"
                    />
                  </TreeTable>
                </>
              ) : (
                <div className="content-tree-collapsed-placeholder">
                  <Button
                    label=""
                    text
                    size="small"
                    icon="pi pi-angle-right"
                    aria-label="Expand tree"
                    tooltip="Expand tree"
                    tooltipOptions={{ position: 'right' }}
                    onClick={toggleLeftPaneCollapsed}
                  />
                </div>
              )}
            </div>
          </SplitterPanel>
          <SplitterPanel size={workspaceSizes[1] ?? 72} minSize={35}>
            {workspaceMode === 'split' ? (
              <Splitter className="splitFill cms-editor-detail-workspace">
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
      <Dialog header="Add Component" visible={showAddComponent} onHide={() => setShowAddComponent(false)} className="w-11 md:w-8 lg:w-6 xl:w-4">
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
            options={configuredAreaNames.map((areaName) => ({ label: areaName, value: areaName }))}
            onChange={(event) => setNewComponentArea(String(event.value))}
          />
        </div>
        <div className="inline-actions mt-3">
          <Button label="Cancel" text onClick={() => setShowAddComponent(false)} />
          <Button label="Add" onClick={addComponent} disabled={!newComponentType || availableComponentTypeOptions.length === 0} />
        </div>
      </Dialog>
      {onPageAssetPicker ? (
        <AssetPickerDialog
          visible={onPageAssetPicker.visible}
          token={token}
          siteId={siteId}
          selected={onPageAssetPicker.selected}
          multiple={onPageAssetPicker.multiple}
          onHide={() => setOnPageAssetPicker(null)}
          onApply={applyOnPageAssetSelection}
        />
      ) : null}
      {onPageLinkPicker ? (
        <LinkSelectorDialog
          visible={onPageLinkPicker.visible}
          token={token}
          siteId={siteId}
          value={onPageLinkPicker.value}
          onHide={() => setOnPageLinkPicker(null)}
          onApply={applyOnPageLinkSelection}
        />
      ) : null}
      <Dialog
        header="Select Form"
        visible={Boolean(onPageFormPicker?.visible)}
        onHide={() => setOnPageFormPicker(null)}
        className="w-11 md:w-8 lg:w-6 xl:w-5"
      >
        <div className="form-row">
          <label>Form</label>
          <Dropdown
            value={onPageFormPicker?.value ?? null}
            options={formOptions.map((entry) => ({ label: entry.name, value: entry.id }))}
            onChange={(event) => setOnPageFormPicker((prev) => (prev ? { ...prev, value: typeof event.value === 'number' ? event.value : null } : prev))}
            showClear
            placeholder="Select form"
          />
        </div>
        <div className="inline-actions justify-content-end mt-3">
          <Button label="Cancel" text onClick={() => setOnPageFormPicker(null)} />
          <Button
            label="Apply"
            onClick={() => applyOnPageFormSelection(onPageFormPicker?.value ?? null)}
            disabled={!onPageFormPicker}
          />
        </div>
      </Dialog>
      <Dialog
        header="Manage List Items"
        visible={Boolean(onPageListDialog?.visible)}
        onHide={() => {
          setOnPageListItemEditor(null);
          setOnPageListDialog(null);
        }}
        className="w-11 md:w-9 lg:w-7 xl:w-6"
      >
        <div className="form-row">
          <label>Field Path</label>
          <InputText value={onPageListDialog?.path ?? ''} readOnly />
        </div>
        {onPageListDialog?.mode === 'json' ? (
          <div className="form-row">
            <label>Array JSON</label>
            <InputTextarea
              rows={14}
              value={onPageListDialog?.draftJson ?? '[]'}
              onChange={(event) =>
                setOnPageListDialog((prev) =>
                  prev
                    ? {
                        ...prev,
                        draftJson: event.target.value
                      }
                    : prev
                )
              }
            />
            <small className="muted">List shape is mixed/unknown. Use JSON fallback.</small>
          </div>
        ) : (
          <>
            <div className="form-row">
              <label>Items</label>
              <DataTable
                value={(onPageListDialog?.items ?? []).map((item, index) => ({ index, value: item }))}
                size="small"
                className="cms-object-list-table"
              >
                {onPageListDialog?.mode === 'object' ? (
                  onPageListDialog.objectKeys.slice(0, 3).map((key) => (
                    <Column
                      key={`list-col-${key}`}
                      header={key}
                      body={(row: { value: unknown }) => {
                        const raw = row.value;
                        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
                          return '';
                        }
                        const value = (raw as Record<string, unknown>)[key];
                        return <span className="cms-cell-ellipsis" title={String(value ?? '')}>{String(value ?? '')}</span>;
                      }}
                    />
                  ))
                ) : (
                  <Column
                    header="Value"
                    body={(row: { value: unknown }) => {
                      const value = row.value;
                      return <span className="cms-cell-ellipsis" title={String(value ?? '')}>{String(value ?? '')}</span>;
                    }}
                  />
                )}
                <Column
                  header="Order"
                  style={{ width: '5.5rem' }}
                  body={(_row: { value: unknown }, options) => (
                    <div className="inline-actions">
                      <Button text icon="pi pi-angle-up" onClick={() => moveOnPageListItem(options.rowIndex, -1)} />
                      <Button text icon="pi pi-angle-down" onClick={() => moveOnPageListItem(options.rowIndex, 1)} />
                    </div>
                  )}
                />
                <Column
                  header="Actions"
                  style={{ width: '8rem' }}
                  body={(_row: { value: unknown }, options) => (
                    <div className="inline-actions">
                      <Button text label="Edit" onClick={() => openOnPageListItemEditor(options.rowIndex)} />
                      <Button text severity="danger" label="Remove" onClick={() => removeOnPageListItem(options.rowIndex)} />
                    </div>
                  )}
                />
              </DataTable>
            </div>
            <div className="form-row">
              <label>Raw JSON (fallback)</label>
              <InputTextarea
                rows={8}
                value={onPageListDialog?.draftJson ?? '[]'}
                onChange={(event) =>
                  setOnPageListDialog((prev) =>
                    prev
                      ? {
                          ...prev,
                          draftJson: event.target.value
                        }
                      : prev
                  )
                }
              />
              <div className="inline-actions justify-content-end">
                <Button label="Apply JSON to Table" text onClick={applyOnPageListJsonDraft} />
              </div>
            </div>
          </>
        )}
        <div className="inline-actions justify-content-end mt-3">
          <Button
            label="Cancel"
            text
            onClick={() => {
              setOnPageListItemEditor(null);
              setOnPageListDialog(null);
            }}
          />
          <Button
            label="Add Item"
            severity="secondary"
            onClick={addOnPageListItem}
          />
          <Button label="Apply" onClick={applyOnPageListSelection} disabled={!onPageListDialog} />
        </div>
      </Dialog>
      <Dialog
        header="Edit List Item"
        visible={Boolean(onPageListItemEditor)}
        onHide={() => setOnPageListItemEditor(null)}
        className="w-11 md:w-8 lg:w-6"
      >
        {onPageListItemEditor?.mode === 'object' ? (
          <div className="form-row">
            {onPageListItemEditor.objectKeys.map((key) => {
              const value =
                onPageListItemEditor.value && typeof onPageListItemEditor.value === 'object' && !Array.isArray(onPageListItemEditor.value)
                  ? (onPageListItemEditor.value as Record<string, unknown>)[key]
                  : '';
              const field = onPageListItemEditor.itemFields.find((entry) => entry.key === key);
              const isLinkField = field?.type === 'contentLink' || looksLikeContentLinkValue(value);
              return (
                <div className="form-row" key={`list-item-${key}`}>
                  <label>{field?.label ?? key}</label>
                  {field?.type === 'boolean' ? (
                    <Checkbox
                      checked={Boolean(value)}
                      onChange={(event) =>
                        setOnPageListObjectFieldValue(key, Boolean(event.checked))
                      }
                    />
                  ) : field?.type === 'multiline' ? (
                    <InputTextarea
                      rows={4}
                      value={String(value ?? '')}
                      onChange={(event) =>
                        setOnPageListObjectFieldValue(key, event.target.value)
                      }
                    />
                  ) : field?.type === 'number' ? (
                    <InputText
                      value={String(value ?? '')}
                      onChange={(event) =>
                        setOnPageListObjectFieldValue(key, Number.isFinite(Number(event.target.value)) ? Number(event.target.value) : 0)
                      }
                    />
                  ) : field?.type === 'stringList' ? (
                    <InputTextarea
                      rows={4}
                      value={Array.isArray(value) ? value.map((entry) => String(entry)).join('\n') : ''}
                      onChange={(event) =>
                        setOnPageListItemEditor((prev) => {
                          if (!prev || !prev.value || typeof prev.value !== 'object' || Array.isArray(prev.value)) {
                            return prev;
                          }
                          const lines = event.target.value
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean);
                          return { ...prev, value: { ...(prev.value as Record<string, unknown>), [key]: lines } };
                        })
                      }
                    />
                  ) : isLinkField ? (
                    <div className="form-grid">
                      {(() => {
                        const rawLink =
                          value && typeof value === 'object' && !Array.isArray(value)
                            ? (value as Partial<ContentLinkValue>)
                            : {};
                        const linkKind = rawLink.kind === 'external' ? 'external' : 'internal';
                        const target = rawLink.target === '_blank' ? '_blank' : '_self';
                        return (
                          <>
                            <Dropdown
                              value={linkKind}
                              options={[
                                { label: 'Internal', value: 'internal' },
                                { label: 'External', value: 'external' }
                              ]}
                              onChange={(event) => {
                                const nextKind = event.value === 'external' ? 'external' : 'internal';
                                const nextLink: ContentLinkValue = {
                                  kind: nextKind,
                                  ...(typeof rawLink.url === 'string' ? { url: rawLink.url } : {}),
                                  ...(typeof rawLink.text === 'string' ? { text: rawLink.text } : {}),
                                  target
                                };
                                if (nextKind === 'internal') {
                                  if (typeof rawLink.contentItemId === 'number') {
                                    nextLink.contentItemId = rawLink.contentItemId;
                                  }
                                  if (typeof rawLink.routeSlug === 'string') {
                                    nextLink.routeSlug = rawLink.routeSlug;
                                  }
                                  if (typeof rawLink.anchor === 'string') {
                                    nextLink.anchor = rawLink.anchor;
                                  }
                                }
                                setOnPageListObjectFieldValue(key, nextLink);
                              }}
                            />
                            <InputText
                              value={String(rawLink.text ?? '')}
                              placeholder="Link text"
                              onChange={(event) =>
                                setOnPageListObjectFieldValue(key, {
                                  kind: linkKind,
                                  ...(typeof rawLink.url === 'string' ? { url: rawLink.url } : {}),
                                  ...(event.target.value.trim() ? { text: event.target.value } : {}),
                                  target,
                                  ...(typeof rawLink.contentItemId === 'number' ? { contentItemId: rawLink.contentItemId } : {}),
                                  ...(typeof rawLink.routeSlug === 'string' ? { routeSlug: rawLink.routeSlug } : {}),
                                  ...(typeof rawLink.anchor === 'string' ? { anchor: rawLink.anchor } : {})
                                } as ContentLinkValue)
                              }
                            />
                            <InputText
                              value={String(rawLink.url ?? '')}
                              placeholder={linkKind === 'external' ? 'https://example.com' : '/path#anchor'}
                              onChange={(event) =>
                                setOnPageListObjectFieldValue(key, {
                                  kind: linkKind,
                                  ...(event.target.value.trim() ? { url: event.target.value } : {}),
                                  ...(typeof rawLink.text === 'string' ? { text: rawLink.text } : {}),
                                  target,
                                  ...(typeof rawLink.contentItemId === 'number' ? { contentItemId: rawLink.contentItemId } : {}),
                                  ...(typeof rawLink.routeSlug === 'string' ? { routeSlug: rawLink.routeSlug } : {}),
                                  ...(typeof rawLink.anchor === 'string' ? { anchor: rawLink.anchor } : {})
                                } as ContentLinkValue)
                              }
                            />
                            <Dropdown
                              value={target}
                              options={[
                                { label: 'Same tab', value: '_self' },
                                { label: 'New tab', value: '_blank' }
                              ]}
                              onChange={(event) =>
                                setOnPageListObjectFieldValue(key, {
                                  kind: linkKind,
                                  ...(typeof rawLink.url === 'string' ? { url: rawLink.url } : {}),
                                  ...(typeof rawLink.text === 'string' ? { text: rawLink.text } : {}),
                                  target: event.value === '_blank' ? '_blank' : '_self',
                                  ...(typeof rawLink.contentItemId === 'number' ? { contentItemId: rawLink.contentItemId } : {}),
                                  ...(typeof rawLink.routeSlug === 'string' ? { routeSlug: rawLink.routeSlug } : {}),
                                  ...(typeof rawLink.anchor === 'string' ? { anchor: rawLink.anchor } : {})
                                } as ContentLinkValue)
                              }
                            />
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    value && typeof value === 'object' ? (
                      <InputTextarea
                        rows={4}
                        value={JSON.stringify(value, null, 2)}
                        onChange={(event) => {
                          try {
                            setOnPageListObjectFieldValue(key, JSON.parse(event.target.value));
                          } catch {
                            // keep current value while typing invalid JSON
                          }
                        }}
                      />
                    ) : (
                      <InputText
                        value={String(value ?? '')}
                        onChange={(event) => setOnPageListObjectFieldValue(key, event.target.value)}
                      />
                    )
                  )}
                </div>
              );
            })}
          </div>
        ) : onPageListItemEditor?.mode === 'boolean' ? (
          <div className="form-row">
            <label>Value</label>
            <Checkbox
              checked={Boolean(onPageListItemEditor.value)}
              onChange={(event) =>
                setOnPageListItemEditor((prev) => (prev ? { ...prev, value: Boolean(event.checked) } : prev))
              }
            />
          </div>
        ) : (
          <div className="form-row">
            <label>Value</label>
            <InputText
              value={String(onPageListItemEditor?.value ?? '')}
              onChange={(event) =>
                setOnPageListItemEditor((prev) => {
                  if (!prev) {
                    return prev;
                  }
                  if (prev.mode === 'number') {
                    const parsed = Number(event.target.value);
                    return { ...prev, value: Number.isFinite(parsed) ? parsed : 0 };
                  }
                  return { ...prev, value: event.target.value };
                })
              }
            />
          </div>
        )}
        <div className="inline-actions justify-content-end mt-3">
          <Button label="Cancel" text onClick={() => setOnPageListItemEditor(null)} />
          <Button label="Apply" onClick={applyOnPageListItemEditor} />
        </div>
      </Dialog>
      <Dialog header="Ask AI" visible={aiDialogOpen} onHide={() => setAiDialogOpen(false)} className="w-11 lg:w-9 xl:w-8">
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
        <div className="inline-actions mt-3">
          <Button label="Generate Suggestion" onClick={generateAiSuggestion} />
          <Button label="Apply Manually" severity="success" onClick={applyAiSuggestion} disabled={!aiSuggestion} />
          {aiMode === 'translate' ? <Button label="Run AI Translate Version" severity="secondary" onClick={() => runAiTranslateVersion().catch((e) => setStatus(formatErrorMessage(e)))} disabled={!draft} /> : null}
        </div>
        <div className="form-row mt-3">
          <label>Suggestion</label>
          <InputTextarea rows={8} value={aiSuggestion} onChange={(event) => setAiSuggestion(event.target.value)} />
        </div>
      </Dialog>
      {status ? <div className="status-panel" role="alert">{status}</div> : null}
    </WorkspacePage>
  );
}

