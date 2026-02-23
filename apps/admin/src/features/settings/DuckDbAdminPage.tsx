import { useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { FileUpload } from 'primereact/fileupload';
import { InputTextarea } from 'primereact/inputtextarea';

import { useAdminContext } from '../../app/AdminContext';
import { useAuth } from '../../app/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { createAdminSdk } from '../../lib/sdk';

type ExportedItem = {
  contentTypeName: string;
  fieldsJson: string;
  compositionJson: string;
  componentsJson: string;
  metadataJson: string;
  routes: Array<{ marketCode: string; localeCode: string; slug: string; isCanonical: boolean }>;
};

type SiteSnapshot = {
  schemaVersion: 1;
  siteId: number;
  exportedAt: string;
  contentTypes: Array<{ name: string; description?: string | null; fieldsJson: string }>;
  templates: Array<{ name: string; compositionJson: string; componentsJson: string; constraintsJson: string }>;
  items: ExportedItem[];
};

function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DuckDbAdminPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId } = useAdminContext();
  const [status, setStatus] = useState('');
  const [importJson, setImportJson] = useState('');
  const [working, setWorking] = useState(false);

  const exportSnapshot = async () => {
    setWorking(true);
    setStatus('');
    try {
      const [typesRes, templatesRes, itemsRes, routesRes] = await Promise.all([
        sdk.listContentTypes({ siteId }),
        sdk.listTemplates({ siteId }),
        sdk.listContentItems({ siteId }),
        sdk.listRoutes({ siteId, marketCode: null, localeCode: null })
      ]);
      const contentTypes = (typesRes.listContentTypes ?? []).map((entry) => ({
        name: entry?.name ?? '',
        description: entry?.description ?? null,
        fieldsJson: entry?.fieldsJson ?? '[]'
      }));
      const templates = (templatesRes.listTemplates ?? []).map((entry) => ({
        name: entry?.name ?? '',
        compositionJson: entry?.compositionJson ?? '{"areas":[]}',
        componentsJson: entry?.componentsJson ?? '{}',
        constraintsJson: entry?.constraintsJson ?? '{}'
      }));
      const routes = (routesRes.listRoutes ?? []).map((entry) => ({
        contentItemId: entry?.contentItemId ?? 0,
        marketCode: entry?.marketCode ?? '',
        localeCode: entry?.localeCode ?? '',
        slug: entry?.slug ?? '',
        isCanonical: Boolean(entry?.isCanonical)
      }));

      const items = await Promise.all(
        (itemsRes.listContentItems ?? []).map(async (item) => {
          const detail = await sdk.getContentItemDetail({ contentItemId: item?.id ?? 0 });
          const typeName = detail.getContentItemDetail?.contentType?.name ?? '';
          const version = detail.getContentItemDetail?.currentDraftVersion ?? detail.getContentItemDetail?.currentPublishedVersion;
          return {
            contentTypeName: typeName,
            fieldsJson: version?.fieldsJson ?? '{}',
            compositionJson: version?.compositionJson ?? '{"areas":[]}',
            componentsJson: version?.componentsJson ?? '{}',
            metadataJson: version?.metadataJson ?? '{}',
            routes: routes
              .filter((route) => route.contentItemId === item?.id)
              .map((route) => ({
                marketCode: route.marketCode,
                localeCode: route.localeCode,
                slug: route.slug,
                isCanonical: route.isCanonical
              }))
          } as ExportedItem;
        })
      );

      const snapshot: SiteSnapshot = {
        schemaVersion: 1,
        siteId,
        exportedAt: new Date().toISOString(),
        contentTypes,
        templates,
        items
      };
      downloadJson(`contenthead-site-${siteId}-${Date.now()}.json`, snapshot);
      setStatus(`Exported ${contentTypes.length} content types, ${templates.length} templates, ${items.length} items.`);
    } catch (error) {
      setStatus(String(error));
    } finally {
      setWorking(false);
    }
  };

  const importSnapshot = async () => {
    setWorking(true);
    setStatus('');
    try {
      const parsed = JSON.parse(importJson || '{}') as Partial<SiteSnapshot>;
      if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.contentTypes) || !Array.isArray(parsed.templates) || !Array.isArray(parsed.items)) {
        throw new Error('Invalid snapshot format.');
      }

      const existingTypes = await sdk.listContentTypes({ siteId });
      const typeByName = new Map((existingTypes.listContentTypes ?? []).map((entry) => [entry?.name ?? '', entry?.id ?? 0]));

      for (const type of parsed.contentTypes) {
        if (!typeByName.has(type.name)) {
          const created = await sdk.createContentType({
            siteId,
            name: type.name,
            description: type.description ?? null,
            fieldsJson: type.fieldsJson,
            by: 'admin'
          });
          if (created.createContentType?.id) {
            typeByName.set(type.name, created.createContentType.id);
          }
        }
      }

      const existingTemplates = await sdk.listTemplates({ siteId });
      const templateNames = new Set((existingTemplates.listTemplates ?? []).map((entry) => entry?.name ?? ''));
      for (const template of parsed.templates) {
        if (templateNames.has(template.name)) {
          continue;
        }
        await sdk.createTemplate({
          siteId,
          name: template.name,
          compositionJson: template.compositionJson,
          componentsJson: template.componentsJson,
          constraintsJson: template.constraintsJson
        });
      }

      let importedItems = 0;
      for (const item of parsed.items) {
        const contentTypeId = typeByName.get(item.contentTypeName);
        if (!contentTypeId) {
          continue;
        }
        const created = await sdk.createContentItem({
          siteId,
          contentTypeId,
          by: 'admin',
          initialFieldsJson: item.fieldsJson,
          initialCompositionJson: item.compositionJson,
          initialComponentsJson: item.componentsJson
        });
        const createdId = created.createContentItem?.id;
        if (!createdId) {
          continue;
        }
        importedItems += 1;
        for (const route of item.routes) {
          try {
            await sdk.upsertRoute({
              siteId,
              contentItemId: createdId,
              marketCode: route.marketCode,
              localeCode: route.localeCode,
              slug: route.slug,
              isCanonical: route.isCanonical
            });
          } catch {
            // continue importing remaining routes/items
          }
        }
      }

      setStatus(`Import complete. Imported ${importedItems} items into site ${siteId}.`);
    } catch (error) {
      setStatus(String(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="pageRoot">
      <PageHeader title="DuckDB Admin" subtitle="Runtime DB operations, demo data, and JSON import/export." />
      <div className="card-grid">
        <section className="content-card">
          <h3 style={{ marginTop: 0 }}>Load Demo Data</h3>
          <p className="muted">Run the API seed script to load the demo page (`/demo`) and baseline data.</p>
          <div className="inline-actions">
            <Button
              label="Copy Seed Command"
              onClick={() => navigator.clipboard.writeText('pnpm --filter @contenthead/api seed')}
            />
            <Button
              label="Copy Start Command"
              severity="secondary"
              onClick={() => navigator.clipboard.writeText('pnpm dev')}
            />
          </div>
        </section>

        <section className="content-card">
          <h3 style={{ marginTop: 0 }}>Export Site Snapshot</h3>
          <p className="muted">Exports content types, templates, items (latest version JSON), and routes for the current site.</p>
          <Button label="Export JSON" onClick={() => void exportSnapshot()} loading={working} />
        </section>

        <section className="content-card">
          <h3 style={{ marginTop: 0 }}>Import Site Snapshot</h3>
          <p className="muted">Imports snapshots exported by this screen. Existing content types/templates by name are skipped.</p>
          <FileUpload
            mode="basic"
            name="snapshot"
            accept=".json,application/json"
            chooseLabel="Load JSON File"
            customUpload
            uploadHandler={(event) => {
              const file = event.files?.[0];
              if (!(file instanceof File)) {
                return;
              }
              file.text().then((text) => setImportJson(text)).catch(() => setStatus('Failed to read file.'));
            }}
          />
          <div className="form-row" style={{ marginTop: '0.75rem' }}>
            <label>Snapshot JSON</label>
            <InputTextarea rows={12} value={importJson} onChange={(event) => setImportJson(event.target.value)} />
          </div>
          <Button label="Import JSON" severity="success" onClick={() => void importSnapshot()} disabled={!importJson.trim()} loading={working} />
        </section>
      </div>
      {status ? <div className="status-panel"><pre>{status}</pre></div> : null}
    </div>
  );
}
