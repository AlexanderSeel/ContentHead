import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { createSdk } from '@contenthead/sdk';
const sdk = createSdk({ endpoint: 'http://localhost:4000/graphql' });
const p = (v, f) => { try {
    return JSON.parse(v);
}
catch {
    return f;
} };
const j = (v) => JSON.stringify(v, null, 2);
export function App() {
    const [sites, setSites] = useState([]);
    const [siteId, setSiteId] = useState(1);
    const [market, setMarket] = useState('');
    const [locale, setLocale] = useState('');
    const [combos, setCombos] = useState([]);
    const [types, setTypes] = useState([]);
    const [items, setItems] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [versions, setVersions] = useState([]);
    const [draft, setDraft] = useState(null);
    const [typeId, setTypeId] = useState(null);
    const [typeName, setTypeName] = useState('');
    const [typeDescription, setTypeDescription] = useState('');
    const [typeFields, setTypeFields] = useState([{ key: 'title', label: 'Title', type: 'text' }]);
    const [fields, setFields] = useState({});
    const [compositionJson, setCompositionJson] = useState('{"areas":[{"name":"main","components":[]}]}');
    const [componentsJson, setComponentsJson] = useState('{}');
    const [metadataJson, setMetadataJson] = useState('{}');
    const [routeId, setRouteId] = useState(null);
    const [routeItemId, setRouteItemId] = useState(null);
    const [routeSlug, setRouteSlug] = useState('');
    const [routeMarket, setRouteMarket] = useState('');
    const [routeLocale, setRouteLocale] = useState('');
    const [routeCanonical, setRouteCanonical] = useState(true);
    const [templates, setTemplates] = useState([]);
    const [templateId, setTemplateId] = useState(null);
    const [templateName, setTemplateName] = useState('Default Page');
    const [templateComp, setTemplateComp] = useState('{"areas":[{"name":"main","components":[]}]}');
    const [templateComps, setTemplateComps] = useState('{}');
    const [templateConstraints, setTemplateConstraints] = useState('{"requiredFields":["title"]}');
    const [diffLeft, setDiffLeft] = useState(null);
    const [diffRight, setDiffRight] = useState(null);
    const [diffOut, setDiffOut] = useState('');
    const [status, setStatus] = useState('');
    const selectedType = useMemo(() => {
        const item = items.find((x) => x.id === selectedItemId);
        return types.find((x) => x.id === item?.contentTypeId) ?? null;
    }, [items, types, selectedItemId]);
    const selectedDefs = useMemo(() => p(selectedType?.fieldsJson ?? '[]', []), [selectedType]);
    const marketOptions = useMemo(() => Array.from(new Set(combos.filter((c) => c.active).map((c) => c.marketCode))).map((x) => ({ label: x, value: x })), [combos]);
    const localeOptions = useMemo(() => Array.from(new Set(combos.filter((c) => c.active && c.marketCode === market).map((c) => c.localeCode))).map((x) => ({ label: x, value: x })), [combos, market]);
    const routeLocaleOptions = useMemo(() => Array.from(new Set(combos.filter((c) => c.active && c.marketCode === routeMarket).map((c) => c.localeCode))).map((x) => ({ label: x, value: x })), [combos, routeMarket]);
    const treeNodes = useMemo(() => routes.map((r) => ({ key: String(r.id), data: { slug: r.slug, item: r.contentItemId, ml: `${r.marketCode}/${r.localeCode}` } })), [routes]);
    const refresh = async (s) => {
        const sid = s ?? siteId;
        const siteRes = await sdk.listSites();
        const allSites = (siteRes.listSites ?? []);
        setSites(allSites);
        const effective = sid || allSites[0]?.id || 1;
        setSiteId(effective);
        const m = await sdk.getSiteMarketLocaleMatrix({ siteId: effective });
        const combosRes = (m.getSiteMarketLocaleMatrix?.combinations ?? []);
        setCombos(combosRes);
        const dm = m.getSiteMarketLocaleMatrix?.defaults?.defaultMarketCode ?? combosRes[0]?.marketCode ?? '';
        const dl = m.getSiteMarketLocaleMatrix?.defaults?.defaultLocaleCode ?? combosRes.find((x) => x.marketCode === dm)?.localeCode ?? '';
        setMarket(dm);
        setLocale(dl);
        setRouteMarket(dm);
        setRouteLocale(dl);
        const [t, i, r, tp] = await Promise.all([
            sdk.listContentTypes({ siteId: effective }),
            sdk.listContentItems({ siteId: effective }),
            sdk.listRoutes({ siteId: effective, marketCode: dm || null, localeCode: dl || null }),
            sdk.listTemplates({ siteId: effective })
        ]);
        setTypes((t.listContentTypes ?? []));
        setItems((i.listContentItems ?? []));
        setRoutes((r.listRoutes ?? []));
        setTemplates((tp.listTemplates ?? []));
    };
    const loadItem = async (id) => {
        setSelectedItemId(id);
        const detail = await sdk.getContentItemDetail({ contentItemId: id });
        const d = (detail.getContentItemDetail?.currentDraftVersion ?? detail.getContentItemDetail?.currentPublishedVersion ?? null);
        setDraft(d);
        if (d) {
            setFields(p(d.fieldsJson, {}));
            setCompositionJson(d.compositionJson);
            setComponentsJson(d.componentsJson);
            setMetadataJson(d.metadataJson);
        }
        const v = await sdk.listVersions({ contentItemId: id });
        const vv = (v.listVersions ?? []);
        setVersions(vv);
        setDiffLeft(vv[0]?.id ?? null);
        setDiffRight(vv[1]?.id ?? vv[0]?.id ?? null);
    };
    useEffect(() => { refresh().catch((e) => setStatus(String(e))); }, []);
    const saveType = async () => {
        const payload = { name: typeName, description: typeDescription || null, fieldsJson: j(typeFields), by: 'admin' };
        if (typeId) {
            await sdk.updateContentType({ id: typeId, ...payload });
        }
        else {
            await sdk.createContentType({ siteId, ...payload });
        }
        await refresh(siteId);
        setStatus('Content type saved');
    };
    const createItem = async () => {
        if (!typeId)
            return;
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
        if (id)
            await loadItem(id);
    };
    const saveDraft = async () => {
        if (!selectedItemId)
            return;
        let target = draft;
        if (!target) {
            const d = await sdk.createDraftVersion({ contentItemId: selectedItemId, by: 'admin' });
            target = (d.createDraftVersion ?? null);
            setDraft(target);
        }
        if (!target)
            return;
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
        setDraft((next.updateDraftVersion ?? null));
        await loadItem(selectedItemId);
        setStatus('Draft saved');
    };
    const publish = async () => {
        if (!draft || !selectedItemId)
            return;
        await sdk.publishVersion({ versionId: draft.id, expectedVersionNumber: draft.versionNumber, by: 'admin' });
        await loadItem(selectedItemId);
        await refresh(siteId);
        setStatus('Published');
    };
    const saveRoute = async () => {
        if (!routeItemId || !routeMarket || !routeLocale || !routeSlug)
            return;
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
    return (_jsx("main", { className: "admin-shell", children: _jsxs(Card, { title: "CMS Core Admin", subTitle: "Types, items, versions, templates, routes", children: [_jsxs("section", { className: "topbar-grid", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Site" }), _jsx(Dropdown, { value: siteId, options: sites.map((s) => ({ label: `${s.id}: ${s.name}`, value: s.id })), onChange: (e) => refresh(Number(e.value)).catch((err) => setStatus(String(err))) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Market" }), _jsx(Dropdown, { value: market, options: marketOptions, onChange: (e) => setMarket(e.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Locale" }), _jsx(Dropdown, { value: locale, options: localeOptions, onChange: (e) => setLocale(e.value) })] })] }), _jsx("h3", { children: "Content Tree" }), _jsxs(TreeTable, { value: treeNodes, children: [_jsx(Column, { field: "slug", header: "Slug", expander: true }), _jsx(Column, { field: "item", header: "Item" }), _jsx(Column, { field: "ml", header: "Market/Locale" })] }), _jsx("h3", { children: "Content List" }), _jsxs(DataTable, { value: items, size: "small", children: [_jsx(Column, { field: "id", header: "ID" }), _jsx(Column, { field: "contentTypeId", header: "Type" }), _jsx(Column, { field: "currentDraftVersionId", header: "Draft" }), _jsx(Column, { field: "currentPublishedVersionId", header: "Published" }), _jsx(Column, { header: "Edit", body: (row) => _jsx(Button, { size: "small", text: true, label: "Edit", onClick: () => loadItem(row.id).catch((err) => setStatus(String(err))) }) })] }), _jsx("h3", { children: "ContentType Builder" }), _jsxs("div", { className: "form-grid", children: [_jsx(Dropdown, { value: typeId, options: types.map((t) => ({ label: `${t.name} (#${t.id})`, value: t.id })), onChange: (e) => {
                                const t = types.find((x) => x.id === Number(e.value));
                                setTypeId(Number(e.value));
                                setTypeName(t?.name ?? '');
                                setTypeDescription(t?.description ?? '');
                                setTypeFields(p(t?.fieldsJson ?? '[]', []));
                            }, placeholder: "Select type" }), _jsx(InputText, { value: typeName, onChange: (e) => setTypeName(e.target.value), placeholder: "Name" }), _jsx(InputText, { value: typeDescription, onChange: (e) => setTypeDescription(e.target.value), placeholder: "Description" }), _jsx(Button, { label: "Add Field", onClick: () => setTypeFields((prev) => [...prev, { key: 'field', label: 'Field', type: 'text' }]) })] }), _jsxs(DataTable, { value: typeFields, size: "small", children: [_jsx(Column, { header: "Key", body: (row, o) => _jsx(InputText, { value: row.key, onChange: (e) => setTypeFields((prev) => prev.map((x, i) => i === o.rowIndex ? { ...x, key: e.target.value } : x)) }) }), _jsx(Column, { header: "Label", body: (row, o) => _jsx(InputText, { value: row.label, onChange: (e) => setTypeFields((prev) => prev.map((x, i) => i === o.rowIndex ? { ...x, label: e.target.value } : x)) }) }), _jsx(Column, { header: "Type", body: (row, o) => _jsx(Dropdown, { value: row.type, options: [{ label: 'text', value: 'text' }, { label: 'richtext', value: 'richtext' }, { label: 'number', value: 'number' }, { label: 'boolean', value: 'boolean' }], onChange: (e) => setTypeFields((prev) => prev.map((x, i) => i === o.rowIndex ? { ...x, type: e.value } : x)) }) })] }), _jsxs("div", { className: "inline-actions", children: [_jsx(Button, { label: "Save Type", onClick: () => saveType().catch((err) => setStatus(String(err))) }), _jsx(Button, { label: "Create Item", severity: "secondary", onClick: () => createItem().catch((err) => setStatus(String(err))) })] }), _jsx("h3", { children: "Content Editor" }), _jsxs("div", { className: "form-grid", children: [_jsx(Dropdown, { value: selectedItemId, options: items.map((i) => ({ label: `#${i.id}`, value: i.id })), onChange: (e) => loadItem(Number(e.value)).catch((err) => setStatus(String(err))), placeholder: "Item" }), _jsx(Button, { label: "Issue Preview Token", onClick: () => sdk.issuePreviewToken({ contentItemId: selectedItemId ?? 0 }).then((r) => setStatus(r.issuePreviewToken?.token ?? '')).catch((err) => setStatus(String(err))) })] }), selectedDefs.map((f) => (_jsxs("div", { className: "form-row", children: [_jsx("label", { children: f.label }), f.type === 'boolean' ? _jsx(Checkbox, { checked: Boolean(fields[f.key]), onChange: (e) => setFields((prev) => ({ ...prev, [f.key]: Boolean(e.checked) })) }) : f.type === 'richtext' ? _jsx(InputTextarea, { rows: 3, value: String(fields[f.key] ?? ''), onChange: (e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value })) }) : _jsx(InputText, { value: String(fields[f.key] ?? ''), onChange: (e) => setFields((prev) => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })) })] }, f.key))), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Composition JSON" }), _jsx(InputTextarea, { rows: 3, value: compositionJson, onChange: (e) => setCompositionJson(e.target.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Components JSON" }), _jsx(InputTextarea, { rows: 4, value: componentsJson, onChange: (e) => setComponentsJson(e.target.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Metadata JSON" }), _jsx(InputTextarea, { rows: 2, value: metadataJson, onChange: (e) => setMetadataJson(e.target.value) })] }), _jsxs("div", { className: "inline-actions", children: [_jsx(Button, { label: "Save Draft", onClick: () => saveDraft().catch((err) => setStatus(String(err))) }), _jsx(Button, { label: "Publish", severity: "success", onClick: () => publish().catch((err) => setStatus(String(err))) })] }), _jsx("h4", { children: "Version History" }), _jsxs(DataTable, { value: versions, size: "small", children: [_jsx(Column, { field: "id", header: "ID" }), _jsx(Column, { field: "versionNumber", header: "Version" }), _jsx(Column, { field: "state", header: "State" }), _jsx(Column, { field: "comment", header: "Comment" }), _jsx(Column, { header: "Rollback", body: (row) => _jsx(Button, { text: true, size: "small", label: "Rollback", onClick: () => sdk.rollbackToVersion({ contentItemId: selectedItemId ?? 0, versionId: row.id, by: 'admin' }).then(async () => { if (selectedItemId) {
                                    await loadItem(selectedItemId);
                                } }).catch((err) => setStatus(String(err))) }) })] }), _jsxs("div", { className: "form-grid", children: [_jsx(Dropdown, { value: diffLeft, options: versions.map((v) => ({ label: `v${v.versionNumber}`, value: v.id })), onChange: (e) => setDiffLeft(Number(e.value)) }), _jsx(Dropdown, { value: diffRight, options: versions.map((v) => ({ label: `v${v.versionNumber}`, value: v.id })), onChange: (e) => setDiffRight(Number(e.value)) }), _jsx(Button, { label: "Diff", onClick: () => sdk.diffVersions({ leftVersionId: diffLeft ?? 0, rightVersionId: diffRight ?? 0 }).then((r) => setDiffOut(j(r.diffVersions ?? {}))).catch((err) => setStatus(String(err))) })] }), _jsx("pre", { children: diffOut }), _jsx("h3", { children: "Template Editor" }), _jsxs(DataTable, { value: templates, size: "small", children: [_jsx(Column, { field: "id", header: "ID" }), _jsx(Column, { field: "name", header: "Name" }), _jsx(Column, { header: "Edit", body: (r) => _jsx(Button, { text: true, size: "small", label: "Edit", onClick: () => { setTemplateId(r.id); setTemplateName(r.name); setTemplateComp(r.compositionJson); setTemplateComps(r.componentsJson); setTemplateConstraints(r.constraintsJson); } }) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Name" }), _jsx(InputText, { value: templateName, onChange: (e) => setTemplateName(e.target.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Composition" }), _jsx(InputTextarea, { rows: 3, value: templateComp, onChange: (e) => setTemplateComp(e.target.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Components" }), _jsx(InputTextarea, { rows: 3, value: templateComps, onChange: (e) => setTemplateComps(e.target.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Constraints" }), _jsx(InputTextarea, { rows: 2, value: templateConstraints, onChange: (e) => setTemplateConstraints(e.target.value) })] }), _jsxs("div", { className: "inline-actions", children: [_jsx(Button, { label: "Save Template", onClick: () => (templateId ? sdk.updateTemplate({ id: templateId, name: templateName, compositionJson: templateComp, componentsJson: templateComps, constraintsJson: templateConstraints }) : sdk.createTemplate({ siteId, name: templateName, compositionJson: templateComp, componentsJson: templateComps, constraintsJson: templateConstraints })).then(() => refresh(siteId)).catch((err) => setStatus(String(err))) }), _jsx(Button, { label: "Reconcile", severity: "secondary", onClick: () => sdk.reconcileTemplate({ templateId: templateId ?? 0 }).then((r) => setStatus(j(r.reconcileTemplate ?? {}))).catch((err) => setStatus(String(err))) })] }), _jsx("h3", { children: "Route Editor" }), _jsxs(DataTable, { value: routes, size: "small", children: [_jsx(Column, { field: "id", header: "ID" }), _jsx(Column, { field: "slug", header: "Slug" }), _jsx(Column, { field: "marketCode", header: "Market" }), _jsx(Column, { field: "localeCode", header: "Locale" }), _jsx(Column, { field: "contentItemId", header: "Item" }), _jsx(Column, { header: "Edit", body: (r) => _jsx(Button, { text: true, size: "small", label: "Edit", onClick: () => { setRouteId(r.id); setRouteItemId(r.contentItemId); setRouteMarket(r.marketCode); setRouteLocale(r.localeCode); setRouteSlug(r.slug); setRouteCanonical(r.isCanonical); } }) })] }), _jsxs("div", { className: "form-grid", children: [_jsx(Dropdown, { value: routeItemId, options: items.map((i) => ({ label: `#${i.id}`, value: i.id })), onChange: (e) => setRouteItemId(Number(e.value)), placeholder: "Item" }), _jsx(Dropdown, { value: routeMarket, options: marketOptions, onChange: (e) => setRouteMarket(e.value), placeholder: "Market" }), _jsx(Dropdown, { value: routeLocale, options: routeLocaleOptions, onChange: (e) => setRouteLocale(e.value), placeholder: "Locale" }), _jsx(InputText, { value: routeSlug, onChange: (e) => setRouteSlug(e.target.value), placeholder: "slug" }), _jsxs("label", { children: [_jsx(Checkbox, { checked: routeCanonical, onChange: (e) => setRouteCanonical(Boolean(e.checked)) }), " Canonical"] }), _jsx(Button, { label: "Save Route", onClick: () => saveRoute().catch((err) => setStatus(String(err))) })] }), _jsx("h3", { children: "Status" }), _jsx("pre", { children: status })] }) }));
}
