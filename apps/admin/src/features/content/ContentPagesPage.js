import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { TabPanel, TabView } from 'primereact/tabview';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
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
const parseJson = (value, fallback) => {
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
};
export function ContentPagesPage() {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const { siteId, marketCode, localeCode, combos } = useAdminContext();
    const [types, setTypes] = useState([]);
    const [items, setItems] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [versions, setVersions] = useState([]);
    const [draft, setDraft] = useState(null);
    const [fields, setFields] = useState({});
    const [compositionJson, setCompositionJson] = useState('{"areas":[{"name":"main","components":[]}]}');
    const [componentsJson, setComponentsJson] = useState('{}');
    const [metadataJson, setMetadataJson] = useState('{}');
    const [searchText, setSearchText] = useState('');
    const [status, setStatus] = useState('');
    const [previewToken, setPreviewToken] = useState('');
    const [routeDraft, setRouteDraft] = useState({
        slug: '',
        marketCode,
        localeCode,
        isCanonical: true
    });
    const [variantSets, setVariantSets] = useState([]);
    const [variants, setVariants] = useState([]);
    const [variantSetId, setVariantSetId] = useState(null);
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
    const fieldDefs = useMemo(() => parseJson(selectedType?.fieldsJson ?? '[]', []), [selectedType]);
    const filteredItems = useMemo(() => {
        const text = searchText.trim().toLowerCase();
        if (!text) {
            return items;
        }
        return items.filter((entry) => {
            const hasRoute = routes.some((route) => route.contentItemId === entry.id &&
                route.slug.toLowerCase().includes(text));
            return hasRoute || String(entry.id).includes(text);
        });
    }, [items, routes, searchText]);
    const treeNodes = useMemo(() => routes
        .filter((entry) => entry.marketCode === marketCode && entry.localeCode === localeCode)
        .map((route) => ({
        key: String(route.id),
        data: {
            slug: route.slug,
            contentItemId: route.contentItemId
        }
    })), [routes, marketCode, localeCode]);
    const activeCombos = useMemo(() => combos
        .filter((entry) => entry.active)
        .map((entry) => ({ label: `${entry.marketCode}/${entry.localeCode}`, value: `${entry.marketCode}::${entry.localeCode}` })), [combos]);
    const refresh = async () => {
        const [typesRes, itemsRes, routesRes] = await Promise.all([
            sdk.listContentTypes({ siteId }),
            sdk.listContentItems({ siteId }),
            sdk.listRoutes({ siteId, marketCode: null, localeCode: null })
        ]);
        setTypes((typesRes.listContentTypes ?? []));
        setItems((itemsRes.listContentItems ?? []));
        setRoutes((routesRes.listRoutes ?? []));
    };
    const loadItem = async (id) => {
        setSelectedItemId(id);
        const detail = await sdk.getContentItemDetail({ contentItemId: id });
        const activeVersion = (detail.getContentItemDetail?.currentDraftVersion ?? detail.getContentItemDetail?.currentPublishedVersion ?? null);
        setDraft(activeVersion);
        if (activeVersion) {
            setFields(parseJson(activeVersion.fieldsJson, {}));
            setCompositionJson(activeVersion.compositionJson);
            setComponentsJson(activeVersion.componentsJson);
            setMetadataJson(activeVersion.metadataJson);
            setVariantDraft((prev) => ({ ...prev, contentVersionId: activeVersion.id }));
        }
        const versionsRes = await sdk.listVersions({ contentItemId: id });
        setVersions((versionsRes.listVersions ?? []));
        const setsRes = await sdk.listVariantSets({ siteId, contentItemId: id, marketCode, localeCode });
        const sets = (setsRes.listVariantSets ?? []);
        setVariantSets(sets);
        const setId = sets[0]?.id ?? null;
        setVariantSetId(setId);
        if (setId) {
            const variantsRes = await sdk.listVariants({ variantSetId: setId });
            setVariants((variantsRes.listVariants ?? []));
        }
        else {
            setVariants([]);
        }
    };
    useEffect(() => {
        refresh().catch((error) => setStatus(String(error)));
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
        setDraft((updated.updateDraftVersion ?? null));
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
    const rightPanel = !selectedItemId ? (_jsx(EmptyState, { title: "No page selected", description: "Pick a page from the tree or search results.", actionLabel: "Create Page", onAction: () => createPage().catch((e) => setStatus(String(e))) })) : (_jsxs(TabView, { children: [_jsxs(TabPanel, { header: "Edit", children: [fieldDefs.map((def) => (_jsxs("div", { className: "form-row", children: [_jsx("label", { children: def.label }), def.type === 'boolean' ? (_jsx(Checkbox, { checked: Boolean(fields[def.key]), onChange: (event) => setFields((prev) => ({ ...prev, [def.key]: Boolean(event.checked) })) })) : def.type === 'richtext' ? (_jsx(InputTextarea, { rows: 4, value: String(fields[def.key] ?? ''), onChange: (event) => setFields((prev) => ({ ...prev, [def.key]: event.target.value })) })) : (_jsx(InputText, { value: String(fields[def.key] ?? ''), onChange: (event) => setFields((prev) => ({ ...prev, [def.key]: def.type === 'number' ? Number(event.target.value) : event.target.value })) }))] }, def.key))), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Composition JSON" }), _jsx(InputTextarea, { rows: 3, value: compositionJson, onChange: (e) => setCompositionJson(e.target.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Components JSON" }), _jsx(InputTextarea, { rows: 3, value: componentsJson, onChange: (e) => setComponentsJson(e.target.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Metadata JSON" }), _jsx(InputTextarea, { rows: 2, value: metadataJson, onChange: (e) => setMetadataJson(e.target.value) })] })] }), _jsxs(TabPanel, { header: "Routes", children: [_jsxs(DataTable, { value: routes.filter((route) => route.contentItemId === selectedItemId), size: "small", children: [_jsx(Column, { field: "slug", header: "Slug" }), _jsx(Column, { field: "marketCode", header: "Market" }), _jsx(Column, { field: "localeCode", header: "Locale" }), _jsx(Column, { field: "isCanonical", header: "Canonical", body: (row) => (row.isCanonical ? 'Yes' : 'No') }), _jsx(Column, { header: "Edit", body: (row) => _jsx(Button, { text: true, label: "Edit", onClick: () => setRouteDraft({ id: row.id, slug: row.slug, marketCode: row.marketCode, localeCode: row.localeCode, isCanonical: row.isCanonical }) }) })] }), _jsxs("div", { className: "form-grid", children: [_jsx(InputText, { value: routeDraft.slug, onChange: (e) => setRouteDraft((prev) => ({ ...prev, slug: e.target.value })), placeholder: "slug" }), _jsx(Dropdown, { value: `${routeDraft.marketCode}::${routeDraft.localeCode}`, options: activeCombos, onChange: (event) => {
                                    const [nextMarket, nextLocale] = String(event.value).split('::');
                                    setRouteDraft((prev) => ({
                                        ...prev,
                                        marketCode: nextMarket ?? prev.marketCode,
                                        localeCode: nextLocale ?? prev.localeCode
                                    }));
                                } }), _jsxs("label", { children: [_jsx(Checkbox, { checked: routeDraft.isCanonical, onChange: (event) => setRouteDraft((prev) => ({ ...prev, isCanonical: Boolean(event.checked) })) }), " Canonical"] }), _jsx(Button, { label: "Save Route", onClick: () => sdk
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
                                    .catch((err) => setStatus(String(err))) })] })] }), _jsx(TabPanel, { header: "Versions", children: _jsxs(DataTable, { value: versions, size: "small", children: [_jsx(Column, { field: "versionNumber", header: "Version" }), _jsx(Column, { field: "state", header: "State" }), _jsx(Column, { field: "comment", header: "Comment" }), _jsx(Column, { header: "Rollback", body: (row) => (_jsx(Button, { text: true, label: "Rollback", onClick: () => sdk
                                    .rollbackToVersion({ contentItemId: selectedItemId, versionId: row.id, by: 'admin' })
                                    .then(() => loadItem(selectedItemId)) })) })] }) }), _jsxs(TabPanel, { header: "Variants", children: [_jsxs("div", { className: "form-grid", children: [_jsx(Dropdown, { value: variantSetId, options: variantSets.map((entry) => ({ label: `Set #${entry.id}`, value: entry.id })), onChange: (event) => {
                                    const id = Number(event.value);
                                    setVariantSetId(id);
                                    sdk.listVariants({ variantSetId: id }).then((res) => setVariants((res.listVariants ?? [])));
                                }, placeholder: "Variant set" }), _jsx(Button, { label: "Create/Update Variant Set", onClick: () => sdk
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
                                }) })] }), _jsxs(DataTable, { value: variants, size: "small", children: [_jsx(Column, { field: "key", header: "Key" }), _jsx(Column, { field: "priority", header: "Priority" }), _jsx(Column, { field: "state", header: "State" }), _jsx(Column, { field: "trafficAllocation", header: "Traffic" }), _jsx(Column, { field: "contentVersionId", header: "Version" })] }), _jsxs("div", { className: "form-grid", children: [_jsx(InputText, { value: variantDraft.key, onChange: (e) => setVariantDraft((prev) => ({ ...prev, key: e.target.value })), placeholder: "key" }), _jsx(InputText, { value: String(variantDraft.priority), onChange: (e) => setVariantDraft((prev) => ({ ...prev, priority: Number(e.target.value || '0') })), placeholder: "priority" }), _jsx(InputText, { value: String(variantDraft.trafficAllocation), onChange: (e) => setVariantDraft((prev) => ({ ...prev, trafficAllocation: Number(e.target.value || '0') })), placeholder: "traffic" }), _jsx(Dropdown, { value: variantDraft.contentVersionId, options: versions.map((entry) => ({ label: `v${entry.versionNumber}`, value: entry.id })), onChange: (e) => setVariantDraft((prev) => ({ ...prev, contentVersionId: Number(e.value) })), placeholder: "version" })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Rule JSON" }), _jsx(InputTextarea, { rows: 4, value: variantDraft.ruleJson, onChange: (e) => setVariantDraft((prev) => ({ ...prev, ruleJson: e.target.value })) })] }), _jsx(Button, { label: "Save Variant", onClick: () => variantSetId
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
                            : Promise.resolve() })] }), _jsxs(TabPanel, { header: "Preview", children: [_jsxs("div", { className: "form-grid", children: [_jsx(InputText, { value: previewToken, onChange: (event) => setPreviewToken(event.target.value), placeholder: "preview token" }), _jsx(Button, { label: "Issue Preview Token", onClick: () => sdk.issuePreviewToken({ contentItemId: selectedItemId }).then((res) => setPreviewToken(res.issuePreviewToken?.token ?? '')) })] }), _jsx("iframe", { title: "Visivic Preview", src: `http://localhost:3000/preview?contentItemId=${selectedItemId}&siteId=${siteId}&market=${marketCode}&locale=${localeCode}&token=${encodeURIComponent(previewToken)}`, style: { width: '100%', height: 500, border: '1px solid #cbd5e1', borderRadius: 8 } })] }), _jsx(TabPanel, { header: "Raw JSON", children: _jsx("pre", { children: JSON.stringify({ fields, compositionJson: parseJson(compositionJson, {}), componentsJson: parseJson(componentsJson, {}), metadataJson: parseJson(metadataJson, {}) }, null, 2) }) })] }));
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Content Pages", subtitle: "Tree navigation + editor tabs", actions: _jsxs("div", { className: "inline-actions", children: [_jsx(Button, { label: "Create Page", onClick: () => createPage().catch((e) => setStatus(String(e))) }), _jsx(Button, { label: "Save Draft", severity: "secondary", onClick: () => saveDraft().catch((e) => setStatus(String(e))), disabled: !draft }), _jsx(Button, { label: "Publish", severity: "success", onClick: () => publish().catch((e) => setStatus(String(e))), disabled: !draft })] }) }), _jsx(SplitView, { left: _jsxs(TabView, { children: [_jsx(TabPanel, { header: "Tree", children: _jsxs(TreeTable, { value: treeNodes, selectionMode: "single", onSelectionChange: (event) => {
                                    const key = event.value?.key;
                                    const route = routes.find((entry) => String(entry.id) === key);
                                    if (route) {
                                        loadItem(route.contentItemId).catch((error) => setStatus(String(error)));
                                    }
                                }, children: [_jsx(Column, { field: "slug", header: "Slug", expander: true }), _jsx(Column, { field: "contentItemId", header: "Item" })] }) }), _jsxs(TabPanel, { header: "Search", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Find by route slug or item id" }), _jsx(InputText, { value: searchText, onChange: (event) => setSearchText(event.target.value), placeholder: "Search pages" })] }), _jsxs(DataTable, { value: filteredItems, size: "small", children: [_jsx(Column, { field: "id", header: "Item" }), _jsx(Column, { field: "contentTypeId", header: "Type" }), _jsx(Column, { header: "Open", body: (row) => _jsx(Button, { text: true, label: "Open", onClick: () => loadItem(row.id).catch((error) => setStatus(String(error))) }) })] })] })] }), right: rightPanel }), status ? _jsx("pre", { children: status }) : null] }));
}
