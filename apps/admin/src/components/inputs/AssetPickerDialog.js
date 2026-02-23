import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Tree } from 'primereact/tree';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { createAdminSdk } from '../../lib/sdk';
function buildTree(folders) {
    const byParent = folders.reduce((acc, folder) => {
        const key = String(folder.parentId ?? 0);
        acc[key] = [...(acc[key] ?? []), folder];
        return acc;
    }, {});
    const toNodes = (parentId) => {
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
export function AssetPickerDialog({ visible, token, siteId, multiple, selected, onHide, onApply }) {
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const [search, setSearch] = useState('');
    const [folders, setFolders] = useState([]);
    const [assets, setAssets] = useState([]);
    const [activeFolderId, setActiveFolderId] = useState(null);
    const [draftSelection, setDraftSelection] = useState(selected);
    const [focusedAsset, setFocusedAsset] = useState(null);
    const refresh = async () => {
        const [assetRes, folderRes] = await Promise.all([
            sdk.listAssets({ siteId, limit: 200, offset: 0, search: search || null, folderId: activeFolderId, tags: null }),
            sdk.listAssetFolders({ siteId })
        ]);
        setAssets((assetRes.listAssets ?? []));
        setFolders((folderRes.listAssetFolders ?? []));
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
    return (_jsxs(Dialog, { header: "Asset Picker", visible: visible, onHide: onHide, style: { width: 'min(92rem, 98vw)' }, children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '16rem 1fr 20rem', gap: '1rem', minHeight: '28rem' }, children: [_jsx("div", { className: "content-card", style: { padding: '0.5rem' }, children: _jsx(Tree, { value: treeNodes, selectionMode: "single", selectionKeys: activeFolderId == null ? 'all' : String(activeFolderId), onSelectionChange: (event) => {
                                const value = event.value;
                                if (!value || value === 'all') {
                                    setActiveFolderId(null);
                                    return;
                                }
                                setActiveFolderId(Number(value));
                            } }) }), _jsxs("div", { className: "content-card", style: { padding: '0.75rem' }, children: [_jsxs("div", { className: "form-row", style: { marginBottom: '0.5rem' }, children: [_jsx("label", { children: "Search assets" }), _jsx(InputText, { value: search, onChange: (event) => setSearch(event.target.value), placeholder: "filename or title" })] }), _jsxs(DataTable, { value: assets, size: "small", selectionMode: "multiple", selection: assets.filter((entry) => draftSelection.includes(entry.id)), onSelectionChange: (event) => {
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
                                }, onRowClick: (event) => setFocusedAsset(event.data), children: [_jsx(Column, { header: "Preview", body: (row) => (_jsx("img", { src: `${import.meta.env.VITE_API_URL?.replace('/graphql', '') ?? 'http://localhost:4000'}/assets/${row.id}/rendition/thumb`, alt: row.altText ?? row.title ?? row.originalName, style: { width: 56, height: 40, objectFit: 'cover', borderRadius: 6 } })) }), _jsx(Column, { field: "originalName", header: "Name" }), _jsx(Column, { field: "title", header: "Title" })] })] }), _jsx("div", { className: "content-card", style: { padding: '0.75rem' }, children: focusedAsset ? (_jsxs("div", { className: "form-row", children: [_jsx("img", { src: `${import.meta.env.VITE_API_URL?.replace('/graphql', '') ?? 'http://localhost:4000'}/assets/${focusedAsset.id}`, alt: focusedAsset.altText ?? focusedAsset.title ?? focusedAsset.originalName, style: { width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 } }), _jsx("div", { children: _jsx("strong", { children: focusedAsset.originalName }) }), _jsx("small", { children: focusedAsset.title || 'No title' }), _jsx("small", { children: focusedAsset.altText || 'No alt text' }), _jsx("small", { children: focusedAsset.description || 'No description' })] })) : (_jsx("p", { className: "muted", children: "Select an asset for preview." })) })] }), _jsxs("div", { className: "inline-actions", style: { marginTop: '1rem', justifyContent: 'flex-end' }, children: [_jsx(Button, { label: "Cancel", text: true, onClick: onHide }), _jsx(Button, { label: multiple ? 'Add selected' : 'Select', onClick: () => {
                            onApply(draftSelection);
                            onHide();
                        }, disabled: draftSelection.length === 0 })] })] }));
}
