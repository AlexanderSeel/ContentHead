import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

import { createSdk } from '@contenthead/sdk';
import { parseLocalizedPath } from '@contenthead/shared';

type ComponentPayload = {
  type: string;
  title?: string;
  subtitle?: string;
  html?: string;
  items?: Array<{ title: string; href: string }>;
};

type AreaPayload = {
  name: string;
  components: string[];
};

function renderComponent(id: string, component: ComponentPayload | undefined) {
  if (!component) {
    return <div key={id}>Missing component: {id}</div>;
  }

  if (component.type === 'Hero') {
    return (
      <section key={id} style={{ padding: '2rem', border: '1px solid #cbd5e1', borderRadius: 8 }}>
        <h1>{component.title ?? 'Hero Title'}</h1>
        <p>{component.subtitle ?? ''}</p>
      </section>
    );
  }

  if (component.type === 'RichText') {
    return (
      <section
        key={id}
        style={{ padding: '1rem 0' }}
        dangerouslySetInnerHTML={{ __html: component.html ?? '<p></p>' }}
      />
    );
  }

  if (component.type === 'TeaserGrid') {
    return (
      <section key={id}>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          {(component.items ?? []).map((item, index) => (
            <a
              key={`${id}-${index}`}
              href={item.href}
              style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '1rem', textDecoration: 'none', color: '#0f172a' }}
            >
              {item.title}
            </a>
          ))}
        </div>
      </section>
    );
  }

  return <div key={id}>Unsupported component type: {component.type}</div>;
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
  const preview = ((resolvedSearch.preview as string | undefined) ?? 'false') === 'true';
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
  const areas = composition.areas ?? [{ name: 'main', components: Object.keys(components) }];

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem' }}>
      <p style={{ color: '#64748b' }}>
        Mode: {base.mode} | Site: {siteId} | Market/Locale: {marketCode}/{localeCode} | Variant:{' '}
        {payload.selectedVariant?.key ?? 'none'} | Reason: {payload.selectionReason}
      </p>
      {areas.map((area) => (
        <section key={area.name} style={{ marginBottom: '1.5rem', display: 'grid', gap: '1rem' }}>
          {area.components.map((componentId) => renderComponent(componentId, components[componentId]))}
        </section>
      ))}
    </main>
  );
}
