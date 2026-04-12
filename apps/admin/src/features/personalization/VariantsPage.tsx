import { useEffect, useMemo, useState } from 'react';
import { Button, Select, Textarea, TextInput } from '../../ui/atoms';
import type { Rule } from '@contenthead/shared';

import { createAdminSdk } from '../../lib/sdk';
import { DataGrid, PaneRoot, PaneScroll, Splitter, SplitterPanel, WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
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
    <WorkspacePage>
      <WorkspaceHeader
        title="Variants (Advanced)"
        subtitle="Power-user table editor for personalization and A/B configurations"
        helpTopicKey="variants"
        askAiContext="content"
        askAiPayload={{ siteId, marketCode, localeCode, contentItemId, draft }}
      />
      <WorkspaceActionBar
        primary={
          <>
            <Select
              value={contentItemId}
              options={items.map((entry) => ({ label: `#${entry.id}`, value: entry.id }))}
              onChange={(next) => next !== null && loadItem(next).catch(() => undefined)}
              placeholder="Content item"
            />
            <Select
              value={variantSetId}
              options={variantSets.map((entry) => ({ label: `Set #${entry.id}`, value: entry.id }))}
              onChange={(next) => {
                if (next === null) return;
                setVariantSetId(next);
                sdk.listVariants({ variantSetId: next }).then((res) => setVariants((res.listVariants ?? []) as Variant[]));
              }}
              placeholder="Variant set"
            />
            <Button
              label="Save Variant Set"
              onClick={() =>
                contentItemId
                  ? sdk
                      .upsertVariantSet({ id: variantSetId, siteId, contentItemId, marketCode, localeCode, active: true, fallbackVariantSetId: null })
                      .then((res) => {
                        const id = res.upsertVariantSet?.id ?? null;
                        setVariantSetId(id);
                        return loadItem(contentItemId);
                      })
                  : Promise.resolve()
              }
              disabled={!contentItemId}
            />
            <Button
              label="Save Variant"
              severity="success"
              onClick={() =>
                variantSetId
                  ? sdk
                      .upsertVariant({
                        variantSetId,
                        key: draft.key,
                        priority: draft.priority,
                        state: draft.state,
                        ruleJson: draft.ruleJson,
                        trafficAllocation: draft.trafficAllocation,
                        contentVersionId: draft.contentVersionId
                      })
                      .then(() => sdk.listVariants({ variantSetId }).then((res) => setVariants((res.listVariants ?? []) as Variant[])))
                  : Promise.resolve()
              }
              disabled={!variantSetId}
            />
          </>
        }
      />
      <WorkspaceBody>
        <Splitter className="splitFill">
          <SplitterPanel size={60} minSize={40}>
            <PaneRoot className="content-card">
              <PaneScroll>
                <DataGrid
                  data={variants}
                  rowKey="id"
                  columns={[
                    { key: 'id', header: 'ID' },
                    { key: 'key', header: 'Key' },
                    { key: 'priority', header: 'Priority' },
                    { key: 'state', header: 'State' },
                    { key: 'trafficAllocation', header: 'Traffic' },
                    { key: 'contentVersionId', header: 'Version' },
                    {
                      key: '__edit',
                      header: 'Edit',
                      cell: (row) => (
                        <Button
                          text
                          label="Edit"
                          onClick={() =>
                            setDraft({
                              key: row.key,
                              priority: row.priority,
                              state: row.state,
                              ruleJson: row.ruleJson,
                              trafficAllocation: row.trafficAllocation ?? 100,
                              contentVersionId: row.contentVersionId
                            })
                          }
                        />
                      )
                    }
                  ]}
                />
              </PaneScroll>
            </PaneRoot>
          </SplitterPanel>
          <SplitterPanel size={40} minSize={24}>
            <PaneRoot className="content-card">
              <PaneScroll>
                <div className="form-grid">
                  <TextInput value={draft.key} onChange={(next) => setDraft((prev) => ({ ...prev, key: next }))} placeholder="Key" />
                  <TextInput value={String(draft.priority)} onChange={(next) => setDraft((prev) => ({ ...prev, priority: Number(next || '0') }))} placeholder="Priority" />
                  <TextInput value={String(draft.trafficAllocation)} onChange={(next) => setDraft((prev) => ({ ...prev, trafficAllocation: Number(next || '0') }))} placeholder="Traffic allocation" />
                  <Select value={draft.contentVersionId} options={versions.map((entry) => ({ label: `v${entry.versionNumber}`, value: entry.id }))} onChange={(next) => next !== null && setDraft((prev) => ({ ...prev, contentVersionId: next }))} placeholder="Version" />
                </div>
                <div className="form-row mt-3">
                  <label>Rule JSON</label>
                  <Textarea rows={8} value={draft.ruleJson} onChange={(next) => setDraft((prev) => ({ ...prev, ruleJson: next }))} />
                </div>
                <div className="inline-actions mt-3">
                  <Button label="Rule Editor" text onClick={() => setRuleEditorOpen(true)} />
                </div>
              </PaneScroll>
            </PaneRoot>
          </SplitterPanel>
        </Splitter>
      </WorkspaceBody>
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
    </WorkspacePage>
  );
}

