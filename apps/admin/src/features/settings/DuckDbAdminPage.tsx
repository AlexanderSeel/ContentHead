import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, DialogPanel, Textarea } from '../../ui/atoms';

import { useAdminContext } from '../../app/AdminContext';
import { useAuth } from '../../app/AuthContext';
import { useUi } from '../../app/UiContext';
import { getApiBaseUrl } from '../../lib/api';
import { createAdminSdk } from '../../lib/sdk';
import { formatErrorMessage, isForbiddenError } from '../../lib/graphqlErrorUi';
import { issueCollector } from '../../lib/issueCollector';
import { ForbiddenState, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

type ExportedItem = {
  externalId?: string;
  parentExternalId?: string | null;
  contentTypeName: string;
  fieldsJson: string;
  compositionJson: string;
  componentsJson: string;
  metadataJson: string;
  routes: Array<{ marketCode: string; localeCode: string; slug: string; isCanonical: boolean }>;
};

type SnapshotForm = {
  id?: number;
  externalId?: string;
  name: string;
  description?: string | null;
  active: boolean;
  steps: Array<{
    id?: number;
    externalId?: string;
    name: string;
    position: number;
  }>;
  fields: Array<{
    id?: number;
    stepRef?: string | number;
    key: string;
    label: string;
    fieldType: string;
    position: number;
    conditionsJson: string;
    validationsJson: string;
    uiConfigJson: string;
    active: boolean;
  }>;
};

type SnapshotVariant = {
  itemIndex: number;
  itemExternalId?: string;
  marketCode: string;
  localeCode: string;
  key: string;
  priority: number;
  state: string;
  ruleJson: string;
  trafficAllocation?: number | null;
  patch?: {
    fieldsJson?: string;
    compositionJson?: string;
    componentsJson?: string;
    metadataJson?: string;
    comment?: string;
  };
};

type SnapshotAsset = {
  externalId?: string;
  filename: string;
  originalName?: string | null;
  mimeType?: string | null;
  sourcePath?: string | null;
  sourceDataUrl?: string | null;
  sourceText?: string | null;
  aiPrompt?: string | null;
  aiImagePrompt?: string | null;
  aiImageSize?: string | null;
  title?: string | null;
  altText?: string | null;
  description?: string | null;
  tags?: string[] | null;
};

type SiteConfigSnapshot = {
  siteName?: string;
  urlPattern?: string;
  markets?: Array<{ code: string; name: string; currency?: string | null; timezone?: string | null; active: boolean; isDefault: boolean }>;
  locales?: Array<{ code: string; name: string; active: boolean; fallbackLocaleCode?: string | null; isDefault: boolean }>;
  matrix?: {
    combinations: Array<{ marketCode: string; localeCode: string; active: boolean; isDefaultForMarket?: boolean }>;
    defaults?: { marketDefaultLocales: Array<{ marketCode: string; localeCode: string }> };
  };
};

type SiteSnapshot = {
  schemaVersion: 1;
  siteId: number;
  exportedAt: string;
  contentTypes: Array<{ name: string; description?: string | null; fieldsJson: string }>;
  templates: Array<{ name: string; compositionJson: string; componentsJson: string; constraintsJson: string }>;
  items: ExportedItem[];
  siteConfig?: SiteConfigSnapshot;
  forms?: SnapshotForm[];
  variants?: SnapshotVariant[];
  assets?: SnapshotAsset[];
};

const DEFAULT_MARKETS: NonNullable<SiteConfigSnapshot['markets']> = [
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    timezone: 'America/New_York',
    active: true,
    isDefault: true
  },
  {
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    active: true,
    isDefault: false
  }
];

const DEFAULT_LOCALES: NonNullable<SiteConfigSnapshot['locales']> = [
  {
    code: 'en-US',
    name: 'English (US)',
    active: true,
    fallbackLocaleCode: null,
    isDefault: true
  },
  {
    code: 'de-DE',
    name: 'Deutsch (DE)',
    active: true,
    fallbackLocaleCode: 'en-US',
    isDefault: false
  }
];

const DEFAULT_MATRIX_COMBINATIONS: NonNullable<NonNullable<SiteConfigSnapshot['matrix']>['combinations']> = [
  {
    marketCode: 'US',
    localeCode: 'en-US',
    active: true,
    isDefaultForMarket: true
  },
  {
    marketCode: 'DE',
    localeCode: 'de-DE',
    active: true,
    isDefaultForMarket: true
  }
];

const DEFAULT_MATRIX_DEFAULTS: NonNullable<NonNullable<SiteConfigSnapshot['matrix']>['defaults']> = {
  marketDefaultLocales: [
    { marketCode: 'US', localeCode: 'en-US' },
    { marketCode: 'DE', localeCode: 'de-DE' }
  ]
};

function normalizeMarketCode(code: string | null | undefined): string {
  return (code ?? '').trim().toUpperCase();
}

