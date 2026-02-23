import { buildLocalizedPath } from '@contenthead/shared';
function normalizeBaseUrl(value) {
    const raw = (value ?? 'http://localhost:3000').trim();
    return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}
export function buildWebUrl(params) {
    const baseUrl = normalizeBaseUrl(params.baseUrl);
    const path = buildLocalizedPath(params.siteUrlPattern, params.marketCode, params.localeCode, params.slug);
    if (params.previewMode === 'published') {
        const query = new URLSearchParams();
        query.set('siteId', String(params.siteId));
        query.set('market', params.marketCode);
        query.set('locale', params.localeCode);
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
    if (params.versionId) {
        query.set('versionId', String(params.versionId));
    }
    if (params.cmsBridge) {
        query.set('cmsBridge', '1');
    }
    return `${baseUrl}/preview?${query.toString()}`;
}
