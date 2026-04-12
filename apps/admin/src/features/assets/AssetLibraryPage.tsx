import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Column } from 'primereact/column';

import { Button, Chips, TextInput, Textarea } from '../../ui/atoms';

import { createAdminSdk } from '../../lib/sdk';
import { getApiBaseUrl } from '../../lib/api';
import { formatErrorMessage, isForbiddenError } from '../../lib/graphqlErrorUi';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { useUi } from '../../app/UiContext';
import { CommandMenuButton } from '../../ui/commands/CommandMenuButton';
import { commandRegistry } from '../../ui/commands/registry';
import { toTieredMenuItems } from '../../ui/commands/menuModel';
import type { Command, CommandContext } from '../../ui/commands/types';
import { downloadJson, routeStartsWith } from '../../ui/commands/utils';
import { ContextMenuHandle, ContextMenuPanel, ForbiddenState, WorkspaceActionBar, WorkspaceBody, WorkspaceGrid, WorkspaceHeader, WorkspacePage, WorkspacePaneLayout, WorkspaceToolbar } from '../../ui/molecules';
import { AssetImageEditorDialog } from './AssetImageEditorDialog';

type AssetRow = {
  id: number;
  originalName: string;
  filename?: string;
  title?: string | null;
  altText?: string | null;
  description?: string | null;
  tagsJson?: string | null;
};

type AssetUsageReference = {
  contentItemId: number;
  contentTypeName: string;
  versionId: number;
  versionState: string;
  routeSlug?: string | null;
  marketCode?: string | null;
  localeCode?: string | null;
  jsonArea: string;
  path: string;
};

type AssetUsageResult = {
  assetId: number;
  references: AssetUsageReference[];
};

type AssetsHeaderContext = CommandContext & {
  assets: AssetRow[];
  refresh: () => Promise<void>;
};

type AssetsRowContext = CommandContext & {
  row: AssetRow;
  editRow: (row: AssetRow) => void;
  editImage: (row: AssetRow) => void;
  copyAssetUrl: (row: AssetRow) => Promise<void>;
  deleteRow: (row: AssetRow) => Promise<void>;
};

const assetsHeaderCommands: Command<AssetsHeaderContext>[] = [
  {
    id: 'assets.export.json',
    label: 'Export assets JSON',
    icon: 'pi pi-download',
    group: 'Export',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/assets'),
    enabled: (ctx) => ctx.assets.length > 0,
    run: (ctx) => {
      downloadJson(`assets-site-${ctx.siteId ?? 'unknown'}.json`, ctx.assets);
      ctx.toast?.({ severity: 'success', summary: 'Assets exported' });
    }
  },
  {
    id: 'assets.refresh',
    label: 'Refresh',
    icon: 'pi pi-refresh',
    group: 'Advanced',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/assets'),
    run: (ctx) => ctx.refresh()
  }
];

const assetsRowCommands: Command<AssetsRowContext>[] = [
  {
    id: 'assets.row.open',
    label: 'Open',
    icon: 'pi pi-folder-open',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/assets'),
    run: (ctx) => ctx.editRow(ctx.row)
  },
  {
    id: 'assets.row.copy-url',
    label: 'Copy asset URL',
    icon: 'pi pi-link',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/assets'),
    run: (ctx) => ctx.copyAssetUrl(ctx.row)
  },
  {
    id: 'assets.row.edit-image',
    label: 'Edit image',
    icon: 'pi pi-image',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/assets'),
    run: (ctx) => ctx.editImage(ctx.row)
  },
  {
    id: 'assets.row.delete',
    label: 'Delete',
    icon: 'pi pi-trash',
    danger: true,
    visible: (ctx) => routeStartsWith(ctx.route, '/content/assets'),
    run: (ctx) => ctx.deleteRow(ctx.row)
  }
];

