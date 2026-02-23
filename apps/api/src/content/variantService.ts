import { GraphQLError } from 'graphql';

import { chooseTrafficBucket, evaluateRule, type Rule, type RuleContext } from '@contenthead/shared';

import type { DbClient } from '../db/DbClient.js';
import { validateMarketLocale } from '../marketLocale/service.js';
import type { ContentVersionRecord, ResolvedRoute } from './service.js';
import { resolveRoute } from './service.js';

export type VariantSetRecord = {
  id: number;
  siteId: number;
  contentItemId: number;
  marketCode: string;
  localeCode: string;
  fallbackVariantSetId: number | null;
  active: boolean;
};

export type VariantRecord = {
  id: number;
  variantSetId: number;
  key: string;
  priority: number;
  ruleJson: string;
  state: string;
  trafficAllocation: number | null;
  contentVersionId: number;
};

export type VariantSelection = {
  variant: VariantRecord | null;
  reason: string;
  variantSetId: number | null;
};

export type PageByRouteResult = {
  base: ResolvedRoute;
  selectedVariant: VariantRecord | null;
  selectedVersion: ContentVersionRecord | null;
  selectionReason: string;
};

function badInput(message: string, code = 'BAD_USER_INPUT'): never {
  throw new GraphQLError(message, { extensions: { code } });
}

async function nextId(db: DbClient, table: string): Promise<number> {
  const row = await db.get<{ nextId: number }>(`SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM ${table}`);
  return row?.nextId ?? 1;
}

function parseContextJson(contextJson?: string | null): RuleContext {
  if (!contextJson) {
    return { segments: [], query: {} };
  }

  try {
    const parsed = JSON.parse(contextJson) as RuleContext;
    return {
      userId: parsed.userId ?? null,
      sessionId: parsed.sessionId ?? null,
      segments: parsed.segments ?? [],
      country: parsed.country ?? null,
      device: parsed.device ?? null,
      referrer: parsed.referrer ?? null,
      query: parsed.query ?? {}
    };
  } catch {
    badInput('contextJson must be valid JSON', 'INVALID_CONTEXT');
  }
}

async function getVariantSet(db: DbClient, id: number): Promise<VariantSetRecord> {
  const row = await db.get<VariantSetRecord>(
    `
SELECT
  id,
  site_id as siteId,
  content_item_id as contentItemId,
  market_code as marketCode,
  locale_code as localeCode,
  fallback_variant_set_id as fallbackVariantSetId,
  active
FROM variant_sets
WHERE id = ?
`,
    [id]
  );

  if (!row) {
    throw new GraphQLError(`Variant set ${id} not found`, { extensions: { code: 'VARIANT_SET_NOT_FOUND' } });
  }

  return row;
}

async function getVersion(db: DbClient, versionId: number): Promise<ContentVersionRecord> {
  const row = await db.get<ContentVersionRecord>(
    `
SELECT
  id,
  content_item_id as contentItemId,
  version_number as versionNumber,
  state,
  source_version_id as sourceVersionId,
  fields_json as fieldsJson,
  composition_json as compositionJson,
  components_json as componentsJson,
  metadata_json as metadataJson,
  comment,
  created_at as createdAt,
  created_by as createdBy
FROM content_versions
WHERE id = ?
`,
    [versionId]
  );

  if (!row) {
    throw new GraphQLError(`Version ${versionId} not found`, { extensions: { code: 'CONTENT_VERSION_NOT_FOUND' } });
  }

  return row;
}

async function listVariantsRaw(db: DbClient, variantSetId: number): Promise<VariantRecord[]> {
  return db.all<VariantRecord>(
    `
SELECT
  id,
  variant_set_id as variantSetId,
  key,
  priority,
  rule_json as ruleJson,
  state,
  traffic_allocation as trafficAllocation,
  content_version_id as contentVersionId
FROM variants
WHERE variant_set_id = ?
ORDER BY priority DESC, id ASC
`,
    [variantSetId]
  );
}

function evaluateVariantRule(ruleJson: string, context: RuleContext): boolean {
  try {
    const parsed = JSON.parse(ruleJson) as Rule;
    return evaluateRule(parsed, context);
  } catch {
    return false;
  }
}

export async function listVariantSets(db: DbClient, input: {
  siteId: number;
  contentItemId?: number | null | undefined;
  marketCode?: string | null | undefined;
  localeCode?: string | null | undefined;
}): Promise<VariantSetRecord[]> {
  const clauses = ['site_id = ?'];
  const params: unknown[] = [input.siteId];

  if (input.contentItemId) {
    clauses.push('content_item_id = ?');
    params.push(input.contentItemId);
  }
  if (input.marketCode) {
    clauses.push('market_code = ?');
    params.push(input.marketCode);
  }
  if (input.localeCode) {
    clauses.push('locale_code = ?');
    params.push(input.localeCode);
  }

  return db.all<VariantSetRecord>(
    `
SELECT
  id,
  site_id as siteId,
  content_item_id as contentItemId,
  market_code as marketCode,
  locale_code as localeCode,
  fallback_variant_set_id as fallbackVariantSetId,
  active
FROM variant_sets
WHERE ${clauses.join(' AND ')}
ORDER BY id DESC
`,
    params
  );
}

