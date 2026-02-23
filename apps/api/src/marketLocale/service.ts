import { GraphQLError } from 'graphql';
import { localeCatalog, type LocaleCatalogItem as SharedLocaleCatalogItem, validateUrlPattern } from '@contenthead/shared';

import type { DbClient } from '../db/DbClient.js';

export type Site = {
  id: number;
  name: string;
  active: boolean;
  urlPattern: string;
};

export type Market = {
  code: string;
  name: string;
  currency: string | null;
  timezone: string | null;
  active: boolean;
  isDefault: boolean;
};

export type Locale = {
  code: string;
  name: string;
  active: boolean;
  fallbackLocaleCode: string | null;
  isDefault: boolean;
};

export type MatrixCombination = {
  siteId: number;
  marketCode: string;
  localeCode: string;
  active: boolean;
  isDefaultForMarket: boolean;
};

export type MarketDefaultLocale = {
  marketCode: string;
  localeCode: string;
};

export type SiteDefaults = {
  siteId: number;
  defaultMarketCode: string | null;
  defaultLocaleCode: string | null;
  marketDefaultLocales: MarketDefaultLocale[];
};

export type Matrix = {
  siteId: number;
  markets: Market[];
  locales: Locale[];
  combinations: MatrixCombination[];
  defaults: SiteDefaults;
};

export type ResolvedMarketLocale = {
  siteId: number;
  marketCode: string;
  localeCode: string;
  resolution: string;
};

export type UpsertMarketInput = {
  siteId: number;
  code: string;
  name: string;
  currency?: string | null | undefined;
  timezone?: string | null | undefined;
  active: boolean;
  isDefault: boolean;
};

export type UpsertLocaleInput = {
  siteId: number;
  code: string;
  name: string;
  active: boolean;
  fallbackLocaleCode?: string | null | undefined;
  isDefault: boolean;
};

export type SiteMarketInput = {
  code: string;
  active: boolean;
};

export type SiteLocaleInput = {
  code: string;
  active: boolean;
};

export type SiteMarketLocaleInput = {
  marketCode: string;
  localeCode: string;
  active: boolean;
  isDefaultForMarket?: boolean | null | undefined;
};

export type UpsertSiteLocaleOverrideInput = {
  siteId: number;
  code: string;
  displayName?: string | null | undefined;
  fallbackLocaleCode?: string | null | undefined;
};

export type LocaleCatalogItem = SharedLocaleCatalogItem;

const INVALID_MARKET_LOCALE = 'INVALID_MARKET_LOCALE';

function graphQLError(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: INVALID_MARKET_LOCALE } });
}

async function ensureSiteExists(db: DbClient, siteId: number): Promise<void> {
  const site = await db.get<{ id: number }>('SELECT id FROM sites WHERE id = ?', [siteId]);
  if (!site) {
    throw new GraphQLError(`Site ${siteId} does not exist`, { extensions: { code: 'SITE_NOT_FOUND' } });
  }
}

async function comboIsActive(
  db: DbClient,
  siteId: number,
  marketCode: string,
  localeCode: string
): Promise<boolean> {
  const row = await db.get<{ ok: number }>(
    `
SELECT 1 as ok
FROM site_market_locales sml
JOIN site_markets sm ON sm.site_id = sml.site_id AND sm.market_code = sml.market_code
JOIN site_locales sl ON sl.site_id = sml.site_id AND sl.locale_code = sml.locale_code
JOIN markets m ON m.code = sml.market_code
JOIN locales l ON l.code = sml.locale_code
JOIN sites s ON s.id = sml.site_id
WHERE sml.site_id = ?
  AND sml.market_code = ?
  AND sml.locale_code = ?
  AND sml.active = TRUE
  AND sm.active = TRUE
  AND sl.active = TRUE
  AND m.active = TRUE
  AND l.active = TRUE
  AND s.active = TRUE
LIMIT 1
`,
    [siteId, marketCode, localeCode]
  );

  return Boolean(row?.ok);
}

async function getLocaleFallbackChain(db: DbClient, startLocaleCode: string): Promise<string[]> {
  const chain: string[] = [];
  const visited = new Set<string>();
  let current: string | null = startLocaleCode;

  while (current && !visited.has(current)) {
    visited.add(current);
    chain.push(current);
    const localeRow: { fallbackLocaleCode: string | null } | undefined = await db.get<{
      fallbackLocaleCode: string | null;
    }>(
      'SELECT fallback_locale_code as fallbackLocaleCode FROM locales WHERE code = ?',
      [current]
    );
    current = localeRow?.fallbackLocaleCode ?? null;
  }

  return chain;
}

