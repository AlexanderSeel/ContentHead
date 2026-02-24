import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { createAdminSdk } from '../../lib/sdk';
import { PageHeader } from '../../components/common/PageHeader';
import { ComponentInspector } from './components/ComponentInspector';
import { componentRegistry, getComponentRegistryEntry } from './components/componentRegistry';
import {
  cloneProps,
  duplicateComponentInAreas,
  moveComponentInAreas,
  parseBuilderState,
  placeComponentInArea,
  removeComponentFromAreas,
  serializeBuilderState,
  type ComponentRecord
} from './builder/visualBuilderModel';
import { VisualBuilderWorkspace } from './builder/VisualBuilderWorkspace';
import { InspectorSection } from '../../ui/molecules';
import { TextInput } from '../../ui/atoms';

type Template = {
  id: number;
  name: string;
  compositionJson: string;
  componentsJson: string;
  constraintsJson: string;
};

type ContentItem = { id: number; currentDraftVersionId?: number | null };
type ContentItemDetail = {
  item?: { id?: number | null } | null;
  currentDraftVersion?: { id?: number | null; versionNumber?: number | null; metadataJson?: string | null } | null;
};

const DEFAULT_TEMPLATE: Template = {
  id: 0,
  name: 'Default Page',
  compositionJson: JSON.stringify({
    areas: [
      { name: 'header', components: [] },
      { name: 'main', components: [] },
      { name: 'sidebar', components: [] },
      { name: 'footer', components: [] }
    ]
  }),
  componentsJson: '{}',
  constraintsJson: JSON.stringify({ requiredFields: ['title'] })
};

function parseTemplateId(metadataJson: string | null | undefined): number | null {
  if (!metadataJson) {
    return null;
  }
  try {
    const parsed = JSON.parse(metadataJson) as { templateId?: unknown };
    return typeof parsed.templateId === 'number' ? parsed.templateId : null;
  } catch {
    return null;
  }
}

