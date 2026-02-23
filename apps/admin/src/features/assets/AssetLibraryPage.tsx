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

type AssetRow = {
  id: number;
  originalName: string;
  title?: string | null;
  altText?: string | null;
  description?: string | null;
  tagsJson?: string | null;
};

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
  const { token } = useAuth();
  const { siteId } = useAdminContext();
  const sdk = useMemo(() => createAdminSdk(token), [token]);

  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [selected, setSelected] = useState<AssetRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const refresh = async () => {
    const res = await sdk.listAssets({ siteId, limit: 200, offset: 0, search: search || null, folderId: null, tags: null });
    const rows = (res.listAssets ?? []) as AssetRow[];
    setAssets(rows);
    setSelected((prev) => rows.find((entry) => entry.id === prev?.id) ?? rows[0] ?? null);
  };

  useEffect(() => {
    refresh().catch((error: unknown) => setStatus(String(error)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, search]);

  const uploadFiles = async (fileList: FileList | null) => {
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
      setStatus(String(error));
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
      setStatus(String(error));
    } finally {
      setSaving(false);
    }
  };

  const apiBase = import.meta.env.VITE_API_URL?.replace('/graphql', '') ?? 'http://localhost:4000';

  return (
    <div className="pageRoot">
      <PageHeader
        title="Asset Library"
        subtitle="Upload and manage images with metadata and renditions"
        helpTopicKey="content_pages"
        actions={
          <div className="inline-actions">
            <label className="p-button p-component p-button-sm">
              <input type="file" multiple style={{ display: 'none' }} onChange={(event) => uploadFiles(event.target.files).catch(() => undefined)} />
              <span className="p-button-label p-c">Upload</span>
            </label>
            <InputText value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assets" />
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
        <section className="content-card">
          <DataTable
            value={assets}
            size="small"
            selectionMode="single"
            selection={selected}
            onSelectionChange={(event) => setSelected((event.value as AssetRow) ?? null)}
          >
            <Column
              header="Preview"
              body={(row: AssetRow) => (
                <img
                  src={`${apiBase}/assets/${row.id}/rendition/thumb`}
                  alt={row.altText ?? row.title ?? row.originalName}
                  style={{ width: 64, height: 42, objectFit: 'cover', borderRadius: 6 }}
                />
              )}
            />
            <Column field="originalName" header="Filename" />
            <Column field="title" header="Title" />
          </DataTable>
        </section>

        <section className="content-card">
          {!selected ? (
            <p className="muted">Select an asset to edit metadata.</p>
          ) : (
            <div className="form-row">
              <img
                src={`${apiBase}/assets/${selected.id}`}
                alt={selected.altText ?? selected.title ?? selected.originalName}
                style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8 }}
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
                      .catch((error: unknown) => setStatus(String(error)))
                  }
                />
              </div>
            </div>
          )}
        </section>
      </div>
      {uploading ? <div className="status-panel">Uploading files...</div> : null}
      {status ? <div className="status-panel"><pre>{status}</pre></div> : null}
    </div>
  );
}
