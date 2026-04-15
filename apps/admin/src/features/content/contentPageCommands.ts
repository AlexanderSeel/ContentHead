import { commandRegistry } from '../../ui/commands/registry';
import { routeStartsWith } from '../../ui/commands/utils';
import type { Command } from '../../ui/commands/types';
import type {
  ContentPageHeaderCommandContext,
  ContentPageRowCommandContext,
  ContentPageTreeCommandContext,
  TreeRow
} from './contentPageTypes';

// ── Header overflow commands ──────────────────────────────────────────────────

export const contentPageHeaderOverflowCommands: Command<ContentPageHeaderCommandContext>[] = [
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

// ── Row overflow commands ─────────────────────────────────────────────────────

export const contentPageRowOverflowCommands: Command<ContentPageRowCommandContext>[] = [
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
    label: 'Archive / Restore',
    icon: 'pi pi-trash',
    danger: true,
    requiresConfirm: true,
    confirmText: 'Toggle archive state for this page?',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.deleteRow(ctx.row)
  },
  {
    id: 'content-pages.row.delete-final',
    label: 'Delete Permanently',
    icon: 'pi pi-times',
    group: 'Danger',
    danger: true,
    requiresConfirm: true,
    confirmText: 'Permanently delete this archived page and its versions/routes? This cannot be undone.',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages') && ctx.row.archived && !ctx.row.hasChildren,
    run: (ctx) => ctx.deleteRowFinal(ctx.row)
  }
];

// ── Tree context commands ─────────────────────────────────────────────────────

export const contentPageTreeContextCommands: Command<ContentPageTreeCommandContext>[] = [
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
    label: 'Archive / Restore',
    icon: 'pi pi-trash',
    danger: true,
    requiresConfirm: true,
    confirmText: 'Toggle archive state for this page?',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
    run: (ctx) => ctx.deleteRow(ctx.treeNode)
  },
  {
    id: 'content-pages.tree.delete-final',
    label: 'Delete Permanently',
    icon: 'pi pi-times',
    group: 'Danger',
    danger: true,
    requiresConfirm: true,
    confirmText: 'Permanently delete this archived page and its versions/routes? This cannot be undone.',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/pages') && ctx.treeNode.archived && !ctx.treeNode.hasChildren,
    run: (ctx) => ctx.deleteRowFinal(ctx.treeNode)
  }
];

// ── Registration (runs once on module load) ───────────────────────────────────

commandRegistry.registerCoreCommands([{ placement: 'overflow', commands: contentPageHeaderOverflowCommands }]);
commandRegistry.registerCoreCommands([{ placement: 'rowOverflow', commands: contentPageRowOverflowCommands }]);
commandRegistry.registerCoreCommands([{ placement: 'treeNodeContext', commands: contentPageTreeContextCommands }]);
