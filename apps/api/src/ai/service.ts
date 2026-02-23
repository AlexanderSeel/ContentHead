import { GraphQLError } from 'graphql';
import { z } from 'zod';

import type { DbClient } from '../db/DbClient.js';
import { createContentItem, createContentType, createDraftVersion, updateDraftVersion } from '../content/service.js';
import { upsertVariantSet, upsertVariant } from '../content/variantService.js';
import { validateMarketLocale } from '../marketLocale/service.js';
import { resolveDefaultConnector } from '../connectors/service.js';
import { MockAIProvider, OpenAICompatibleProviderStub, type AIProvider } from './provider.js';

const fieldDefSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.string().min(1)
});

const contentTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(fieldDefSchema).min(1)
});

const contentPayloadSchema = z.object({
  fields: z.record(z.string(), z.unknown()),
  composition: z.record(z.string(), z.unknown()),
  components: z.record(z.string(), z.unknown()),
  metadata: z.record(z.string(), z.unknown())
});

const variantsSchema = z.object({
  variants: z.array(
    z.object({
      key: z.string().min(1),
      priority: z.number().int(),
      rule: z.record(z.string(), z.unknown()).or(z.object({}).passthrough()),
      trafficAllocation: z.number().int().min(0).max(100)
    })
  )
});

async function aiProvider(db: DbClient): Promise<AIProvider> {
  const connector = await resolveDefaultConnector(db, 'ai');
  if (connector?.type === 'openai_compatible') {
    try {
      const config = JSON.parse(connector.configJson) as { apiKey?: string | null | undefined };
      if (config.apiKey) {
        return new OpenAICompatibleProviderStub(config.apiKey);
      }
    } catch {
      return new MockAIProvider();
    }
  }
  return new MockAIProvider();
}

function parseObjectJson<T>(value: string, name: string): T {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as T;
    }
  } catch {
    // handled below
  }

  throw new GraphQLError(`${name} must be a JSON object`, { extensions: { code: 'BAD_USER_INPUT' } });
}

async function getVersionById(db: DbClient, versionId: number): Promise<{
  id: number;
  contentItemId: number;
  versionNumber: number;
  fieldsJson: string;
  compositionJson: string;
  componentsJson: string;
  metadataJson: string;
}> {
  const version = await db.get<{
    id: number;
    contentItemId: number;
    versionNumber: number;
    fieldsJson: string;
    compositionJson: string;
    componentsJson: string;
    metadataJson: string;
  }>(
    `
SELECT
  id,
  content_item_id as contentItemId,
  version_number as versionNumber,
  fields_json as fieldsJson,
  composition_json as compositionJson,
  components_json as componentsJson,
  metadata_json as metadataJson
FROM content_versions
WHERE id = ?
`,
    [versionId]
  );

  if (!version) {
    throw new GraphQLError(`Version ${versionId} not found`, { extensions: { code: 'CONTENT_VERSION_NOT_FOUND' } });
  }

  return version;
}

async function currentDraftVersion(db: DbClient, contentItemId: number): Promise<{ id: number; versionNumber: number }> {
  const version = await db.get<{ id: number; versionNumber: number }>(
    `
SELECT v.id, v.version_number as versionNumber
FROM content_items i
JOIN content_versions v ON v.id = i.current_draft_version_id
WHERE i.id = ?
`,
    [contentItemId]
  );

  if (!version) {
    throw new GraphQLError(`Content item ${contentItemId} has no draft version`, {
      extensions: { code: 'CONTENT_VERSION_NOT_FOUND' }
    });
  }

  return version;
}

export async function aiGenerateContentType(
  db: DbClient,
  input: {
    siteId: number;
    prompt: string;
    nameHint?: string | null | undefined;
    by: string;
  }
) {
  const raw = await (await aiProvider(db)).generateContentType({ prompt: input.prompt, nameHint: input.nameHint });
  const validated = contentTypeSchema.parse(raw);

  return createContentType(db, {
    siteId: input.siteId,
    name: validated.name,
    description: validated.description ?? `AI generated from prompt`,
    fieldsJson: JSON.stringify(validated.fields),
    by: input.by
  });
}

