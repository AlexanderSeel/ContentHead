import { useEffect, useMemo, useState } from 'react';
import { Button, DialogPanel, TextInput } from '../../ui/atoms';
import { Tree } from '../../ui/molecules';
import type { TreeNode } from '../../ui/molecules';

import { formatErrorMessage } from '../../lib/graphqlErrorUi';
import { getApiBaseUrl } from '../../lib/api';
import { AssetImageEditorDialog } from '../../features/assets/AssetImageEditorDialog';
import { createAdminSdk } from '../../lib/sdk';

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
  const [loadError, setLoadError] = useState('');
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [draftSelection, setDraftSelection] = useState<number[]>(selected);
  const [focusedAsset, setFocusedAsset] = useState<AssetRow | null>(null);
  const [imageEditorAssetId, setImageEditorAssetId] = useState<number | null>(null);

  const refresh = async () => {
    const [assetRes, folderRes] = await Promise.allSettled([
      sdk.listAssets({ siteId, limit: 200, offset: 0, search: search || null, folderId: activeFolderId, tags: null }),
      sdk.listAssetFolders({ siteId })
    ]);

    const errors: string[] = [];
    if (assetRes.status === 'fulfilled') {
      setAssets((assetRes.value.listAssets?.items ?? []) as AssetRow[]);
    } else {
      setAssets([]);
      errors.push(`Assets: ${formatErrorMessage(assetRes.reason)}`);
    }

    if (folderRes.status === 'fulfilled') {
      setFolders((folderRes.value.listAssetFolders ?? []) as FolderRow[]);
    } else {
      setFolders([]);
      errors.push(`Folders: ${formatErrorMessage(folderRes.reason)}`);
    }

    setLoadError(errors.join(' '));
  };

  useEffect(() => {
    if (!visible) {
      return;
    }
    setDraftSelection(selected);
    refresh().catch((error: unknown) => setLoadError(`Unable to load assets. ${formatErrorMessage(error)}`));
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

  const toggleAsset = (asset: AssetRow) => {
    const isSelected = draftSelection.includes(asset.id);
    if (!multiple) {
      setDraftSelection([asset.id]);
      setFocusedAsset(asset);
      return;
    }
    setDraftSelection(isSelected ? draftSelection.filter((id) => id !== asset.id) : [...draftSelection, asset.id]);
    if (!isSelected) {
      setFocusedAsset(asset);
    }
  };

  return (
    <DialogPanel header="Asset Picker" visible={visible} onHide={onHide} className="w-11">
      <div className="grid">
        <div className="content-card p-2 col-12 xl:col-2">
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

        <div className="content-card p-3 col-12 xl:col-6">
          <div className="form-row mb-2">
            <label>Search assets</label>
            <TextInput value={search} onChange={(next) => setSearch(next)} placeholder="filename or title" />
          </div>
          <div className="p-datatable p-datatable-sm p-component" style={{ overflowY: 'auto', maxHeight: '400px' }}>
            <table role="table" style={{ width: '100%' }}>
              <thead className="p-datatable-thead">
                <tr>
                  <th><span className="p-column-title">Preview</span></th>
                  <th><span className="p-column-title">Name</span></th>
                  <th><span className="p-column-title">Title</span></th>
                </tr>
              </thead>
              <tbody className="p-datatable-tbody">
                {assets.length === 0 ? (
                  <tr><td colSpan={3} className="p-datatable-emptymessage">No assets found.</td></tr>
                ) : null}
                {assets.map((asset) => {
                  const isSelected = draftSelection.includes(asset.id);
                  return (
                    <tr
                      key={asset.id}
                      className={['p-selectable-row', isSelected ? 'p-highlight' : ''].filter(Boolean).join(' ')}
                      onClick={() => toggleAsset(asset)}
                    >
                      <td>
                        <img
                          src={`${apiBase}/assets/${asset.id}/rendition/thumb`}
                          alt={asset.altText ?? asset.title ?? asset.originalName}
                          className="w-4rem h-3rem border-round-sm object-cover"
                        />
                      </td>
                      <td>{asset.originalName}</td>
                      <td>{asset.title}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {loadError ? <small className="error-text">{loadError}</small> : null}
        </div>

        <div className="content-card p-3 col-12 xl:col-4">
          {focusedAsset ? (
            <div className="form-row">
              <img
                src={`${apiBase}/assets/${focusedAsset.id}`}
                alt={focusedAsset.altText ?? focusedAsset.title ?? focusedAsset.originalName}
                className="w-full border-round object-cover"
              />
              <div><strong>{focusedAsset.originalName}</strong></div>
              <small>{focusedAsset.title || 'No title'}</small>
              <small>{focusedAsset.altText || 'No alt text'}</small>
              <small>{focusedAsset.description || 'No description'}</small>
              <Button text label="Edit image" onClick={() => setImageEditorAssetId(focusedAsset.id)} />
            </div>
          ) : (
            <p className="muted">Select an asset for preview.</p>
          )}
        </div>
      </div>
      <div className="inline-actions mt-4 justify-content-end">
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
      <AssetImageEditorDialog
        visible={imageEditorAssetId != null}
        assetId={imageEditorAssetId}
        token={token}
        siteId={siteId}
        onHide={() => setImageEditorAssetId(null)}
        onSaved={() => refresh().catch(() => undefined)}
      />
    </DialogPanel>
  );
}
