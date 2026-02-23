import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import type { Rule } from '@contenthead/shared';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
import { RuleEditorDialog } from '../../components/rules/RuleEditorDialog';

type Item = { id: number };
type Version = { id: number; versionNumber: number };
type VariantSet = { id: number; contentItemId: number; marketCode: string; localeCode: string; active: boolean; fallbackVariantSetId?: number | null };
type Variant = { id: number; key: string; priority: number; state: string; ruleJson: string; trafficAllocation?: number | null; contentVersionId: number };

export function VariantsPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId, marketCode, localeCode } = useAdminContext();

  const [items, setItems] = useState<Item[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [contentItemId, setContentItemId] = useState<number | null>(null);
  const [variantSetId, setVariantSetId] = useState<number | null>(null);
  const [variantSets, setVariantSets] = useState<VariantSet[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [draft, setDraft] = useState({ key: 'default', priority: 100, state: 'ACTIVE', ruleJson: '{}', trafficAllocation: 100, contentVersionId: 0 });
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);

  useEffect(() => {
    sdk.listContentItems({ siteId }).then((res) => setItems((res.listContentItems ?? []) as Item[]));
  }, [siteId]);

  const loadItem = async (id: number) => {
    setContentItemId(id);
    const [setsRes, versionsRes] = await Promise.all([
      sdk.listVariantSets({ siteId, contentItemId: id, marketCode, localeCode }),
      sdk.listVersions({ contentItemId: id })
    ]);
    const sets = (setsRes.listVariantSets ?? []) as VariantSet[];
    setVariantSets(sets);
    const setId = sets[0]?.id ?? null;
    setVariantSetId(setId);
    setVersions((versionsRes.listVersions ?? []) as Version[]);
    setDraft((prev) => ({ ...prev, contentVersionId: versionsRes.listVersions?.[0]?.id ?? 0 }));
    if (setId) {
      const variantsRes = await sdk.listVariants({ variantSetId: setId });
      setVariants((variantsRes.listVariants ?? []) as Variant[]);
    } else {
      setVariants([]);
    }
  };

  return (
    <div className="pageRoot">
      <PageHeader
        title="Variants"
        subtitle="Personalization and A/B configurations"
        helpTopicKey="variants"
        askAiContext="content"
        askAiPayload={{ siteId, marketCode, localeCode, contentItemId, draft }}
      />
      <div className="form-grid">
        <Dropdown value={contentItemId} options={items.map((entry) => ({ label: `#${entry.id}`, value: entry.id }))} onChange={(e) => loadItem(Number(e.value)).catch(() => undefined)} placeholder="Content item" />
        <Dropdown value={variantSetId} options={variantSets.map((entry) => ({ label: `Set #${entry.id}`, value: entry.id }))} onChange={(e) => {
          const id = Number(e.value);
          setVariantSetId(id);
          sdk.listVariants({ variantSetId: id }).then((res) => setVariants((res.listVariants ?? []) as Variant[]));
        }} placeholder="Variant set" />
        <Button label="Save Variant Set" onClick={() => contentItemId ? sdk.upsertVariantSet({ id: variantSetId, siteId, contentItemId, marketCode, localeCode, active: true, fallbackVariantSetId: null }).then((res) => { const id = res.upsertVariantSet?.id ?? null; setVariantSetId(id); return loadItem(contentItemId); }) : Promise.resolve()} disabled={!contentItemId} />
      </div>
      <DataTable value={variants} size="small">
        <Column field="id" header="ID" />
        <Column field="key" header="Key" />
        <Column field="priority" header="Priority" />
        <Column field="state" header="State" />
        <Column field="trafficAllocation" header="Traffic" />
        <Column field="contentVersionId" header="Version" />
        <Column header="Edit" body={(row: Variant) => <Button text label="Edit" onClick={() => setDraft({ key: row.key, priority: row.priority, state: row.state, ruleJson: row.ruleJson, trafficAllocation: row.trafficAllocation ?? 100, contentVersionId: row.contentVersionId })} />} />
      </DataTable>
      <div className="form-grid">
        <InputText value={draft.key} onChange={(e) => setDraft((prev) => ({ ...prev, key: e.target.value }))} placeholder="key" />
        <InputText value={String(draft.priority)} onChange={(e) => setDraft((prev) => ({ ...prev, priority: Number(e.target.value || '0') }))} placeholder="priority" />
        <InputText value={String(draft.trafficAllocation)} onChange={(e) => setDraft((prev) => ({ ...prev, trafficAllocation: Number(e.target.value || '0') }))} placeholder="traffic" />
        <Dropdown value={draft.contentVersionId} options={versions.map((entry) => ({ label: `v${entry.versionNumber}`, value: entry.id }))} onChange={(e) => setDraft((prev) => ({ ...prev, contentVersionId: Number(e.value) }))} placeholder="version" />
      </div>
      <div className="form-row"><label>Rule JSON</label><InputTextarea rows={4} value={draft.ruleJson} onChange={(e) => setDraft((prev) => ({ ...prev, ruleJson: e.target.value }))} /></div>
      <div className="inline-actions">
        <Button label="Rule Editor" text onClick={() => setRuleEditorOpen(true)} />
      </div>
      <Button label="Save Variant" onClick={() => variantSetId ? sdk.upsertVariant({ variantSetId, key: draft.key, priority: draft.priority, state: draft.state, ruleJson: draft.ruleJson, trafficAllocation: draft.trafficAllocation, contentVersionId: draft.contentVersionId }).then(() => sdk.listVariants({ variantSetId }).then((res) => setVariants((res.listVariants ?? []) as Variant[]))) : Promise.resolve()} disabled={!variantSetId} />
      <RuleEditorDialog
        visible={ruleEditorOpen}
        initialRule={(() => {
          try {
            return JSON.parse(draft.ruleJson) as Rule;
          } catch {
            return null;
          }
        })()}
        fields={[
          { label: 'country', value: 'country' },
          { label: 'device', value: 'device' },
          { label: 'segments', value: 'segments' },
          { label: 'query.answer.plan', value: 'query.answer.plan' }
        ]}
        onHide={() => setRuleEditorOpen(false)}
        onApply={(rule) => {
          setDraft((prev) => ({ ...prev, ruleJson: JSON.stringify(rule) }));
          setRuleEditorOpen(false);
        }}
      />
    </div>
  );
}
