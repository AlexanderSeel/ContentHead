import type { CmsActionId } from './previewBridge';
import type { CommandContext } from '../../ui/commands/types';
import type { ComponentUiField } from './components/componentRegistry';

// ── Data shapes ──────────────────────────────────────────────────────────────

export type CType = {
  id: number;
  name: string;
  fieldsJson: string;
  allowedComponentsJson?: string | null;
  componentAreaRestrictionsJson?: string | null;
};

export type Template = { id: number; name: string; compositionJson: string; componentsJson: string };

export type CItem = {
  id: number;
  contentTypeId: number;
  parentId?: number | null;
  sortOrder?: number | null;
  archived?: boolean | null;
  currentDraftVersionId?: number | null;
  currentPublishedVersionId?: number | null;
};

export type CVersion = {
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

export type CRoute = { id: number; contentItemId: number; marketCode: string; localeCode: string; slug: string; isCanonical: boolean };

export type PageTreeNodeDto = {
  id: number;
  title: string;
  slug: string;
  status: 'Draft' | 'Published' | 'New';
  parentId?: number | null;
  sortOrder: number;
  route?: CRoute | null;
  children: PageTreeNodeDto[];
};

export type VariantSet = { id: number; contentItemId: number; marketCode: string; localeCode: string; fallbackVariantSetId?: number | null; active: boolean };
export type Variant = { id: number; variantSetId: number; key: string; priority: number; ruleJson: string; state: string; trafficAllocation?: number | null; contentVersionId: number };
export type CompositionArea = { name: string; components: string[] };
export type ComponentRecord = { id: string; type: string; props: Record<string, unknown> };
export type ComponentInstance = { instanceId: string; componentTypeId: string; area: string; sortOrder: number; props: Record<string, unknown> };

export type ComponentTypeSettingRow = {
  componentTypeId?: string | null;
  enabled?: boolean | null;
  label?: string | null;
  groupName?: string | null;
  schemaJson?: string | null;
  uiMetaJson?: string | null;
  defaultPropsJson?: string | null;
};

export type AclEntry = {
  principalType: 'ROLE' | 'USER' | 'GROUP';
  principalId: string;
  permissionKey: string;
  effect: 'ALLOW' | 'DENY';
};

export type PrincipalGroup = { id: number; name: string; description?: string | null };
export type VisitorGroup = { id: number; siteId: number; name: string; ruleJson: string };
export type InternalRole = { id: number; name: string };
export type InternalUser = { id: number; username: string; displayName?: string | null };
export type FormListRow = { id: number; name: string };

// ── On-page editing ──────────────────────────────────────────────────────────

export type OnPageTargetType = 'text' | 'richtext' | 'asset' | 'link' | 'form' | 'component' | 'unknown';
export type OnPageActionItem = { id: CmsActionId; label: string; primary?: boolean };
export type OnPageTarget = {
  contentItemId: number;
  versionId: number;
  editTargetId?: string | null;
  editKind?: 'text' | 'richtext' | 'link' | 'asset' | 'list' | null;
  editMeta?: string | null;
  componentId: string | null;
  fieldPath: string | null;
  targetType: OnPageTargetType;
};

export type OnPageListMode = 'object' | 'string' | 'number' | 'boolean' | 'json';

export type OnPageListDialogState = {
  visible: boolean;
  path: string;
  items: unknown[];
  draftJson: string;
  mode: OnPageListMode;
  objectKeys: string[];
  itemFields: ComponentUiField[];
};

export type OnPageListItemEditorState = {
  index: number;
  mode: Exclude<OnPageListMode, 'json'>;
  value: unknown;
  objectKeys: string[];
  itemFields: ComponentUiField[];
};

// ── Workspace / UI modes ─────────────────────────────────────────────────────

export type AiMode = 'copy' | 'props' | 'translate';
export type WorkspaceMode = 'split' | 'properties' | 'onpage';
export type PreviewDevice = 'web' | 'tablet' | 'mobile';

export type TreeRow = {
  routeId: string;
  slug: string;
  contentItemId: number;
  title: string;
  status: 'Draft' | 'Published' | 'New';
  archived: boolean;
  hasChildren: boolean;
  parentId: number | null;
  sortOrder: number;
  depth: number;
};

// ── Command contexts ─────────────────────────────────────────────────────────

export type ContentPageHeaderCommandContext = CommandContext & {
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

export type ContentPageRowCommandContext = CommandContext & {
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
  deleteRowFinal: (row: TreeRow) => Promise<void>;
};

export type ContentPageTreeCommandContext = ContentPageRowCommandContext & {
  treeNode: TreeRow;
  openWebsiteFromRow: (row: TreeRow) => void;
  issueTokenForRow: (row: TreeRow) => Promise<void>;
  copyPreviewUrlForRow: (row: TreeRow) => Promise<void>;
};

// ── Constants ────────────────────────────────────────────────────────────────

export const CONTENT_PAGES_SHOW_ARCHIVED_KEY = 'content-pages-show-archived';

export const PAGE_ACL_ACTIONS = [
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