export async function upsertVariantSet(db: DbClient, input: {
  id?: number | null | undefined;
  siteId: number;
  contentItemId: number;
  marketCode: string;
  localeCode: string;
  fallbackVariantSetId?: number | null | undefined;
  active: boolean;
}): Promise<VariantSetRecord> {
  await validateMarketLocale(db, input.siteId, input.marketCode, input.localeCode);

  const item = await db.get<{ siteId: number }>('SELECT site_id as siteId FROM content_items WHERE id = ?', [
    input.contentItemId
  ]);
  if (!item) {
    throw new GraphQLError('contentItemId not found', { extensions: { code: 'CONTENT_ITEM_NOT_FOUND' } });
  }
  if (item.siteId !== input.siteId) {
    badInput('contentItemId does not belong to siteId', 'CONTENT_ITEM_SITE_MISMATCH');
  }

  if (input.fallbackVariantSetId) {
    await getVariantSet(db, input.fallbackVariantSetId);
  }

  const id = input.id ?? (await nextId(db, 'variant_sets'));

  await db.run(
    `
INSERT INTO variant_sets(
  id,
  site_id,
  content_item_id,
  market_code,
  locale_code,
  fallback_variant_set_id,
  active
)
VALUES (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  site_id = excluded.site_id,
  content_item_id = excluded.content_item_id,
  market_code = excluded.market_code,
  locale_code = excluded.locale_code,
  fallback_variant_set_id = excluded.fallback_variant_set_id,
  active = excluded.active
`,
    [
      id,
      input.siteId,
      input.contentItemId,
      input.marketCode,
      input.localeCode,
      input.fallbackVariantSetId ?? null,
      input.active
    ]
  );

  return getVariantSet(db, id);
}

export async function deleteVariantSet(db: DbClient, id: number): Promise<boolean> {
  await db.run('DELETE FROM variants WHERE variant_set_id = ?', [id]);
  await db.run('DELETE FROM variant_sets WHERE id = ?', [id]);
  return true;
}

export async function listVariants(db: DbClient, variantSetId: number): Promise<VariantRecord[]> {
  await getVariantSet(db, variantSetId);
  return listVariantsRaw(db, variantSetId);
}

export async function upsertVariant(db: DbClient, input: {
  id?: number | null | undefined;
  variantSetId: number;
  key: string;
  priority: number;
  ruleJson: string;
  state: string;
  trafficAllocation?: number | null | undefined;
  contentVersionId: number;
}): Promise<VariantRecord> {
  const variantSet = await getVariantSet(db, input.variantSetId);
  const version = await getVersion(db, input.contentVersionId);

  if (version.contentItemId !== variantSet.contentItemId) {
    badInput('contentVersionId must belong to variantSet.contentItemId', 'VERSION_ITEM_MISMATCH');
  }

  try {
    JSON.parse(input.ruleJson);
  } catch {
    badInput('ruleJson must be valid JSON', 'INVALID_RULE_JSON');
  }

  const id = input.id ?? (await nextId(db, 'variants'));

  await db.run(
    `
INSERT INTO variants(
  id,
  variant_set_id,
  key,
  priority,
  rule_json,
  state,
  traffic_allocation,
  content_version_id
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  variant_set_id = excluded.variant_set_id,
  key = excluded.key,
  priority = excluded.priority,
  rule_json = excluded.rule_json,
  state = excluded.state,
  traffic_allocation = excluded.traffic_allocation,
  content_version_id = excluded.content_version_id
`,
    [
      id,
      input.variantSetId,
      input.key,
      input.priority,
      input.ruleJson,
      input.state,
      input.trafficAllocation ?? null,
      input.contentVersionId
    ]
  );

  const row = await db.get<VariantRecord>(
    `
SELECT
  id,
  variant_set_id as variantSetId,
  key,
  priority,
  rule_json as ruleJson,
  state,
  traffic_allocation as trafficAllocation,
  content_version_id as contentVersionId
FROM variants
WHERE id = ?
`,
    [id]
  );

  if (!row) {
    throw new GraphQLError(`Variant ${id} not found`, { extensions: { code: 'VARIANT_NOT_FOUND' } });
  }

  return row;
}

export async function deleteVariant(db: DbClient, id: number): Promise<boolean> {
  await db.run('DELETE FROM variants WHERE id = ?', [id]);
  return true;
}

