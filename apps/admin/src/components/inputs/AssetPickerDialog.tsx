import { useEffect, useMemo, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Tree } from 'primereact/tree';
import type { TreeNode } from 'primereact/treenode';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

import { createAdminSdk } from '../../lib/sdk';
import { getApiBaseUrl } from '../../lib/api';

type AssetRow = {
  id: number;
  siteId: number;
  filename: string;
  originalName: string;
  title?: string | null;
  altText?: string | null;
  description?: string | null;
  folderId?: number | null;
};

type FolderRow = {
  id: number;
  parentId?: number | null;
  name: string;
};

function buildTree(folders: FolderRow[]): TreeNode[] {
  const byParent = folders.reduce<Record<string, FolderRow[]>>((acc, folder) => {
    const key = String(folder.parentId ?? 0);
    acc[key] = [...(acc[key] ?? []), folder];
    return acc;
  }, {});

  const toNodes = (parentId: number | null): TreeNode[] => {
    const key = String(parentId ?? 0);
    return (byParent[key] ?? [])
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((folder) => ({
        key: String(folder.id),
        label: folder.name,
        data: folder,
        children: toNodes(folder.id)
      }));
  };

  return [{ key: 'all', label: 'All assets', data: null, children: toNodes(null) }];
}

export function AssetPickerDialog({
  visible,
  token,
  siteId,
  multiple,
  selected,
  onHide,
  onApply
}: {
  visible: boolean;
  token: string | null;
  siteId: number;
  multiple?: boolean;
  selected: number[];
  onHide: () => void;
  onApply: (assetIds: number[]) => void;
}) {
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const [search, setSearch] = useState('');
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [draftSelection, setDraftSelection] = useState<number[]>(selected);
  const [focusedAsset, setFocusedAsset] = useState<AssetRow | null>(null);

  const refresh = async () => {
    const [assetRes, folderRes] = await Promise.all([
      sdk.listAssets({ siteId, limit: 200, offset: 0, search: search || null, folderId: activeFolderId, tags: null }),
      sdk.listAssetFolders({ siteId })
    ]);
    setAssets((assetRes.listAssets?.items ?? []) as AssetRow[]);
    setFolders((folderRes.listAssetFolders ?? []) as FolderRow[]);
  };

  useEffect(() => {
    if (!visible) {
      return;
    }
    setDraftSelection(selected);
    refresh().catch(() => {
      setAssets([]);
      setFolders([]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, siteId, activeFolderId, search]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setFocusedAsset((prev) => prev ?? assets[0] ?? null);
  }, [assets, visible]);

  const treeNodes = useMemo(() => buildTree(folders), [folders]);
  const apiBase = getApiBaseUrl();

  return (
    <Dialog header="Asset Picker" visible={visible} onHide={onHide} style={{ width: 'min(92rem, 98vw)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '16rem 1fr 20rem', gap: '1rem', minHeight: '28rem' }}>
        <div className="content-card" style={{ padding: '0.5rem' }}>
          <Tree
            value={treeNodes}
            selectionMode="single"
            selectionKeys={activeFolderId == null ? 'all' : String(activeFolderId)}
            onSelectionChange={(event) => {
              const value = event.value as string | null;
              if (!value || value === 'all') {
                setActiveFolderId(null);
                return;
              }
              setActiveFolderId(Number(value));
            }}
          />
        </div>

        <div className="content-card" style={{ padding: '0.75rem' }}>
          <div className="form-row" style={{ marginBottom: '0.5rem' }}>
            <label>Search assets</label>
            <InputText value={search} onChange={(event) => setSearch(event.target.value)} placeholder="filename or title" />
          </div>
          <DataTable
            value={assets}
            size="small"
            selectionMode="multiple"
            selection={assets.filter((entry) => draftSelection.includes(entry.id))}
            onSelectionChange={(event: { value: AssetRow[] }) => {
              const rows = event.value ?? [];
              if (!multiple && rows.length > 1) {
                const first = rows[rows.length - 1];
                if (!first) {
                  setDraftSelection([]);
                  return;
                }
                setDraftSelection([first.id]);
                setFocusedAsset(first);
                return;
              }
              setDraftSelection(rows.map((entry) => entry.id));
              setFocusedAsset(rows[0] ?? null);
            }}
            onRowClick={(event) => setFocusedAsset(event.data as AssetRow)}
          >
            <Column
              header="Preview"
              body={(row: AssetRow) => (
                <img
                  src={`${apiBase}/assets/${row.id}/rendition/thumb`}
                  alt={row.altText ?? row.title ?? row.originalName}
                  style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6 }}
                />
              )}
            />
            <Column field="originalName" header="Name" />
            <Column field="title" header="Title" />
          </DataTable>
        </div>

        <div className="content-card" style={{ padding: '0.75rem' }}>
          {focusedAsset ? (
            <div className="form-row">
              <img
                src={`${apiBase}/assets/${focusedAsset.id}`}
                alt={focusedAsset.altText ?? focusedAsset.title ?? focusedAsset.originalName}
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
              />
              <div><strong>{focusedAsset.originalName}</strong></div>
              <small>{focusedAsset.title || 'No title'}</small>
              <small>{focusedAsset.altText || 'No alt text'}</small>
              <small>{focusedAsset.description || 'No description'}</small>
            </div>
          ) : (
            <p className="muted">Select an asset for preview.</p>
          )}
        </div>
      </div>
      <div className="inline-actions" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
        <Button label="Cancel" text onClick={onHide} />
        <Button
          label={multiple ? 'Add selected' : 'Select'}
          onClick={() => {
            onApply(draftSelection);
            onHide();
          }}
          disabled={draftSelection.length === 0}
        />
      </div>
    </Dialog>
  );
}
