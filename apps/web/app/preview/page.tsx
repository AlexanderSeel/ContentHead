import { notFound } from 'next/navigation';

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

export default async function PreviewPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const contentItemId = Number((query.contentItemId as string | undefined) ?? '0');
  const siteId = Number((query.siteId as string | undefined) ?? '1');
  const marketCode = (query.market as string | undefined) ?? 'US';
  const localeCode = (query.locale as string | undefined) ?? 'en-US';
  const variantKey = (query.variantKey as string | undefined) ?? null;
  const versionIdOverride = query.versionId ? Number(query.versionId as string) : null;
  const token = (query.token as string | undefined) ?? null;
  const cmsBridge = (query.cmsBridge as string | undefined) === '1';
  const inlineEdit = (query.inline as string | undefined) === '1';

  if (!Number.isFinite(contentItemId) || contentItemId <= 0) {
    notFound();
  }

  const sdk = createSdk({ endpoint: process.env.API_URL ?? 'http://localhost:4000/graphql' });
  const siteRes = await sdk.getSite({ siteId });
  const urlPattern = siteRes.getSite?.urlPattern ?? '/{market}/{locale}';

  let resolvedVersionId = versionIdOverride;
  if (!resolvedVersionId && variantKey) {
    const sets = await sdk.listVariantSets({
      siteId,
      contentItemId,
      marketCode,
      localeCode
    });

    const firstSetId = sets.listVariantSets?.[0]?.id;
    if (firstSetId) {
      const list = await sdk.listVariants({ variantSetId: firstSetId });
      const matched = list.listVariants?.find((entry) => entry.key === variantKey);
      if (matched?.contentVersionId) {
        resolvedVersionId = matched.contentVersionId;
      }
    }
  }

  const detail = await sdk.getContentItemDetail({ contentItemId });
  const entity = detail.getContentItemDetail;
  if (!entity?.item) {
    notFound();
  }

  const version =
    (resolvedVersionId
      ? (await sdk.listVersions({ contentItemId })).listVersions?.find((entry) => entry.id === resolvedVersionId)
      : null) ??
    entity.currentDraftVersion ??
    entity.currentPublishedVersion;

  if (!version) {
    notFound();
  }

  const fields = JSON.parse(version.fieldsJson ?? '{}') as Record<string, unknown>;
  const parsedComponentData = parseComponentData(version.compositionJson ?? '{}', version.componentsJson ?? '{}');
  const composition = parsedComponentData.composition;
  const components = parsedComponentData.components;

  let fieldDefs: Array<{ key: string; type: string }> = [];
  try {
    fieldDefs = JSON.parse(entity.contentType?.fieldsJson ?? '[]') as Array<{ key: string; type: string }>;
  } catch {
    fieldDefs = [];
  }

  return (
    <>
      <div style={{ padding: '0.5rem 1rem', fontSize: 12, background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
        Preview token: {token ? 'provided' : 'none'} | item: {contentItemId} | version: {version.id}
      </div>
      <CmsRendererClient
        contentItemId={contentItemId}
        versionId={version.id ?? 0}
        siteId={siteId}
        marketCode={marketCode}
        localeCode={localeCode}
        urlPattern={urlPattern}
        fields={fields}
        fieldDefs={fieldDefs}
        composition={composition}
        components={components}
        cmsBridge={cmsBridge}
        inlineEdit={inlineEdit}
      />
    </>
  );
}