export async function aiGenerateContent(
  db: DbClient,
  input: {
    contentItemId?: number | null | undefined;
    siteId?: number | null | undefined;
    contentTypeId?: number | null | undefined;
    prompt: string;
    by: string;
  }
): Promise<{ contentItemId: number; draftVersionId: number }> {
  let contentItemId = input.contentItemId ?? null;

  if (!contentItemId) {
    if (!input.siteId || !input.contentTypeId) {
      throw new GraphQLError('contentItemId or (siteId + contentTypeId) is required', {
        extensions: { code: 'BAD_USER_INPUT' }
      });
    }

    const created = await createContentItem(db, {
      siteId: input.siteId,
      contentTypeId: input.contentTypeId,
      by: input.by
    });
    contentItemId = created.id;
  }

  const itemType = await db.get<{ name: string }>(
    `
SELECT ct.name as name
FROM content_items i
JOIN content_types ct ON ct.id = i.content_type_id
WHERE i.id = ?
`,
    [contentItemId]
  );

  const raw = await (await aiProvider(db)).generateContent({
    prompt: input.prompt,
    contentTypeName: itemType?.name ?? 'Content'
  });

  const validated = contentPayloadSchema.parse(raw);

  await createDraftVersion(db, {
    contentItemId,
    by: input.by,
    comment: 'AI draft generated'
  });

  const draft = await currentDraftVersion(db, contentItemId);
  const updated = await updateDraftVersion(db, {
    versionId: draft.id,
    expectedVersionNumber: draft.versionNumber,
    patch: {
      fieldsJson: JSON.stringify(validated.fields),
      compositionJson: JSON.stringify(validated.composition),
      componentsJson: JSON.stringify(validated.components),
      metadataJson: JSON.stringify(validated.metadata),
      comment: 'AI generated content',
      createdBy: input.by
    }
  });

  return {
    contentItemId,
    draftVersionId: updated.id
  };
}

export async function aiGenerateVariants(
  db: DbClient,
  input: {
    siteId: number;
    contentItemId: number;
    marketCode: string;
    localeCode: string;
    variantSetId?: number | null | undefined;
    targetVersionId: number;
    prompt: string;
  }
): Promise<{ variantSetId: number; createdKeys: string[] }> {
  await validateMarketLocale(db, input.siteId, input.marketCode, input.localeCode);
  await getVersionById(db, input.targetVersionId);

  const raw = await (await aiProvider(db)).generateVariants({ prompt: input.prompt });
  const validated = variantsSchema.parse(raw);

  const set = input.variantSetId
    ? { id: input.variantSetId }
    : await upsertVariantSet(db, {
        siteId: input.siteId,
        contentItemId: input.contentItemId,
        marketCode: input.marketCode,
        localeCode: input.localeCode,
        active: true
      });

  const variantSetId = input.variantSetId ?? set.id;

  const createdKeys: string[] = [];
  for (const variant of validated.variants) {
    await upsertVariant(db, {
      variantSetId,
      key: variant.key,
      priority: variant.priority,
      state: 'ACTIVE',
      ruleJson: JSON.stringify(variant.rule),
      trafficAllocation: variant.trafficAllocation,
      contentVersionId: input.targetVersionId
    });
    createdKeys.push(variant.key);
  }

  return { variantSetId, createdKeys };
}

export async function aiTranslateVersion(
  db: DbClient,
  input: {
    versionId: number;
    targetMarketCode: string;
    targetLocaleCode: string;
    by: string;
  }
): Promise<{ contentItemId: number; draftVersionId: number }> {
  const version = await getVersionById(db, input.versionId);
  const site = await db.get<{ siteId: number }>('SELECT site_id as siteId FROM content_items WHERE id = ?', [
    version.contentItemId
  ]);

  if (!site) {
    throw new GraphQLError(`Content item ${version.contentItemId} not found`, {
      extensions: { code: 'CONTENT_ITEM_NOT_FOUND' }
    });
  }

  await validateMarketLocale(db, site.siteId, input.targetMarketCode, input.targetLocaleCode);

  const raw = await (await aiProvider(db)).translate({
    targetLocale: input.targetLocaleCode,
    targetMarket: input.targetMarketCode,
    source: {
      fields: parseObjectJson(version.fieldsJson, 'fieldsJson'),
      composition: parseObjectJson(version.compositionJson, 'compositionJson'),
      components: parseObjectJson(version.componentsJson, 'componentsJson'),
      metadata: parseObjectJson(version.metadataJson, 'metadataJson')
    }
  });

  const validated = contentPayloadSchema.parse(raw);

  await createDraftVersion(db, {
    contentItemId: version.contentItemId,
    fromVersionId: version.id,
    by: input.by,
    comment: `AI translation ${input.targetMarketCode}/${input.targetLocaleCode}`
  });

  const draft = await currentDraftVersion(db, version.contentItemId);
  const updated = await updateDraftVersion(db, {
    versionId: draft.id,
    expectedVersionNumber: draft.versionNumber,
    patch: {
      fieldsJson: JSON.stringify(validated.fields),
      compositionJson: JSON.stringify(validated.composition),
      componentsJson: JSON.stringify(validated.components),
      metadataJson: JSON.stringify(validated.metadata),
      comment: 'AI translated content',
      createdBy: input.by
    }
  });

  return { contentItemId: version.contentItemId, draftVersionId: updated.id };
}
