import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ContextMenu } from 'primereact/contextmenu';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Chips } from 'primereact/chips';
import { Splitter, SplitterPanel } from 'primereact/splitter';

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
import { ForbiddenState, WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage, WorkspaceToolbar } from '../../ui/molecules';

type AssetRow = {
  id: number;
  originalName: string;
  title?: string | null;
  altText?: string | null;
  description?: string | null;
  tagsJson?: string | null;
};

type AssetsHeaderContext = CommandContext & {
  assets: AssetRow[];
  refresh: () => Promise<void>;
};

type AssetsRowContext = CommandContext & {
  row: AssetRow;
  editRow: (row: AssetRow) => void;
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
    id: 'assets.row.delete',
    label: 'Delete',
    icon: 'pi pi-trash',
    danger: true,
    requiresConfirm: true,
    confirmText: 'Delete this asset?',
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

  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [selected, setSelected] = useState<AssetRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [forbiddenReason, setForbiddenReason] = useState('');
  const [contextAsset, setContextAsset] = useState<AssetRow | null>(null);
  const contextMenuRef = useRef<ContextMenu>(null);

  const handleError = (error: unknown) => {
    const message = formatErrorMessage(error);
    if (isForbiddenError(error)) {
      setForbiddenReason(message);
      return;
    }
    setStatus(message);
  };

  const refresh = async () => {
    const res = await sdk.listAssets({ siteId, limit: 200, offset: 0, search: search || null, folderId: null, tags: null });
    const rows = (res.listAssets?.items ?? []) as AssetRow[];
    setAssets(rows);
    setSelected((prev) => rows.find((entry) => entry.id === prev?.id) ?? rows[0] ?? null);
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

  const apiBase = getApiBaseUrl();

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
    copyAssetUrl: async (entry) => {
      await navigator.clipboard.writeText(`${apiBase}/assets/${entry.id}`);
      toast({ severity: 'success', summary: 'Asset URL copied' });
    },
    deleteRow: async (entry) => {
      await sdk.deleteAsset({ id: entry.id });
      await refresh();
      if (selected?.id === entry.id) {
        setSelected(null);
      }
      toast({ severity: 'success', summary: `Asset #${entry.id} deleted` });
    }
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
              <label className="p-button p-component p-button-sm">
            <input type="file" multiple className="hidden" onChange={(event) => uploadFiles(event.target.files).catch(() => undefined)} />
            <span className="p-button-label p-c">Upload</span>
          </label>
        )}
        overflow={<CommandMenuButton commands={headerOverflowCommands} context={headerContext} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />}
      />
      <WorkspaceToolbar>
        <InputText value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assets" />
      </WorkspaceToolbar>
      <WorkspaceBody>
        <Splitter className="splitFill">
          <SplitterPanel size={62} minSize={35}>
            <div className="paneRoot">
              <div className="paneScroll">
                <ContextMenu ref={contextMenuRef} model={contextItems} />
                <DataTable
                  value={assets}
                  size="small"
                  selectionMode="single"
                  selection={selected}
                  onSelectionChange={(event) => setSelected((event.value as AssetRow) ?? null)}
                  onContextMenu={(event) => {
                    setContextAsset(event.data as AssetRow);
                    window.requestAnimationFrame(() => contextMenuRef.current?.show(event.originalEvent));
                  }}
                >
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
                  <Column
                    header="Actions"
                    body={(row: AssetRow) => <CommandMenuButton commands={commandRegistry.getCommands(rowContextFor(row), 'rowOverflow')} context={rowContextFor(row)} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />}
                  />
                </DataTable>
              </div>
            </div>
          </SplitterPanel>
          <SplitterPanel size={38} minSize={25}>
            <div className="paneRoot">
              <div className="paneScroll">
                {!selected ? (
                  <p className="muted">Select an asset to edit metadata.</p>
                ) : (
                  <div className="form-row">
                    <img
                      src={`${apiBase}/assets/${selected.id}`}
                      alt={selected.altText ?? selected.title ?? selected.originalName}
                      className="w-full border-round object-cover"
                    />
                    <label>Title</label>
                    <InputText value={selected.title ?? ''} onChange={(event) => setSelected({ ...selected, title: event.target.value })} />
                    <label>Alt Text</label>
                    <InputText value={selected.altText ?? ''} onChange={(event) => setSelected({ ...selected, altText: event.target.value })} />
                    <label>Description</label>
                    <InputTextarea rows={4} value={selected.description ?? ''} onChange={(event) => setSelected({ ...selected, description: event.target.value })} />
                    <label>Tags</label>
                    <Chips value={parseTags(selected.tagsJson)} onChange={(event) => setSelected({ ...selected, tagsJson: JSON.stringify(event.value ?? []) })} separator="," />
                    <div className="inline-actions">
                      <Button label="Save metadata" onClick={() => saveMetadata().catch(() => undefined)} loading={saving} />
                      <Button
                        label="Delete"
                        severity="danger"
                        onClick={() =>
                          sdk
                            .deleteAsset({ id: selected.id })
                            .then(() => refresh())
                            .catch(handleError)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SplitterPanel>
        </Splitter>
      </WorkspaceBody>
          {uploading ? <div className="status-panel">Uploading files...</div> : null}
          {status ? <div className="status-panel" role="alert">{status}</div> : null}
        </>
      )}
    </WorkspacePage>
  );
}

