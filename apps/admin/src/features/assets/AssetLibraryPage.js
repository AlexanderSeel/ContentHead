import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Chips } from 'primereact/chips';
import { PageHeader } from '../../components/common/PageHeader';
import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
function parseTags(value) {
    if (!value) {
        return [];
    }
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string') : [];
    }
    catch {
        return [];
    }
}
export function AssetLibraryPage() {
    const { token } = useAuth();
    const { siteId } = useAdminContext();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const [search, setSearch] = useState('');
    const [assets, setAssets] = useState([]);
    const [selected, setSelected] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState('');
    const refresh = async () => {
        const res = await sdk.listAssets({ siteId, limit: 200, offset: 0, search: search || null, folderId: null, tags: null });
        const rows = (res.listAssets ?? []);
        setAssets(rows);
        setSelected((prev) => rows.find((entry) => entry.id === prev?.id) ?? rows[0] ?? null);
    };
    useEffect(() => {
        refresh().catch((error) => setStatus(String(error)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteId, search]);
    const uploadFiles = async (fileList) => {
        if (!fileList || fileList.length === 0) {
            return;
        }
        setUploading(true);
        setStatus('');
        try {
            const endpoint = `${import.meta.env.VITE_API_URL?.replace('/graphql', '') ?? 'http://localhost:4000'}/api/assets/upload?siteId=${siteId}`;
            for (const file of Array.from(fileList)) {
                const form = new FormData();
                form.append('file', file);
                const requestInit = {
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
        }
        catch (error) {
            setStatus(String(error));
        }
        finally {
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
        }
        catch (error) {
            setStatus(String(error));
        }
        finally {
            setSaving(false);
        }
    };
    const apiBase = import.meta.env.VITE_API_URL?.replace('/graphql', '') ?? 'http://localhost:4000';
    return (_jsxs("div", { className: "pageRoot", children: [_jsx(PageHeader, { title: "Asset Library", subtitle: "Upload and manage images with metadata and renditions", helpTopicKey: "content_pages", actions: _jsxs("div", { className: "inline-actions", children: [_jsxs("label", { className: "p-button p-component p-button-sm", children: [_jsx("input", { type: "file", multiple: true, style: { display: 'none' }, onChange: (event) => uploadFiles(event.target.files).catch(() => undefined) }), _jsx("span", { className: "p-button-label p-c", children: "Upload" })] }), _jsx(InputText, { value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Search assets" })] }) }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }, children: [_jsx("section", { className: "content-card", children: _jsxs(DataTable, { value: assets, size: "small", selectionMode: "single", selection: selected, onSelectionChange: (event) => setSelected(event.value ?? null), children: [_jsx(Column, { header: "Preview", body: (row) => (_jsx("img", { src: `${apiBase}/assets/${row.id}/rendition/thumb`, alt: row.altText ?? row.title ?? row.originalName, style: { width: 64, height: 42, objectFit: 'cover', borderRadius: 6 } })) }), _jsx(Column, { field: "originalName", header: "Filename" }), _jsx(Column, { field: "title", header: "Title" })] }) }), _jsx("section", { className: "content-card", children: !selected ? (_jsx("p", { className: "muted", children: "Select an asset to edit metadata." })) : (_jsxs("div", { className: "form-row", children: [_jsx("img", { src: `${apiBase}/assets/${selected.id}`, alt: selected.altText ?? selected.title ?? selected.originalName, style: { width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8 } }), _jsx("label", { children: "Title" }), _jsx(InputText, { value: selected.title ?? '', onChange: (event) => setSelected({ ...selected, title: event.target.value }) }), _jsx("label", { children: "Alt Text" }), _jsx(InputText, { value: selected.altText ?? '', onChange: (event) => setSelected({ ...selected, altText: event.target.value }) }), _jsx("label", { children: "Description" }), _jsx(InputTextarea, { rows: 4, value: selected.description ?? '', onChange: (event) => setSelected({ ...selected, description: event.target.value }) }), _jsx("label", { children: "Tags" }), _jsx(Chips, { value: parseTags(selected.tagsJson), onChange: (event) => setSelected({ ...selected, tagsJson: JSON.stringify(event.value ?? []) }), separator: "," }), _jsxs("div", { className: "inline-actions", children: [_jsx(Button, { label: "Save metadata", onClick: () => saveMetadata().catch(() => undefined), loading: saving }), _jsx(Button, { label: "Delete", severity: "danger", onClick: () => sdk
                                                .deleteAsset({ id: selected.id })
                                                .then(() => refresh())
                                                .catch((error) => setStatus(String(error))) })] })] })) })] }), uploading ? _jsx("div", { className: "status-panel", children: "Uploading files..." }) : null, status ? _jsx("div", { className: "status-panel", children: _jsx("pre", { children: status }) }) : null] }));
}