function normalizeLocaleCode(code: string | null | undefined): string {
  const trimmed = (code ?? '').trim();
  if (!trimmed) {
    return '';
  }
  const parts = trimmed.replace(/_/g, '-').split('-').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.toLowerCase()}-${parts[1]!.toUpperCase()}`;
  }
  return trimmed;
}

function slugifyFallback(value: string | null | undefined, index: number): string {
  const base = (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!base) {
    return index === 0 ? 'index' : `page-${index + 1}`;
  }
  if (base === 'index' || base === 'home') {
    return 'index';
  }
  return base;
}

function ensureSnapshotDefaults(snapshot: Partial<SiteSnapshot>): SiteSnapshot {
  const normalizedMarkets = new Map<string, NonNullable<SiteConfigSnapshot['markets']>[number]>();
  for (const market of snapshot.siteConfig?.markets ?? []) {
    const code = normalizeMarketCode(market?.code);
    if (!code) {
      continue;
    }
    normalizedMarkets.set(code, {
      code,
      name: market?.name?.trim() || code,
      currency: market?.currency ?? null,
      timezone: market?.timezone ?? null,
      active: Boolean(market?.active),
      isDefault: Boolean(market?.isDefault)
    });
  }
  for (const market of DEFAULT_MARKETS) {
    if (!normalizedMarkets.has(market.code)) {
      normalizedMarkets.set(market.code, { ...market });
    }
  }
  const markets = Array.from(normalizedMarkets.values());
  if (!markets.some((entry) => entry.isDefault)) {
    const us = markets.find((entry) => entry.code === 'US');
    if (us) {
      us.isDefault = true;
    } else if (markets.length > 0) {
      markets[0]!.isDefault = true;
    }
  }
  for (const market of markets) {
    if (!market.isDefault) {
      continue;
    }
    for (const entry of markets) {
      if (entry !== market) {
        entry.isDefault = false;
      }
    }
    break;
  }

  const normalizedLocales = new Map<string, NonNullable<SiteConfigSnapshot['locales']>[number]>();
  for (const locale of snapshot.siteConfig?.locales ?? []) {
    const code = normalizeLocaleCode(locale?.code);
    if (!code) {
      continue;
    }
    normalizedLocales.set(code, {
      code,
      name: locale?.name?.trim() || code,
      active: Boolean(locale?.active),
      fallbackLocaleCode: normalizeLocaleCode(locale?.fallbackLocaleCode) || null,
      isDefault: Boolean(locale?.isDefault)
    });
  }
  for (const locale of DEFAULT_LOCALES) {
    if (!normalizedLocales.has(locale.code)) {
      normalizedLocales.set(locale.code, { ...locale });
    }
  }
  const locales = Array.from(normalizedLocales.values());
  if (!locales.some((entry) => entry.isDefault)) {
    const enUs = locales.find((entry) => entry.code === 'en-US');
    if (enUs) {
      enUs.isDefault = true;
    } else if (locales.length > 0) {
      locales[0]!.isDefault = true;
    }
  }
  for (const locale of locales) {
    if (!locale.isDefault) {
      continue;
    }
    locale.fallbackLocaleCode = null;
    for (const entry of locales) {
      if (entry !== locale) {
        entry.isDefault = false;
      }
    }
    break;
  }
  const hasEnUs = locales.some((entry) => entry.code === 'en-US');
  if (hasEnUs) {
    const deDe = locales.find((entry) => entry.code === 'de-DE');
    if (deDe && !deDe.fallbackLocaleCode) {
      deDe.fallbackLocaleCode = 'en-US';
    }
  }

  const activeMarketCodes = new Set(markets.filter((entry) => entry.active).map((entry) => entry.code));
  const activeLocaleCodes = new Set(locales.filter((entry) => entry.active).map((entry) => entry.code));
  const normalizedCombinations = new Map<string, NonNullable<NonNullable<SiteConfigSnapshot['matrix']>['combinations']>[number]>();
  for (const combo of snapshot.siteConfig?.matrix?.combinations ?? []) {
    const marketCode = normalizeMarketCode(combo?.marketCode);
    const localeCode = normalizeLocaleCode(combo?.localeCode);
    if (!marketCode || !localeCode || !activeMarketCodes.has(marketCode) || !activeLocaleCodes.has(localeCode)) {
      continue;
    }
    normalizedCombinations.set(`${marketCode}|${localeCode}`, {
      marketCode,
      localeCode,
      active: Boolean(combo?.active),
      isDefaultForMarket: Boolean(combo?.isDefaultForMarket)
    });
  }
  for (const combo of DEFAULT_MATRIX_COMBINATIONS) {
    if (!activeMarketCodes.has(combo.marketCode) || !activeLocaleCodes.has(combo.localeCode)) {
      continue;
    }
    const key = `${combo.marketCode}|${combo.localeCode}`;
    if (!normalizedCombinations.has(key)) {
      normalizedCombinations.set(key, { ...combo });
    }
  }
  const combinations = Array.from(normalizedCombinations.values()).filter((entry) => entry.active);
  for (const marketCode of activeMarketCodes) {
    const perMarket = combinations.filter((entry) => entry.marketCode === marketCode);
    if (perMarket.length === 0) {
      const defaultLocale = marketCode === 'DE' && activeLocaleCodes.has('de-DE') ? 'de-DE' : 'en-US';
      if (activeLocaleCodes.has(defaultLocale)) {
        combinations.push({
          marketCode,
          localeCode: defaultLocale,
          active: true,
          isDefaultForMarket: true
        });
      }
      continue;
    }
    if (!perMarket.some((entry) => entry.isDefaultForMarket)) {
      perMarket[0]!.isDefaultForMarket = true;
    }
  }
  const rawDefaults = snapshot.siteConfig?.matrix?.defaults?.marketDefaultLocales ?? [];
  const defaultsByMarket = new Map<string, string>();
  for (const entry of rawDefaults) {
    const marketCode = normalizeMarketCode(entry?.marketCode);
    const localeCode = normalizeLocaleCode(entry?.localeCode);
    if (!marketCode || !localeCode) {
      continue;
    }
    if (!combinations.some((combo) => combo.marketCode === marketCode && combo.localeCode === localeCode)) {
      continue;
    }
    defaultsByMarket.set(marketCode, localeCode);
  }
  for (const combo of combinations) {
    if (!defaultsByMarket.has(combo.marketCode) && combo.isDefaultForMarket) {
      defaultsByMarket.set(combo.marketCode, combo.localeCode);
    }
  }
  for (const combo of combinations) {
    if (!defaultsByMarket.has(combo.marketCode)) {
      defaultsByMarket.set(combo.marketCode, combo.localeCode);
    }
  }
  for (const entry of DEFAULT_MATRIX_DEFAULTS.marketDefaultLocales) {
    if (!defaultsByMarket.has(entry.marketCode) && combinations.some((combo) => combo.marketCode === entry.marketCode && combo.localeCode === entry.localeCode)) {
      defaultsByMarket.set(entry.marketCode, entry.localeCode);
    }
  }
  const marketDefaultLocales = Array.from(defaultsByMarket.entries()).map(([marketCode, localeCode]) => ({ marketCode, localeCode }));

  const items = (snapshot.items ?? []).map((item, index) => {
    const rawRoutes = Array.isArray(item.routes) ? item.routes : [];
    const normalizedRoutes = rawRoutes
      .map((route) => ({
        marketCode: normalizeMarketCode(route?.marketCode),
        localeCode: normalizeLocaleCode(route?.localeCode),
        slug: (route?.slug ?? '').trim(),
        isCanonical: Boolean(route?.isCanonical)
      }))
      .filter((route) => route.marketCode && route.localeCode && route.slug);
    if (normalizedRoutes.length > 0) {
      return {
        ...item,
        routes: normalizedRoutes
      };
    }
    const fallbackSlug = slugifyFallback(item.externalId ?? item.contentTypeName, index);
    return {
      ...item,
      routes: [
        {
          marketCode: 'US',
          localeCode: 'en-US',
          slug: fallbackSlug,
          isCanonical: true
        },
        {
          marketCode: 'DE',
          localeCode: 'de-DE',
          slug: fallbackSlug,
          isCanonical: false
        }
      ]
    };
  });

  const siteConfig: SiteConfigSnapshot = {
    urlPattern: snapshot.siteConfig?.urlPattern || '/{market}/{locale}',
    markets,
    locales,
    matrix: {
      combinations,
      defaults: {
        marketDefaultLocales
      }
    }
  };
  if (snapshot.siteConfig?.siteName?.trim()) {
    siteConfig.siteName = snapshot.siteConfig.siteName.trim();
  }

  return {
    schemaVersion: 1,
    siteId: snapshot.siteId ?? 1,
    exportedAt: snapshot.exportedAt ?? new Date().toISOString(),
    contentTypes: snapshot.contentTypes ?? [],
    templates: snapshot.templates ?? [],
    items,
    siteConfig,
    forms: Array.isArray(snapshot.forms) ? snapshot.forms : [],
    variants: Array.isArray(snapshot.variants) ? snapshot.variants : [],
    assets: Array.isArray(snapshot.assets) ? snapshot.assets : []
  };
}

type ResetSiteDataResponse = {
  data?: {
    dbAdminResetSiteData?: {
      siteId?: number | null;
      statementsExecuted?: number | null;
      tablesTouched?: string[] | null;
      message?: string | null;
    } | null;
  };
  errors?: Array<{ message?: string | null }>;
};

type ImportAiActivity = {
  textInFlight: number;
  textCompleted: number;
  textFailed: number;
  imageInFlight: number;
  imageCompleted: number;
  imageFailed: number;
};

function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function serializeErrorForDiagnostics(error: unknown): string {
  try {
    if (error instanceof Error) {
      const withMeta = error as Error & {
        response?: unknown;
        request?: unknown;
        cause?: unknown;
        failure?: unknown;
      };
      return JSON.stringify({
        name: withMeta.name,
        message: withMeta.message,
        response: withMeta.response ?? null,
        request: withMeta.request ?? null,
        cause: withMeta.cause ?? null,
        failure: withMeta.failure ?? null
      });
    }
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function DuckDbAdminPage() {
  const { token } = useAuth();
  const ui = useUi();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId, refreshContext } = useAdminContext();
  const [status, setStatus] = useState('');
  const forbiddenReason = status && isForbiddenError(status) ? status : '';
  const [importJson, setImportJson] = useState('');
  const [importProgress, setImportProgress] = useState<string[]>([]);
  const [importStage, setImportStage] = useState('');
  const [importPercent, setImportPercent] = useState(0);
  const [importProgressOpen, setImportProgressOpen] = useState(false);
  const [importAiActivity, setImportAiActivity] = useState<ImportAiActivity>({
    textInFlight: 0,
    textCompleted: 0,
    textFailed: 0,
    imageInFlight: 0,
    imageCompleted: 0,
    imageFailed: 0
  });
  const [working, setWorking] = useState(false);
  const progressLogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const panel = progressLogRef.current;
    if (panel) {
      panel.scrollTop = panel.scrollHeight;
    }
  }, [importProgress]);

  const handleError = (error: unknown) => {
    setStatus(formatErrorMessage(error));
  };
  const reportImportDiagnostic = (scope: string, error: unknown, extra?: Record<string, unknown>) => {
    const message = formatErrorMessage(error);
    const serialized = serializeErrorForDiagnostics(error);
    let extraJson = '';
    if (extra) {
      try {
        extraJson = ` | extra=${JSON.stringify(extra)}`;
      } catch {
        extraJson = ` | extra=${String(extra)}`;
      }
    }
    issueCollector.add({
      source: 'runtime',
      level: 'error',
      title: `Import: ${scope}`,
      details: `${message} | raw=${serialized}${extraJson}`,
      stack: error instanceof Error ? error.stack : undefined,
      featureTag: 'settings/global'
    });
    console.error('[admin-import-error]', { scope, message, error, extra: extra ?? null });
  };

  const exportSnapshot = async () => {
    setWorking(true);
    setStatus('');
    try {
      const [siteRes, matrixRes, typesRes, templatesRes, itemsRes, routesRes, formsRes] = await Promise.all([
        sdk.getSite({ siteId }),
        sdk.getSiteMarketLocaleMatrix({ siteId }),
        sdk.listContentTypes({ siteId }),
        sdk.listTemplates({ siteId }),
        sdk.listContentItems({ siteId }),
        sdk.listRoutes({ siteId, marketCode: null, localeCode: null }),
        sdk.listForms({ siteId })
      ]);
      const contentTypes = (typesRes.listContentTypes ?? []).map((entry) => ({
        name: entry?.name ?? '',
        description: entry?.description ?? null,
        fieldsJson: entry?.fieldsJson ?? '[]'
      }));
      const templates = (templatesRes.listTemplates ?? []).map((entry) => ({
        name: entry?.name ?? '',
        compositionJson: entry?.compositionJson ?? '{"areas":[]}',
        componentsJson: entry?.componentsJson ?? '{}',
        constraintsJson: entry?.constraintsJson ?? '{}'
      }));
      const routes = (routesRes.listRoutes ?? []).map((entry) => ({
        contentItemId: entry?.contentItemId ?? 0,
        marketCode: entry?.marketCode ?? '',
        localeCode: entry?.localeCode ?? '',
        slug: entry?.slug ?? '',
        isCanonical: Boolean(entry?.isCanonical)
      }));

      const items = await Promise.all(
        (itemsRes.listContentItems ?? []).map(async (item) => {
          const detail = await sdk.getContentItemDetail({ contentItemId: item?.id ?? 0 });
          const typeName = detail.getContentItemDetail?.contentType?.name ?? '';
          const version = detail.getContentItemDetail?.currentDraftVersion ?? detail.getContentItemDetail?.currentPublishedVersion;
          return {
            contentTypeName: typeName,
            fieldsJson: version?.fieldsJson ?? '{}',
            compositionJson: version?.compositionJson ?? '{"areas":[]}',
            componentsJson: version?.componentsJson ?? '{}',
            metadataJson: version?.metadataJson ?? '{}',
            routes: routes
              .filter((route) => route.contentItemId === item?.id)
              .map((route) => ({
                marketCode: route.marketCode,
                localeCode: route.localeCode,
                slug: route.slug,
                isCanonical: route.isCanonical
              }))
          } as ExportedItem;
        })
      );

      const forms = await Promise.all(
        (formsRes.listForms ?? []).map(async (form) => {
          const formId = form?.id ?? 0;
          const [stepsRes, fieldsRes] = await Promise.all([
            sdk.listFormSteps({ formId }),
            sdk.listFormFields({ formId })
          ]);
          return {
            id: formId,
            name: form?.name ?? `Form ${formId}`,
            description: form?.description ?? null,
            active: Boolean(form?.active ?? true),
            steps: (stepsRes.listFormSteps ?? []).map((step) => ({
              id: step?.id ?? undefined,
              name: step?.name ?? '',
              position: step?.position ?? 0
            })),
            fields: (fieldsRes.listFormFields ?? []).map((field) => ({
              id: field?.id ?? undefined,
              stepRef: field?.stepId ?? undefined,
              key: field?.key ?? '',
              label: field?.label ?? '',
              fieldType: field?.fieldType ?? 'text',
              position: field?.position ?? 0,
              conditionsJson: field?.conditionsJson ?? '{}',
              validationsJson: field?.validationsJson ?? '{}',
              uiConfigJson: field?.uiConfigJson ?? '{}',
              active: Boolean(field?.active ?? true)
            }))
          } as SnapshotForm;
        })
      );

      const siteConfig: SiteConfigSnapshot = {
        urlPattern: siteRes.getSite?.urlPattern ?? '/{market}/{locale}',
        markets: (matrixRes.getSiteMarketLocaleMatrix?.markets ?? []).map((entry) => ({
          code: entry?.code ?? '',
          name: entry?.name ?? '',
          currency: entry?.currency ?? null,
          timezone: entry?.timezone ?? null,
          active: Boolean(entry?.active),
          isDefault: Boolean(entry?.isDefault)
        })),
        locales: (matrixRes.getSiteMarketLocaleMatrix?.locales ?? []).map((entry) => ({
          code: entry?.code ?? '',
          name: entry?.name ?? '',
          active: Boolean(entry?.active),
          fallbackLocaleCode: entry?.fallbackLocaleCode ?? null,
          isDefault: Boolean(entry?.isDefault)
        })),
        matrix: {
          combinations: (matrixRes.getSiteMarketLocaleMatrix?.combinations ?? []).map((entry) => ({
            marketCode: entry?.marketCode ?? '',
            localeCode: entry?.localeCode ?? '',
            active: Boolean(entry?.active),
            isDefaultForMarket: Boolean(entry?.isDefaultForMarket)
          })),
          defaults: {
            marketDefaultLocales: (matrixRes.getSiteMarketLocaleMatrix?.defaults?.marketDefaultLocales ?? []).map((entry) => ({
              marketCode: entry?.marketCode ?? '',
              localeCode: entry?.localeCode ?? ''
            }))
          }
        }
      };
      if (siteRes.getSite?.name) {
        siteConfig.siteName = siteRes.getSite.name;
      }

      const snapshot: SiteSnapshot = {
        schemaVersion: 1,
        siteId,
        exportedAt: new Date().toISOString(),
        contentTypes,
        templates,
        items,
        siteConfig,
        forms
      };
      downloadJson(`contenthead-site-${siteId}-${Date.now()}.json`, snapshot);
      setStatus(`Exported ${contentTypes.length} content types, ${templates.length} templates, ${items.length} items, ${forms.length} forms.`);
    } catch (error) {
      handleError(error);
    } finally {
      setWorking(false);
    }
  };

  const importSnapshot = async () => {
    setWorking(true);
    setStatus('');
    setImportProgress([]);
    setImportStage('Preparing import…');
    setImportPercent(0);
    setImportAiActivity({
      textInFlight: 0,
      textCompleted: 0,
      textFailed: 0,
      imageInFlight: 0,
      imageCompleted: 0,
      imageFailed: 0
    });
    setImportProgressOpen(true);
    try {
      const parsed = JSON.parse(importJson || '{}') as Partial<SiteSnapshot>;
      if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.contentTypes) || !Array.isArray(parsed.templates) || !Array.isArray(parsed.items)) {
        throw new Error('Invalid snapshot format.');
      }
      const normalized = ensureSnapshotDefaults(parsed);
      const apiBase = getApiBaseUrl();
      const now = () =>
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      const appendProgress = (entry: string, level: 'INFO' | 'WARN' | 'DONE' = 'INFO') => {
        const line = `${now()} ${level} ${entry}`;
        setImportProgress((prev) => [...prev, line]);
        setImportStage(entry);
        setStatus(line);
      };
      const TOTAL_PHASES = 7;
      const PHASE_REQUEST_TIMEOUT_MS = 45_000;
      const AI_REQUEST_TIMEOUT_MS = 180_000;
      const ASSET_UPLOAD_TIMEOUT_MS = 120_000;
      const setPhaseProgress = (phase: number) => {
        const percent = Math.max(0, Math.min(100, Math.round(((phase - 1) / TOTAL_PHASES) * 100)));
        setImportPercent(percent);
      };
      const finishProgress = () => setImportPercent(100);
      const runWithTimeout = async <T,>(label: string, fn: () => Promise<T>, timeoutMs: number): Promise<T> => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        try {
          const timeoutPromise = new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`)), timeoutMs);
          });
          return await Promise.race([fn(), timeoutPromise]);
        } finally {
          if (timer) {
            clearTimeout(timer);
          }
        }
      };
      const totals = {
        types: normalized.contentTypes.length,
        templates: normalized.templates.length,
        forms: normalized.forms?.length ?? 0,
        assets: normalized.assets?.length ?? 0,
        items: normalized.items.length,
        variants: normalized.variants?.length ?? 0
      };
      const counts = {
        types: 0,
        templates: 0,
        forms: 0,
        assets: 0,
        aiImages: 0,
        items: 0,
        routes: 0,
        variants: 0,
        aiTexts: 0,
        failures: 0
      };
      const failureMessages: string[] = [];
      const recordFailure = (scope: string, error: unknown) => {
        counts.failures += 1;
        const message = formatErrorMessage(error);
        reportImportDiagnostic(scope, error, { phase: importStage || 'import' });
        if (failureMessages.length < 8) {
          failureMessages.push(`${scope}: ${message}`);
        }
        if (counts.failures <= 5) {
          appendProgress(`${scope} failed: ${message}`, 'WARN');
        }
      };

      const parseJson = (value: string, fallback: unknown) => {
        try {
          return JSON.parse(value);
        } catch {
          return fallback;
        }
      };
      const requestGraphql = async <T,>(
        query: string,
        variables: Record<string, unknown>,
        options?: { timeoutMs?: number; label?: string }
      ): Promise<T> => {
        const timeoutMs = options?.timeoutMs ?? PHASE_REQUEST_TIMEOUT_MS;
        const label = options?.label ?? 'GraphQL request';
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout> | null = null;
        try {
          timer = setTimeout(() => controller.abort(), timeoutMs);
          const response = await fetch(`${apiBase}/graphql`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              ...(token ? { authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ query, variables }),
            signal: controller.signal
          });
          if (!response.ok) {
            throw new Error(`${label} failed (${response.status})`);
          }
          const payload = (await response.json()) as { data?: T; errors?: Array<{ message?: string | null }> };
          if (payload.errors?.length) {
            throw new Error(payload.errors.map((entry) => entry.message ?? 'Unknown GraphQL error').join('; '));
          }
          if (!payload.data) {
            throw new Error(`${label} response missing data`);
          }
          return payload.data;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            const timeoutError = new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`);
            reportImportDiagnostic(label, timeoutError, { timeoutMs });
            throw timeoutError;
          }
          reportImportDiagnostic(label, error, {
            variables,
            query: query.slice(0, 180),
            timeoutMs
          });
          throw error;
        } finally {
          if (timer) {
            clearTimeout(timer);
          }
        }
      };
      const aiTextCache = new Map<string, string>();
      const generateAiText = async (prompt: string, maxChars?: number): Promise<string> => {
        const trimmedPrompt = prompt.trim();
        if (!trimmedPrompt) {
          return '';
        }
        const key = `${trimmedPrompt}|${typeof maxChars === 'number' ? maxChars : ''}`;
        const cached = aiTextCache.get(key);
        if (cached) {
          appendProgress(`AI text cache hit (${Math.min(trimmedPrompt.length, 64)} chars prompt).`);
          return cached;
        }
        setImportAiActivity((prev) => ({ ...prev, textInFlight: prev.textInFlight + 1 }));
        appendProgress(`AI text start: "${trimmedPrompt.slice(0, 72)}${trimmedPrompt.length > 72 ? '…' : ''}"`);
        try {
          const data = await requestGraphql<{ aiGenerateText?: { text?: string | null } | null }>(
            `
mutation AiGenerateText($prompt: String!, $maxChars: Int) {
  aiGenerateText(prompt: $prompt, maxChars: $maxChars) {
    text
  }
}
`,
            { prompt: trimmedPrompt, maxChars: typeof maxChars === 'number' ? maxChars : null },
            { timeoutMs: AI_REQUEST_TIMEOUT_MS, label: 'AI text generation' }
          );
          const text = data.aiGenerateText?.text?.trim() ?? '';
          if (!text) {
            throw new Error('AI text generation returned empty text');
          }
          aiTextCache.set(key, text);
          counts.aiTexts += 1;
          setImportAiActivity((prev) => ({
            ...prev,
            textInFlight: Math.max(0, prev.textInFlight - 1),
            textCompleted: prev.textCompleted + 1
          }));
          appendProgress(`AI text done (${text.length} chars).`, 'DONE');
          return text;
        } catch (error) {
          setImportAiActivity((prev) => ({
            ...prev,
            textInFlight: Math.max(0, prev.textInFlight - 1),
            textFailed: prev.textFailed + 1
          }));
          appendProgress(`AI text failed: ${formatErrorMessage(error)}`, 'WARN');
          throw error;
        }
      };
      const stringifyJson = (value: unknown, fallback: string) => {
        try {
          return JSON.stringify(value);
        } catch {
          return fallback;
        }
      };

      appendProgress(
        `Snapshot detected: ${totals.types} types, ${totals.templates} templates, ${totals.forms} forms, ${totals.assets} assets, ${totals.items} items, ${totals.variants} variants.`
      );

      setPhaseProgress(1);
      appendProgress('1/7 Import site config');
      const isSoftSiteConfigConflict = (error: unknown): boolean => {
        const message = formatErrorMessage(error).toLowerCase();
        return (
          message.includes('market_in_use') ||
          message.includes('locale_in_use') ||
          message.includes('cannot be updated in-place') ||
          message.includes('in use and cannot be updated')
        );
      };
      if (normalized.siteConfig?.urlPattern) {
        await sdk.setSiteUrlPattern({ siteId, urlPattern: normalized.siteConfig.urlPattern });
      }
      if (normalized.siteConfig?.siteName?.trim()) {
        await sdk.setSiteName({ siteId, name: normalized.siteConfig.siteName.trim() });
      }

      if (Array.isArray(normalized.siteConfig?.markets) && normalized.siteConfig?.markets.length > 0) {
        for (const market of normalized.siteConfig.markets) {
          try {
            await sdk.upsertMarket({
              siteId,
              code: market.code,
              name: market.name,
              currency: market.currency ?? null,
              timezone: market.timezone ?? null,
              active: Boolean(market.active),
              // Apply default in the consolidated setSiteMarkets step to avoid transient conflicts.
              isDefault: false
            });
          } catch (error) {
            if (!isSoftSiteConfigConflict(error)) {
              throw error;
            }
            appendProgress(`Market ${market.code}: using existing base market metadata (${formatErrorMessage(error)}).`, 'WARN');
            reportImportDiagnostic(`Market ${market.code} base upsert`, error, { marketCode: market.code });
          }
        }
        await sdk.setSiteMarkets({
          siteId,
          markets: normalized.siteConfig.markets.map((entry) => ({ code: entry.code, active: Boolean(entry.active) })),
          defaultMarketCode: normalized.siteConfig.markets.find((entry) => entry.isDefault)?.code ?? normalized.siteConfig.markets[0]!.code
        });
      }

      if (Array.isArray(normalized.siteConfig?.locales) && normalized.siteConfig?.locales.length > 0) {
        for (const locale of normalized.siteConfig.locales) {
          try {
            await sdk.upsertLocale({
              siteId,
              code: locale.code,
              name: locale.name,
              active: Boolean(locale.active),
              fallbackLocaleCode: locale.fallbackLocaleCode ?? null,
              // Apply default in the consolidated setSiteLocales step to avoid transient conflicts.
              isDefault: false
            });
          } catch (error) {
            if (!isSoftSiteConfigConflict(error)) {
              throw error;
            }
            appendProgress(`Locale ${locale.code}: using existing base locale metadata (${formatErrorMessage(error)}).`, 'WARN');
            reportImportDiagnostic(`Locale ${locale.code} base upsert`, error, { localeCode: locale.code });
          }
        }
        await sdk.setSiteLocales({
          siteId,
          locales: normalized.siteConfig.locales.map((entry) => ({ code: entry.code, active: Boolean(entry.active) })),
          defaultLocaleCode: normalized.siteConfig.locales.find((entry) => entry.isDefault)?.code ?? normalized.siteConfig.locales[0]!.code
        });
      }

      if (normalized.siteConfig?.matrix?.combinations?.length) {
        await sdk.setSiteMarketLocaleMatrix({
          siteId,
          combinations: normalized.siteConfig.matrix.combinations.map((entry) => ({
            marketCode: entry.marketCode,
            localeCode: entry.localeCode,
            active: Boolean(entry.active),
            isDefaultForMarket: Boolean(entry.isDefaultForMarket)
          })),
          defaults: normalized.siteConfig.matrix.defaults
            ? {
                marketDefaultLocales: normalized.siteConfig.matrix.defaults.marketDefaultLocales.map((entry) => ({
                  marketCode: entry.marketCode,
                  localeCode: entry.localeCode
                }))
              }
            : null
        });
      }
      appendProgress(
        `Site config imported. Markets=${normalized.siteConfig?.markets?.length ?? 0}, locales=${normalized.siteConfig?.locales?.length ?? 0}, matrix=${normalized.siteConfig?.matrix?.combinations?.length ?? 0}.`,
        'DONE'
      );
      const verifiedMatrix = await sdk.getSiteMarketLocaleMatrix({ siteId });
      const verifiedMarkets = (verifiedMatrix.getSiteMarketLocaleMatrix?.markets ?? []).map((entry) => entry?.code ?? '');
      const verifiedLocales = (verifiedMatrix.getSiteMarketLocaleMatrix?.locales ?? []).map((entry) => entry?.code ?? '');
      appendProgress(
        `Site config verify: markets=[${verifiedMarkets.join(', ')}], locales=[${verifiedLocales.join(', ')}].`,
        'INFO'
      );
      const expectedMarketCodes = (normalized.siteConfig?.markets ?? []).map((entry) => entry.code);
      const expectedLocaleCodes = (normalized.siteConfig?.locales ?? []).map((entry) => entry.code);
      const missingMarkets = expectedMarketCodes.filter((code) => !verifiedMarkets.includes(code));
      const missingLocales = expectedLocaleCodes.filter((code) => !verifiedLocales.includes(code));
      if (missingMarkets.length > 0 || missingLocales.length > 0) {
        appendProgress(
          `Site config repair: missing markets=[${missingMarkets.join(', ')}], locales=[${missingLocales.join(', ')}].`,
          'WARN'
        );
        for (const code of missingMarkets) {
          const market = normalized.siteConfig?.markets?.find((entry) => entry.code === code);
          if (!market) {
            continue;
          }
          await sdk.upsertMarket({
            siteId,
            code: market.code,
            name: market.name,
            currency: market.currency ?? null,
            timezone: market.timezone ?? null,
            active: Boolean(market.active),
            isDefault: false
          });
        }
        for (const code of missingLocales) {
          const locale = normalized.siteConfig?.locales?.find((entry) => entry.code === code);
          if (!locale) {
            continue;
          }
          await sdk.upsertLocale({
            siteId,
            code: locale.code,
            name: locale.name,
            active: Boolean(locale.active),
            fallbackLocaleCode: locale.fallbackLocaleCode ?? null,
            isDefault: false
          });
        }
        if (normalized.siteConfig?.markets?.length) {
          await sdk.setSiteMarkets({
            siteId,
            markets: normalized.siteConfig.markets.map((entry) => ({ code: entry.code, active: Boolean(entry.active) })),
            defaultMarketCode: normalized.siteConfig.markets.find((entry) => entry.isDefault)?.code ?? normalized.siteConfig.markets[0]!.code
          });
        }
        if (normalized.siteConfig?.locales?.length) {
          await sdk.setSiteLocales({
            siteId,
            locales: normalized.siteConfig.locales.map((entry) => ({ code: entry.code, active: Boolean(entry.active) })),
            defaultLocaleCode: normalized.siteConfig.locales.find((entry) => entry.isDefault)?.code ?? normalized.siteConfig.locales[0]!.code
          });
        }
        const repaired = await sdk.getSiteMarketLocaleMatrix({ siteId });
        const repairedMarkets = (repaired.getSiteMarketLocaleMatrix?.markets ?? []).map((entry) => entry?.code ?? '');
        const repairedLocales = (repaired.getSiteMarketLocaleMatrix?.locales ?? []).map((entry) => entry?.code ?? '');
        appendProgress(
          `Site config repaired: markets=[${repairedMarkets.join(', ')}], locales=[${repairedLocales.join(', ')}].`,
          'DONE'
        );
      }

      setPhaseProgress(2);
      appendProgress('2/7 Import content types');
      const existingTypes = await sdk.listContentTypes({ siteId });
      const typeByName = new Map((existingTypes.listContentTypes ?? []).map((entry) => [entry?.name ?? '', entry?.id ?? 0]));
      let skippedTypes = 0;

      for (const type of normalized.contentTypes) {
        if (typeByName.has(type.name)) {
          skippedTypes += 1;
          continue;
        }
        const created = await sdk.createContentType({
          siteId,
          name: type.name,
          description: type.description ?? null,
          fieldsJson: type.fieldsJson,
          by: 'admin'
        });
        if (created.createContentType?.id) {
          typeByName.set(type.name, created.createContentType.id);
          counts.types += 1;
        }
      }
      appendProgress(`Content types done: created ${counts.types}, skipped ${skippedTypes}, total ${totals.types}.`, 'DONE');

      setPhaseProgress(3);
      appendProgress('3/7 Import templates/components');
      const existingTemplates = await sdk.listTemplates({ siteId });
      const templateNames = new Set((existingTemplates.listTemplates ?? []).map((entry) => entry?.name ?? ''));
      let skippedTemplates = 0;
      for (const template of normalized.templates) {
        if (templateNames.has(template.name)) {
          skippedTemplates += 1;
          continue;
        }
        await sdk.createTemplate({
          siteId,
          name: template.name,
          compositionJson: template.compositionJson,
          componentsJson: template.componentsJson,
          constraintsJson: template.constraintsJson
        });
        counts.templates += 1;
      }
      appendProgress(
        `Templates/components done: created ${counts.templates}, skipped ${skippedTemplates}, total ${totals.templates}.`,
        'DONE'
      );

      setPhaseProgress(4);
      appendProgress('4/7 Import forms');
      const formIdByExternal = new Map<string, number>();
      if (Array.isArray(normalized.forms)) {
        const totalForms = normalized.forms.length;
        let formIndex = 0;
        for (const form of normalized.forms) {
          formIndex += 1;
          const savedForm = await sdk.upsertForm({
            id: form.id ?? null,
            siteId,
            name: form.name,
            description: form.description ?? null,
            active: Boolean(form.active)
          });
          const nextFormId = savedForm.upsertForm?.id;
          if (!nextFormId) {
            continue;
          }
          counts.forms += 1;
          if (form.externalId?.trim()) {
            formIdByExternal.set(form.externalId.trim(), nextFormId);
          }

          const stepMap = new Map<string, number>();
          for (const step of form.steps ?? []) {
            const savedStep = await sdk.upsertFormStep({
              id: step.id ?? null,
              formId: nextFormId,
              name: step.name,
              position: step.position
            });
            const stepId = savedStep.upsertFormStep?.id;
            if (!stepId) {
              continue;
            }
            if (step.externalId) {
              stepMap.set(step.externalId, stepId);
            }
            stepMap.set(String(step.id ?? stepId), stepId);
          }

          const fallbackStepId = stepMap.values().next().value as number | undefined;
          for (const field of form.fields ?? []) {
            const stepId = typeof field.stepRef === 'number'
              ? stepMap.get(String(field.stepRef)) ?? field.stepRef
              : typeof field.stepRef === 'string'
                ? stepMap.get(field.stepRef)
                : fallbackStepId;
            if (!stepId) {
              continue;
            }
            await sdk.upsertFormField({
              id: field.id ?? null,
              formId: nextFormId,
              stepId,
              key: field.key,
              label: field.label,
              fieldType: field.fieldType,
              position: field.position,
              conditionsJson: field.conditionsJson ?? '{}',
              validationsJson: field.validationsJson ?? '{}',
              uiConfigJson: field.uiConfigJson ?? '{}',
              active: Boolean(field.active)
            });
          }
          if (formIndex % 5 === 0 || formIndex === totalForms) {
            appendProgress(`Forms progress: ${formIndex}/${totalForms} processed.`);
          }
        }
      }
      appendProgress(`Forms done: ${counts.forms}/${totals.forms} upserted.`, 'DONE');

      const assetIdByExternal = new Map<string, number>();
      setPhaseProgress(5);
      appendProgress('5/7 Import assets/images');
      if (Array.isArray(normalized.assets) && normalized.assets.length > 0) {
        const existingAssets = await sdk.listAssets({ siteId, limit: 500, offset: 0, search: null, folderId: null, tags: null });
        const byFilename = new Map(
          (existingAssets.listAssets?.items ?? [])
            .filter((entry) => typeof entry?.id === 'number')
            .map((entry) => [entry?.filename ?? '', entry?.id as number])
        );

        const uploadAsset = async (asset: SnapshotAsset): Promise<number | null> => {
          const sourcePath = asset.sourcePath?.trim() ?? '';
          const sourceDataUrl = asset.sourceDataUrl?.trim() ?? '';
          const sourceText = asset.sourceText ?? '';
          let blob: Blob | null = null;
          if (sourceDataUrl) {
            const response = await runWithTimeout(
              `Download sourceDataUrl for asset ${asset.filename}`,
              () => fetch(sourceDataUrl),
              ASSET_UPLOAD_TIMEOUT_MS
            );
            if (!response.ok) {
              return null;
            }
            blob = await response.blob();
          } else if (sourcePath) {
            const response = await runWithTimeout(
              `Download sourcePath for asset ${asset.filename}`,
              () => fetch(sourcePath),
              ASSET_UPLOAD_TIMEOUT_MS
            );
            if (!response.ok) {
              return null;
            }
            blob = await response.blob();
          } else if (sourceText) {
            blob = new Blob([sourceText], { type: asset.mimeType ?? 'application/octet-stream' });
          }
          if (!blob) {
            return null;
          }
          const file = new File([blob], asset.originalName?.trim() || asset.filename, {
            type: asset.mimeType?.trim() || blob.type || 'application/octet-stream'
          });
          const formData = new FormData();
          formData.append('file', file);
          const requestInit: RequestInit = { method: 'POST', body: formData };
          if (token) {
            requestInit.headers = { authorization: `Bearer ${token}` };
          }
          const response = await runWithTimeout(
            `Upload asset ${asset.filename}`,
            () => fetch(`${apiBase}/api/assets/upload?siteId=${siteId}`, requestInit),
            ASSET_UPLOAD_TIMEOUT_MS
          );
          if (!response.ok) {
            return null;
          }
          const payload = (await response.json()) as { id?: number };
          return typeof payload.id === 'number' ? payload.id : null;
        };

        const generateAiAsset = async (asset: SnapshotAsset): Promise<number | null> => {
          const prompt = asset.aiImagePrompt?.trim() || asset.aiPrompt?.trim() || '';
          if (!prompt) {
            return null;
          }
          setImportAiActivity((prev) => ({ ...prev, imageInFlight: prev.imageInFlight + 1 }));
          appendProgress(`AI image start: ${asset.filename} "${prompt.slice(0, 72)}${prompt.length > 72 ? '…' : ''}"`);
          try {
            const payload = await requestGraphql<{ aiGenerateAsset?: { id?: number | null } | null }>(
              `
mutation AiGenerateAssetImport(
  $siteId: Int!
  $prompt: String!
  $filename: String
  $mimeType: String
  $size: String
  $title: String
  $altText: String
  $description: String
  $tags: [String!]
) {
  aiGenerateAsset(
    siteId: $siteId
    prompt: $prompt
    filename: $filename
    mimeType: $mimeType
    size: $size
    title: $title
    altText: $altText
    description: $description
    tags: $tags
  ) {
    id
  }
}
`,
              {
                siteId,
                prompt,
                filename: asset.filename,
                mimeType: asset.mimeType ?? null,
                size: asset.aiImageSize ?? null,
                title: asset.title ?? null,
                altText: asset.altText ?? null,
                description: asset.description ?? null,
                tags: Array.isArray(asset.tags) ? asset.tags : null
              },
              { timeoutMs: AI_REQUEST_TIMEOUT_MS, label: `AI image generation for ${asset.filename}` }
            );
            const generatedId = payload.aiGenerateAsset?.id;
            const assetId = typeof generatedId === 'number' ? generatedId : null;
            if (assetId) {
              setImportAiActivity((prev) => ({
                ...prev,
                imageInFlight: Math.max(0, prev.imageInFlight - 1),
                imageCompleted: prev.imageCompleted + 1
              }));
              appendProgress(`AI image done: ${asset.filename} (asset #${assetId}).`, 'DONE');
            } else {
              setImportAiActivity((prev) => ({
                ...prev,
                imageInFlight: Math.max(0, prev.imageInFlight - 1),
                imageFailed: prev.imageFailed + 1
              }));
              appendProgress(`AI image returned empty id: ${asset.filename}.`, 'WARN');
            }
            return assetId;
          } catch (error) {
            setImportAiActivity((prev) => ({
              ...prev,
              imageInFlight: Math.max(0, prev.imageInFlight - 1),
              imageFailed: prev.imageFailed + 1
            }));
            appendProgress(`AI image failed: ${asset.filename}: ${formatErrorMessage(error)}`, 'WARN');
            throw error;
          }
        };

        const totalAssets = normalized.assets.length;
        let processedAssets = 0;
        for (const asset of normalized.assets) {
          processedAssets += 1;
          const filename = asset.filename?.trim();
          if (!filename) {
            continue;
          }
          let assetId = byFilename.get(filename) ?? null;
          if (!assetId) {
            try {
              const hasAiImagePrompt = Boolean(asset.aiImagePrompt?.trim() || asset.aiPrompt?.trim());
              assetId = hasAiImagePrompt ? await generateAiAsset(asset) : await uploadAsset(asset);
              if (hasAiImagePrompt && assetId) {
                counts.aiImages += 1;
              }
            } catch (error) {
              recordFailure(`Asset ${filename}`, error);
              assetId = null;
            }
          }
          if (!assetId) {
            continue;
          }
          byFilename.set(filename, assetId);
          counts.assets += 1;
          if (asset.externalId?.trim()) {
            assetIdByExternal.set(asset.externalId.trim(), assetId);
          }
          try {
            await sdk.updateAssetMetadata({
              id: assetId,
              title: asset.title ?? asset.originalName ?? filename,
              altText: asset.altText ?? asset.title ?? filename,
              description: asset.description ?? null,
              tags: Array.isArray(asset.tags) ? asset.tags : [],
              folderId: null,
              by: 'admin'
            });
          } catch (error) {
            recordFailure(`Asset metadata ${filename}`, error);
          }
          if (processedAssets % 5 === 0 || processedAssets === totalAssets) {
            appendProgress(`Assets progress: ${processedAssets}/${totalAssets} processed (${counts.aiImages} AI-generated).`);
          }
        }
      }
      appendProgress(`Assets done: ${counts.assets}/${totals.assets} imported (${counts.aiImages} AI-generated).`, 'DONE');

      const itemIdByExternal = new Map<string, number>();
      const createdItemIds: number[] = Array(parsed.items.length).fill(0);
      const resolveAiDirective = (value: Record<string, unknown>): { prompt: string; maxChars?: number } | null => {
        const directive = value.$aiText;
        if (typeof directive === 'string' && directive.trim()) {
          return { prompt: directive.trim() };
        }
          if (directive && typeof directive === 'object') {
            const record = directive as Record<string, unknown>;
            if (typeof record.prompt === 'string' && record.prompt.trim()) {
              const maxChars = typeof record.maxChars === 'number' ? Math.floor(record.maxChars) : null;
              if (typeof maxChars === 'number') {
                return { prompt: record.prompt.trim(), maxChars };
              }
              return { prompt: record.prompt.trim() };
            }
          }
        return null;
      };
      const resolveTokens = async (value: unknown): Promise<unknown> => {
        if (typeof value === 'string') {
          if (value.startsWith('@asset:')) {
            return assetIdByExternal.get(value.slice('@asset:'.length)) ?? null;
          }
          if (value.startsWith('@item:')) {
            return itemIdByExternal.get(value.slice('@item:'.length)) ?? null;
          }
          if (value.startsWith('@form:')) {
            return formIdByExternal.get(value.slice('@form:'.length)) ?? null;
          }
          if (value.startsWith('@ai:text:')) {
            return generateAiText(value.slice('@ai:text:'.length));
          }
          return value;
        }
        if (Array.isArray(value)) {
          const resolved: unknown[] = [];
          for (const entry of value) {
            resolved.push(await resolveTokens(entry));
          }
          return resolved;
        }
        if (value && typeof value === 'object') {
          const record = value as Record<string, unknown>;
          const aiDirective = resolveAiDirective(record);
          if (aiDirective) {
            return generateAiText(aiDirective.prompt, aiDirective.maxChars);
          }
          const entries = await Promise.all(
            Object.entries(record).map(async ([key, entry]) => [key, await resolveTokens(entry)] as const)
          );
          return Object.fromEntries(entries);
        }
        return value;
      };
      const resolveJsonString = async (value: string | null | undefined, fallback: string): Promise<string> => {
        if (!value?.trim()) {
          return fallback;
        }
        const parsedValue = parseJson(value, null);
        if (parsedValue == null) {
          return value;
        }
        return stringifyJson(await resolveTokens(parsedValue), value);
      };

      setPhaseProgress(6);
      appendProgress('6/7 Import content + routes');
      const pendingItems = normalized.items.map((item, index) => ({ item, index }));
      let importedItems = 0;
      let progressed = true;
      let createdByParentPass = 0;
      while (pendingItems.length > 0 && progressed) {
        progressed = false;
        for (let idx = pendingItems.length - 1; idx >= 0; idx -= 1) {
          const entry = pendingItems[idx]!;
          const parentExternalId = entry.item.parentExternalId?.trim() ?? '';
          if (parentExternalId && !itemIdByExternal.has(parentExternalId)) {
            continue;
          }
          const contentTypeId = typeByName.get(entry.item.contentTypeName);
          if (!contentTypeId) {
            pendingItems.splice(idx, 1);
            continue;
          }
          const created = await sdk.createContentItem({
            siteId,
            contentTypeId,
            parentId: parentExternalId ? itemIdByExternal.get(parentExternalId) ?? null : null,
            by: 'admin',
            initialFieldsJson: entry.item.fieldsJson,
            initialCompositionJson: entry.item.compositionJson,
            initialComponentsJson: entry.item.componentsJson,
            metadataJson: entry.item.metadataJson
          });
          const createdId = created.createContentItem?.id ?? 0;
          createdItemIds[entry.index] = createdId;
          if (createdId) {
            importedItems += 1;
            counts.items += 1;
            createdByParentPass += 1;
            if (entry.item.externalId?.trim()) {
              itemIdByExternal.set(entry.item.externalId.trim(), createdId);
            }
          }
          pendingItems.splice(idx, 1);
          progressed = true;
          if (importedItems % 10 === 0 || importedItems === totals.items) {
            appendProgress(`Items creation progress: ${importedItems}/${totals.items}.`);
          }
        }
      }

      for (const entry of pendingItems) {
        const contentTypeId = typeByName.get(entry.item.contentTypeName);
        if (!contentTypeId) {
          continue;
        }
        const created = await sdk.createContentItem({
          siteId,
          contentTypeId,
          parentId: null,
          by: 'admin',
          initialFieldsJson: entry.item.fieldsJson,
          initialCompositionJson: entry.item.compositionJson,
          initialComponentsJson: entry.item.componentsJson,
          metadataJson: entry.item.metadataJson
        });
        const createdId = created.createContentItem?.id ?? 0;
        createdItemIds[entry.index] = createdId;
        if (createdId) {
          importedItems += 1;
          counts.items += 1;
          if (entry.item.externalId?.trim()) {
            itemIdByExternal.set(entry.item.externalId.trim(), createdId);
          }
        }
        if (importedItems % 10 === 0 || importedItems === totals.items) {
          appendProgress(`Items creation progress: ${importedItems}/${totals.items}.`);
        }
      }
      appendProgress(
        `Items created: ${counts.items}/${totals.items} (parent-order pass: ${createdByParentPass}, fallback pass: ${Math.max(0, counts.items - createdByParentPass)}).`,
        'DONE'
      );

      let publishedItems = 0;
      for (let index = 0; index < normalized.items.length; index += 1) {
        const item = normalized.items[index]!;
        const contentItemId = createdItemIds[index] ?? 0;
        if (!contentItemId) {
          continue;
        }
        try {
          const detail = await sdk.getContentItemDetail({ contentItemId });
          const draft = detail.getContentItemDetail?.currentDraftVersion;
          if (draft?.id && typeof draft.versionNumber === 'number') {
            const next = await sdk.updateDraftVersion({
              versionId: draft.id,
              expectedVersionNumber: draft.versionNumber,
              patch: {
                fieldsJson: await resolveJsonString(item.fieldsJson, '{}'),
                compositionJson: await resolveJsonString(item.compositionJson, '{"areas":[]}'),
                componentsJson: await resolveJsonString(item.componentsJson, '{}'),
                metadataJson: await resolveJsonString(item.metadataJson, '{}'),
                comment: 'Resolve imported references',
                createdBy: 'admin'
              }
            });
            if (next.updateDraftVersion?.id && typeof next.updateDraftVersion.versionNumber === 'number') {
              await sdk.publishVersion({
                versionId: next.updateDraftVersion.id,
                expectedVersionNumber: next.updateDraftVersion.versionNumber,
                comment: 'Publish imported snapshot',
                by: 'admin'
              });
              publishedItems += 1;
            }
          }
        } catch (error) {
          recordFailure(`Publish item ${contentItemId}`, error);
        }
        for (const route of item.routes) {
          try {
            await sdk.upsertRoute({
              siteId,
              contentItemId,
              marketCode: route.marketCode,
              localeCode: route.localeCode,
              slug: route.slug,
              isCanonical: route.isCanonical
            });
            counts.routes += 1;
          } catch (error) {
            recordFailure(`Route ${route.slug}`, error);
          }
        }
        if ((index + 1) % 10 === 0 || index + 1 === normalized.items.length) {
          appendProgress(`Publish/routes progress: ${index + 1}/${normalized.items.length} items processed, ${counts.routes} routes.`);
        }
      }
      appendProgress(`Publish/routes done: published ${publishedItems}/${counts.items} items, routes upserted ${counts.routes}.`, 'DONE');

      setPhaseProgress(7);
      appendProgress('7/7 Import variants');
      const variantSetByKey = new Map<string, number>();
      if (Array.isArray(normalized.variants)) {
        const totalVariants = normalized.variants.length;
        let variantIndex = 0;
        for (const variant of normalized.variants) {
          variantIndex += 1;
          const contentItemId = variant.itemExternalId?.trim()
            ? itemIdByExternal.get(variant.itemExternalId.trim()) ?? 0
            : createdItemIds[variant.itemIndex] ?? 0;
          if (!contentItemId) {
            continue;
          }
          try {
            const detail = await sdk.getContentItemDetail({ contentItemId });
            const baseVersion = detail.getContentItemDetail?.currentPublishedVersion ?? detail.getContentItemDetail?.currentDraftVersion;
            if (!baseVersion?.id || typeof baseVersion.versionNumber !== 'number') {
              continue;
            }

            const draft = await sdk.createDraftVersion({
              contentItemId,
              fromVersionId: baseVersion.id,
              comment: variant.patch?.comment ?? `Variant ${variant.key}`,
              by: 'admin'
            });
            const draftVersion = draft.createDraftVersion;
            if (!draftVersion?.id || typeof draftVersion.versionNumber !== 'number') {
              continue;
            }

            const nextVersion = await sdk.updateDraftVersion({
              versionId: draftVersion.id,
              expectedVersionNumber: draftVersion.versionNumber,
              patch: {
                fieldsJson: await resolveJsonString(variant.patch?.fieldsJson ?? null, '{}'),
                compositionJson: await resolveJsonString(variant.patch?.compositionJson ?? null, '{"areas":[]}'),
                componentsJson: await resolveJsonString(variant.patch?.componentsJson ?? null, '{}'),
                metadataJson: await resolveJsonString(variant.patch?.metadataJson ?? null, '{}'),
                comment: variant.patch?.comment ?? null,
                createdBy: 'admin'
              }
            });
            const publish = await sdk.publishVersion({
              versionId: nextVersion.updateDraftVersion?.id ?? 0,
              expectedVersionNumber: nextVersion.updateDraftVersion?.versionNumber ?? 0,
              comment: `Publish variant ${variant.key}`,
              by: 'admin'
            });
            const variantVersionId = publish.publishVersion?.id;
            if (!variantVersionId) {
              continue;
            }

            const variantSetKey = `${contentItemId}|${variant.marketCode}|${variant.localeCode}`;
            let variantSetId = variantSetByKey.get(variantSetKey) ?? 0;
            if (!variantSetId) {
              const set = await sdk.upsertVariantSet({
                siteId,
                contentItemId,
                marketCode: variant.marketCode,
                localeCode: variant.localeCode,
                fallbackVariantSetId: null,
                active: true
              });
              variantSetId = set.upsertVariantSet?.id ?? 0;
              if (variantSetId) {
                variantSetByKey.set(variantSetKey, variantSetId);
              }
            }
            if (!variantSetId) {
              continue;
            }
            await sdk.upsertVariant({
              variantSetId,
              key: variant.key,
              priority: variant.priority,
              state: variant.state,
              ruleJson: variant.ruleJson,
              trafficAllocation: variant.trafficAllocation ?? null,
              contentVersionId: variantVersionId
            });
            counts.variants += 1;
          } catch (error) {
            recordFailure(`Variant ${variant.key}`, error);
          }
          if (variantIndex % 5 === 0 || variantIndex === totalVariants) {
            appendProgress(`Variants progress: ${variantIndex}/${totalVariants} processed (${counts.variants} created).`);
          }
        }
      }
      appendProgress(`Variants done: ${counts.variants}/${totals.variants} imported.`, 'DONE');

      const summary = `Import complete for site ${siteId}. Added ${counts.types} types, ${counts.templates} templates, ${counts.forms} forms, ${importedItems} items, ${counts.routes} routes, ${counts.assets} assets (${counts.aiImages} AI), ${counts.variants} variants, ${counts.aiTexts} AI text snippets.`;
      finishProgress();
      appendProgress(summary, 'DONE');
      if (counts.failures > 0) {
        appendProgress(`Warnings: ${counts.failures}. Showing up to ${failureMessages.length} details below.`, 'WARN');
        for (const message of failureMessages) {
          appendProgress(message, 'WARN');
        }
      }
      await refreshContext();
      setStatus(summary);
    } catch (error) {
      const message = formatErrorMessage(error);
      const stamped = `${new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })} WARN Import aborted: ${message}`;
      setImportProgress((prev) => [...prev, stamped]);
      setImportStage(`Import failed: ${message}`);
      reportImportDiagnostic('Import aborted', error, { siteId });
      handleError(error);
    } finally {
      setWorking(false);
    }
  };

  const loadDemoImport = async (path = '/demo/contenthead-demo-import.json', successLabel = 'Loaded demo import JSON.') => {
    setStatus('');
    setImportProgress([]);
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load demo import file (${response.status})`);
      }
      const text = await response.text();
      setImportJson(text);
      setStatus(successLabel);
    } catch (error) {
      handleError(error);
    }
  };

  const resetSiteData = async () => {
    const confirmed = await ui.confirm({
      header: 'Reset Site Data',
      message: `Delete existing site data for site ${siteId} before importing demo data? This cannot be undone.`,
      acceptLabel: 'Reset',
      rejectLabel: 'Cancel'
    });
    if (!confirmed) {
      return;
    }

    setWorking(true);
    setStatus('');
    setImportProgress([]);
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/graphql`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          query: `
mutation DbAdminResetSiteData($siteId: Int!) {
  dbAdminResetSiteData(siteId: $siteId) {
    siteId
    statementsExecuted
    tablesTouched
    message
  }
}
`,
          variables: { siteId }
        })
      });
      if (!response.ok) {
        throw new Error(`Reset request failed (${response.status})`);
      }
      const payload = (await response.json()) as ResetSiteDataResponse;
      if (payload.errors?.length) {
        throw new Error(payload.errors.map((entry) => entry.message ?? 'Unknown GraphQL error').join('; '));
      }
      const result = payload.data?.dbAdminResetSiteData;
      await refreshContext();
      setImportJson('');
      setStatus(result?.message ?? `Reset complete for site ${siteId}.`);
    } catch (error) {
      handleError(error);
    } finally {
      setWorking(false);
    }
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader title="DuckDB Admin" subtitle="Runtime DB operations, demo data, and JSON import/export." />
      {forbiddenReason ? (
        <WorkspaceBody>
          <ForbiddenState title="DuckDB admin unavailable" reason={forbiddenReason} />
        </WorkspaceBody>
      ) : (
        <WorkspaceBody>
          <div className="card-grid">
            <section className="content-card">
              <h3 className="mt-0">Load Demo Data</h3>
              <p className="muted">Run the API seed script to load the demo page (`/demo`) and baseline data.</p>
              <div className="inline-actions">
                <Button
                  label="Copy Seed Command"
                  onClick={() => navigator.clipboard.writeText('pnpm --filter @contenthead/api seed')}
                />
                <Button
                  label="Copy Start Command"
                  severity="secondary"
                  onClick={() => navigator.clipboard.writeText('pnpm dev')}
                />
              </div>
            </section>

            <section className="content-card">
              <h3 className="mt-0">Reset Site Data</h3>
              <p className="muted">Clears existing content, routes, variants, forms, assets, and site mappings for this site before import.</p>
              <Button label="Reset Site Data" severity="danger" onClick={() => void resetSiteData()} loading={working} />
            </section>

            <section className="content-card">
              <h3 className="mt-0">Export Site Snapshot</h3>
              <p className="muted">Exports content types, templates, items (latest version JSON), and routes for the current site.</p>
              <Button label="Export JSON" onClick={() => void exportSnapshot()} loading={working} />
            </section>

            <section className="content-card">
              <h3 className="mt-0">Import Site Snapshot</h3>
              <p className="muted">Imports snapshots exported by this screen. Existing content types/templates by name are skipped.</p>
              <div className="inline-actions mb-2">
                <Button label="Load Demo Import" severity="secondary" onClick={() => void loadDemoImport()} />
                <Button
                  label="Load Complex Demo"
                  severity="secondary"
                  onClick={() =>
                    void loadDemoImport(
                      '/demo/contenthead-complex-demo-import.json',
                      'Loaded complex demo import JSON.'
                    )
                  }
                />
              </div>
              <label className="p-button p-component p-button-secondary p-button-outlined" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="pi pi-upload" />
                <span>Load JSON File</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!(file instanceof File)) return;
                    file.text().then((text) => setImportJson(text)).catch(() => setStatus('Failed to read file.'));
                    e.target.value = '';
                  }}
                />
              </label>
              <div className="form-row mt-3">
                <label>Snapshot JSON</label>
                <Textarea rows={12} value={importJson} onChange={(next) => setImportJson(next)} />
              </div>
              <div className="inline-actions mt-3">
                <Button label="Import JSON" severity="success" onClick={() => void importSnapshot()} disabled={!importJson.trim()} loading={working} />
                <Button
                  label="View Progress"
                  severity="secondary"
                  outlined
                  onClick={() => setImportProgressOpen(true)}
                  disabled={importProgress.length === 0}
                />
              </div>
              <small className="muted">Import runs in a detailed progress dialog with AI activity and timeout diagnostics.</small>
            </section>
          </div>
        </WorkspaceBody>
      )}
      {status && !forbiddenReason ? <div className="status-panel" role="alert">{status}</div> : null}
      <DialogPanel
        header="Import Progress"
        visible={importProgressOpen}
        onHide={() => {
          if (!working) {
            setImportProgressOpen(false);
          }
        }}
        style={{ width: 'min(96vw, 62rem)' }}
        closable={!working}
        dismissableMask={!working}
      >
        <div className="import-progress-dialog">
          <div className="import-progress-summary">
            <div className="import-progress-stage">{importStage || 'Waiting…'}</div>
            <progress className="p-progressbar" value={importPercent} max={100} style={{ width: '100%', height: '0.5rem' }} />
            <div className="import-progress-metrics">
              <span>Progress: {importPercent}%</span>
              <span>AI Text in-flight: {importAiActivity.textInFlight}</span>
              <span>AI Text done: {importAiActivity.textCompleted}</span>
              <span>AI Text failed: {importAiActivity.textFailed}</span>
              <span>AI Image in-flight: {importAiActivity.imageInFlight}</span>
              <span>AI Image done: {importAiActivity.imageCompleted}</span>
              <span>AI Image failed: {importAiActivity.imageFailed}</span>
            </div>
          </div>
          <div className="import-progress-log import-progress-log-dialog" ref={progressLogRef}>
            {importProgress.length === 0 ? <div className="import-progress-entry muted">No progress entries yet.</div> : null}
            {importProgress.map((entry, index) => (
              <div key={`${index}-${entry}`} className="import-progress-entry">{entry}</div>
            ))}
          </div>
        </div>
      </DialogPanel>
    </WorkspacePage>
  );
}

