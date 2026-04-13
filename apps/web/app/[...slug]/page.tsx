import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';

import { createSdk } from '@contenthead/sdk';
import { parseLocalizedPath } from '@contenthead/shared';

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
    return {
      composition,
      components: parsedComponents as Record<string, ComponentPayload>
    };
  }

  const instances = parsedComponents as ComponentInstancePayload[];
  const components = Object.fromEntries(
    instances
      .filter((entry) => entry && typeof entry.instanceId === 'string')
      .map((entry) => [
        entry.instanceId,
        {
          type: entry.componentTypeId,
          props: entry.props ?? {}
        }
      ])
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

function resolveApiEndpoint(candidate: string | string[] | undefined): string {
  const fromQuery = Array.isArray(candidate) ? candidate[0] : candidate;
  const normalizedQuery = (fromQuery ?? '').trim();
  if (normalizedQuery) {
    return normalizedQuery;
  }
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/graphql';
}

export default async function CatchAllPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

  const slug = (resolvedParams.slug ?? []).join('/');
  const siteId = Number((resolvedSearch.siteId as string | undefined) ?? '1');
  const previewToken = (resolvedSearch.previewToken as string | undefined) ?? null;
  const authToken = (resolvedSearch.authToken as string | undefined) ?? null;
  const apiEndpoint = resolveApiEndpoint(resolvedSearch.apiUrl);
  const preview = ((resolvedSearch.preview as string | undefined) ?? 'false') === 'true';
  const cmsBridge = (resolvedSearch.cmsBridge as string | undefined) === '1';
  const inlineEdit = (resolvedSearch.inline as string | undefined) === '1';
  const segments = ((resolvedSearch.segments as string | undefined) ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const userId = cookieStore.get('userId')?.value ?? null;
  const userAgent = requestHeaders.get('user-agent') ?? '';
  const resolvedDevice = (resolvedSearch.device as string | undefined) ?? (userAgent.includes('Mobile') ? 'mobile' : 'desktop');
  const country = (resolvedSearch.country as string | undefined) ?? requestHeaders.get('x-vercel-ip-country') ?? null;
  const query = Object.fromEntries(
    Object.entries(resolvedSearch).map(([key, value]) => [key, Array.isArray(value) ? value[0] : (value ?? null)])
  );
  const contextJson = JSON.stringify({
    userId,
    sessionId: cookieStore.get('sessionId')?.value ?? null,
    segments,
    country,
    device: resolvedDevice,
    query
  });

  const sdk = createSdk({
    endpoint: apiEndpoint,
    headersProvider: () => (authToken ? { authorization: `Bearer ${authToken}` } : undefined)
  });
  let urlPattern = '/{market}/{locale}';
  try {
    const site = await sdk.getSite({ siteId });
    urlPattern = site.getSite?.urlPattern ?? '/{market}/{locale}';
  } catch (error) {
    return (
      <div style={{ padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ marginTop: 0 }}>Website render unavailable</h2>
        <p style={{ marginBottom: '0.5rem' }}>
          Could not connect to API endpoint: <code>{apiEndpoint}</code>
        </p>
        <pre style={{ background: '#f5f5f5', padding: '0.75rem', borderRadius: 6, overflow: 'auto' }}>
          {error instanceof Error ? error.message : 'Unknown fetch error'}
        </pre>
      </div>
    );
  }
  const parsedFromPath = parseLocalizedPath(urlPattern, resolvedParams.slug ?? []);

  const marketCode = (resolvedSearch.market as string | undefined) ?? parsedFromPath?.marketCode ?? 'US';
  const localeCode = (resolvedSearch.locale as string | undefined) ?? parsedFromPath?.localeCode ?? 'en-US';
  const effectiveSlug = parsedFromPath?.slug ?? slug;

  try {
    const result = await sdk.getPageByRoute({
      siteId,
      marketCode,
      localeCode,
      slug: effectiveSlug,
      contextJson,
      previewToken,
      preview,
      variantKeyOverride: (resolvedSearch.variantKey as string | undefined) ?? null,
      versionIdOverride: resolvedSearch.versionId ? Number(resolvedSearch.versionId as string) : null
    });

    const payload = result.getPageByRoute;
    const version = payload?.selectedVersion;
    const base = payload?.base;
    if (!payload || !version || !base) {
      notFound();
    }

    const parsedComponentData = parseComponentData(version.compositionJson ?? '{}', version.componentsJson ?? '{}');
    const composition = parsedComponentData.composition;
    const components = parsedComponentData.components;
    const fields = JSON.parse(version.fieldsJson ?? '{}') as Record<string, unknown>;
    let fieldDefs: Array<{ key: string; type: string; uiConfig?: Record<string, unknown> | null }> = [];
    try {
      fieldDefs = JSON.parse(base.contentType?.fieldsJson ?? '[]') as Array<{ key: string; type: string; uiConfig?: Record<string, unknown> | null }>;
    } catch {
      fieldDefs = [];
    }
    const apiBaseUrl = apiEndpoint.endsWith('/graphql')
      ? apiEndpoint.slice(0, -'/graphql'.length)
      : apiEndpoint;

    const componentEntries = Object.values(components ?? {});
    const collectAssetIds = (value: unknown, acc: Set<number>) => {
      if (typeof value === 'number') {
        acc.add(value);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((entry) => collectAssetIds(entry, acc));
        return;
      }
      if (value && typeof value === 'object') {
        Object.values(value as Record<string, unknown>).forEach((entry) => collectAssetIds(entry, acc));
      }
    };
    const assetIds = new Set<number>();
    const formIds = new Set<number>();
    for (const component of componentEntries) {
      const props = component?.props && typeof component.props === 'object' ? component.props : component;
      collectAssetIds(props, assetIds);
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

    const formRows = await Promise.all(
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
    );
    const forms = Object.fromEntries(formRows);

    return (
      <>
        {cmsBridge && inlineEdit ? (
          <p className="cms-top-meta">
            Mode: {base.mode} | Site: {siteId} | Market/Locale: {marketCode}/{localeCode} | Variant:{' '}
            {payload.selectedVariant?.key ?? 'none'} | Reason: {payload.selectionReason}
          </p>
        ) : null}
        <CmsRendererClient
          siteId={siteId}
          marketCode={marketCode}
          localeCode={localeCode}
          urlPattern={urlPattern}
          routeSlug={effectiveSlug}
          contentItemId={base.contentItem?.id ?? 0}
          versionId={version.id ?? 0}
          fields={fields}
          fieldDefs={fieldDefs}
          composition={composition}
          components={components}
          forms={forms}
          assets={assets}
          apiBaseUrl={apiBaseUrl}
          cmsBridge={cmsBridge}
          inlineEdit={inlineEdit}
        />
      </>
    );
  } catch (error) {
    return (
      <div style={{ padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ marginTop: 0 }}>Website render fetch failed</h2>
        <p style={{ marginBottom: '0.5rem' }}>
          Endpoint: <code>{apiEndpoint}</code>
        </p>
        <pre style={{ background: '#f5f5f5', padding: '0.75rem', borderRadius: 6, overflow: 'auto' }}>
          {error instanceof Error ? error.message : 'Unknown fetch error'}
        </pre>
      </div>
    );
  }
}