export async function listSites(db: DbClient): Promise<Site[]> {
  return db.all<Site>(
    "SELECT id, name, active, COALESCE(url_pattern, '/{market}/{locale}') as urlPattern FROM sites ORDER BY id"
  );
}

export async function getSite(db: DbClient, siteId: number): Promise<Site> {
  const site = await db.get<Site>(
    "SELECT id, name, active, COALESCE(url_pattern, '/{market}/{locale}') as urlPattern FROM sites WHERE id = ?",
    [siteId]
  );
  if (!site) {
    throw new GraphQLError(`Site ${siteId} does not exist`, { extensions: { code: 'SITE_NOT_FOUND' } });
  }
  return site;
}

export async function listLocaleCatalog(): Promise<LocaleCatalogItem[]> {
  return localeCatalog;
}

export async function setSiteUrlPattern(db: DbClient, siteId: number, urlPattern: string): Promise<Site> {
  await ensureSiteExists(db, siteId);
  const validation = validateUrlPattern(urlPattern);
  if (!validation.valid) {
    throw new GraphQLError(validation.error ?? 'Invalid URL pattern', {
      extensions: { code: 'INVALID_URL_PATTERN' }
    });
  }

  await db.run('UPDATE sites SET url_pattern = ? WHERE id = ?', [urlPattern, siteId]);
  return getSite(db, siteId);
}

export async function listMarkets(db: DbClient, siteId: number): Promise<Market[]> {
  await ensureSiteExists(db, siteId);
  return db.all<Market>(
    `
SELECT
  m.code,
  m.name,
  m.currency,
  m.timezone,
  sm.active,
  sm.is_default as isDefault
FROM site_markets sm
JOIN markets m ON m.code = sm.market_code
WHERE sm.site_id = ?
ORDER BY m.code
`,
    [siteId]
  );
}

export async function listLocales(db: DbClient, siteId: number): Promise<Locale[]> {
  await ensureSiteExists(db, siteId);
  return db.all<Locale>(
    `
SELECT
  l.code,
  COALESCE(slo.display_name, l.name) as name,
  l.active,
  COALESCE(slo.fallback_locale_code, l.fallback_locale_code) as fallbackLocaleCode,
  sl.is_default as isDefault
FROM site_locales sl
JOIN locales l ON l.code = sl.locale_code
LEFT JOIN site_locale_overrides slo ON slo.site_id = sl.site_id AND slo.locale_code = sl.locale_code
WHERE sl.site_id = ?
ORDER BY l.code
`,
    [siteId]
  );
}

export async function upsertMarket(db: DbClient, input: UpsertMarketInput): Promise<Market[]> {
  await ensureSiteExists(db, input.siteId);
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(
      `
INSERT INTO markets(code, name, currency, timezone, active)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT(code) DO UPDATE SET
  name = excluded.name,
  currency = excluded.currency,
  timezone = excluded.timezone,
  active = excluded.active
`,
      [input.code, input.name, input.currency ?? null, input.timezone ?? null, input.active]
    );

    await db.run(
      `
INSERT INTO site_markets(site_id, market_code, active, is_default)
VALUES (?, ?, ?, ?)
ON CONFLICT(site_id, market_code) DO UPDATE SET
  active = excluded.active,
  is_default = excluded.is_default
`,
      [input.siteId, input.code, input.active, input.isDefault]
    );

    if (input.isDefault) {
      await db.run(
        'UPDATE site_markets SET is_default = FALSE WHERE site_id = ? AND market_code <> ?',
        [input.siteId, input.code]
      );
    }

    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  return listMarkets(db, input.siteId);
}

export async function upsertLocale(db: DbClient, input: UpsertLocaleInput): Promise<Locale[]> {
  await ensureSiteExists(db, input.siteId);
  if (input.fallbackLocaleCode) {
    const fallback = await db.get<{ code: string }>('SELECT code FROM locales WHERE code = ?', [
      input.fallbackLocaleCode
    ]);
    if (!fallback && input.fallbackLocaleCode !== input.code) {
      throw new GraphQLError(`Fallback locale ${input.fallbackLocaleCode} does not exist`, {
        extensions: { code: 'LOCALE_NOT_FOUND' }
      });
    }
  }

  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(
      `
INSERT INTO locales(code, name, active, fallback_locale_code)
VALUES (?, ?, ?, ?)
ON CONFLICT(code) DO UPDATE SET
  name = excluded.name,
  active = excluded.active,
  fallback_locale_code = excluded.fallback_locale_code
`,
      [input.code, input.name, input.active, input.fallbackLocaleCode ?? null]
    );

    await db.run(
      `
INSERT INTO site_locales(site_id, locale_code, active, is_default)
VALUES (?, ?, ?, ?)
ON CONFLICT(site_id, locale_code) DO UPDATE SET
  active = excluded.active,
  is_default = excluded.is_default
`,
      [input.siteId, input.code, input.active, input.isDefault]
    );

    if (input.isDefault) {
      await db.run(
        'UPDATE site_locales SET is_default = FALSE WHERE site_id = ? AND locale_code <> ?',
        [input.siteId, input.code]
      );
    }

    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  return listLocales(db, input.siteId);
}

