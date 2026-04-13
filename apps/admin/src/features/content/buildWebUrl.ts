import { buildLocalizedPath } from '@contenthead/shared';

type BuildWebUrlParams = {
  baseUrl?: string;
  siteId: number;
  siteUrlPattern?: string | null | undefined;
  contentItemId: number;
  marketCode: string;
  localeCode: string;
  slug: string;
  previewToken?: string | null | undefined;
  authToken?: string | null | undefined;
  apiUrl?: string | null | undefined;
  versionId?: number | null | undefined;
  previewMode: 'draft' | 'published';
  cmsBridge?: boolean;
  inlineEdit?: boolean;
};

function normalizeBaseUrl(value: string | undefined): string {
  const raw = (value ?? 'http://localhost:localhost:3200').trim();
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

export function buildWebUrl(params: BuildWebUrlParams): string {
  const baseUrl = normalizeBaseUrl(params.baseUrl);
  const path = buildLocalizedPath(params.siteUrlPattern, params.marketCode, params.localeCode, params.slug);

  if (params.previewMode === 'published') {
    const query = new URLSearchParams();
    query.set('siteId', String(params.siteId));
    query.set('market', params.marketCode);
    query.set('locale', params.localeCode);
    if (params.authToken) {
      query.set('authToken', params.authToken);
    }
    if (params.apiUrl) {
      query.set('apiUrl', params.apiUrl);
    }
    if (params.cmsBridge) {
      query.set('cmsBridge', '1');
    }
    return `${baseUrl}${path}?${query.toString()}`;
  }

  const query = new URLSearchParams();
  query.set('contentItemId', String(params.contentItemId));
  query.set('siteId', String(params.siteId));
  query.set('market', params.marketCode);
  query.set('locale', params.localeCode);
  if (params.previewToken) {
    query.set('token', params.previewToken);
  }
  if (params.authToken) {
    query.set('authToken', params.authToken);
  }
  if (params.apiUrl) {
    query.set('apiUrl', params.apiUrl);
  }
  if (params.versionId) {
    query.set('versionId', String(params.versionId));
  }
  if (params.cmsBridge) {
    query.set('cmsBridge', '1');
  }
  if (params.inlineEdit) {
    query.set('inline', '1');
  }

  return `${baseUrl}/preview?${query.toString()}`;
}
