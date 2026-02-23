import { notFound } from 'next/navigation';

import { createSdk } from '@contenthead/sdk';

import { PreviewClient } from './PreviewClient';

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

  if (!Number.isFinite(contentItemId) || contentItemId <= 0) {
    notFound();
  }

  const sdk = createSdk({ endpoint: process.env.API_URL ?? 'http://localhost:4000/graphql' });

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
  const composition = JSON.parse(version.compositionJson ?? '{}') as { areas?: { name: string; components: string[] }[] };
  const components = JSON.parse(version.componentsJson ?? '{}') as Record<string, {
    type: string;
    title?: string;
    subtitle?: string;
    html?: string;
    items?: Array<{ title: string; href: string }>;
  }>;

  return (
    <>
      <div style={{ padding: '0.5rem 1rem', fontSize: 12, background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
        Preview token: {token ? 'provided' : 'none'} | item: {contentItemId} | version: {version.id}
      </div>
      <PreviewClient
        contentItemId={contentItemId}
        versionId={version.id ?? 0}
        fields={fields}
        composition={composition}
        components={components}
      />
    </>
  );
}