export function TemplatesPage() {
  const { token } = useAuth();
  const { siteId } = useAdminContext();
  const sdk = useMemo(() => createAdminSdk(token), [token]);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [draft, setDraft] = useState<Template>(DEFAULT_TEMPLATE);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [affectedDrafts, setAffectedDrafts] = useState<Array<{ itemId: number; versionId: number; versionNumber: number }>>([]);
  const [loadingImpact, setLoadingImpact] = useState(false);

  const builderState = useMemo(() => parseBuilderState(draft.compositionJson, draft.componentsJson), [draft.compositionJson, draft.componentsJson]);

  const selectedComponent = selectedComponentId ? builderState.componentMap[selectedComponentId] ?? null : null;

  const updateBuilder = (nextAreas: typeof builderState.areas, nextMap: typeof builderState.componentMap) => {
    const serialized = serializeBuilderState({ areas: nextAreas, componentMap: nextMap });
    setDraft((prev) => ({ ...prev, ...serialized }));
  };

  const refresh = async () => {
    const res = await sdk.listTemplates({ siteId });
    const rows = (res.listTemplates ?? []) as Template[];
    setTemplates(rows);
    if (draft.id) {
      const match = rows.find((entry) => entry.id === draft.id);
      if (match) {
        setDraft(match);
      }
    }
  };

  useEffect(() => {
    refresh().catch((error) => setStatus(String(error)));
  }, [siteId]);

  const loadImpact = async () => {
    if (!draft.id) {
      setAffectedDrafts([]);
      return;
    }
    setLoadingImpact(true);
    try {
      const itemsRes = await sdk.listContentItems({ siteId });
      const items = (itemsRes.listContentItems ?? []) as ContentItem[];
      const details = await Promise.all(
        items
          .filter((entry) => Boolean(entry.currentDraftVersionId))
          .map((entry) => sdk.getContentItemDetail({ contentItemId: entry.id }))
      );

      const matched = details
        .map((entry) => entry.getContentItemDetail as ContentItemDetail | null)
        .filter((entry): entry is ContentItemDetail => Boolean(entry?.currentDraftVersion?.id))
        .filter((entry) => parseTemplateId(entry.currentDraftVersion?.metadataJson) === draft.id)
        .map((entry) => ({
          itemId: Number(entry.item?.id ?? 0),
          versionId: Number(entry.currentDraftVersion?.id ?? 0),
          versionNumber: Number(entry.currentDraftVersion?.versionNumber ?? 0)
        }));

      setAffectedDrafts(matched.filter((entry) => entry.itemId > 0 && entry.versionId > 0));
    } catch (error) {
      setStatus(String(error));
    } finally {
      setLoadingImpact(false);
    }
  };

  useEffect(() => {
    loadImpact().catch((error) => setStatus(String(error)));
  }, [draft.id, draft.compositionJson, draft.componentsJson, siteId]);

  const saveTemplate = async () => {
    const action = draft.id
      ? sdk.updateTemplate({
          id: draft.id,
          name: draft.name,
          compositionJson: draft.compositionJson,
          componentsJson: draft.componentsJson,
          constraintsJson: draft.constraintsJson
        })
      : sdk.createTemplate({
          siteId,
          name: draft.name,
          compositionJson: draft.compositionJson,
          componentsJson: draft.componentsJson,
          constraintsJson: draft.constraintsJson
        });

    await action;
    await refresh();
    await loadImpact();
  };

  const applyTemplateUpdate = async () => {
    for (const entry of affectedDrafts) {
      await sdk.updateDraftVersion({
        versionId: entry.versionId,
        expectedVersionNumber: entry.versionNumber,
        patch: {
          compositionJson: draft.compositionJson,
          componentsJson: draft.componentsJson,
          comment: `Apply template ${draft.name} update`,
          metadataJson: JSON.stringify({ templateId: draft.id, templateUpdatedAt: new Date().toISOString() })
        }
      });
    }
    setStatus(`Applied template update to ${affectedDrafts.length} page drafts.`);
  };

  const createTemplateVersion = async () => {
    const suffix = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    await sdk.createTemplate({
      siteId,
      name: `${draft.name} v${suffix}`,
      compositionJson: draft.compositionJson,
      componentsJson: draft.componentsJson,
      constraintsJson: draft.constraintsJson
    });
    await refresh();
    setStatus('Created new template version.');
  };

  return (
    <div>
      <PageHeader title="Templates" subtitle="Visual template builder with palette, canvas, inspector, and update rollout." />
      <DataTable value={templates} size="small" selectionMode="single" selection={draft.id ? draft : null} onSelectionChange={(event) => setDraft((event.value as Template) ?? DEFAULT_TEMPLATE)}>
        <Column field="id" header="ID" />
        <Column field="name" header="Name" />
        <Column field="updatedAt" header="Updated" />
        <Column header="Edit" body={(row: Template) => <Button text label="Edit" onClick={() => setDraft(row)} />} />
      </DataTable>

      <div style={{ marginTop: '0.75rem' }}>
        <VisualBuilderWorkspace
          palette={componentRegistry.map((entry) => ({
            id: entry.id,
            label: entry.label,
            ...(entry.description ? { description: entry.description } : {})
          }))}
          areas={builderState.areas}
          componentMap={builderState.componentMap}
          selectedComponentId={selectedComponentId}
          onSelect={(id) => setSelectedComponentId(id)}
          onAdd={(componentTypeId, areaName = 'main') => {
            const entry = getComponentRegistryEntry(componentTypeId);
            if (!entry) {
              return;
            }
            const id = `${componentTypeId}_${Date.now()}`;
            const nextMap = {
              ...builderState.componentMap,
              [id]: { id, type: componentTypeId, props: cloneProps(entry.defaultProps) }
            };
            const nextAreas = placeComponentInArea(builderState.areas, areaName, id);
            updateBuilder(nextAreas, nextMap);
            setSelectedComponentId(id);
          }}
          onMove={(id, direction) => updateBuilder(moveComponentInAreas(builderState.areas, id, direction), builderState.componentMap)}
          onDuplicate={(id) => {
            const source = builderState.componentMap[id];
            if (!source) {
              return;
            }
            const duplicateId = `${source.type}_${Date.now()}`;
            const nextMap = {
              ...builderState.componentMap,
              [duplicateId]: {
                id: duplicateId,
                type: source.type,
                props: cloneProps(source.props)
              }
            };
            const nextAreas = duplicateComponentInAreas(builderState.areas, id, duplicateId);
            updateBuilder(nextAreas, nextMap);
            setSelectedComponentId(duplicateId);
          }}
          onDelete={(id) => {
            const nextMap = { ...builderState.componentMap };
            delete nextMap[id];
            updateBuilder(removeComponentFromAreas(builderState.areas, id), nextMap);
            if (selectedComponentId === id) {
              setSelectedComponentId(null);
            }
          }}
          rightPane={(
            <div className="form-row">
              <InspectorSection title="Template Settings">
                <div className="form-row">
                  <label>Name</label>
                  <TextInput value={draft.name} onChange={(next) => setDraft((prev) => ({ ...prev, name: next }))} />
                </div>
                <div className="form-row">
                  <label>Constraints JSON</label>
                  <textarea
                    value={draft.constraintsJson}
                    rows={4}
                    className="p-inputtextarea p-inputtext"
                    onChange={(event) => setDraft((prev) => ({ ...prev, constraintsJson: event.target.value }))}
                  />
                </div>
                <div className="inline-actions">
                  <Button label="Save Template" onClick={() => saveTemplate().catch((error) => setStatus(String(error)))} />
                  <Button label="Reconcile" severity="secondary" onClick={() => sdk.reconcileTemplate({ templateId: draft.id }).then((res) => setStatus(JSON.stringify(res.reconcileTemplate ?? {}, null, 2))).catch((error) => setStatus(String(error)))} disabled={!draft.id} />
                </div>
              </InspectorSection>
              <InspectorSection title="Selected Block" defaultCollapsed={!selectedComponent}>
                <ComponentInspector
                  component={selectedComponent as ComponentRecord | null}
                  siteId={siteId}
                  onChange={(next) => {
                    const nextMap = { ...builderState.componentMap, [next.id]: next };
                    updateBuilder(builderState.areas, nextMap);
                  }}
                />
              </InspectorSection>
              <InspectorSection title="Apply Template Update">
                <div className="status-panel">
                  {loadingImpact ? 'Calculating affected pages...' : `${affectedDrafts.length} page drafts currently linked to this template.`}
                </div>
                <div className="inline-actions">
                  <Button label="Apply to linked pages" severity="success" onClick={() => applyTemplateUpdate().catch((error) => setStatus(String(error)))} disabled={!draft.id || affectedDrafts.length === 0} />
                  <Button label="Create template version" severity="secondary" onClick={() => createTemplateVersion().catch((error) => setStatus(String(error)))} disabled={!draft.name.trim()} />
                </div>
              </InspectorSection>
            </div>
          )}
        />
      </div>
      {status ? <div className="status-panel"><pre>{status}</pre></div> : null}
    </div>
  );
}
