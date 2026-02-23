import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

import { createSdk } from '@contenthead/sdk';
import { parseLocalizedPath } from '@contenthead/shared';

import { CmsRendererClient } from '../components/CmsRendererClient';

type AreaPayload = {
  name: string;
  components: string[];
};

type ComponentPayload = {
  type: string;
  title?: string;
  subtitle?: string;
  body?: string;
  text?: string;
  html?: string;
  href?: string;
  items?: Array<{ title: string; href: string }>;
};

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
  const preview = ((resolvedSearch.preview as string | undefined) ?? 'false') === 'true';
  const cmsBridge = (resolvedSearch.cmsBridge as string | undefined) === '1';
  const segments = ((resolvedSearch.segments as string | undefined) ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value ?? null;
  const contextJson = JSON.stringify({
    userId,
    sessionId: cookieStore.get('sessionId')?.value ?? null,
    segments
  });

  const sdk = createSdk({ endpoint: process.env.API_URL ?? 'http://localhost:4000/graphql' });
  const site = await sdk.getSite({ siteId });
  const urlPattern = site.getSite?.urlPattern ?? '/{market}/{locale}';
  const parsedFromPath = parseLocalizedPath(urlPattern, resolvedParams.slug ?? []);

  const marketCode = (resolvedSearch.market as string | undefined) ?? parsedFromPath?.marketCode ?? 'US';
  const localeCode = (resolvedSearch.locale as string | undefined) ?? parsedFromPath?.localeCode ?? 'en-US';
  const effectiveSlug = parsedFromPath?.slug ?? slug;

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

  const composition = JSON.parse(version.compositionJson ?? '{}') as { areas?: AreaPayload[] };
  const components = JSON.parse(version.componentsJson ?? '{}') as Record<string, ComponentPayload>;
  const fields = JSON.parse(version.fieldsJson ?? '{}') as Record<string, unknown>;

  return (
    <>
      <p style={{ color: '#64748b', margin: '1rem auto', maxWidth: 960, padding: '0 2rem' }}>
        Mode: {base.mode} | Site: {siteId} | Market/Locale: {marketCode}/{localeCode} | Variant:{' '}
        {payload.selectedVariant?.key ?? 'none'} | Reason: {payload.selectionReason}
      </p>
      <CmsRendererClient
        contentItemId={base.contentItem?.id ?? 0}
        versionId={version.id ?? 0}
        fields={fields}
        composition={composition}
        components={components}
        cmsBridge={cmsBridge}
      />
    </>
  );
}
