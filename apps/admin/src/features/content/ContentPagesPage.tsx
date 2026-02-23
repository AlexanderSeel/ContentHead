import { useEffect, useMemo, useState } from 'react';
import { TabPanel, TabView } from 'primereact/tabview';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import type { TreeNode } from 'primereact/treenode';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { SplitView } from '../../components/common/SplitView';

type CType = { id: number; name: string; fieldsJson: string };
type CItem = { id: number; contentTypeId: number; currentDraftVersionId?: number | null; currentPublishedVersionId?: number | null };
type CVersion = { id: number; versionNumber: number; fieldsJson: string; compositionJson: string; componentsJson: string; metadataJson: string; state: string; comment?: string | null };
type CRoute = { id: number; contentItemId: number; marketCode: string; localeCode: string; slug: string; isCanonical: boolean };
type VariantSet = { id: number; contentItemId: number; marketCode: string; localeCode: string; fallbackVariantSetId?: number | null; active: boolean };
type Variant = { id: number; variantSetId: number; key: string; priority: number; ruleJson: string; state: string; trafficAllocation?: number | null; contentVersionId: number };
type FieldDef = { key: string; label: string; type: 'text' | 'richtext' | 'number' | 'boolean' };

const parseJson = <T,>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export function ContentPagesPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId, marketCode, localeCode, combos } = useAdminContext();

  const [types, setTypes] = useState<CType[]>([]);
  const [items, setItems] = useState<CItem[]>([]);
  const [routes, setRoutes] = useState<CRoute[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [versions, setVersions] = useState<CVersion[]>([]);
  const [draft, setDraft] = useState<CVersion | null>(null);
  const [fields, setFields] = useState<Record<string, unknown>>({});
  const [compositionJson, setCompositionJson] = useState('{"areas":[{"name":"main","components":[]}]}');
  const [componentsJson, setComponentsJson] = useState('{}');
  const [metadataJson, setMetadataJson] = useState('{}');
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState('');
  const [previewToken, setPreviewToken] = useState('');
  const [routeDraft, setRouteDraft] = useState<{ id?: number | null; slug: string; marketCode: string; localeCode: string; isCanonical: boolean }>({
    slug: '',
    marketCode,
    localeCode,
    isCanonical: true
  });

  const [variantSets, setVariantSets] = useState<VariantSet[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantSetId, setVariantSetId] = useState<number | null>(null);
  const [variantDraft, setVariantDraft] = useState({
    key: 'default',
    priority: 100,
    state: 'ACTIVE',
    ruleJson: '{}',
    trafficAllocation: 100,
    contentVersionId: 0
  });

  const selectedType = useMemo(() => {
    const item = items.find((entry) => entry.id === selectedItemId);
    return types.find((entry) => entry.id === item?.contentTypeId) ?? null;
  }, [items, types, selectedItemId]);

  const fieldDefs = useMemo(() => parseJson<FieldDef[]>(selectedType?.fieldsJson ?? '[]', []), [selectedType]);

  const filteredItems = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    if (!text) {
      return items;
    }

    return items.filter((entry) => {
      const hasRoute = routes.some(
        (route) =>
          route.contentItemId === entry.id &&
          route.slug.toLowerCase().includes(text)
      );
      return hasRoute || String(entry.id).includes(text);
    });
  }, [items, routes, searchText]);

  const treeNodes = useMemo<TreeNode[]>(
    () =>
      routes
        .filter((entry) => entry.marketCode === marketCode && entry.localeCode === localeCode)
        .map((route) => ({
          key: String(route.id),
          data: {
            slug: route.slug,
            contentItemId: route.contentItemId
          }
        })),
    [routes, marketCode, localeCode]
  );

  const activeCombos = useMemo(
    () =>
      combos
        .filter((entry) => entry.active)
        .map((entry) => ({ label: `${entry.marketCode}/${entry.localeCode}`, value: `${entry.marketCode}::${entry.localeCode}` })),
    [combos]
  );

  const refresh = async () => {
    const [typesRes, itemsRes, routesRes] = await Promise.all([
      sdk.listContentTypes({ siteId }),
      sdk.listContentItems({ siteId }),
      sdk.listRoutes({ siteId, marketCode: null, localeCode: null })
    ]);
    setTypes((typesRes.listContentTypes ?? []) as CType[]);
    setItems((itemsRes.listContentItems ?? []) as CItem[]);
    setRoutes((routesRes.listRoutes ?? []) as CRoute[]);
  };

  const loadItem = async (id: number) => {
    setSelectedItemId(id);
    const detail = await sdk.getContentItemDetail({ contentItemId: id });
    const activeVersion = (detail.getContentItemDetail?.currentDraftVersion ?? detail.getContentItemDetail?.currentPublishedVersion ?? null) as CVersion | null;
    setDraft(activeVersion);
    if (activeVersion) {
      setFields(parseJson(activeVersion.fieldsJson, {}));
      setCompositionJson(activeVersion.compositionJson);
      setComponentsJson(activeVersion.componentsJson);
      setMetadataJson(activeVersion.metadataJson);
      setVariantDraft((prev) => ({ ...prev, contentVersionId: activeVersion.id }));
    }

    const versionsRes = await sdk.listVersions({ contentItemId: id });
    setVersions((versionsRes.listVersions ?? []) as CVersion[]);

    const setsRes = await sdk.listVariantSets({ siteId, contentItemId: id, marketCode, localeCode });
    const sets = (setsRes.listVariantSets ?? []) as VariantSet[];
    setVariantSets(sets);
    const setId = sets[0]?.id ?? null;
    setVariantSetId(setId);
    if (setId) {
      const variantsRes = await sdk.listVariants({ variantSetId: setId });
      setVariants((variantsRes.listVariants ?? []) as Variant[]);
    } else {
      setVariants([]);
    }
  };

  useEffect(() => {
    refresh().catch((error: unknown) => setStatus(String(error)));
  }, [siteId]);

  useEffect(() => {
    setRouteDraft((prev) => ({ ...prev, marketCode, localeCode }));
  }, [marketCode, localeCode]);

  const createPage = async () => {
    const fallbackType = types[0];
    if (!fallbackType) {
      setStatus('Create a content type first.');
      return;
    }

    const created = await sdk.createContentItem({
      siteId,
      contentTypeId: fallbackType.id,
      by: 'admin',
      initialFieldsJson: '{}',
      initialCompositionJson: '{"areas":[{"name":"main","components":["hero_1","rich_1","teasers_1"]}]}',
      initialComponentsJson: '{"hero_1":{"type":"Hero","title":"Hero","subtitle":"Sub"},"rich_1":{"type":"RichText","html":"<p>Body</p>"},"teasers_1":{"type":"TeaserGrid","items":[{"title":"A","href":"/a"}]}}'
    });
    const id = created.createContentItem?.id;
    await refresh();
    if (id) {
      await loadItem(id);
    }
  };

  const saveDraft = async () => {
    if (!draft) {
      return;
    }
    const updated = await sdk.updateDraftVersion({
      versionId: draft.id,
      expectedVersionNumber: draft.versionNumber,
      patch: {
        fieldsJson: JSON.stringify(fields),
        compositionJson,
        componentsJson,
        metadataJson,
        comment: 'Save draft',
        createdBy: 'admin'
      }
    });
    setDraft((updated.updateDraftVersion ?? null) as CVersion | null);
    if (selectedItemId) {
      await loadItem(selectedItemId);
    }
  };

  const publish = async () => {
    if (!draft) {
      return;
    }
    await sdk.publishVersion({ versionId: draft.id, expectedVersionNumber: draft.versionNumber, by: 'admin' });
    if (selectedItemId) {
      await loadItem(selectedItemId);
    }
  };

  const rightPanel = !selectedItemId ? (
    <EmptyState title="No page selected" description="Pick a page from the tree or search results." actionLabel="Create Page" onAction={() => createPage().catch((e: unknown) => setStatus(String(e)))} />
  ) : (
    <TabView>
      <TabPanel header="Edit">
        {fieldDefs.map((def) => (
          <div className="form-row" key={def.key}>
            <label>{def.label}</label>
            {def.type === 'boolean' ? (
              <Checkbox checked={Boolean(fields[def.key])} onChange={(event) => setFields((prev) => ({ ...prev, [def.key]: Boolean(event.checked) }))} />
            ) : def.type === 'richtext' ? (
              <InputTextarea rows={4} value={String(fields[def.key] ?? '')} onChange={(event) => setFields((prev) => ({ ...prev, [def.key]: event.target.value }))} />
            ) : (
              <InputText value={String(fields[def.key] ?? '')} onChange={(event) => setFields((prev) => ({ ...prev, [def.key]: def.type === 'number' ? Number(event.target.value) : event.target.value }))} />
            )}
          </div>
        ))}
        <div className="form-row"><label>Composition JSON</label><InputTextarea rows={3} value={compositionJson} onChange={(e) => setCompositionJson(e.target.value)} /></div>
        <div className="form-row"><label>Components JSON</label><InputTextarea rows={3} value={componentsJson} onChange={(e) => setComponentsJson(e.target.value)} /></div>
        <div className="form-row"><label>Metadata JSON</label><InputTextarea rows={2} value={metadataJson} onChange={(e) => setMetadataJson(e.target.value)} /></div>
      </TabPanel>
      <TabPanel header="Routes">
        <DataTable value={routes.filter((route) => route.contentItemId === selectedItemId)} size="small">
          <Column field="slug" header="Slug" />
          <Column field="marketCode" header="Market" />
          <Column field="localeCode" header="Locale" />
          <Column field="isCanonical" header="Canonical" body={(row: CRoute) => (row.isCanonical ? 'Yes' : 'No')} />
          <Column header="Edit" body={(row: CRoute) => <Button text label="Edit" onClick={() => setRouteDraft({ id: row.id, slug: row.slug, marketCode: row.marketCode, localeCode: row.localeCode, isCanonical: row.isCanonical })} />} />
        </DataTable>
        <div className="form-grid">
          <InputText value={routeDraft.slug} onChange={(e) => setRouteDraft((prev) => ({ ...prev, slug: e.target.value }))} placeholder="slug" />
          <Dropdown
            value={`${routeDraft.marketCode}::${routeDraft.localeCode}`}
            options={activeCombos}
            onChange={(event) => {
              const [nextMarket, nextLocale] = String(event.value).split('::');
              setRouteDraft((prev) => ({
                ...prev,
                marketCode: nextMarket ?? prev.marketCode,
                localeCode: nextLocale ?? prev.localeCode
              }));
            }}
          />
          <label><Checkbox checked={routeDraft.isCanonical} onChange={(event) => setRouteDraft((prev) => ({ ...prev, isCanonical: Boolean(event.checked) }))} /> Canonical</label>
          <Button
            label="Save Route"
            onClick={() =>
              sdk
                .upsertRoute({
                  ...(routeDraft.id ? { id: routeDraft.id } : {}),
                  siteId,
                  contentItemId: selectedItemId,
                  marketCode: routeDraft.marketCode,
                  localeCode: routeDraft.localeCode,
                  slug: routeDraft.slug,
                  isCanonical: routeDraft.isCanonical
                })
                .then(() => refresh())
                .catch((err: unknown) => setStatus(String(err)))
            }
          />
        </div>
      </TabPanel>
      <TabPanel header="Versions">
        <DataTable value={versions} size="small">
          <Column field="versionNumber" header="Version" />
          <Column field="state" header="State" />
          <Column field="comment" header="Comment" />
          <Column
            header="Rollback"
            body={(row: CVersion) => (
              <Button
                text
                label="Rollback"
                onClick={() =>
                  sdk
                    .rollbackToVersion({ contentItemId: selectedItemId, versionId: row.id, by: 'admin' })
                    .then(() => loadItem(selectedItemId))
                }
              />
            )}
          />
        </DataTable>
      </TabPanel>
      <TabPanel header="Variants">
        <div className="form-grid">
          <Dropdown
            value={variantSetId}
            options={variantSets.map((entry) => ({ label: `Set #${entry.id}`, value: entry.id }))}
            onChange={(event) => {
              const id = Number(event.value);
              setVariantSetId(id);
              sdk.listVariants({ variantSetId: id }).then((res) => setVariants((res.listVariants ?? []) as Variant[]));
            }}
            placeholder="Variant set"
          />
          <Button
            label="Create/Update Variant Set"
            onClick={() =>
              sdk
                .upsertVariantSet({
                  id: variantSetId,
                  siteId,
                  contentItemId: selectedItemId,
                  marketCode,
                  localeCode,
                  active: true,
                  fallbackVariantSetId: null
                })
                .then((res) => {
                  const id = res.upsertVariantSet?.id ?? null;
                  setVariantSetId(id);
                  return loadItem(selectedItemId);
                })
            }
          />
        </div>
        <DataTable value={variants} size="small">
          <Column field="key" header="Key" />
          <Column field="priority" header="Priority" />
          <Column field="state" header="State" />
          <Column field="trafficAllocation" header="Traffic" />
          <Column field="contentVersionId" header="Version" />
        </DataTable>
        <div className="form-grid">
          <InputText value={variantDraft.key} onChange={(e) => setVariantDraft((prev) => ({ ...prev, key: e.target.value }))} placeholder="key" />
          <InputText value={String(variantDraft.priority)} onChange={(e) => setVariantDraft((prev) => ({ ...prev, priority: Number(e.target.value || '0') }))} placeholder="priority" />
          <InputText value={String(variantDraft.trafficAllocation)} onChange={(e) => setVariantDraft((prev) => ({ ...prev, trafficAllocation: Number(e.target.value || '0') }))} placeholder="traffic" />
          <Dropdown value={variantDraft.contentVersionId} options={versions.map((entry) => ({ label: `v${entry.versionNumber}`, value: entry.id }))} onChange={(e) => setVariantDraft((prev) => ({ ...prev, contentVersionId: Number(e.value) }))} placeholder="version" />
        </div>
        <div className="form-row"><label>Rule JSON</label><InputTextarea rows={4} value={variantDraft.ruleJson} onChange={(e) => setVariantDraft((prev) => ({ ...prev, ruleJson: e.target.value }))} /></div>
        <Button
          label="Save Variant"
          onClick={() =>
            variantSetId
              ? sdk
                  .upsertVariant({
                    variantSetId,
                    key: variantDraft.key,
                    priority: variantDraft.priority,
                    state: variantDraft.state,
                    ruleJson: variantDraft.ruleJson,
                    trafficAllocation: variantDraft.trafficAllocation,
                    contentVersionId: variantDraft.contentVersionId
                  })
                  .then(() => loadItem(selectedItemId))
              : Promise.resolve()
          }
        />
      </TabPanel>
      <TabPanel header="Preview">
        <div className="form-grid">
          <InputText value={previewToken} onChange={(event) => setPreviewToken(event.target.value)} placeholder="preview token" />
          <Button
            label="Issue Preview Token"
            onClick={() =>
              sdk.issuePreviewToken({ contentItemId: selectedItemId }).then((res) => setPreviewToken(res.issuePreviewToken?.token ?? ''))
            }
          />
        </div>
        <iframe
          title="Visivic Preview"
          src={`http://localhost:3000/preview?contentItemId=${selectedItemId}&siteId=${siteId}&market=${marketCode}&locale=${localeCode}&token=${encodeURIComponent(previewToken)}`}
          style={{ width: '100%', height: 500, border: '1px solid #cbd5e1', borderRadius: 8 }}
        />
      </TabPanel>
      <TabPanel header="Raw JSON">
        <pre>{JSON.stringify({ fields, compositionJson: parseJson(compositionJson, {}), componentsJson: parseJson(componentsJson, {}), metadataJson: parseJson(metadataJson, {}) }, null, 2)}</pre>
      </TabPanel>
    </TabView>
  );

  return (
    <div>
      <PageHeader
        title="Content Pages"
        subtitle="Tree navigation + editor tabs"
        actions={
          <div className="inline-actions">
            <Button label="Create Page" onClick={() => createPage().catch((e: unknown) => setStatus(String(e)))} />
            <Button label="Save Draft" severity="secondary" onClick={() => saveDraft().catch((e: unknown) => setStatus(String(e)))} disabled={!draft} />
            <Button label="Publish" severity="success" onClick={() => publish().catch((e: unknown) => setStatus(String(e)))} disabled={!draft} />
          </div>
        }
      />
      <SplitView
        left={
          <TabView>
            <TabPanel header="Tree">
              <TreeTable value={treeNodes} selectionMode="single" onSelectionChange={(event) => {
                const key = (event.value as TreeNode | undefined)?.key;
                const route = routes.find((entry) => String(entry.id) === key);
                if (route) {
                  loadItem(route.contentItemId).catch((error: unknown) => setStatus(String(error)));
                }
              }}>
                <Column field="slug" header="Slug" expander />
                <Column field="contentItemId" header="Item" />
              </TreeTable>
            </TabPanel>
            <TabPanel header="Search">
              <div className="form-row">
                <label>Find by route slug or item id</label>
                <InputText value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search pages" />
              </div>
              <DataTable value={filteredItems} size="small">
                <Column field="id" header="Item" />
                <Column field="contentTypeId" header="Type" />
                <Column header="Open" body={(row: CItem) => <Button text label="Open" onClick={() => loadItem(row.id).catch((error: unknown) => setStatus(String(error)))} />} />
              </DataTable>
            </TabPanel>
          </TabView>
        }
        right={rightPanel}
      />
      {status ? <pre>{status}</pre> : null}
    </div>
  );
}
