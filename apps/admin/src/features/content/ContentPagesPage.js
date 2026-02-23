import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TabPanel, TabView } from 'primereact/tabview';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { AutoComplete } from 'primereact/autocomplete';
import { Dialog } from 'primereact/dialog';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { buildLocalizedPath } from '@contenthead/shared';
import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { SplitView } from '../../components/common/SplitView';
import { MarketLocalePicker } from '../../components/inputs/MarketLocalePicker';
import { SlugEditor } from '../../components/inputs/SlugEditor';
import { useUi } from '../../app/UiContext';
import { parseFieldsJson } from '../schema/fieldValidationUi';
import { FieldRenderer } from './fieldRenderers/FieldRenderer';
import { validationMessage } from './fieldRenderers/rendererRegistry';
import { ComponentList } from './components/ComponentList';
import { ComponentInspector } from './components/ComponentInspector';
import { componentRegistry, getComponentRegistryEntry } from './components/componentRegistry';
const parseJson = (value, fallback) => {
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
};
function buildContentEditorUrl(contentItemId, marketCode, localeCode) {
    return `/content/pages/${contentItemId}?market=${encodeURIComponent(marketCode)}&locale=${encodeURIComponent(localeCode)}`;
}
export function ContentPagesPage() {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const { contentItemId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast } = useUi();
    const { siteId, marketCode, localeCode, combos, sites } = useAdminContext();
    const selectedItemId = Number(contentItemId ?? 0) || null;
    const [types, setTypes] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [templateSearch, setTemplateSearch] = useState('');
    const [items, setItems] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [versions, setVersions] = useState([]);
    const [draft, setDraft] = useState(null);
    const [fields, setFields] = useState({});
    const [compositionJson, setCompositionJson] = useState('{"areas":[{"name":"main","components":[]}]}');
    const [componentsJson, setComponentsJson] = useState('{}');
    const [metadataJson, setMetadataJson] = useState('{}');
    const [searchText, setSearchText] = useState('');
    const [status, setStatus] = useState('');
    const [loadingItem, setLoadingItem] = useState(false);
    const [previewToken, setPreviewToken] = useState('');
    const [selectedContentTypeId, setSelectedContentTypeId] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
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
    const [rawEditable, setRawEditable] = useState(false);
    const [selectedComponentId, setSelectedComponentId] = useState(null);
    const [showAddComponent, setShowAddComponent] = useState(false);
    const [newComponentType, setNewComponentType] = useState(componentRegistry[0]?.id ?? 'hero');
    const [newComponentArea, setNewComponentArea] = useState('main');
    const selectedType = useMemo(() => {
        const item = items.find((entry) => entry.id === selectedItemId);
        return types.find((entry) => entry.id === item?.contentTypeId) ?? null;
    }, [items, types, selectedItemId]);
    const fieldDefs = useMemo(() => parseFieldsJson(selectedType?.fieldsJson ?? '[]'), [selectedType]);
    const filteredItems = useMemo(() => {
        const text = searchText.trim().toLowerCase();
        if (!text) {
            return items;
        }
        return items.filter((entry) => {
            const hasRoute = routes.some((route) => route.contentItemId === entry.id && route.slug.toLowerCase().includes(text));
            return hasRoute || String(entry.id).includes(text);
        });
    }, [items, routes, searchText]);
    const treeNodes = useMemo(() => {
        return routes
            .filter((entry) => entry.marketCode === marketCode && entry.localeCode === localeCode)
            .map((route) => ({
            key: String(route.id),
            data: { slug: route.slug, contentItemId: route.contentItemId }
        }));
    }, [routes, marketCode, localeCode]);
    const selectedRouteKey = useMemo(() => {
        if (!selectedItemId) {
            return null;
        }
        return String(routes.find((entry) => entry.contentItemId === selectedItemId && entry.marketCode === marketCode && entry.localeCode === localeCode)?.id ?? '');
    }, [routes, selectedItemId, marketCode, localeCode]);
    const templateSuggestions = useMemo(() => {
        const query = templateSearch.trim().toLowerCase();
        if (!query) {
            return templates;
        }
        return templates.filter((entry) => entry.name.toLowerCase().includes(query));
    }, [templates, templateSearch]);
    const site = sites.find((entry) => entry.id === siteId);
    const refresh = async () => {
        const [typesRes, itemsRes, routesRes, templatesRes] = await Promise.all([
            sdk.listContentTypes({ siteId }),
            sdk.listContentItems({ siteId }),
            sdk.listRoutes({ siteId, marketCode: null, localeCode: null }),
            sdk.listTemplates({ siteId })
        ]);
        const nextTypes = (typesRes.listContentTypes ?? []);
        setTypes(nextTypes);
        setSelectedContentTypeId((prev) => prev ?? nextTypes[0]?.id ?? null);
        setItems((itemsRes.listContentItems ?? []));
        setRoutes((routesRes.listRoutes ?? []));
        setTemplates((templatesRes.listTemplates ?? []));
    };
    const loadItem = async (id) => {
        setLoadingItem(true);
        try {
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
        }
        finally {
            setLoadingItem(false);
        }
    };
    useEffect(() => {
        refresh().catch((error) => setStatus(String(error)));
    }, [siteId]);
    useEffect(() => {
        setRouteDraft((prev) => ({ ...prev, marketCode, localeCode }));
    }, [marketCode, localeCode]);
    useEffect(() => {
        const marketQuery = searchParams.get('market');
        const localeQuery = searchParams.get('locale');
        if (marketQuery || localeQuery) {
            setRouteDraft((prev) => ({
                ...prev,
                marketCode: marketQuery ?? prev.marketCode,
                localeCode: localeQuery ?? prev.localeCode
            }));
        }
    }, [searchParams]);
    useEffect(() => {
        if (!selectedItemId) {
            setDraft(null);
            setVersions([]);
            setVariantSets([]);
            setVariants([]);
            return;
        }
        loadItem(selectedItemId).catch((error) => setStatus(String(error)));
    }, [selectedItemId, siteId, marketCode, localeCode]);
    const createPage = async () => {
        const contentTypeId = selectedContentTypeId ?? types[0]?.id;
        if (!contentTypeId) {
            setStatus('Create a content type first.');
            return;
        }
        const created = await sdk.createContentItem({
            siteId,
            contentTypeId,
            by: 'admin',
            initialFieldsJson: '{}',
            initialCompositionJson: selectedTemplate?.compositionJson ?? '{"areas":[{"name":"main","components":[]}]}',
            initialComponentsJson: selectedTemplate?.componentsJson ?? '{}'
        });
        const id = created.createContentItem?.id;
        await refresh();
        if (id) {
            navigate(buildContentEditorUrl(id, marketCode, localeCode));
            toast({ severity: 'success', summary: 'Page created', detail: `Content item #${id}` });
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
            toast({ severity: 'success', summary: 'Draft saved' });
        }
    };
    const publish = async () => {
        if (!draft) {
            return;
        }
        await sdk.publishVersion({ versionId: draft.id, expectedVersionNumber: draft.versionNumber, by: 'admin' });
        if (selectedItemId) {
            await loadItem(selectedItemId);
            toast({ severity: 'success', summary: 'Version published' });
        }
    };
    const composition = useMemo(() => {
        const parsed = parseJson(compositionJson, { areas: [] });
        const areas = Array.isArray(parsed.areas) ? parsed.areas : [];
        return { areas };
    }, [compositionJson]);
    const componentMap = useMemo(() => {
        const parsed = parseJson(componentsJson, {});
        const mapped = {};
        for (const [id, value] of Object.entries(parsed)) {
            mapped[id] = {
                id,
                type: typeof value?.type === 'string' ? value.type : 'text_block',
                props: value?.props && typeof value.props === 'object' ? value.props : {}
            };
        }
        return mapped;
    }, [componentsJson]);
    const selectedComponent = selectedComponentId ? componentMap[selectedComponentId] ?? null : null;
    const updateComponentMap = (next) => {
        const normalized = Object.fromEntries(Object.entries(next).map(([id, value]) => [id, { type: value.type, props: value.props }]));
        setComponentsJson(JSON.stringify(normalized));
    };
    const updateComposition = (next) => {
        setCompositionJson(JSON.stringify(next));
    };
    const moveComponent = (id, direction) => {
        const nextAreas = composition.areas.map((area) => {
            const index = area.components.findIndex((entry) => entry === id);
            if (index < 0) {
                return area;
            }
            const target = index + direction;
            if (target < 0 || target >= area.components.length) {
                return area;
            }
            const nextComponents = [...area.components];
            const [current] = nextComponents.splice(index, 1);
            if (!current) {
                return area;
            }
            nextComponents.splice(target, 0, current);
            return { ...area, components: nextComponents };
        });
        updateComposition({ areas: nextAreas });
    };
    const removeComponent = (id) => {
        const nextAreas = composition.areas.map((area) => ({ ...area, components: area.components.filter((entry) => entry !== id) }));
        const nextMap = { ...componentMap };
        delete nextMap[id];
        updateComposition({ areas: nextAreas });
        updateComponentMap(nextMap);
        if (selectedComponentId === id) {
            setSelectedComponentId(null);
        }
    };
    const addComponent = () => {
        const entry = getComponentRegistryEntry(newComponentType);
        if (!entry) {
            return;
        }
        const id = `${entry.id}_${Date.now()}`;
        const nextMap = { ...componentMap, [id]: { id, type: entry.id, props: { ...entry.defaultProps } } };
        const areas = composition.areas.length > 0 ? composition.areas : [{ name: 'main', components: [] }];
        const hasArea = areas.some((area) => area.name === newComponentArea);
        const nextAreas = (hasArea ? areas : [...areas, { name: newComponentArea, components: [] }]).map((area) => area.name === newComponentArea ? { ...area, components: [...area.components, id] } : area);
        updateComponentMap(nextMap);
        updateComposition({ areas: nextAreas });
        setSelectedComponentId(id);
        setShowAddComponent(false);
    };
    const rightPanel = !selectedItemId ? (_jsx(EmptyState, { title: "No page selected", description: "Pick a page from the tree or search results.", actionLabel: "Create Page", onAction: () => createPage().catch((e) => setStatus(String(e))) })) : (_jsxs(TabView, { children: [_jsxs(TabPanel, { header: "Edit", children: [loadingItem ? _jsxs("div", { className: "status-panel", children: ["Loading content item #", selectedItemId, "..."] }) : null, _jsxs("div", { className: "form-grid", style: { gridTemplateColumns: '1.2fr 1fr' }, children: [_jsxs("div", { className: "content-card", children: [_jsx("h4", { children: "Content Fields" }), fieldDefs.map((def) => {
                                        const message = validationMessage(def, fields[def.key]);
                                        return (_jsxs("div", { className: "form-row", children: [_jsxs("label", { children: [def.label, def.required ? ' *' : ''] }), _jsx(FieldRenderer, { field: def, value: fields[def.key], onChange: (value) => setFields((prev) => ({ ...prev, [def.key]: value })), siteId: siteId, token: token }), message ? _jsx("small", { className: "error-text", children: message }) : null, def.description ? _jsx("small", { className: "muted", children: def.description }) : null] }, def.key));
                                    })] }), _jsxs("div", { className: "content-card", children: [_jsxs("div", { className: "inline-actions", children: [_jsx("h4", { style: { margin: 0 }, children: "Composition" }), _jsx(Button, { label: "Add Component", onClick: () => setShowAddComponent(true) })] }), _jsx(ComponentList, { areas: composition.areas, selected: selectedComponentId, onSelect: setSelectedComponentId, onMove: moveComponent, onDelete: removeComponent }), _jsx(ComponentInspector, { component: selectedComponent, onChange: (next) => {
                                            const nextMap = { ...componentMap, [next.id]: next };
                                            updateComponentMap(nextMap);
                                        } })] })] }), _jsx(Accordion, { children: _jsxs(AccordionTab, { header: "Advanced JSON", children: [_jsx("div", { className: "inline-actions", children: _jsx(Button, { label: rawEditable ? 'Lock JSON Editing' : 'Enable JSON Editing', severity: rawEditable ? 'danger' : 'secondary', onClick: () => {
                                            if (!rawEditable) {
                                                const confirmEdit = window.confirm('Enable raw JSON editing? This bypasses visual editors.');
                                                if (!confirmEdit) {
                                                    return;
                                                }
                                            }
                                            setRawEditable((prev) => !prev);
                                        } }) }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Fields JSON" }), _jsx(InputTextarea, { rows: 4, value: JSON.stringify(fields, null, 2), readOnly: true })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Composition JSON" }), _jsx(InputTextarea, { rows: 4, value: compositionJson, onChange: (e) => setCompositionJson(e.target.value), readOnly: !rawEditable })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Components JSON" }), _jsx(InputTextarea, { rows: 4, value: componentsJson, onChange: (e) => setComponentsJson(e.target.value), readOnly: !rawEditable })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Metadata JSON" }), _jsx(InputTextarea, { rows: 3, value: metadataJson, onChange: (e) => setMetadataJson(e.target.value), readOnly: !rawEditable })] })] }) })] }), _jsxs(TabPanel, { header: "Routes", children: [_jsxs(DataTable, { value: routes.filter((route) => route.contentItemId === selectedItemId), size: "small", children: [_jsx(Column, { field: "slug", header: "Slug" }), _jsx(Column, { field: "marketCode", header: "Market" }), _jsx(Column, { field: "localeCode", header: "Locale" }), _jsx(Column, { field: "isCanonical", header: "Canonical", body: (row) => (row.isCanonical ? 'Yes' : 'No') }), _jsx(Column, { header: "Edit", body: (row) => _jsx(Button, { text: true, label: "Edit", onClick: () => setRouteDraft({ id: row.id, slug: row.slug, marketCode: row.marketCode, localeCode: row.localeCode, isCanonical: row.isCanonical }) }) })] }), _jsxs("div", { className: "form-grid", children: [_jsx(MarketLocalePicker, { combos: combos, marketCode: routeDraft.marketCode, localeCode: routeDraft.localeCode, onChange: (value) => setRouteDraft((prev) => ({ ...prev, ...value })) }), _jsx(SlugEditor, { value: routeDraft.slug, onChange: (value) => setRouteDraft((prev) => ({ ...prev, slug: value })) }), _jsxs("label", { children: [_jsx(Checkbox, { checked: routeDraft.isCanonical, onChange: (event) => setRouteDraft((prev) => ({ ...prev, isCanonical: Boolean(event.checked) })) }), " Canonical"] }), _jsx(Button, { label: "Save Route", onClick: () => sdk
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
                                    .catch((err) => setStatus(String(err))) })] })] }), _jsx(TabPanel, { header: "Versions", children: _jsxs(DataTable, { value: versions, size: "small", children: [_jsx(Column, { field: "versionNumber", header: "Version" }), _jsx(Column, { field: "state", header: "State" }), _jsx(Column, { field: "comment", header: "Comment" }), _jsx(Column, { header: "Rollback", body: (row) => _jsx(Button, { text: true, label: "Rollback", onClick: () => sdk.rollbackToVersion({ contentItemId: selectedItemId, versionId: row.id, by: 'admin' }).then(() => loadItem(selectedItemId)) }) })] }) }), _jsxs(TabPanel, { header: "Variants", children: [_jsxs("div", { className: "form-grid", children: [_jsx(Dropdown, { value: variantSetId, options: variantSets.map((entry) => ({ label: `Set #${entry.id}`, value: entry.id })), onChange: (event) => {
                                    const id = Number(event.value);
                                    setVariantSetId(id);
                                    sdk.listVariants({ variantSetId: id }).then((res) => setVariants((res.listVariants ?? [])));
                                }, placeholder: "Variant set" }), _jsx(Button, { label: "Create/Update Variant Set", onClick: () => sdk.upsertVariantSet({ id: variantSetId, siteId, contentItemId: selectedItemId, marketCode, localeCode, active: true, fallbackVariantSetId: null }).then((res) => { const id = res.upsertVariantSet?.id ?? null; setVariantSetId(id); return loadItem(selectedItemId); }) })] }), _jsxs(DataTable, { value: variants, size: "small", children: [_jsx(Column, { field: "key", header: "Key" }), _jsx(Column, { field: "priority", header: "Priority" }), _jsx(Column, { field: "state", header: "State" }), _jsx(Column, { field: "trafficAllocation", header: "Traffic" }), _jsx(Column, { field: "contentVersionId", header: "Version" })] }), _jsxs("div", { className: "form-grid", children: [_jsx(InputText, { value: variantDraft.key, onChange: (e) => setVariantDraft((prev) => ({ ...prev, key: e.target.value })), placeholder: "key" }), _jsx(InputText, { value: String(variantDraft.priority), onChange: (e) => setVariantDraft((prev) => ({ ...prev, priority: Number(e.target.value || '0') })), placeholder: "priority" }), _jsx(InputText, { value: String(variantDraft.trafficAllocation), onChange: (e) => setVariantDraft((prev) => ({ ...prev, trafficAllocation: Number(e.target.value || '0') })), placeholder: "traffic" }), _jsx(Dropdown, { value: variantDraft.contentVersionId, options: versions.map((entry) => ({ label: `v${entry.versionNumber}`, value: entry.id })), onChange: (e) => setVariantDraft((prev) => ({ ...prev, contentVersionId: Number(e.value) })), placeholder: "version" })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Rule JSON" }), _jsx(InputTextarea, { rows: 4, value: variantDraft.ruleJson, onChange: (e) => setVariantDraft((prev) => ({ ...prev, ruleJson: e.target.value })) })] }), _jsx(Button, { label: "Save Variant", onClick: () => (variantSetId ? sdk.upsertVariant({ variantSetId, key: variantDraft.key, priority: variantDraft.priority, state: variantDraft.state, ruleJson: variantDraft.ruleJson, trafficAllocation: variantDraft.trafficAllocation, contentVersionId: variantDraft.contentVersionId }).then(() => loadItem(selectedItemId)) : Promise.resolve()) })] }), _jsxs(TabPanel, { header: "Preview", children: [_jsxs("div", { className: "form-grid", children: [_jsx(InputText, { value: previewToken, onChange: (event) => setPreviewToken(event.target.value), placeholder: "preview token" }), _jsx(Button, { label: "Issue Preview Token", onClick: () => sdk.issuePreviewToken({ contentItemId: selectedItemId }).then((res) => setPreviewToken(res.issuePreviewToken?.token ?? '')) })] }), (() => {
                        const activeRoute = routes.find((entry) => entry.contentItemId === selectedItemId && entry.marketCode === marketCode && entry.localeCode === localeCode);
                        const path = buildLocalizedPath(site?.urlPattern, marketCode, localeCode, activeRoute?.slug ?? '');
                        const url = `http://localhost:3000${path}?siteId=${siteId}&preview=true&previewToken=${encodeURIComponent(previewToken)}`;
                        return _jsx("iframe", { title: "Content Preview", src: url, style: { width: '100%', height: 500, border: '1px solid var(--surface-border)', borderRadius: 8 } });
                    })()] })] }));
    return (_jsxs("div", { className: "pageRoot", children: [_jsx(PageHeader, { title: "Content Pages", subtitle: "URL-driven tree navigation with synchronized editor.", helpTopicKey: "content_pages", askAiContext: "content", askAiPayload: { siteId, marketCode, localeCode, selectedItemId, fields, compositionJson, componentsJson }, onAskAiInsert: (value) => setMetadataJson((prev) => `${prev}\n${value}`.trim()), actions: _jsxs("div", { className: "inline-actions", children: [_jsx(Dropdown, { value: selectedContentTypeId, options: types.map((entry) => ({ label: entry.name, value: entry.id })), onChange: (event) => setSelectedContentTypeId(Number(event.value)), placeholder: "Content type" }), _jsx(AutoComplete, { value: selectedTemplate, suggestions: templateSuggestions, completeMethod: (event) => setTemplateSearch(event.query), field: "name", dropdown: true, onChange: (event) => setSelectedTemplate(event.value ?? null), placeholder: "Template" }), _jsx(Button, { label: "Create Page", onClick: () => createPage().catch((e) => setStatus(String(e))) }), _jsx(Button, { label: "Save Draft", severity: "secondary", onClick: () => saveDraft().catch((e) => setStatus(String(e))), disabled: !draft }), _jsx(Button, { label: "Publish", severity: "success", onClick: () => publish().catch((e) => setStatus(String(e))), disabled: !draft })] }) }), _jsx(SplitView, { left: _jsxs(TabView, { children: [_jsx(TabPanel, { header: "Tree", children: _jsxs(TreeTable, { value: treeNodes, selectionMode: "single", selectionKeys: selectedRouteKey ?? undefined, onSelectionChange: (event) => {
                                    const value = event.value;
                                    const key = typeof value === 'string' ? value : String(Object.keys(value ?? {})[0] ?? '');
                                    const route = routes.find((entry) => String(entry.id) === key);
                                    if (route) {
                                        navigate(buildContentEditorUrl(route.contentItemId, marketCode, localeCode));
                                    }
                                }, children: [_jsx(Column, { field: "slug", header: "Slug", expander: true }), _jsx(Column, { field: "contentItemId", header: "Item" })] }) }), _jsxs(TabPanel, { header: "Search", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Find by route slug or item id" }), _jsx(InputText, { value: searchText, onChange: (event) => setSearchText(event.target.value), placeholder: "Search pages" })] }), _jsxs(DataTable, { value: filteredItems, size: "small", children: [_jsx(Column, { field: "id", header: "Item" }), _jsx(Column, { field: "contentTypeId", header: "Type" }), _jsx(Column, { header: "Open", body: (row) => _jsx(Button, { text: true, label: "Open", onClick: () => navigate(buildContentEditorUrl(row.id, marketCode, localeCode)) }) })] })] })] }), right: rightPanel }), _jsxs(Dialog, { header: "Add Component", visible: showAddComponent, onHide: () => setShowAddComponent(false), style: { width: '30rem' }, children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Component Type" }), _jsx(Dropdown, { value: newComponentType, options: componentRegistry.map((entry) => ({ label: entry.label, value: entry.id })), onChange: (event) => setNewComponentType(String(event.value)), filter: true })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Area" }), _jsx(Dropdown, { value: newComponentArea, options: (composition.areas.length > 0 ? composition.areas : [{ name: 'main', components: [] }]).map((area) => ({ label: area.name, value: area.name })), onChange: (event) => setNewComponentArea(String(event.value)), editable: true })] }), _jsxs("div", { className: "inline-actions", style: { marginTop: '0.75rem' }, children: [_jsx(Button, { label: "Cancel", text: true, onClick: () => setShowAddComponent(false) }), _jsx(Button, { label: "Add", onClick: addComponent })] })] }), status ? _jsx("div", { className: "status-panel", children: _jsx("pre", { children: status }) }) : null] }));
}
