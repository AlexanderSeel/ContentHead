import type { ToastMessage } from 'primereact/toast';

export type CommandPlacement =
  | 'primary'
  | 'overflow'
  | 'context'
  | 'pageHeaderOverflow'
  | 'rowOverflow'
  | 'treeNodeContext'
  | 'inspectorPanel'
  | 'toolbarSecondary';

export type CommandContext = {
  route: string;
  siteId?: number | null;
  selectedSite?: { id: number; name: string } | null;
  marketCode?: string | null;
  localeCode?: string | null;
  selectedContentItemId?: number | null;
  selectedVersionId?: number | null;
  selectionIds?: Array<number | string>;
  selectionRows?: unknown[];
  row?: unknown;
  treeNode?: unknown;
  userRoles?: string[];
  userPermissions?: string[];
  featureFlags?: Record<string, boolean>;
  toast?: (message: ToastMessage, featureTag?: string) => void;
  confirm?: (options: { header: string; message: string; acceptLabel?: string; rejectLabel?: string }) => Promise<boolean>;
  [key: string]: unknown;
};

export type Command<TContext extends CommandContext = CommandContext> = {
  id: string;
  label: string;
  icon?: string;
  group?: string;
  danger?: boolean;
  requiresConfirm?: boolean;
  confirmText?: string;
  tooltip?: string;
  visible?: (ctx: TContext) => boolean;
  enabled?: (ctx: TContext) => boolean;
  run: (ctx: TContext) => Promise<void> | void;
};

export type CommandRegistration<TContext extends CommandContext = CommandContext> = {
  placement: CommandPlacement;
  commands: Command<TContext>[];
};