export async function upsertSiteLocaleOverride(
  db: DbClient,
  input: UpsertSiteLocaleOverrideInput
): Promise<Locale[]> {
  await ensureSiteExists(db, input.siteId);
  const locale = await db.get<{ code: string }>('SELECT code FROM locales WHERE code = ?', [input.code]);
  if (!locale) {
    throw new GraphQLError(`Locale ${input.code} does not exist`, {
      extensions: { code: 'LOCALE_NOT_FOUND' }
    });
  }

  if (input.fallbackLocaleCode) {
    const fallback = await db.get<{ code: string }>('SELECT code FROM locales WHERE code = ?', [input.fallbackLocaleCode]);
    if (!fallback) {
      throw new GraphQLError(`Fallback locale ${input.fallbackLocaleCode} does not exist`, {
        extensions: { code: 'LOCALE_NOT_FOUND' }
      });
    }
  }

  await db.run(
    `
INSERT INTO site_locale_overrides(site_id, locale_code, display_name, fallback_locale_code)
VALUES (?, ?, ?, ?)
ON CONFLICT(site_id, locale_code) DO UPDATE SET
  display_name = excluded.display_name,
  fallback_locale_code = excluded.fallback_locale_code
`,
    [input.siteId, input.code, input.displayName ?? null, input.fallbackLocaleCode ?? null]
  );

  return listLocales(db, input.siteId);
}

