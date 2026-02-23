import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
import { RuleEditorDialog } from '../../components/rules/RuleEditorDialog';
export function VariantsPage() {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const { siteId, marketCode, localeCode } = useAdminContext();
    const [items, setItems] = useState([]);
    const [versions, setVersions] = useState([]);
    const [contentItemId, setContentItemId] = useState(null);
    const [variantSetId, setVariantSetId] = useState(null);
    const [variantSets, setVariantSets] = useState([]);
    const [variants, setVariants] = useState([]);
    const [draft, setDraft] = useState({ key: 'default', priority: 100, state: 'ACTIVE', ruleJson: '{}', trafficAllocation: 100, contentVersionId: 0 });
    const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
    useEffect(() => {
        sdk.listContentItems({ siteId }).then((res) => setItems((res.listContentItems ?? [])));
    }, [siteId]);
    const loadItem = async (id) => {
        setContentItemId(id);
        const [setsRes, versionsRes] = await Promise.all([
            sdk.listVariantSets({ siteId, contentItemId: id, marketCode, localeCode }),
            sdk.listVersions({ contentItemId: id })
        ]);
        const sets = (setsRes.listVariantSets ?? []);
        setVariantSets(sets);
        const setId = sets[0]?.id ?? null;
        setVariantSetId(setId);
        setVersions((versionsRes.listVersions ?? []));
        setDraft((prev) => ({ ...prev, contentVersionId: versionsRes.listVersions?.[0]?.id ?? 0 }));
        if (setId) {
            const variantsRes = await sdk.listVariants({ variantSetId: setId });
            setVariants((variantsRes.listVariants ?? []));
        }
        else {
            setVariants([]);
        }
    };
    return (_jsxs("div", { className: "pageRoot", children: [_jsx(PageHeader, { title: "Variants", subtitle: "Personalization and A/B configurations", helpTopicKey: "variants", askAiContext: "content", askAiPayload: { siteId, marketCode, localeCode, contentItemId, draft } }), _jsxs("div", { className: "form-grid", children: [_jsx(Dropdown, { value: contentItemId, options: items.map((entry) => ({ label: `#${entry.id}`, value: entry.id })), onChange: (e) => loadItem(Number(e.value)).catch(() => undefined), placeholder: "Content item" }), _jsx(Dropdown, { value: variantSetId, options: variantSets.map((entry) => ({ label: `Set #${entry.id}`, value: entry.id })), onChange: (e) => {
                            const id = Number(e.value);
                            setVariantSetId(id);
                            sdk.listVariants({ variantSetId: id }).then((res) => setVariants((res.listVariants ?? [])));
                        }, placeholder: "Variant set" }), _jsx(Button, { label: "Save Variant Set", onClick: () => contentItemId ? sdk.upsertVariantSet({ id: variantSetId, siteId, contentItemId, marketCode, localeCode, active: true, fallbackVariantSetId: null }).then((res) => { const id = res.upsertVariantSet?.id ?? null; setVariantSetId(id); return loadItem(contentItemId); }) : Promise.resolve(), disabled: !contentItemId })] }), _jsxs(DataTable, { value: variants, size: "small", children: [_jsx(Column, { field: "id", header: "ID" }), _jsx(Column, { field: "key", header: "Key" }), _jsx(Column, { field: "priority", header: "Priority" }), _jsx(Column, { field: "state", header: "State" }), _jsx(Column, { field: "trafficAllocation", header: "Traffic" }), _jsx(Column, { field: "contentVersionId", header: "Version" }), _jsx(Column, { header: "Edit", body: (row) => _jsx(Button, { text: true, label: "Edit", onClick: () => setDraft({ key: row.key, priority: row.priority, state: row.state, ruleJson: row.ruleJson, trafficAllocation: row.trafficAllocation ?? 100, contentVersionId: row.contentVersionId }) }) })] }), _jsxs("div", { className: "form-grid", children: [_jsx(InputText, { value: draft.key, onChange: (e) => setDraft((prev) => ({ ...prev, key: e.target.value })), placeholder: "key" }), _jsx(InputText, { value: String(draft.priority), onChange: (e) => setDraft((prev) => ({ ...prev, priority: Number(e.target.value || '0') })), placeholder: "priority" }), _jsx(InputText, { value: String(draft.trafficAllocation), onChange: (e) => setDraft((prev) => ({ ...prev, trafficAllocation: Number(e.target.value || '0') })), placeholder: "traffic" }), _jsx(Dropdown, { value: draft.contentVersionId, options: versions.map((entry) => ({ label: `v${entry.versionNumber}`, value: entry.id })), onChange: (e) => setDraft((prev) => ({ ...prev, contentVersionId: Number(e.value) })), placeholder: "version" })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Rule JSON" }), _jsx(InputTextarea, { rows: 4, value: draft.ruleJson, onChange: (e) => setDraft((prev) => ({ ...prev, ruleJson: e.target.value })) })] }), _jsx("div", { className: "inline-actions", children: _jsx(Button, { label: "Rule Editor", text: true, onClick: () => setRuleEditorOpen(true) }) }), _jsx(Button, { label: "Save Variant", onClick: () => variantSetId ? sdk.upsertVariant({ variantSetId, key: draft.key, priority: draft.priority, state: draft.state, ruleJson: draft.ruleJson, trafficAllocation: draft.trafficAllocation, contentVersionId: draft.contentVersionId }).then(() => sdk.listVariants({ variantSetId }).then((res) => setVariants((res.listVariants ?? [])))) : Promise.resolve(), disabled: !variantSetId }), _jsx(RuleEditorDialog, { visible: ruleEditorOpen, initialRule: (() => {
                    try {
                        return JSON.parse(draft.ruleJson);
                    }
                    catch {
                        return null;
                    }
                })(), fields: [
                    { label: 'country', value: 'country' },
                    { label: 'device', value: 'device' },
                    { label: 'segments', value: 'segments' },
                    { label: 'query.answer.plan', value: 'query.answer.plan' }
                ], onHide: () => setRuleEditorOpen(false), onApply: (rule) => {
                    setDraft((prev) => ({ ...prev, ruleJson: JSON.stringify(rule) }));
                    setRuleEditorOpen(false);
                } })] }));
}
