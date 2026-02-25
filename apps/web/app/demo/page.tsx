import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

import { createSdk } from '@contenthead/sdk';

import { CmsRendererClient } from '../components/CmsRendererClient';

type AreaPayload = {
  name: string;
  components: string[];
};

type ComponentPayload = {
  type: string;
  props?: Record<string, unknown>;
  [key: string]: unknown;
};

type ComponentInstancePayload = {
  instanceId: string;
  componentTypeId: string;
  area: string;
  sortOrder: number;
  props?: Record<string, unknown>;
};

function parseComponentData(
  compositionJson: string,
  componentsJson: string
): { composition: { areas?: AreaPayload[] }; components: Record<string, ComponentPayload> } {
  const composition = JSON.parse(compositionJson ?? '{}') as { areas?: AreaPayload[] };
  const parsedComponents = JSON.parse(componentsJson ?? '{}') as unknown;
  if (!Array.isArray(parsedComponents)) {
    return { composition, components: parsedComponents as Record<string, ComponentPayload> };
  }

  const instances = parsedComponents as ComponentInstancePayload[];
  const components = Object.fromEntries(
    instances
      .filter((entry) => entry && typeof entry.instanceId === 'string')
      .map((entry) => [entry.instanceId, { type: entry.componentTypeId, props: entry.props ?? {} }])
  );
  const areasByName = new Map<string, Array<{ id: string; sortOrder: number }>>();
  for (const instance of instances) {
    const area = typeof instance.area === 'string' && instance.area.trim() ? instance.area : 'main';
    const bucket = areasByName.get(area) ?? [];
    bucket.push({
      id: instance.instanceId,
      sortOrder: Number.isFinite(instance.sortOrder) ? instance.sortOrder : 0
    });
    areasByName.set(area, bucket);
  }

  return {
    components,
    composition: {
      areas: Array.from(areasByName.entries()).map(([name, entries]) => ({
        name,
        components: entries.sort((a, b) => a.sortOrder - b.sortOrder).map((entry) => entry.id)
      }))
    }
  };
}

export default async function DemoPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearch = await searchParams;
  const siteId = Number((resolvedSearch.siteId as string | undefined) ?? '1');
  const marketCode = (resolvedSearch.market as string | undefined) ?? 'US';
  const localeCode = (resolvedSearch.locale as string | undefined) ?? 'en-US';
  const previewToken = (resolvedSearch.previewToken as string | undefined) ?? null;
  const authToken = (resolvedSearch.authToken as string | undefined) ?? null;
  const preview = ((resolvedSearch.preview as string | undefined) ?? 'false') === 'true';
  const cmsBridge = (resolvedSearch.cmsBridge as string | undefined) === '1';

  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value ?? null;
  const contextJson = JSON.stringify({
    userId,
    sessionId: cookieStore.get('sessionId')?.value ?? null,
    segments: ((resolvedSearch.segments as string | undefined) ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  });

  const sdk = createSdk({
    endpoint: process.env.API_URL ?? 'http://localhost:4000/graphql',
    headersProvider: () => (authToken ? { authorization: `Bearer ${authToken}` } : undefined)
  });

  const result = await sdk.getPageByRoute({
    siteId,
    marketCode,
    localeCode,
    slug: 'demo',
    contextJson,
    previewToken,
    preview,
    variantKeyOverride: (resolvedSearch.variantKey as string | undefined) ?? null,
    versionIdOverride: resolvedSearch.versionId ? Number(resolvedSearch.versionId as string) : null
  });

  const payload = result.getPageByRoute;
  const version = payload?.selectedVersion;
  const base = payload?.base;
  const siteRes = await sdk.getSite({ siteId });
  const urlPattern = siteRes.getSite?.urlPattern ?? '/{market}/{locale}';
  if (!payload || !version || !base) {
    notFound();
  }

  const parsedComponentData = parseComponentData(version.compositionJson ?? '{}', version.componentsJson ?? '{}');
  const composition = parsedComponentData.composition;
  const components = parsedComponentData.components;
  const fields = JSON.parse(version.fieldsJson ?? '{}') as Record<string, unknown>;
  const apiBaseUrl = (process.env.API_URL ?? 'http://localhost:4000/graphql').replace('/graphql', '');

  const assetIds = new Set<number>();
  const formIds = new Set<number>();
  const collectAssetIds = (value: unknown) => {
    if (typeof value === 'number') {
      assetIds.add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => collectAssetIds(entry));
      return;
    }
    if (value && typeof value === 'object') {
      Object.values(value as Record<string, unknown>).forEach((entry) => collectAssetIds(entry));
    }
  };

  for (const component of Object.values(components ?? {})) {
    const props = component?.props && typeof component.props === 'object' ? component.props : component;
    collectAssetIds(props);
    const maybeFormId = (props as Record<string, unknown>).formId;
    if (typeof maybeFormId === 'number') {
      formIds.add(maybeFormId);
    }
  }

  const assetRows = await Promise.all(
    Array.from(assetIds).map(async (id) => {
      const res = await sdk.getAsset({ id });
      return res.getAsset;
    })
  );
  const assets = Object.fromEntries(
    assetRows.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)).map((entry) => [entry.id, entry])
  );

  const forms = Object.fromEntries(
    await Promise.all(
      Array.from(formIds).map(async (formId) => {
        const formSteps = await sdk.listFormSteps({ formId });
        const formFields = await sdk.listFormFields({ formId });
        return [
          formId,
          {
            steps: (formSteps.listFormSteps ?? [])
              .filter((entry) => typeof entry.id === 'number')
              .map((entry) => ({
                id: entry.id as number,
                name: (entry.name as string | null | undefined) ?? `Step ${(entry.position as number | null | undefined) ?? 1}`,
                position: (entry.position as number | null | undefined) ?? 0
              })),
            fields: (formFields.listFormFields ?? [])
              .filter((entry) => typeof entry.id === 'number' && typeof entry.key === 'string')
              .map((entry) => ({
                id: entry.id as number,
                stepId: (entry.stepId as number | null | undefined) ?? null,
                key: entry.key as string,
                label: (entry.label as string | null | undefined) ?? (entry.key as string),
                fieldType: (entry.fieldType as string | null | undefined) ?? 'text',
                conditionsJson: (entry.conditionsJson as string | null | undefined) ?? '{}',
                validationsJson: (entry.validationsJson as string | null | undefined) ?? '{}',
                uiConfigJson: (entry.uiConfigJson as string | null | undefined) ?? '{}',
                active: Boolean(entry.active ?? true)
              }))
          }
        ] as const;
      })
    )
  );

  return (
    <>
      <p className="cms-top-meta">
        Mode: {base.mode} | Site: {siteId} | Market/Locale: {marketCode}/{localeCode} | Variant:{' '}
        {payload.selectedVariant?.key ?? 'none'} | Reason: {payload.selectionReason}
      </p>
      <CmsRendererClient
        siteId={siteId}
        marketCode={marketCode}
        localeCode={localeCode}
        urlPattern={urlPattern}
        routeSlug="demo"
        contentItemId={base.contentItem?.id ?? 0}
        versionId={version.id ?? 0}
        fields={fields}
        composition={composition}
        components={components}
        forms={forms}
        assets={assets}
        apiBaseUrl={apiBaseUrl}
        cmsBridge={cmsBridge}
      />
    </>
  );
}
