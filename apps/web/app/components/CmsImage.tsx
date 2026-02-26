'use client';

import { buildLocalizedPath } from '@contenthead/shared';

type ContentLink = {
  kind?: 'internal' | 'external';
  url?: string | null;
  contentItemId?: number | null;
  routeSlug?: string | null;
  anchor?: string | null;
  text?: string | null;
  target?: '_self' | '_blank' | null;
};

type Poi = {
  id: string;
  x: number;
  y: number;
  label?: string | null;
  visible?: boolean | null;
  link?: ContentLink | null;
};

type Asset = {
  id: number;
  title?: string | null | undefined;
  altText?: string | null | undefined;
  pois?: Poi[] | null | undefined;
};

function resolveInternalHref(
  link: ContentLink,
  input: { marketCode: string; localeCode: string; urlPattern: string }
): string | null {
  const hash = (link.anchor ?? '').trim().replace(/^#/, '');
  const appendHash = (path: string) => (hash ? `${path}#${hash}` : path);
  const routeSlug = (link.routeSlug ?? '').trim().replace(/^\/+/, '');
  if (routeSlug) {
    return appendHash(buildLocalizedPath(input.urlPattern, input.marketCode, input.localeCode, routeSlug));
  }
  const url = (link.url ?? '').trim();
  if (!url) {
    return null;
  }
  if (url.startsWith('/')) {
    const [pathOnly, urlHash] = url.split('#');
    const slug = (pathOnly ?? '').replace(/^\/+/, '');
    const localized = buildLocalizedPath(input.urlPattern, input.marketCode, input.localeCode, slug);
    return appendHash(urlHash ? `${localized}#${urlHash.replace(/^#/, '')}` : localized);
  }
  return appendHash(url);
}

function resolvePoiHref(
  link: ContentLink | null | undefined,
  input: { marketCode: string; localeCode: string; urlPattern: string }
): string | null {
  if (!link) {
    return null;
  }
  if (link.kind === 'external') {
    return link.url?.trim() || null;
  }
  return resolveInternalHref(link, input);
}

export function CmsImage({
  assetId,
  asset,
  kind,
  fitMode,
  customWidth,
  presetId,
  showPois,
  altOverride,
  apiBaseUrl,
  marketCode,
  localeCode,
  urlPattern
}: {
  assetId?: number | null | undefined;
  asset?: Asset | null | undefined;
  kind?: 'thumb' | 'small' | 'medium' | 'large' | undefined;
  fitMode?: 'cover' | 'contain' | undefined;
  customWidth?: number | undefined;
  presetId?: string | undefined;
  showPois?: boolean | undefined;
  altOverride?: string | undefined;
  apiBaseUrl: string;
  marketCode: string;
  localeCode: string;
  urlPattern: string;
}) {
  if (!assetId) {
    return null;
  }

  const renditionKind = kind ?? 'original';
  const params = new URLSearchParams();
  if (fitMode) {
    params.set('fit', fitMode);
  }
  if (customWidth && customWidth > 0) {
    params.set('width', String(customWidth));
  }
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const url = presetId
    ? `${apiBaseUrl}/assets/${assetId}/rendition/preset/${encodeURIComponent(presetId)}`
    : renditionKind === 'original'
      ? `${apiBaseUrl}/assets/${assetId}`
      : `${apiBaseUrl}/assets/${assetId}/rendition/${renditionKind}${suffix}`;
  const alt = altOverride ?? asset?.altText ?? asset?.title ?? `Asset ${assetId}`;
  const pois = showPois ? (asset?.pois ?? []).filter((entry) => entry.visible !== false) : [];

  return (
    <div style={{ position: 'relative' }}>
      <img src={url} alt={alt} loading="lazy" />
      {pois.map((poi) => {
        const href = resolvePoiHref(poi.link, { marketCode, localeCode, urlPattern });
        const label = poi.label ?? poi.link?.text ?? `Hotspot ${poi.id}`;
        if (!href) {
          return (
            <span
              key={poi.id}
              aria-label={label}
              style={{
                position: 'absolute',
                left: `${poi.x * 100}%`,
                top: `${poi.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 18,
                height: 18,
                borderRadius: 999,
                border: '2px solid #f8fafc',
                background: 'rgba(15, 23, 42, 0.65)'
              }}
            />
          );
        }
        return (
          <a
            key={poi.id}
            href={href}
            target={poi.link?.target ?? '_self'}
            rel={poi.link?.target === '_blank' ? 'noreferrer' : undefined}
            aria-label={label}
            style={{
              position: 'absolute',
              left: `${poi.x * 100}%`,
              top: `${poi.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 22,
              height: 22,
              borderRadius: 999,
              border: '2px solid #f8fafc',
              background: 'rgba(14, 116, 144, 0.8)',
              outlineOffset: 2
            }}
          />
        );
      })}
    </div>
  );
}
