import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { TreeTable } from 'primereact/treetable';
import type { TreeNode } from 'primereact/treenode';
import { createSdk } from '@contenthead/sdk';

const sdk = createSdk({ endpoint: 'http://localhost:4000/graphql' });
type Site = { id: number; name: string };
type Combo = { marketCode: string; localeCode: string; active: boolean };
type CType = { id: number; name: string; description?: string | null; fieldsJson: string };
type CItem = { id: number; contentTypeId: number; archived: boolean; currentDraftVersionId?: number | null; currentPublishedVersionId?: number | null };
type CVersion = { id: number; versionNumber: number; fieldsJson: string; compositionJson: string; componentsJson: string; metadataJson: string; state: string; comment?: string | null };
type CRoute = { id: number; contentItemId: number; marketCode: string; localeCode: string; slug: string; isCanonical: boolean };
type FieldDef = { key: string; label: string; type: 'text' | 'richtext' | 'number' | 'boolean' };

const p = <T,>(v: string, f: T): T => { try { return JSON.parse(v) as T; } catch { return f; } };
const j = (v: unknown) => JSON.stringify(v, null, 2);

export function App() {
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState(1);
  const [market, setMarket] = useState('');
  const [locale, setLocale] = useState('');
  const [combos, setCombos] = useState<Combo[]>([]);

  const [types, setTypes] = useState<CType[]>([]);
  const [items, setItems] = useState<CItem[]>([]);
  const [routes, setRoutes] = useState<CRoute[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [versions, setVersions] = useState<CVersion[]>([]);
  const [draft, setDraft] = useState<CVersion | null>(null);

  const [typeId, setTypeId] = useState<number | null>(null);
  const [typeName, setTypeName] = useState('');
  const [typeDescription, setTypeDescription] = useState('');
  const [typeFields, setTypeFields] = useState<FieldDef[]>([{ key: 'title', label: 'Title', type: 'text' }]);

  const [fields, setFields] = useState<Record<string, unknown>>({});
  const [compositionJson, setCompositionJson] = useState('{"areas":[{"name":"main","components":[]}]}');
  const [componentsJson, setComponentsJson] = useState('{}');
  const [metadataJson, setMetadataJson] = useState('{}');

  const [routeId, setRouteId] = useState<number | null>(null);
  const [routeItemId, setRouteItemId] = useState<number | null>(null);
  const [routeSlug, setRouteSlug] = useState('');
  const [routeMarket, setRouteMarket] = useState('');
  const [routeLocale, setRouteLocale] = useState('');
  const [routeCanonical, setRouteCanonical] = useState(true);

  const [templates, setTemplates] = useState<Array<{ id: number; name: string; compositionJson: string; componentsJson: string; constraintsJson: string }>>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState('Default Page');
  const [templateComp, setTemplateComp] = useState('{"areas":[{"name":"main","components":[]}]}');
  const [templateComps, setTemplateComps] = useState('{}');
  const [templateConstraints, setTemplateConstraints] = useState('{"requiredFields":["title"]}');

  const [diffLeft, setDiffLeft] = useState<number | null>(null);
  const [diffRight, setDiffRight] = useState<number | null>(null);
  const [diffOut, setDiffOut] = useState('');
  const [status, setStatus] = useState('');

  const selectedType = useMemo(() => {
    const item = items.find((x) => x.id === selectedItemId);
    return types.find((x) => x.id === item?.contentTypeId) ?? null;
  }, [items, types, selectedItemId]);
  const selectedDefs = useMemo(() => p<FieldDef[]>(selectedType?.fieldsJson ?? '[]', []), [selectedType]);

  const marketOptions = useMemo(() => Array.from(new Set(combos.filter((c) => c.active).map((c) => c.marketCode))).map((x) => ({ label: x, value: x })), [combos]);
  const localeOptions = useMemo(() => Array.from(new Set(combos.filter((c) => c.active && c.marketCode === market).map((c) => c.localeCode))).map((x) => ({ label: x, value: x })), [combos, market]);
  const routeLocaleOptions = useMemo(() => Array.from(new Set(combos.filter((c) => c.active && c.marketCode === routeMarket).map((c) => c.localeCode))).map((x) => ({ label: x, value: x })), [combos, routeMarket]);

  const treeNodes = useMemo<TreeNode[]>(() => routes.map((r) => ({ key: String(r.id), data: { slug: r.slug, item: r.contentItemId, ml: `${r.marketCode}/${r.localeCode}` } })), [routes]);

  const refresh = async (s?: number) => {
    const sid = s ?? siteId;
    const siteRes = await sdk.listSites();
    const allSites = (siteRes.listSites ?? []) as Site[];
    setSites(allSites);
    const effective = sid || allSites[0]?.id || 1;
    setSiteId(effective);

    const m = await sdk.getSiteMarketLocaleMatrix({ siteId: effective });
    const combosRes = (m.getSiteMarketLocaleMatrix?.combinations ?? []) as Combo[];
    setCombos(combosRes);
    const dm = m.getSiteMarketLocaleMatrix?.defaults?.defaultMarketCode ?? combosRes[0]?.marketCode ?? '';
    const dl = m.getSiteMarketLocaleMatrix?.defaults?.defaultLocaleCode ?? combosRes.find((x) => x.marketCode === dm)?.localeCode ?? '';
    setMarket(dm); setLocale(dl); setRouteMarket(dm); setRouteLocale(dl);

    const [t, i, r, tp] = await Promise.all([
      sdk.listContentTypes({ siteId: effective }),
      sdk.listContentItems({ siteId: effective }),
      sdk.listRoutes({ siteId: effective, marketCode: dm || null, localeCode: dl || null }),
      sdk.listTemplates({ siteId: effective })
    ]);
    setTypes((t.listContentTypes ?? []) as CType[]);
    setItems((i.listContentItems ?? []) as CItem[]);
    setRoutes((r.listRoutes ?? []) as CRoute[]);
    setTemplates((tp.listTemplates ?? []) as Array<{ id: number; name: string; compositionJson: string; componentsJson: string; constraintsJson: string }>);
  };

  const loadItem = async (id: number) => {
    setSelectedItemId(id);
    const detail = await sdk.getContentItemDetail({ contentItemId: id });
    const d = (detail.getContentItemDetail?.currentDraftVersion ?? detail.getContentItemDetail?.currentPublishedVersion ?? null) as CVersion | null;
    setDraft(d);
    if (d) {
      setFields(p<Record<string, unknown>>(d.fieldsJson, {}));
      setCompositionJson(d.compositionJson);
      setComponentsJson(d.componentsJson);
      setMetadataJson(d.metadataJson);
    }
    const v = await sdk.listVersions({ contentItemId: id });
    const vv = (v.listVersions ?? []) as CVersion[];
    setVersions(vv);
    setDiffLeft(vv[0]?.id ?? null);
    setDiffRight(vv[1]?.id ?? vv[0]?.id ?? null);
  };

  useEffect(() => { refresh().catch((e: unknown) => setStatus(String(e))); }, []);
  const saveType = async () => {
    const payload = { name: typeName, description: typeDescription || null, fieldsJson: j(typeFields), by: 'admin' };
    if (typeId) {
      await sdk.updateContentType({ id: typeId, ...payload });
    } else {
      await sdk.createContentType({ siteId, ...payload });
    }
    await refresh(siteId);
    setStatus('Content type saved');
  };

  const createItem = async () => {
    if (!typeId) return;
    const created = await sdk.createContentItem({
      siteId,
      contentTypeId: typeId,
      by: 'admin',
      initialFieldsJson: '{}',
      initialCompositionJson: '{"areas":[{"name":"main","components":["hero_1","rich_1","teasers_1"]}]}',
      initialComponentsJson: '{"hero_1":{"type":"Hero","title":"Hero","subtitle":"Sub"},"rich_1":{"type":"RichText","html":"<p>Body</p>"},"teasers_1":{"type":"TeaserGrid","items":[{"title":"A","href":"/a"}]}}'
    });
    const id = created.createContentItem?.id;
    await refresh(siteId);
    if (id) await loadItem(id);
  };

  const saveDraft = async () => {
    if (!selectedItemId) return;
    let target = draft;
    if (!target) {
      const d = await sdk.createDraftVersion({ contentItemId: selectedItemId, by: 'admin' });
      target = (d.createDraftVersion ?? null) as CVersion | null;
      setDraft(target);
    }
    if (!target) return;
    const next = await sdk.updateDraftVersion({
      versionId: target.id,
      expectedVersionNumber: target.versionNumber,
      patch: {
        fieldsJson: j(fields),
        compositionJson,
        componentsJson,
        metadataJson,
        comment: 'Save draft',
        createdBy: 'admin'
      }
    });
    setDraft((next.updateDraftVersion ?? null) as CVersion | null);
    await loadItem(selectedItemId);
    setStatus('Draft saved');
  };

  const publish = async () => {
    if (!draft || !selectedItemId) return;
    await sdk.publishVersion({ versionId: draft.id, expectedVersionNumber: draft.versionNumber, by: 'admin' });
    await loadItem(selectedItemId);
    await refresh(siteId);
    setStatus('Published');
  };

  const saveRoute = async () => {
    if (!routeItemId || !routeMarket || !routeLocale || !routeSlug) return;
    await sdk.upsertRoute({
      id: routeId,
      siteId,
      contentItemId: routeItemId,
      marketCode: routeMarket,
      localeCode: routeLocale,
      slug: routeSlug,
      isCanonical: routeCanonical
    });
    await refresh(siteId);
  };

  return (
    <main className="admin-shell">
      <Card title="CMS Core Admin" subTitle="Types, items, versions, templates, routes">
        <section className="topbar-grid">
          <div className="form-row">
            <label>Site</label>
            <Dropdown value={siteId} options={sites.map((s) => ({ label: `${s.id}: ${s.name}`, value: s.id }))} onChange={(e) => refresh(Number(e.value)).catch((err: unknown) => setStatus(String(err)))} />
          </div>
          <div className="form-row"><label>Market</label><Dropdown value={market} options={marketOptions} onChange={(e) => setMarket(e.value)} /></div>
          <div className="form-row"><label>Locale</label><Dropdown value={locale} options={localeOptions} onChange={(e) => setLocale(e.value)} /></div>
        </section>

        <h3>Content Tree</h3>
        <TreeTable value={treeNodes}><Column field="slug" header="Slug" expander /><Column field="item" header="Item" /><Column field="ml" header="Market/Locale" /></TreeTable>

        <h3>Content List</h3>
        <DataTable value={items} size="small"><Column field="id" header="ID" /><Column field="contentTypeId" header="Type" /><Column field="currentDraftVersionId" header="Draft" /><Column field="currentPublishedVersionId" header="Published" /><Column header="Edit" body={(row: CItem) => <Button size="small" text label="Edit" onClick={() => loadItem(row.id).catch((err: unknown) => setStatus(String(err)))} />} /></DataTable>

        <h3>ContentType Builder</h3>
        <div className="form-grid">
          <Dropdown value={typeId} options={types.map((t) => ({ label: `${t.name} (#${t.id})`, value: t.id }))} onChange={(e) => {
            const t = types.find((x) => x.id === Number(e.value));
            setTypeId(Number(e.value));
            setTypeName(t?.name ?? '');
            setTypeDescription(t?.description ?? '');
            setTypeFields(p<FieldDef[]>(t?.fieldsJson ?? '[]', []));
          }} placeholder="Select type" />
          <InputText value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="Name" />
          <InputText value={typeDescription} onChange={(e) => setTypeDescription(e.target.value)} placeholder="Description" />
          <Button label="Add Field" onClick={() => setTypeFields((prev) => [...prev, { key: 'field', label: 'Field', type: 'text' }])} />
        </div>
        <DataTable value={typeFields} size="small">
          <Column header="Key" body={(row: FieldDef, o) => <InputText value={row.key} onChange={(e) => setTypeFields((prev) => prev.map((x, i) => i === o.rowIndex ? { ...x, key: e.target.value } : x))} />} />
          <Column header="Label" body={(row: FieldDef, o) => <InputText value={row.label} onChange={(e) => setTypeFields((prev) => prev.map((x, i) => i === o.rowIndex ? { ...x, label: e.target.value } : x))} />} />
          <Column header="Type" body={(row: FieldDef, o) => <Dropdown value={row.type} options={[{ label: 'text', value: 'text' }, { label: 'richtext', value: 'richtext' }, { label: 'number', value: 'number' }, { label: 'boolean', value: 'boolean' }]} onChange={(e) => setTypeFields((prev) => prev.map((x, i) => i === o.rowIndex ? { ...x, type: e.value } : x))} />} />
        </DataTable>
        <div className="inline-actions"><Button label="Save Type" onClick={() => saveType().catch((err: unknown) => setStatus(String(err)))} /><Button label="Create Item" severity="secondary" onClick={() => createItem().catch((err: unknown) => setStatus(String(err)))} /></div>

        <h3>Content Editor</h3>
        <div className="form-grid">
          <Dropdown value={selectedItemId} options={items.map((i) => ({ label: `#${i.id}`, value: i.id }))} onChange={(e) => loadItem(Number(e.value)).catch((err: unknown) => setStatus(String(err)))} placeholder="Item" />
          <Button label="Issue Preview Token" onClick={() => sdk.issuePreviewToken({ contentItemId: selectedItemId ?? 0 }).then((r) => setStatus(r.issuePreviewToken?.token ?? '')).catch((err: unknown) => setStatus(String(err)))} />
        </div>
        {selectedDefs.map((f) => (
          <div className="form-row" key={f.key}>
            <label>{f.label}</label>
            {f.type === 'boolean' ? <Checkbox checked={Boolean(fields[f.key])} onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: Boolean(e.checked) }))} /> : f.type === 'richtext' ? <InputTextarea rows={3} value={String(fields[f.key] ?? '')} onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))} /> : <InputText value={String(fields[f.key] ?? '')} onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))} />}
          </div>
        ))}
        <div className="form-row"><label>Composition JSON</label><InputTextarea rows={3} value={compositionJson} onChange={(e) => setCompositionJson(e.target.value)} /></div>
        <div className="form-row"><label>Components JSON</label><InputTextarea rows={4} value={componentsJson} onChange={(e) => setComponentsJson(e.target.value)} /></div>
        <div className="form-row"><label>Metadata JSON</label><InputTextarea rows={2} value={metadataJson} onChange={(e) => setMetadataJson(e.target.value)} /></div>
        <div className="inline-actions"><Button label="Save Draft" onClick={() => saveDraft().catch((err: unknown) => setStatus(String(err)))} /><Button label="Publish" severity="success" onClick={() => publish().catch((err: unknown) => setStatus(String(err)))} /></div>

        <h4>Version History</h4>
        <DataTable value={versions} size="small"><Column field="id" header="ID" /><Column field="versionNumber" header="Version" /><Column field="state" header="State" /><Column field="comment" header="Comment" /><Column header="Rollback" body={(row: CVersion) => <Button text size="small" label="Rollback" onClick={() => sdk.rollbackToVersion({ contentItemId: selectedItemId ?? 0, versionId: row.id, by: 'admin' }).then(async () => { if (selectedItemId) { await loadItem(selectedItemId); } }).catch((err: unknown) => setStatus(String(err)))} />} /></DataTable>
        <div className="form-grid"><Dropdown value={diffLeft} options={versions.map((v) => ({ label: `v${v.versionNumber}`, value: v.id }))} onChange={(e) => setDiffLeft(Number(e.value))} /><Dropdown value={diffRight} options={versions.map((v) => ({ label: `v${v.versionNumber}`, value: v.id }))} onChange={(e) => setDiffRight(Number(e.value))} /><Button label="Diff" onClick={() => sdk.diffVersions({ leftVersionId: diffLeft ?? 0, rightVersionId: diffRight ?? 0 }).then((r) => setDiffOut(j(r.diffVersions ?? {}))).catch((err: unknown) => setStatus(String(err)))} /></div>
        <pre>{diffOut}</pre>
        <h3>Template Editor</h3>
        <DataTable value={templates} size="small"><Column field="id" header="ID" /><Column field="name" header="Name" /><Column header="Edit" body={(r: { id: number; name: string; compositionJson: string; componentsJson: string; constraintsJson: string }) => <Button text size="small" label="Edit" onClick={() => { setTemplateId(r.id); setTemplateName(r.name); setTemplateComp(r.compositionJson); setTemplateComps(r.componentsJson); setTemplateConstraints(r.constraintsJson); }} />} /></DataTable>
        <div className="form-row"><label>Name</label><InputText value={templateName} onChange={(e) => setTemplateName(e.target.value)} /></div>
        <div className="form-row"><label>Composition</label><InputTextarea rows={3} value={templateComp} onChange={(e) => setTemplateComp(e.target.value)} /></div>
        <div className="form-row"><label>Components</label><InputTextarea rows={3} value={templateComps} onChange={(e) => setTemplateComps(e.target.value)} /></div>
        <div className="form-row"><label>Constraints</label><InputTextarea rows={2} value={templateConstraints} onChange={(e) => setTemplateConstraints(e.target.value)} /></div>
        <div className="inline-actions"><Button label="Save Template" onClick={() => (templateId ? sdk.updateTemplate({ id: templateId, name: templateName, compositionJson: templateComp, componentsJson: templateComps, constraintsJson: templateConstraints }) : sdk.createTemplate({ siteId, name: templateName, compositionJson: templateComp, componentsJson: templateComps, constraintsJson: templateConstraints })).then(() => refresh(siteId)).catch((err: unknown) => setStatus(String(err)))} /><Button label="Reconcile" severity="secondary" onClick={() => sdk.reconcileTemplate({ templateId: templateId ?? 0 }).then((r) => setStatus(j(r.reconcileTemplate ?? {}))).catch((err: unknown) => setStatus(String(err)))} /></div>

        <h3>Route Editor</h3>
        <DataTable value={routes} size="small"><Column field="id" header="ID" /><Column field="slug" header="Slug" /><Column field="marketCode" header="Market" /><Column field="localeCode" header="Locale" /><Column field="contentItemId" header="Item" /><Column header="Edit" body={(r: CRoute) => <Button text size="small" label="Edit" onClick={() => { setRouteId(r.id); setRouteItemId(r.contentItemId); setRouteMarket(r.marketCode); setRouteLocale(r.localeCode); setRouteSlug(r.slug); setRouteCanonical(r.isCanonical); }} />} /></DataTable>
        <div className="form-grid">
          <Dropdown value={routeItemId} options={items.map((i) => ({ label: `#${i.id}`, value: i.id }))} onChange={(e) => setRouteItemId(Number(e.value))} placeholder="Item" />
          <Dropdown value={routeMarket} options={marketOptions} onChange={(e) => setRouteMarket(e.value)} placeholder="Market" />
          <Dropdown value={routeLocale} options={routeLocaleOptions} onChange={(e) => setRouteLocale(e.value)} placeholder="Locale" />
          <InputText value={routeSlug} onChange={(e) => setRouteSlug(e.target.value)} placeholder="slug" />
          <label><Checkbox checked={routeCanonical} onChange={(e) => setRouteCanonical(Boolean(e.checked))} /> Canonical</label>
          <Button label="Save Route" onClick={() => saveRoute().catch((err: unknown) => setStatus(String(err)))} />
        </div>

        <h3>Status</h3>
        <pre>{status}</pre>
      </Card>
    </main>
  );
}