async function selectVariantInSet(
  db: DbClient,
  variantSetId: number,
  context: RuleContext,
  visited: Set<number>
): Promise<VariantSelection> {
  if (visited.has(variantSetId)) {
    return { variant: null, reason: 'fallback_cycle', variantSetId };
  }
  visited.add(variantSetId);

  const variantSet = await getVariantSet(db, variantSetId);
  if (!variantSet.active) {
    if (variantSet.fallbackVariantSetId) {
      return selectVariantInSet(db, variantSet.fallbackVariantSetId, context, visited);
    }
    return { variant: null, reason: 'variant_set_inactive', variantSetId };
  }

  const candidates = (await listVariantsRaw(db, variantSetId)).filter((entry) => entry.state === 'ACTIVE');
  const matched = candidates.filter((entry) => evaluateVariantRule(entry.ruleJson, context));
  if (matched.length === 0) {
    if (variantSet.fallbackVariantSetId) {
      return selectVariantInSet(db, variantSet.fallbackVariantSetId, context, visited);
    }
    return { variant: null, reason: 'no_rule_match', variantSetId };
  }

  const seed = context.userId || context.sessionId || 'anonymous';
  const weighted = matched.filter((entry) => (entry.trafficAllocation ?? 0) > 0);
  if (weighted.length > 0) {
    const chosenKey = chooseTrafficBucket(
      `${seed}::${variantSetId}`,
      weighted.map((entry) => ({ key: entry.key, weight: entry.trafficAllocation ?? 0 }))
    );

    if (chosenKey) {
      const fallbackVariant = weighted[0];
      const variant = weighted.find((entry) => entry.key === chosenKey) ?? fallbackVariant ?? null;
      return { variant, reason: 'traffic_allocation', variantSetId };
    }
  }

  return { variant: matched[0] ?? null, reason: 'priority_match', variantSetId };
}

export async function selectVariant(db: DbClient, input: {
  variantSetId: number;
  contextJson?: string | null | undefined;
}): Promise<VariantSelection> {
  return selectVariantInSet(db, input.variantSetId, parseContextJson(input.contextJson), new Set<number>());
}

async function getVariantSetForRoute(
  db: DbClient,
  input: { siteId: number; contentItemId: number; marketCode: string; localeCode: string }
): Promise<VariantSetRecord | null> {
  const row = await db.get<VariantSetRecord>(
    `
SELECT
  id,
  site_id as siteId,
  content_item_id as contentItemId,
  market_code as marketCode,
  locale_code as localeCode,
  fallback_variant_set_id as fallbackVariantSetId,
  active
FROM variant_sets
WHERE site_id = ?
  AND content_item_id = ?
  AND market_code = ?
  AND locale_code = ?
  AND active = TRUE
LIMIT 1
`,
    [input.siteId, input.contentItemId, input.marketCode, input.localeCode]
  );
  return row ?? null;
}

export async function getPageByRoute(db: DbClient, input: {
  siteId: number;
  marketCode: string;
  localeCode: string;
  slug: string;
  contextJson?: string | null | undefined;
  previewAllowed: boolean;
  variantKeyOverride?: string | null | undefined;
  versionIdOverride?: number | null | undefined;
}): Promise<PageByRouteResult | null> {
  const base = await resolveRoute(db, {
    siteId: input.siteId,
    marketCode: input.marketCode,
    localeCode: input.localeCode,
    slug: input.slug,
    previewAllowed: input.previewAllowed
  });

  if (!base) {
    return null;
  }

  if (input.versionIdOverride) {
    const overrideVersion = await getVersion(db, input.versionIdOverride);
    if (overrideVersion.contentItemId !== base.contentItem.id) {
      badInput('versionIdOverride does not belong to resolved content item', 'VERSION_ITEM_MISMATCH');
    }

    return {
      base,
      selectedVariant: null,
      selectedVersion: overrideVersion,
      selectionReason: 'version_override'
    };
  }

  const variantSet = await getVariantSetForRoute(db, {
    siteId: base.route.siteId,
    contentItemId: base.route.contentItemId,
    marketCode: base.route.marketCode,
    localeCode: base.route.localeCode
  });

  if (!variantSet) {
    return {
      base,
      selectedVariant: null,
      selectedVersion: base.version,
      selectionReason: 'no_variant_set'
    };
  }

  if (input.variantKeyOverride) {
    const override = await db.get<VariantRecord>(
      `
SELECT
  id,
  variant_set_id as variantSetId,
  key,
  priority,
  rule_json as ruleJson,
  state,
  traffic_allocation as trafficAllocation,
  content_version_id as contentVersionId
FROM variants
WHERE variant_set_id = ?
  AND key = ?
LIMIT 1
`,
      [variantSet.id, input.variantKeyOverride]
    );

    if (override) {
      return {
        base,
        selectedVariant: override,
        selectedVersion: await getVersion(db, override.contentVersionId),
        selectionReason: 'variant_override'
      };
    }
  }

  const selected = await selectVariant(db, {
    variantSetId: variantSet.id,
    contextJson: input.contextJson
  });

  if (!selected.variant) {
    return {
      base,
      selectedVariant: null,
      selectedVersion: base.version,
      selectionReason: selected.reason
    };
  }

  return {
    base,
    selectedVariant: selected.variant,
    selectedVersion: await getVersion(db, selected.variant.contentVersionId),
    selectionReason: selected.reason
  };
}