commandRegistry.registerCoreCommands([{ placement: 'overflow', commands: assetsHeaderCommands }]);
commandRegistry.registerCoreCommands([{ placement: 'rowOverflow', commands: assetsRowCommands }]);

function parseTags(value?: string | null): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

export function AssetLibraryPage() {
  const location = useLocation();
  const { token } = useAuth();
  const { siteId } = useAdminContext();
  const { toast, confirm } = useUi();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const apiBase = getApiBaseUrl();

  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [selected, setSelected] = useState<AssetRow | null>(null);
  const [selectedRows, setSelectedRows] = useState<AssetRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [forbiddenReason, setForbiddenReason] = useState('');
  const [contextAsset, setContextAsset] = useState<AssetRow | null>(null);
  const [imageEditorAssetId, setImageEditorAssetId] = useState<number | null>(null);
  const contextMenuRef = useRef<ContextMenuHandle>(null);

  const handleError = (error: unknown) => {
    const message = formatErrorMessage(error);
    if (isForbiddenError(error)) {
      setForbiddenReason(message);
      return;
    }
    setStatus(message);
  };

  const requestGraphql = async <T,>(query: string, variables: Record<string, unknown>): Promise<T> => {
    const response = await fetch(`${apiBase}/graphql`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ query, variables })
    });
    if (!response.ok) {
      throw new Error(`GraphQL request failed (${response.status})`);
    }
    const payload = (await response.json()) as { data?: T; errors?: Array<{ message?: string | null }> };
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((entry) => entry.message ?? 'Unknown GraphQL error').join('; '));
    }
    if (!payload.data) {
      throw new Error('GraphQL response missing data');
    }
    return payload.data;
  };

  const loadAssetUsage = async (assetIds: number[]): Promise<AssetUsageResult[]> => {
    const normalizedIds = Array.from(new Set(assetIds.filter((entry) => Number.isFinite(entry) && entry > 0)));
    if (normalizedIds.length === 0) {
      return [];
    }
    const data = await requestGraphql<{ assetUsage?: AssetUsageResult[] | null }>(
      `
query AssetUsage($siteId: Int!, $assetIds: [Int!]!, $limitPerAsset: Int) {
  assetUsage(siteId: $siteId, assetIds: $assetIds, limitPerAsset: $limitPerAsset) {
    assetId
    references {
      contentItemId
      contentTypeName
      versionId
      versionState
      routeSlug
      marketCode
      localeCode
      jsonArea
      path
    }
  }
}
`,
      {
        siteId,
        assetIds: normalizedIds,
        limitPerAsset: 24
      }
    );
    return data.assetUsage ?? [];
  };

  const buildUsageWarning = (usage: AssetUsageResult[]): string | null => {
    const impacted = usage.filter((entry) => (entry.references?.length ?? 0) > 0);
    if (impacted.length === 0) {
      return null;
    }
    const totalRefs = impacted.reduce((sum, entry) => sum + (entry.references?.length ?? 0), 0);
    const lines: string[] = [
      `Warning: deleting these assets will break ${totalRefs} reference(s) across ${impacted.length} asset(s).`
    ];
    const previewLines = impacted
      .flatMap((entry) =>
        (entry.references ?? []).map((reference) => {
          const route = reference.routeSlug?.trim() ? `/${reference.routeSlug}` : `item #${reference.contentItemId}`;
          const marketLocale =
            reference.marketCode && reference.localeCode ? ` ${reference.marketCode}/${reference.localeCode}` : '';
          return `- asset #${entry.assetId} -> ${route}${marketLocale} (${reference.contentTypeName}, v${reference.versionId} ${reference.versionState}, ${reference.jsonArea}.${reference.path})`;
        })
      )
      .slice(0, 8);
    lines.push(...previewLines);
    if (totalRefs > previewLines.length) {
      lines.push(`- ...and ${totalRefs - previewLines.length} more reference(s).`);
    }
    return lines.join('\n');
  };

  const refresh = async () => {
    const res = await sdk.listAssets({ siteId, limit: 200, offset: 0, search: search || null, folderId: null, tags: null });
    const rows = (res.listAssets?.items ?? []) as AssetRow[];
    setAssets(rows);
    setSelected((prev) => rows.find((entry) => entry.id === prev?.id) ?? rows[0] ?? null);
    setSelectedRows((prev) => {
      const prevIds = new Set(prev.map((entry) => entry.id));
      return rows.filter((entry) => prevIds.has(entry.id));
    });
    setStatus('');
  };

  useEffect(() => {
    refresh().catch(handleError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, search]);

  const uploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }
    setUploading(true);
    setStatus('');
    try {
      const endpoint = `${getApiBaseUrl()}/api/assets/upload?siteId=${siteId}`;
      for (const file of Array.from(fileList)) {
        const form = new FormData();
        form.append('file', file);
        const requestInit: RequestInit = {
          method: 'POST',
          body: form
        };
        if (token) {
          requestInit.headers = { authorization: `Bearer ${token}` };
        }
        const response = await fetch(endpoint, {
          ...requestInit
        });
        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }
      }
      await refresh();
    } catch (error) {
      handleError(error);
    } finally {
      setUploading(false);
    }
  };

  const saveMetadata = async () => {
    if (!selected) {
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      await sdk.updateAssetMetadata({
        id: selected.id,
        title: selected.title ?? null,
        altText: selected.altText ?? null,
        description: selected.description ?? null,
        tags: parseTags(selected.tagsJson),
        folderId: null,
        by: 'admin'
      });
      await refresh();
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  const deleteAssetsWithWarning = async (assetIds: number[], scope: 'single' | 'selected' | 'all') => {
    const ids = Array.from(new Set(assetIds.filter((entry) => Number.isFinite(entry) && entry > 0)));
    if (ids.length === 0) {
      return;
    }
    setDeleting(true);
    setStatus('');
    try {
      const usage = await loadAssetUsage(ids);
      const warning = buildUsageWarning(usage);
      const header = scope === 'all' ? 'Clear DAM Assets' : ids.length === 1 ? 'Delete Asset' : 'Delete Selected Assets';
      const messageParts = [
        scope === 'all'
          ? `Delete all ${ids.length} assets from DAM for site ${siteId}?`
          : `Delete ${ids.length} asset${ids.length === 1 ? '' : 's'}?`
      ];
      if (warning) {
        messageParts.push('');
        messageParts.push(warning);
      }
      const confirmed = await confirm({
        header,
        message: messageParts.join('\n'),
        acceptLabel: scope === 'all' ? 'Clear DAM' : 'Delete',
        rejectLabel: 'Cancel'
      });
      if (!confirmed) {
        return;
      }

      let deleted = 0;
      const failures: string[] = [];
      for (const id of ids) {
        try {
          await sdk.deleteAsset({ id });
          deleted += 1;
        } catch (error) {
          failures.push(`#${id}: ${formatErrorMessage(error)}`);
        }
      }
      await refresh();
      setSelectedRows((prev) => prev.filter((entry) => !ids.includes(entry.id)));
      if (selected && ids.includes(selected.id)) {
        setSelected(null);
      }
      if (deleted > 0) {
        toast({
          severity: 'success',
          summary: scope === 'all' ? 'DAM cleared' : 'Assets deleted',
          detail: `Deleted ${deleted} asset${deleted === 1 ? '' : 's'}.`
        });
      }
      if (failures.length > 0) {
        setStatus(`Failed to delete ${failures.length} asset(s): ${failures.slice(0, 2).join('; ')}`);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setDeleting(false);
    }
  };

  const baseContext: CommandContext = {
    route: location.pathname,
    siteId,
    selectedContentItemId: null,
    toast,
    confirm
  };
  const headerContext: AssetsHeaderContext = {
    ...baseContext,
    assets,
    refresh
  };
  const headerOverflowCommands = commandRegistry.getCommands(headerContext, 'overflow');

  const rowContextFor = (row: AssetRow): AssetsRowContext => ({
    ...baseContext,
    row,
    editRow: setSelected,
    editImage: (entry) => setImageEditorAssetId(entry.id),
    copyAssetUrl: async (entry) => {
      await navigator.clipboard.writeText(`${apiBase}/assets/${entry.id}`);
      toast({ severity: 'success', summary: 'Asset URL copied' });
    },
    deleteRow: async (entry) => deleteAssetsWithWarning([entry.id], 'single')
  });
  const contextItems = contextAsset ? toTieredMenuItems(commandRegistry.getCommands(rowContextFor(contextAsset), 'rowOverflow'), rowContextFor(contextAsset)) : [];

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Asset Library"
        subtitle="Upload and manage images with metadata and renditions."
        helpTopicKey="dam"
      />
      {forbiddenReason ? (
        <WorkspaceBody>
          <ForbiddenState title="Asset library unavailable" reason={forbiddenReason} />
        </WorkspaceBody>
      ) : (
        <>
          <WorkspaceActionBar
            primary={(
              <>
                <label className="p-button p-component p-button-sm">
                  <input type="file" multiple className="hidden" onChange={(event) => uploadFiles(event.target.files).catch(() => undefined)} />
                  <span className="p-button-label p-c">Upload</span>
                </label>
                <Button
                  size="small"
                  severity="danger"
                  outlined
                  label={`Delete Selected (${selectedRows.length})`}
                  onClick={() => deleteAssetsWithWarning(selectedRows.map((entry) => entry.id), 'selected').catch(() => undefined)}
                  disabled={selectedRows.length === 0 || deleting || uploading}
                  loading={deleting}
                />
                <Button
                  size="small"
                  severity="danger"
                  label="Clear DAM"
                  onClick={() => deleteAssetsWithWarning(assets.map((entry) => entry.id), 'all').catch(() => undefined)}
                  disabled={assets.length === 0 || deleting || uploading}
                  loading={deleting}
                />
              </>
            )}
        overflow={<CommandMenuButton commands={headerOverflowCommands} context={headerContext} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />}
      />
      <WorkspaceToolbar>
        <TextInput value={search} onChange={(next) => setSearch(next)} placeholder="Search assets" />
      </WorkspaceToolbar>
      <WorkspaceBody>
        <WorkspacePaneLayout
          workspaceId="content-assets"
          className="asset-library-splitter"
          left={{
            id: 'asset-list',
            label: 'List',
            defaultSize: 48,
            minSize: 30,
            collapsible: true,
            content: (
              <>
                <ContextMenuPanel ref={contextMenuRef} model={contextItems} />
                <WorkspaceGrid
                  className="asset-library-table"
                  value={assets}
                  tableProps={{
                    scrollable: true,
                    scrollHeight: 'flex',
                    selectionMode: 'multiple',
                    selection: selectedRows,
                    metaKeySelection: false,
                    rowClassName: (row: AssetRow) => (row.id === selected?.id ? 'asset-library-row-selected' : ''),
                    onSelectionChange: (event: any) => {
                      const rows = Array.isArray(event.value) ? (event.value as AssetRow[]) : [];
                      setSelectedRows(rows);
                      if (!selected || !rows.some((entry) => entry.id === selected.id)) {
                        setSelected(rows[0] ?? null);
                      }
                    },
                    onRowClick: (event: any) => setSelected((event.data as AssetRow) ?? null),
                    onContextMenu: (event: any) => {
                      setContextAsset(event.data as AssetRow);
                      setSelected((event.data as AssetRow) ?? null);
                      window.requestAnimationFrame(() => contextMenuRef.current?.show(event.originalEvent));
                    }
                  }}
                  rowOverflow={{
                    commandsForRow: (row) => commandRegistry.getCommands(rowContextFor(row), 'rowOverflow'),
                    contextForRow: rowContextFor
                  }}
                  bulkActions={[
                    {
                      label: `Delete selected (${selectedRows.length})`,
                      icon: 'pi pi-trash',
                      danger: true,
                      disabled: selectedRows.length === 0 || deleting,
                      run: () => deleteAssetsWithWarning(selectedRows.map((entry) => entry.id), 'selected')
                    },
                    {
                      label: `Clear DAM (${assets.length})`,
                      icon: 'pi pi-times-circle',
                      danger: true,
                      disabled: assets.length === 0 || deleting,
                      run: () => deleteAssetsWithWarning(assets.map((entry) => entry.id), 'all')
                    }
                  ]}
                >
                  <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} bodyStyle={{ width: '3rem' }} />
                  <Column
                    header="Preview"
                    body={(row: AssetRow) => (
                      <img
                        src={`${apiBase}/assets/${row.id}/rendition/thumb`}
                        alt={row.altText ?? row.title ?? row.originalName}
                        className="w-4rem h-3rem border-round-sm object-cover"
                      />
                    )}
                  />
                  <Column field="originalName" header="Filename" />
                  <Column field="title" header="Title" />
                </WorkspaceGrid>
              </>
            )
          }}
          center={{
            id: 'asset-preview',
            label: 'Preview',
            defaultSize: 27,
            minSize: 20,
            collapsible: true,
            className: 'asset-library-preview-pane',
            content: !selected ? (
              <p className="muted asset-library-empty-state">Select an asset to preview.</p>
            ) : (
              <div className="asset-library-preview-stage">
                <img
                  src={`${apiBase}/assets/${selected.id}`}
                  alt={selected.altText ?? selected.title ?? selected.originalName}
                  className="asset-library-preview-image"
                />
              </div>
            )
          }}
          right={{
            id: 'asset-properties',
            label: 'Properties',
            defaultSize: 25,
            minSize: 20,
            collapsible: true,
            content: !selected ? (
              <p className="muted asset-library-empty-state">Select an asset to edit properties.</p>
            ) : (
              <div className="form-row asset-library-meta-form">
                <label>Title</label>
                <TextInput value={selected.title ?? ''} onChange={(next) => setSelected({ ...selected, title: next })} />
                <label>Alt Text</label>
                <TextInput value={selected.altText ?? ''} onChange={(next) => setSelected({ ...selected, altText: next })} />
                <label>Description</label>
                <Textarea rows={4} value={selected.description ?? ''} onChange={(next) => setSelected({ ...selected, description: next })} />
                <label>Tags</label>
                <Chips value={parseTags(selected.tagsJson)} onChange={(event) => setSelected({ ...selected, tagsJson: JSON.stringify(event.value ?? []) })} separator="," />
                <div className="inline-actions">
                  <Button label="Edit image" text onClick={() => setImageEditorAssetId(selected.id)} />
                  <Button label="Save metadata" onClick={() => saveMetadata().catch(() => undefined)} loading={saving} />
                  <Button
                    label="Delete"
                    severity="danger"
                    onClick={() => deleteAssetsWithWarning([selected.id], 'single').catch(() => undefined)}
                    loading={deleting}
                    disabled={deleting || uploading}
                  />
                </div>
              </div>
            )
          }}
        />
      </WorkspaceBody>
          {uploading ? <div className="status-panel">Uploading files...</div> : null}
          {deleting ? <div className="status-panel">Deleting assets...</div> : null}
          {status ? <div className="status-panel" role="alert">{status}</div> : null}
          <AssetImageEditorDialog
            visible={imageEditorAssetId != null}
            assetId={imageEditorAssetId}
            token={token}
            siteId={siteId}
            onHide={() => setImageEditorAssetId(null)}
            onSaved={() => refresh().catch(() => undefined)}
          />
        </>
      )}
    </WorkspacePage>
  );
}

