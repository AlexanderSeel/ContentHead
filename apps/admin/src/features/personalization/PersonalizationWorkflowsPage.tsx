import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Message } from 'primereact/message';

import { Button, Select, TextInput } from '../../ui/atoms';
import type { Rule } from '@contenthead/shared';

import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { RuleEditorDialog } from '../../components/rules/RuleEditorDialog';
import { createAdminSdk } from '../../lib/sdk';
import { formatErrorMessage, isForbiddenError } from '../../lib/graphqlErrorUi';
import { ForbiddenState, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

type Item = { id: number };
type Version = { id: number; versionNumber: number };
type VariantSet = { id: number };

type RolloutStrategy = 'ab_split' | 'targeted_only' | 'staged_rollout';

type VariantDraft = {
  key: string;
  headline: string;
  hero: string;
  accentColor: string;
  contentVersionId: number;
};

type CreatedFlow = {
  definitionId: number;
  definitionName: string;
  variantSetId: number;
};

function evenTrafficAllocations(count: number): number[] {
  if (count <= 0) {
    return [];
  }
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;
  return Array.from({ length: count }, (_, index) => (index === 0 ? base + remainder : base));
}

function safeRuleFromJson(value: string): Rule {
  try {
    const parsed = JSON.parse(value) as Rule;
    return parsed;
  } catch {
    return {};
  }
}

function initialVariantDrafts(defaultVersionId: number): VariantDraft[] {
  return [
    {
      key: 'hero_control',
      headline: 'Control headline',
      hero: 'Current hero message',
      accentColor: 'var(--primary-color)',
      contentVersionId: defaultVersionId
    },
    {
      key: 'hero_challenger',
      headline: 'Challenger headline',
      hero: 'Alternative hero message',
      accentColor: 'var(--primary-color)',
      contentVersionId: defaultVersionId
    }
  ];
}

export function PersonalizationWorkflowsPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const navigate = useNavigate();
  const { siteId, marketCode, localeCode } = useAdminContext();

  const [items, setItems] = useState<Item[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [contentItemId, setContentItemId] = useState<number | null>(null);
  const [variants, setVariants] = useState<VariantDraft[]>(initialVariantDrafts(0));
  const [audienceRuleJson, setAudienceRuleJson] = useState<string>('{}');
  const [rolloutStrategy, setRolloutStrategy] = useState<RolloutStrategy>('ab_split');
  const [wizardStarted, setWizardStarted] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [ruleEditorSession, setRuleEditorSession] = useState(0);
  const [status, setStatus] = useState('');
  const forbiddenReason = status && isForbiddenError(status) ? status : '';
  const [busy, setBusy] = useState(false);
  const [createdFlow, setCreatedFlow] = useState<CreatedFlow | null>(null);

  useEffect(() => {
    sdk.listContentItems({ siteId }).then((res) => {
      setItems((res.listContentItems ?? []) as Item[]);
    }).catch((error: unknown) => setStatus(formatErrorMessage(error)));
  }, [sdk, siteId]);

  const loadContentItem = async (id: number) => {
    setStatus('');
    setContentItemId(id);
    const versionsRes = await sdk.listVersions({ contentItemId: id });
    const nextVersions = (versionsRes.listVersions ?? []) as Version[];
    setVersions(nextVersions);
    const defaultVersionId = nextVersions[0]?.id ?? 0;
    setVariants(initialVariantDrafts(defaultVersionId));
    setCreatedFlow(null);
  };

  const updateVariant = (index: number, patch: Partial<VariantDraft>) => {
    setVariants((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const addThirdVariant = () => {
    setVariants((prev) => {
      if (prev.length >= 3) {
        return prev;
      }
      return [
        ...prev,
        {
          key: 'hero_variant_c',
          headline: 'Variant C headline',
          hero: 'Third hero message',
          accentColor: 'var(--primary-color)',
          contentVersionId: prev[0]?.contentVersionId ?? versions[0]?.id ?? 0
        }
      ];
    });
  };

  const removeThirdVariant = () => {
    setVariants((prev) => prev.slice(0, 2));
  };

  const generateFlow = async () => {
    if (!contentItemId) {
      setStatus('Select a page/content item first.');
      return;
    }

    if (versions.length === 0) {
      setStatus('Selected page has no versions yet. Create one in Pages before personalization.');
      return;
    }

    const invalidVariant = variants.find((entry) => !entry.key.trim() || !entry.contentVersionId);
    if (invalidVariant) {
      setStatus('Each variant needs a key and a content version.');
      return;
    }

    setBusy(true);
    setStatus('');

    try {
      const setsRes = await sdk.listVariantSets({ siteId, contentItemId, marketCode, localeCode });
      const existingSets = (setsRes.listVariantSets ?? []) as VariantSet[];
      const upsertSetRes = existingSets[0]
        ? { upsertVariantSet: { id: existingSets[0].id } }
        : await sdk.upsertVariantSet({
            id: null,
            siteId,
            contentItemId,
            marketCode,
            localeCode,
            active: true,
            fallbackVariantSetId: null
          });
      const variantSetId = upsertSetRes.upsertVariantSet?.id ?? null;
      if (!variantSetId) {
        throw new Error('Could not create or resolve variant set.');
      }

      const audienceRule = safeRuleFromJson(audienceRuleJson);
      const allocations = evenTrafficAllocations(variants.length);

      for (let index = 0; index < variants.length; index += 1) {
        const variant = variants[index]!;

        const isTargeted = rolloutStrategy === 'targeted_only' || rolloutStrategy === 'staged_rollout';
        const rule: Rule = isTargeted
          ? index === 0
            ? audienceRule
            : {}
          : audienceRule;

        const trafficAllocation = rolloutStrategy === 'ab_split'
          ? allocations[index] ?? 0
          : index === 0
            ? 100
            : 0;

        await sdk.upsertVariant({
          variantSetId,
          key: variant.key.trim(),
          priority: 300 - index * 10,
          state: 'ACTIVE',
          ruleJson: JSON.stringify(rule),
          trafficAllocation,
          contentVersionId: variant.contentVersionId
        });
      }

      const primaryVariant = variants[0]!;
      const flowName = `Personalization Flow item-${contentItemId} ${new Date().toISOString().slice(0, 19)}`;
      const graphJson = JSON.stringify({
        nodes: [
          {
            id: 'create_draft_variant_versions',
            type: 'CreateDraftVersion',
            config: { contentItemId }
          },
          {
            id: 'manual_approval',
            type: 'ManualApproval',
            config: {}
          },
          {
            id: 'publish_version',
            type: 'PublishVersion',
            config: {}
          },
          {
            id: 'activate_variant',
            type: 'ActivateVariant',
            config: {
              variantSetId,
              key: primaryVariant.key,
              priority: 300,
              trafficAllocation: rolloutStrategy === 'ab_split' ? allocations[0] ?? 100 : 100
            }
          }
        ],
        edges: [
          { from: 'create_draft_variant_versions', to: 'manual_approval' },
          { from: 'manual_approval', to: 'publish_version' },
          { from: 'publish_version', to: 'activate_variant' }
        ]
      });

      const workflowRes = await sdk.upsertWorkflowDefinition({
        id: null,
        name: flowName,
        version: 1,
        graphJson,
        inputSchemaJson: JSON.stringify({ type: 'object' }),
        permissionsJson: JSON.stringify({ roles: ['admin'] }),
        createdBy: 'admin'
      });

      const definitionId = workflowRes.upsertWorkflowDefinition?.id ?? null;
      if (!definitionId) {
        throw new Error('Workflow definition could not be created.');
      }

      setCreatedFlow({ definitionId, definitionName: flowName, variantSetId });
      setWizardStep(5);
      setStatus(
        rolloutStrategy === 'staged_rollout'
          ? 'Flow created. Staged rollout is currently mapped to targeted-only behavior until staged execution is implemented.'
          : 'Flow created successfully.'
      );
    } catch (error) {
      setStatus(formatErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const startCreatedWorkflow = async () => {
    if (!createdFlow || !contentItemId) {
      return;
    }

    setBusy(true);
    setStatus('');
    try {
      await sdk.startWorkflowRun({
        definitionId: createdFlow.definitionId,
        contextJson: JSON.stringify({
          siteId,
          contentItemId,
          variantSetId: createdFlow.variantSetId,
          marketCode,
          localeCode
        }),
        startedBy: 'admin'
      });
      navigate('/workflows/runs');
    } catch (error) {
      setStatus(formatErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Personalization Workflows"
        subtitle="Guided setup for audiences, experiences, and rollout"
        helpTopicKey="personalization_workflows"
        askAiContext="workflows"
        askAiPayload={{ siteId, marketCode, localeCode, contentItemId, rolloutStrategy }}
        actions={<Button text label="Open Variants (Power Users)" onClick={() => navigate('/personalization/variants')} />}
      />

      {forbiddenReason ? (
        <WorkspaceBody>
          <ForbiddenState title="You do not have access to personalization workflows." reason={forbiddenReason} />
        </WorkspaceBody>
      ) : null}

      {!forbiddenReason ? (
        <div className="content-card personalization-landing">
          <h3>Make personalization self-explanatory</h3>
          <div className="personalization-steps">
            <div className="personalization-step-card">
              <small>Step 1</small>
              <h4>Define audiences</h4>
              <p>Pick who should see each experience using rules and segments.</p>
            </div>
            <div className="personalization-step-card">
              <small>Step 2</small>
              <h4>Define experiences</h4>
              <p>Create 2-3 variants with visual headline and hero controls.</p>
            </div>
            <div className="personalization-step-card">
              <small>Step 3</small>
              <h4>Orchestrate rollout</h4>
              <p>Choose rollout strategy and generate a runnable workflow.</p>
            </div>
          </div>
          <div className="inline-actions">
            <Button
              label={wizardStarted ? 'Continue Personalization Flow' : 'Create Personalization Flow'}
              onClick={() => {
                setWizardStarted(true);
                setWizardStep((prev) => (prev > 0 ? prev : 1));
              }}
            />
          </div>
        </div>
      ) : null}

      {wizardStarted && !forbiddenReason ? (
        <div className="content-card personalization-wizard">
          <div className="personalization-wizard-steps">
            {[1, 2, 3, 4, 5].map((step) => (
              <Button
                key={step}
                text={wizardStep !== step}
                {...(wizardStep === step ? { severity: 'info' as const } : {})}
                label={`Step ${step}`}
                onClick={() => setWizardStep(step)}
              />
            ))}
          </div>

          {wizardStep === 1 ? (
            <div className="form-row">
              <h4>Step 1: Pick a page/content item</h4>
              <Select
                value={contentItemId}
                options={items.map((entry) => ({ label: `#${entry.id}`, value: entry.id }))}
                onChange={(next) => next !== null && loadContentItem(next).catch((error: unknown) => setStatus(formatErrorMessage(error)))}
                placeholder="Select content item"
                filter
              />
              <small className="muted">This flow will use market {marketCode} and locale {localeCode}.</small>
            </div>
          ) : null}

          {wizardStep === 2 ? (
            <div className="form-row">
              <h4>Step 2: Define experiences (2-3 variants)</h4>
              <div className="inline-actions">
                <Button text label="Add Variant C" disabled={variants.length >= 3} onClick={addThirdVariant} />
                <Button text severity="danger" label="Remove Variant C" disabled={variants.length < 3} onClick={removeThirdVariant} />
              </div>
              <div className="personalization-variant-grid">
                {variants.map((variant, index) => (
                  <div key={`variant-${index}`} className="personalization-variant-card" style={{ borderColor: variant.accentColor || 'var(--surface-border)' }}>
                    <h5 className="mt-0 mb-2">Variant {index + 1}</h5>
                    <div className="form-row">
                      <label>Key</label>
                      <TextInput value={variant.key} onChange={(next) => updateVariant(index, { key: next })} placeholder="variant key" />
                    </div>
                    <div className="form-row">
                      <label>Headline</label>
                      <TextInput value={variant.headline} onChange={(next) => updateVariant(index, { headline: next })} placeholder="Headline" />
                    </div>
                    <div className="form-row">
                      <label>Hero text</label>
                      <TextInput value={variant.hero} onChange={(next) => updateVariant(index, { hero: next })} placeholder="Hero message" />
                    </div>
                    <div className="form-grid">
                      <div className="form-row">
                        <label>Accent color</label>
                        <TextInput value={variant.accentColor} onChange={(next) => updateVariant(index, { accentColor: next })} placeholder="var(--primary-color)" />
                      </div>
                      <div className="form-row">
                        <label>Content version</label>
                        <Select
                          value={variant.contentVersionId}
                          options={versions.map((entry) => ({ label: `v${entry.versionNumber}`, value: entry.id }))}
                          onChange={(next) => next !== null && updateVariant(index, { contentVersionId: next })}
                          placeholder="Version"
                        />
                      </div>
                    </div>
                    <div className="personalization-preview" style={{ background: `color-mix(in srgb, ${variant.accentColor || 'var(--primary-color)'}, transparent 88%)` }}>
                      <strong>{variant.headline || 'Headline preview'}</strong>
                      <span>{variant.hero || 'Hero copy preview'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {wizardStep === 3 ? (
            <div className="form-row">
              <h4>Step 3: Define audience targeting</h4>
              <div className="inline-actions">
                <Button
                  label="Open Rule Editor"
                  onClick={() => {
                    setRuleEditorSession((prev) => prev + 1);
                    setRuleEditorOpen(true);
                  }}
                />
              </div>
              <pre>{audienceRuleJson}</pre>
            </div>
          ) : null}

          {wizardStep === 4 ? (
            <div className="form-row">
              <h4>Step 4: Choose rollout strategy</h4>
              <Select
                value={rolloutStrategy}
                options={[
                  { label: 'A/B split', value: 'ab_split' },
                  { label: 'Targeted only', value: 'targeted_only' },
                  { label: 'Staged rollout (future)', value: 'staged_rollout' }
                ]}
                onChange={(next) => next && setRolloutStrategy(next as RolloutStrategy)}
              />
              <small className="muted">
                Staged rollout is available as a planning option and currently maps to targeted-only activation behavior.
              </small>
            </div>
          ) : null}

          {wizardStep === 5 ? (
            <div className="form-row">
              <h4>Step 5: Generate workflow definition</h4>
              <p>
                This creates a workflow graph with: <strong>CreateDraftVersion</strong> (for variant versions), <strong>ManualApproval</strong>, <strong>PublishVersion</strong>, and <strong>ActivateVariant</strong>.
              </p>
              {!createdFlow ? (
                <Button label="Generate and Attach Workflow" onClick={() => generateFlow().catch((error: unknown) => setStatus(formatErrorMessage(error)))} disabled={busy} />
              ) : (
                <div className="status-panel">
                  <p className="mt-0"><strong>{createdFlow.definitionName}</strong></p>
                  <p>Workflow ID: {createdFlow.definitionId} | Variant Set ID: {createdFlow.variantSetId}</p>
                  <div className="inline-actions">
                    <Button label="Run Workflow" severity="success" onClick={() => startCreatedWorkflow().catch((error: unknown) => setStatus(formatErrorMessage(error)))} disabled={busy} />
                    <Button text label="Open Workflows" onClick={() => navigate('/workflows/designer')} />
                    <Button text label="Open Runs" onClick={() => navigate('/workflows/runs')} />
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="inline-actions justify-content-between">
            <Button text label="Back" disabled={wizardStep <= 1} onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))} />
            <Button label="Next" disabled={wizardStep >= 5} onClick={() => setWizardStep((prev) => Math.min(5, prev + 1))} />
          </div>

          {status && !forbiddenReason ? <Message severity="info" text={status} /> : null}
        </div>
      ) : null}

      <RuleEditorDialog
        key={`rule-editor-${ruleEditorSession}`}
        visible={ruleEditorOpen}
        initialRule={safeRuleFromJson(audienceRuleJson)}
        fields={[
          { label: 'country', value: 'country' },
          { label: 'device', value: 'device' },
          { label: 'segments', value: 'segments' },
          { label: 'query.campaign', value: 'query.campaign' }
        ]}
        onHide={() => setRuleEditorOpen(false)}
        onApply={(rule) => {
          setAudienceRuleJson(JSON.stringify(rule));
          setRuleEditorOpen(false);
        }}
      />
    </WorkspacePage>
  );
}

