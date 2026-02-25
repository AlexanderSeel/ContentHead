import { useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { FileUpload } from 'primereact/fileupload';
import { InputTextarea } from 'primereact/inputtextarea';

import { useAdminContext } from '../../app/AdminContext';
import { useAuth } from '../../app/AuthContext';
import { createAdminSdk } from '../../lib/sdk';
import { formatErrorMessage, isForbiddenError } from '../../lib/graphqlErrorUi';
import { ForbiddenState, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

type ExportedItem = {
  externalId?: string;
  contentTypeName: string;
  fieldsJson: string;
  compositionJson: string;
  componentsJson: string;
  metadataJson: string;
  routes: Array<{ marketCode: string; localeCode: string; slug: string; isCanonical: boolean }>;
};

type SnapshotForm = {
  id?: number;
  externalId?: string;
  name: string;
  description?: string | null;
  active: boolean;
  steps: Array<{
    id?: number;
    externalId?: string;
    name: string;
    position: number;
  }>;
  fields: Array<{
    id?: number;
    stepRef?: string | number;
    key: string;
    label: string;
    fieldType: string;
    position: number;
    conditionsJson: string;
    validationsJson: string;
    uiConfigJson: string;
    active: boolean;
  }>;
};

type SnapshotVariant = {
  itemIndex: number;
  marketCode: string;
  localeCode: string;
  key: string;
  priority: number;
  state: string;
  ruleJson: string;
  trafficAllocation?: number | null;
  patch?: {
    fieldsJson?: string;
    compositionJson?: string;
    componentsJson?: string;
    metadataJson?: string;
    comment?: string;
  };
};

type SiteConfigSnapshot = {
  siteName?: string;
  urlPattern?: string;
  markets?: Array<{ code: string; name: string; currency?: string | null; timezone?: string | null; active: boolean; isDefault: boolean }>;
  locales?: Array<{ code: string; name: string; active: boolean; fallbackLocaleCode?: string | null; isDefault: boolean }>;
  matrix?: {
    combinations: Array<{ marketCode: string; localeCode: string; active: boolean; isDefaultForMarket?: boolean }>;
    defaults?: { marketDefaultLocales: Array<{ marketCode: string; localeCode: string }> };
  };
};

type SiteSnapshot = {
  schemaVersion: 1;
  siteId: number;
  exportedAt: string;
  contentTypes: Array<{ name: string; description?: string | null; fieldsJson: string }>;
  templates: Array<{ name: string; compositionJson: string; componentsJson: string; constraintsJson: string }>;
  items: ExportedItem[];
  siteConfig?: SiteConfigSnapshot;
  forms?: SnapshotForm[];
  variants?: SnapshotVariant[];
};

function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DuckDbAdminPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId } = useAdminContext();
  const [status, setStatus] = useState('');
  const forbiddenReason = status && isForbiddenError(status) ? status : '';
  const [importJson, setImportJson] = useState('');
  const [working, setWorking] = useState(false);

  const handleError = (error: unknown) => {
    setStatus(formatErrorMessage(error));
  };

  const exportSnapshot = async () => {
    setWorking(true);
    setStatus('');
    try {
      const [siteRes, matrixRes, typesRes, templatesRes, itemsRes, routesRes, formsRes] = await Promise.all([
        sdk.getSite({ siteId }),
        sdk.getSiteMarketLocaleMatrix({ siteId }),
        sdk.listContentTypes({ siteId }),
        sdk.listTemplates({ siteId }),
        sdk.listContentItems({ siteId }),
        sdk.listRoutes({ siteId, marketCode: null, localeCode: null }),
        sdk.listForms({ siteId })
      ]);
      const contentTypes = (typesRes.listContentTypes ?? []).map((entry) => ({
        name: entry?.name ?? '',
        description: entry?.description ?? null,
        fieldsJson: entry?.fieldsJson ?? '[]'
      }));
      const templates = (templatesRes.listTemplates ?? []).map((entry) => ({
        name: entry?.name ?? '',
        compositionJson: entry?.compositionJson ?? '{"areas":[]}',
        componentsJson: entry?.componentsJson ?? '{}',
        constraintsJson: entry?.constraintsJson ?? '{}'
      }));
      const routes = (routesRes.listRoutes ?? []).map((entry) => ({
        contentItemId: entry?.contentItemId ?? 0,
        marketCode: entry?.marketCode ?? '',
        localeCode: entry?.localeCode ?? '',
        slug: entry?.slug ?? '',
        isCanonical: Boolean(entry?.isCanonical)
      }));

      const items = await Promise.all(
        (itemsRes.listContentItems ?? []).map(async (item) => {
          const detail = await sdk.getContentItemDetail({ contentItemId: item?.id ?? 0 });
          const typeName = detail.getContentItemDetail?.contentType?.name ?? '';
          const version = detail.getContentItemDetail?.currentDraftVersion ?? detail.getContentItemDetail?.currentPublishedVersion;
          return {
            contentTypeName: typeName,
            fieldsJson: version?.fieldsJson ?? '{}',
            compositionJson: version?.compositionJson ?? '{"areas":[]}',
            componentsJson: version?.componentsJson ?? '{}',
            metadataJson: version?.metadataJson ?? '{}',
            routes: routes
              .filter((route) => route.contentItemId === item?.id)
              .map((route) => ({
                marketCode: route.marketCode,
                localeCode: route.localeCode,
                slug: route.slug,
                isCanonical: route.isCanonical
              }))
          } as ExportedItem;
        })
      );

      const forms = await Promise.all(
        (formsRes.listForms ?? []).map(async (form) => {
          const formId = form?.id ?? 0;
          const [stepsRes, fieldsRes] = await Promise.all([
            sdk.listFormSteps({ formId }),
            sdk.listFormFields({ formId })
          ]);
          return {
            id: formId,
            name: form?.name ?? `Form ${formId}`,
            description: form?.description ?? null,
            active: Boolean(form?.active ?? true),
            steps: (stepsRes.listFormSteps ?? []).map((step) => ({
              id: step?.id ?? undefined,
              name: step?.name ?? '',
              position: step?.position ?? 0
            })),
            fields: (fieldsRes.listFormFields ?? []).map((field) => ({
              id: field?.id ?? undefined,
              stepRef: field?.stepId ?? undefined,
              key: field?.key ?? '',
              label: field?.label ?? '',
              fieldType: field?.fieldType ?? 'text',
              position: field?.position ?? 0,
              conditionsJson: field?.conditionsJson ?? '{}',
              validationsJson: field?.validationsJson ?? '{}',
              uiConfigJson: field?.uiConfigJson ?? '{}',
              active: Boolean(field?.active ?? true)
            }))
          } as SnapshotForm;
        })
      );

      const siteConfig: SiteConfigSnapshot = {
        urlPattern: siteRes.getSite?.urlPattern ?? '/{market}/{locale}',
        markets: (matrixRes.getSiteMarketLocaleMatrix?.markets ?? []).map((entry) => ({
          code: entry?.code ?? '',
          name: entry?.name ?? '',
          currency: entry?.currency ?? null,
          timezone: entry?.timezone ?? null,
          active: Boolean(entry?.active),
          isDefault: Boolean(entry?.isDefault)
        })),
        locales: (matrixRes.getSiteMarketLocaleMatrix?.locales ?? []).map((entry) => ({
          code: entry?.code ?? '',
          name: entry?.name ?? '',
          active: Boolean(entry?.active),
          fallbackLocaleCode: entry?.fallbackLocaleCode ?? null,
          isDefault: Boolean(entry?.isDefault)
        })),
        matrix: {
          combinations: (matrixRes.getSiteMarketLocaleMatrix?.combinations ?? []).map((entry) => ({
            marketCode: entry?.marketCode ?? '',
            localeCode: entry?.localeCode ?? '',
            active: Boolean(entry?.active),
            isDefaultForMarket: Boolean(entry?.isDefaultForMarket)
          })),
          defaults: {
            marketDefaultLocales: (matrixRes.getSiteMarketLocaleMatrix?.defaults?.marketDefaultLocales ?? []).map((entry) => ({
              marketCode: entry?.marketCode ?? '',
              localeCode: entry?.localeCode ?? ''
            }))
          }
        }
      };
      if (siteRes.getSite?.name) {
        siteConfig.siteName = siteRes.getSite.name;
      }

      const snapshot: SiteSnapshot = {
        schemaVersion: 1,
        siteId,
        exportedAt: new Date().toISOString(),
        contentTypes,
        templates,
        items,
        siteConfig,
        forms
      };
      downloadJson(`contenthead-site-${siteId}-${Date.now()}.json`, snapshot);
      setStatus(`Exported ${contentTypes.length} content types, ${templates.length} templates, ${items.length} items, ${forms.length} forms.`);
    } catch (error) {
      handleError(error);
    } finally {
      setWorking(false);
    }
  };

  const importSnapshot = async () => {
    setWorking(true);
    setStatus('');
    try {
      const parsed = JSON.parse(importJson || '{}') as Partial<SiteSnapshot>;
      if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.contentTypes) || !Array.isArray(parsed.templates) || !Array.isArray(parsed.items)) {
        throw new Error('Invalid snapshot format.');
      }

      if (parsed.siteConfig?.urlPattern) {
        await sdk.setSiteUrlPattern({ siteId, urlPattern: parsed.siteConfig.urlPattern });
      }
      if (parsed.siteConfig?.siteName?.trim()) {
        await sdk.setSiteName({ siteId, name: parsed.siteConfig.siteName.trim() });
      }

      if (Array.isArray(parsed.siteConfig?.markets) && parsed.siteConfig?.markets.length > 0) {
        for (const market of parsed.siteConfig.markets) {
          await sdk.upsertMarket({
            siteId,
            code: market.code,
            name: market.name,
            currency: market.currency ?? null,
            timezone: market.timezone ?? null,
            active: Boolean(market.active),
            isDefault: Boolean(market.isDefault)
          });
        }
        await sdk.setSiteMarkets({
          siteId,
          markets: parsed.siteConfig.markets.map((entry) => ({ code: entry.code, active: Boolean(entry.active) })),
          defaultMarketCode: parsed.siteConfig.markets.find((entry) => entry.isDefault)?.code ?? parsed.siteConfig.markets[0]!.code
        });
      }

      if (Array.isArray(parsed.siteConfig?.locales) && parsed.siteConfig?.locales.length > 0) {
        for (const locale of parsed.siteConfig.locales) {
          await sdk.upsertLocale({
            siteId,
            code: locale.code,
            name: locale.name,
            active: Boolean(locale.active),
            fallbackLocaleCode: locale.fallbackLocaleCode ?? null,
            isDefault: Boolean(locale.isDefault)
          });
        }
        await sdk.setSiteLocales({
          siteId,
          locales: parsed.siteConfig.locales.map((entry) => ({ code: entry.code, active: Boolean(entry.active) })),
          defaultLocaleCode: parsed.siteConfig.locales.find((entry) => entry.isDefault)?.code ?? parsed.siteConfig.locales[0]!.code
        });
      }

      if (parsed.siteConfig?.matrix?.combinations?.length) {
        await sdk.setSiteMarketLocaleMatrix({
          siteId,
          combinations: parsed.siteConfig.matrix.combinations.map((entry) => ({
            marketCode: entry.marketCode,
            localeCode: entry.localeCode,
            active: Boolean(entry.active),
            isDefaultForMarket: Boolean(entry.isDefaultForMarket)
          })),
          defaults: parsed.siteConfig.matrix.defaults
            ? {
                marketDefaultLocales: parsed.siteConfig.matrix.defaults.marketDefaultLocales.map((entry) => ({
                  marketCode: entry.marketCode,
                  localeCode: entry.localeCode
                }))
              }
            : null
        });
      }

      const existingTypes = await sdk.listContentTypes({ siteId });
      const typeByName = new Map((existingTypes.listContentTypes ?? []).map((entry) => [entry?.name ?? '', entry?.id ?? 0]));

      for (const type of parsed.contentTypes) {
        if (!typeByName.has(type.name)) {
          const created = await sdk.createContentType({
            siteId,
            name: type.name,
            description: type.description ?? null,
            fieldsJson: type.fieldsJson,
            by: 'admin'
          });
          if (created.createContentType?.id) {
            typeByName.set(type.name, created.createContentType.id);
          }
        }
      }

      const existingTemplates = await sdk.listTemplates({ siteId });
      const templateNames = new Set((existingTemplates.listTemplates ?? []).map((entry) => entry?.name ?? ''));
      for (const template of parsed.templates) {
        if (templateNames.has(template.name)) {
          continue;
        }
        await sdk.createTemplate({
          siteId,
          name: template.name,
          compositionJson: template.compositionJson,
          componentsJson: template.componentsJson,
          constraintsJson: template.constraintsJson
        });
      }

      if (Array.isArray(parsed.forms)) {
        for (const form of parsed.forms) {
          const savedForm = await sdk.upsertForm({
            id: form.id ?? null,
            siteId,
            name: form.name,
            description: form.description ?? null,
            active: Boolean(form.active)
          });
          const nextFormId = savedForm.upsertForm?.id;
          if (!nextFormId) {
            continue;
          }

          const stepMap = new Map<string, number>();
          for (const step of form.steps ?? []) {
            const savedStep = await sdk.upsertFormStep({
              id: step.id ?? null,
              formId: nextFormId,
              name: step.name,
              position: step.position
            });
            const stepId = savedStep.upsertFormStep?.id;
            if (!stepId) {
              continue;
            }
            if (step.externalId) {
              stepMap.set(step.externalId, stepId);
            }
            stepMap.set(String(step.id ?? stepId), stepId);
          }

          const fallbackStepId = stepMap.values().next().value as number | undefined;
          for (const field of form.fields ?? []) {
            const stepId = typeof field.stepRef === 'number'
              ? stepMap.get(String(field.stepRef)) ?? field.stepRef
              : typeof field.stepRef === 'string'
                ? stepMap.get(field.stepRef)
                : fallbackStepId;
            if (!stepId) {
              continue;
            }
            await sdk.upsertFormField({
              id: field.id ?? null,
              formId: nextFormId,
              stepId,
              key: field.key,
              label: field.label,
              fieldType: field.fieldType,
              position: field.position,
              conditionsJson: field.conditionsJson ?? '{}',
              validationsJson: field.validationsJson ?? '{}',
              uiConfigJson: field.uiConfigJson ?? '{}',
              active: Boolean(field.active)
            });
          }
        }
      }

      let importedItems = 0;
      const createdItemIds: number[] = [];
      for (const item of parsed.items) {
        const contentTypeId = typeByName.get(item.contentTypeName);
        if (!contentTypeId) {
          continue;
        }
        const created = await sdk.createContentItem({
          siteId,
          contentTypeId,
          by: 'admin',
          initialFieldsJson: item.fieldsJson,
          initialCompositionJson: item.compositionJson,
          initialComponentsJson: item.componentsJson
        });
        const createdId = created.createContentItem?.id;
        if (!createdId) {
          createdItemIds.push(0);
          continue;
        }
        createdItemIds.push(createdId);
        importedItems += 1;

        try {
          const detail = await sdk.getContentItemDetail({ contentItemId: createdId });
          const draft = detail.getContentItemDetail?.currentDraftVersion;
          if (draft?.id && typeof draft.versionNumber === 'number') {
            await sdk.publishVersion({
              versionId: draft.id,
              expectedVersionNumber: draft.versionNumber,
              comment: 'Publish imported snapshot',
              by: 'admin'
            });
          }
        } catch {
          // continue importing remaining items
        }
        for (const route of item.routes) {
          try {
            await sdk.upsertRoute({
              siteId,
              contentItemId: createdId,
              marketCode: route.marketCode,
              localeCode: route.localeCode,
              slug: route.slug,
              isCanonical: route.isCanonical
            });
          } catch {
            // continue importing remaining routes/items
          }
        }
      }

      if (Array.isArray(parsed.variants)) {
        for (const variant of parsed.variants) {
          const contentItemId = createdItemIds[variant.itemIndex];
          if (!contentItemId) {
            continue;
          }
          try {
            const detail = await sdk.getContentItemDetail({ contentItemId });
            const baseVersion = detail.getContentItemDetail?.currentPublishedVersion ?? detail.getContentItemDetail?.currentDraftVersion;
            if (!baseVersion?.id || typeof baseVersion.versionNumber !== 'number') {
              continue;
            }

            const draft = await sdk.createDraftVersion({
              contentItemId,
              fromVersionId: baseVersion.id,
              comment: variant.patch?.comment ?? `Variant ${variant.key}`,
              by: 'admin'
            });
            const draftVersion = draft.createDraftVersion;
            if (!draftVersion?.id || typeof draftVersion.versionNumber !== 'number') {
              continue;
            }

            const nextVersion = await sdk.updateDraftVersion({
              versionId: draftVersion.id,
              expectedVersionNumber: draftVersion.versionNumber,
              patch: {
                fieldsJson: variant.patch?.fieldsJson ?? null,
                compositionJson: variant.patch?.compositionJson ?? null,
                componentsJson: variant.patch?.componentsJson ?? null,
                metadataJson: variant.patch?.metadataJson ?? null,
                comment: variant.patch?.comment ?? null,
                createdBy: 'admin'
              }
            });
            const publish = await sdk.publishVersion({
              versionId: nextVersion.updateDraftVersion?.id ?? 0,
              expectedVersionNumber: nextVersion.updateDraftVersion?.versionNumber ?? 0,
              comment: `Publish variant ${variant.key}`,
              by: 'admin'
            });
            const variantVersionId = publish.publishVersion?.id;
            if (!variantVersionId) {
              continue;
            }

            const set = await sdk.upsertVariantSet({
              siteId,
              contentItemId,
              marketCode: variant.marketCode,
              localeCode: variant.localeCode,
              fallbackVariantSetId: null,
              active: true
            });
            const variantSetId = set.upsertVariantSet?.id;
            if (!variantSetId) {
              continue;
            }
            await sdk.upsertVariant({
              variantSetId,
              key: variant.key,
              priority: variant.priority,
              state: variant.state,
              ruleJson: variant.ruleJson,
              trafficAllocation: variant.trafficAllocation ?? null,
              contentVersionId: variantVersionId
            });
          } catch {
            // continue importing remaining variants
          }
        }
      }

      setStatus(`Import complete. Imported ${importedItems} items into site ${siteId}.`);
    } catch (error) {
      handleError(error);
    } finally {
      setWorking(false);
    }
  };

  const loadDemoImport = async () => {
    setStatus('');
    try {
      const response = await fetch('/demo/contenthead-demo-import.json');
      if (!response.ok) {
        throw new Error(`Failed to load demo import file (${response.status})`);
      }
      const text = await response.text();
      setImportJson(text);
      setStatus('Loaded demo import JSON.');
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader title="DuckDB Admin" subtitle="Runtime DB operations, demo data, and JSON import/export." />
      {forbiddenReason ? (
        <WorkspaceBody>
          <ForbiddenState title="DuckDB admin unavailable" reason={forbiddenReason} />
        </WorkspaceBody>
      ) : (
        <div className="card-grid">
          <section className="content-card">
          <h3 className="mt-0">Load Demo Data</h3>
          <p className="muted">Run the API seed script to load the demo page (`/demo`) and baseline data.</p>
          <div className="inline-actions">
            <Button
              label="Copy Seed Command"
              onClick={() => navigator.clipboard.writeText('pnpm --filter @contenthead/api seed')}
            />
            <Button
              label="Copy Start Command"
              severity="secondary"
              onClick={() => navigator.clipboard.writeText('pnpm dev')}
            />
          </div>
        </section>

        <section className="content-card">
          <h3 className="mt-0">Export Site Snapshot</h3>
          <p className="muted">Exports content types, templates, items (latest version JSON), and routes for the current site.</p>
          <Button label="Export JSON" onClick={() => void exportSnapshot()} loading={working} />
        </section>

        <section className="content-card">
          <h3 className="mt-0">Import Site Snapshot</h3>
          <p className="muted">Imports snapshots exported by this screen. Existing content types/templates by name are skipped.</p>
          <div className="inline-actions mb-2">
            <Button label="Load Demo Import" severity="secondary" onClick={() => void loadDemoImport()} />
          </div>
          <FileUpload
            mode="basic"
            name="snapshot"
            accept=".json,application/json"
            chooseLabel="Load JSON File"
            customUpload
            uploadHandler={(event) => {
              const file = event.files?.[0];
              if (!(file instanceof File)) {
                return;
              }
              file.text().then((text) => setImportJson(text)).catch(() => setStatus('Failed to read file.'));
            }}
          />
          <div className="form-row mt-3">
            <label>Snapshot JSON</label>
            <InputTextarea rows={12} value={importJson} onChange={(event) => setImportJson(event.target.value)} />
          </div>
          <Button label="Import JSON" severity="success" onClick={() => void importSnapshot()} disabled={!importJson.trim()} loading={working} />
        </section>
        </div>
      )}
      {status && !forbiddenReason ? <div className="status-panel" role="alert">{status}</div> : null}
    </WorkspacePage>
  );
}

