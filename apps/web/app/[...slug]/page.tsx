import { notFound } from 'next/navigation';

import { createSdk } from '@contenthead/sdk';

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
  const marketCode = (resolvedSearch.market as string | undefined) ?? 'US';
  const localeCode = (resolvedSearch.locale as string | undefined) ?? 'en-US';
  const previewToken = (resolvedSearch.previewToken as string | undefined) ?? null;
  const preview = ((resolvedSearch.preview as string | undefined) ?? 'false') === 'true';

  const sdk = createSdk({ endpoint: process.env.API_URL ?? 'http://localhost:4000/graphql' });
  const result = await sdk.resolveRoute({
    siteId,
    marketCode,
    localeCode,
    slug,
    previewToken,
    preview
  });

  const payload = result.resolveRoute;
  if (!payload || !payload.version) {
    notFound();
  }

  const composition = JSON.parse(payload.version.compositionJson ?? '{}') as { areas?: AreaPayload[] };
  const components = JSON.parse(payload.version.componentsJson ?? '{}') as Record<string, ComponentPayload>;
  const areas = composition.areas ?? [{ name: 'main', components: Object.keys(components) }];

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem' }}>
      <p style={{ color: '#64748b' }}>
        Mode: {payload.mode} | Site: {siteId} | Market/Locale: {marketCode}/{localeCode}
      </p>
      {areas.map((area) => (
        <section key={area.name} style={{ marginBottom: '1.5rem', display: 'grid', gap: '1rem' }}>
          {area.components.map((componentId) => renderComponent(componentId, components[componentId]))}
        </section>
      ))}
    </main>
  );
}