export async function setSiteMarkets(
  db: DbClient,
  siteId: number,
  markets: SiteMarketInput[],
  defaultMarketCode: string
): Promise<Market[]> {
  await ensureSiteExists(db, siteId);

  await db.run('BEGIN TRANSACTION');
  try {
    for (const market of markets) {
      const exists = await db.get<{ code: string }>('SELECT code FROM markets WHERE code = ?', [market.code]);
      if (!exists) {
        throw new GraphQLError(`Market ${market.code} does not exist`, {
          extensions: { code: 'MARKET_NOT_FOUND' }
        });
      }

      await db.run(
        `
INSERT INTO site_markets(site_id, market_code, active, is_default)
VALUES (?, ?, ?, FALSE)
ON CONFLICT(site_id, market_code) DO UPDATE SET
  active = excluded.active
`,
        [siteId, market.code, market.active]
      );
    }

    if (markets.length > 0) {
      const placeholders = markets.map(() => '?').join(', ');
      await db.run(
        `
UPDATE site_markets
SET active = FALSE,
    is_default = FALSE
WHERE site_id = ?
  AND market_code NOT IN (${placeholders})
`,
        [siteId, ...markets.map((item) => item.code)]
      );
    }

    const defaultRow = await db.get<{ marketCode: string }>(
      'SELECT market_code as marketCode FROM site_markets WHERE site_id = ? AND market_code = ? AND active = TRUE',
      [siteId, defaultMarketCode]
    );

    if (!defaultRow) {
      throw new GraphQLError(`Default market ${defaultMarketCode} must be active for site ${siteId}`, {
        extensions: { code: 'INVALID_DEFAULT_MARKET' }
      });
    }

    await db.run('UPDATE site_markets SET is_default = FALSE WHERE site_id = ?', [siteId]);
    await db.run('UPDATE site_markets SET is_default = TRUE WHERE site_id = ? AND market_code = ?', [
      siteId,
      defaultMarketCode
    ]);

    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  return listMarkets(db, siteId);
}

export async function setSiteLocales(
  db: DbClient,
  siteId: number,
  locales: SiteLocaleInput[],
  defaultLocaleCode: string
): Promise<Locale[]> {
  await ensureSiteExists(db, siteId);

  await db.run('BEGIN TRANSACTION');
  try {
    for (const locale of locales) {
      const exists = await db.get<{ code: string }>('SELECT code FROM locales WHERE code = ?', [locale.code]);
      if (!exists) {
        throw new GraphQLError(`Locale ${locale.code} does not exist`, {
          extensions: { code: 'LOCALE_NOT_FOUND' }
        });
      }

      await db.run(
        `
INSERT INTO site_locales(site_id, locale_code, active, is_default)
VALUES (?, ?, ?, FALSE)
ON CONFLICT(site_id, locale_code) DO UPDATE SET
  active = excluded.active
`,
        [siteId, locale.code, locale.active]
      );
    }

    if (locales.length > 0) {
      const placeholders = locales.map(() => '?').join(', ');
      await db.run(
        `
UPDATE site_locales
SET active = FALSE,
    is_default = FALSE
WHERE site_id = ?
  AND locale_code NOT IN (${placeholders})
`,
        [siteId, ...locales.map((item) => item.code)]
      );
    }

    const defaultRow = await db.get<{ localeCode: string }>(
      'SELECT locale_code as localeCode FROM site_locales WHERE site_id = ? AND locale_code = ? AND active = TRUE',
      [siteId, defaultLocaleCode]
    );

    if (!defaultRow) {
      throw new GraphQLError(`Default locale ${defaultLocaleCode} must be active for site ${siteId}`, {
        extensions: { code: 'INVALID_DEFAULT_LOCALE' }
      });
    }

    await db.run('UPDATE site_locales SET is_default = FALSE WHERE site_id = ?', [siteId]);
    await db.run('UPDATE site_locales SET is_default = TRUE WHERE site_id = ? AND locale_code = ?', [
      siteId,
      defaultLocaleCode
    ]);

    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  return listLocales(db, siteId);
}

export async function getSiteDefaults(db: DbClient, siteId: number): Promise<SiteDefaults> {
  await ensureSiteExists(db, siteId);

  const defaultMarketRow = await db.get<{ defaultMarketCode: string | null }>(
    `
SELECT market_code as defaultMarketCode
FROM site_markets
WHERE site_id = ?
  AND active = TRUE
  AND is_default = TRUE
LIMIT 1
`,
    [siteId]
  );

  const defaultLocaleRow = await db.get<{ defaultLocaleCode: string | null }>(
    `
SELECT locale_code as defaultLocaleCode
FROM site_locales
WHERE site_id = ?
  AND active = TRUE
  AND is_default = TRUE
LIMIT 1
`,
    [siteId]
  );

  const marketDefaultLocales = await db.all<MarketDefaultLocale>(
    `
SELECT market_code as marketCode, locale_code as localeCode
FROM site_market_locales
WHERE site_id = ?
  AND active = TRUE
  AND is_default_for_market = TRUE
ORDER BY market_code
`,
    [siteId]
  );

  return {
    siteId,
    defaultMarketCode: defaultMarketRow?.defaultMarketCode ?? null,
    defaultLocaleCode: defaultLocaleRow?.defaultLocaleCode ?? null,
    marketDefaultLocales
  };
}

export async function getSiteMarketLocaleMatrix(db: DbClient, siteId: number): Promise<Matrix> {
  await ensureSiteExists(db, siteId);

  const markets = await listMarkets(db, siteId);
  const locales = await listLocales(db, siteId);
  const combinations = await db.all<MatrixCombination>(
    `
SELECT
  site_id as siteId,
  market_code as marketCode,
  locale_code as localeCode,
  active,
  is_default_for_market as isDefaultForMarket
FROM site_market_locales
WHERE site_id = ?
ORDER BY market_code, locale_code
`,
    [siteId]
  );

  return {
    siteId,
    markets,
    locales,
    combinations,
    defaults: await getSiteDefaults(db, siteId)
  };
}

export async function setSiteMarketLocaleMatrix(
  db: DbClient,
  siteId: number,
  combinations: SiteMarketLocaleInput[],
  defaults: MarketDefaultLocale[]
): Promise<Matrix> {
  await ensureSiteExists(db, siteId);

  await db.run('BEGIN TRANSACTION');
  try {
    for (const combination of combinations) {
      const marketExists = await db.get<{ marketCode: string }>(
        'SELECT market_code as marketCode FROM site_markets WHERE site_id = ? AND market_code = ?',
        [siteId, combination.marketCode]
      );
      const localeExists = await db.get<{ localeCode: string }>(
        'SELECT locale_code as localeCode FROM site_locales WHERE site_id = ? AND locale_code = ?',
        [siteId, combination.localeCode]
      );

      if (!marketExists || !localeExists) {
        throw new GraphQLError(
          `Combination ${combination.marketCode}/${combination.localeCode} is not attached to site ${siteId}`,
          { extensions: { code: 'INVALID_COMBINATION' } }
        );
      }

      await db.run(
        `
INSERT INTO site_market_locales(site_id, market_code, locale_code, active, is_default_for_market)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT(site_id, market_code, locale_code) DO UPDATE SET
  active = excluded.active,
  is_default_for_market = excluded.is_default_for_market
`,
        [
          siteId,
          combination.marketCode,
          combination.localeCode,
          combination.active,
          combination.isDefaultForMarket ?? false
        ]
      );
    }

    const allExisting = await db.all<{ marketCode: string; localeCode: string }>(
      `
SELECT market_code as marketCode, locale_code as localeCode
FROM site_market_locales
WHERE site_id = ?
`,
      [siteId]
    );

    const incomingSet = new Set(combinations.map((item) => `${item.marketCode}::${item.localeCode}`));
    for (const row of allExisting) {
      const key = `${row.marketCode}::${row.localeCode}`;
      if (!incomingSet.has(key)) {
        await db.run(
          `
UPDATE site_market_locales
SET active = FALSE,
    is_default_for_market = FALSE
WHERE site_id = ?
  AND market_code = ?
  AND locale_code = ?
`,
          [siteId, row.marketCode, row.localeCode]
        );
      }
    }

    await db.run('UPDATE site_market_locales SET is_default_for_market = FALSE WHERE site_id = ?', [siteId]);

    const computedDefaults = defaults.length > 0
      ? defaults
      : combinations
          .filter((item) => item.isDefaultForMarket)
          .map((item) => ({ marketCode: item.marketCode, localeCode: item.localeCode }));

    for (const item of computedDefaults) {
      const existsActive = await db.get<{ ok: number }>(
        `
SELECT 1 as ok
FROM site_market_locales
WHERE site_id = ?
  AND market_code = ?
  AND locale_code = ?
  AND active = TRUE
LIMIT 1
`,
        [siteId, item.marketCode, item.localeCode]
      );

      if (!existsActive) {
        throw new GraphQLError(
          `Market default locale ${item.marketCode}/${item.localeCode} must reference an active combination`,
          { extensions: { code: 'INVALID_DEFAULT_COMBINATION' } }
        );
      }

      await db.run(
        `
UPDATE site_market_locales
SET is_default_for_market = TRUE
WHERE site_id = ?
  AND market_code = ?
  AND locale_code = ?
`,
        [siteId, item.marketCode, item.localeCode]
      );
    }

    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  return getSiteMarketLocaleMatrix(db, siteId);
}

export async function validateMarketLocale(
  db: DbClient,
  siteId: number,
  marketCode: string,
  localeCode: string
): Promise<true> {
  const valid = await comboIsActive(db, siteId, marketCode, localeCode);
  if (!valid) {
    throw graphQLError(`Invalid market/locale combination for site ${siteId}: ${marketCode}/${localeCode}`);
  }
  return true;
}

export async function resolveMarketLocaleFallback(
  db: DbClient,
  siteId: number,
  marketCode: string,
  localeCode: string
): Promise<ResolvedMarketLocale> {
  await ensureSiteExists(db, siteId);

  if (await comboIsActive(db, siteId, marketCode, localeCode)) {
    return { siteId, marketCode, localeCode, resolution: 'exact' };
  }

  const perMarketDefault = await db.get<{ localeCode: string }>(
    `
SELECT locale_code as localeCode
FROM site_market_locales
WHERE site_id = ?
  AND market_code = ?
  AND active = TRUE
  AND is_default_for_market = TRUE
LIMIT 1
`,
    [siteId, marketCode]
  );

  if (perMarketDefault && (await comboIsActive(db, siteId, marketCode, perMarketDefault.localeCode))) {
    return {
      siteId,
      marketCode,
      localeCode: perMarketDefault.localeCode,
      resolution: 'per_market_default'
    };
  }

  const defaults = await getSiteDefaults(db, siteId);
  if (
    defaults.defaultMarketCode &&
    defaults.defaultLocaleCode &&
    (await comboIsActive(db, siteId, defaults.defaultMarketCode, defaults.defaultLocaleCode))
  ) {
    return {
      siteId,
      marketCode: defaults.defaultMarketCode,
      localeCode: defaults.defaultLocaleCode,
      resolution: 'site_default'
    };
  }

  const localeChain = await getLocaleFallbackChain(db, localeCode);
  for (const candidateLocale of localeChain.slice(1)) {
    if (await comboIsActive(db, siteId, marketCode, candidateLocale)) {
      return {
        siteId,
        marketCode,
        localeCode: candidateLocale,
        resolution: 'locale_fallback_chain'
      };
    }
  }

  throw graphQLError(`No active fallback could resolve ${marketCode}/${localeCode} for site ${siteId}`);
}
