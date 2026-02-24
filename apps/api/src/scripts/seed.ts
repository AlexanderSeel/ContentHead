import { resolve } from 'node:path';

import { config } from '../config.js';
import { InternalAuthProvider } from '../auth/InternalAuthProvider.js';
import { DuckDbClient } from '../db/DuckDbClient.js';
import { runMigrations } from '../db/migrate.js';
import type { SignOptions } from 'jsonwebtoken';
import { ensureBaselineConnectors } from '../connectors/service.js';
import { ensureBaselineSecurity } from '../security/service.js';
import { LocalFileStorageProvider } from '../assets/storage.js';
import { createAssetFromUpload, listAssets } from '../assets/service.js';
import { createContentItem, updateDraftVersion, publishVersion, createDraftVersion } from '../content/service.js';
import { upsertRoute } from '../content/service.js';
import { upsertVariantSet, upsertVariant } from '../content/variantService.js';
import { upsertForm, upsertFormField, upsertFormStep, listForms } from '../forms/service.js';

async function nextId(db: DuckDbClient, table: string): Promise<number> {
  const row = await db.get<{ nextId: number }>(`SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM ${table}`);
  return row?.nextId ?? 1;
}

async function ensureDemoForm(db: DuckDbClient): Promise<number> {
  const existing = (await listForms(db, 1)).find((entry) => entry.name === 'Newsletter Signup');
  if (existing) {
    return existing.id;
  }

  const form = await upsertForm(db, {
    siteId: 1,
    name: 'Newsletter Signup',
    description: 'Demo landing page newsletter form',
    active: true
  });

  const step = await upsertFormStep(db, {
    formId: form.id,
    name: 'Main',
    position: 1
  });

  await upsertFormField(db, {
    formId: form.id,
    stepId: step.id,
    key: 'email',
    label: 'Email',
    fieldType: 'email',
    position: 1,
    conditionsJson: '{}',
    validationsJson: '{"regex":"^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$"}',
    uiConfigJson: '{"placeholder":"you@company.com"}',
    active: true
  });

  await upsertFormField(db, {
    formId: form.id,
    stepId: step.id,
    key: 'firstName',
    label: 'First name',
    fieldType: 'text',
    position: 2,
    conditionsJson: '{}',
    validationsJson: '{"minLength":2}',
    uiConfigJson: '{"placeholder":"Alex"}',
    active: true
  });

  return form.id;
}

async function ensureDemoAssets(db: DuckDbClient): Promise<{ heroAssetId: number; sectionAssetId: number }> {
  const existing = await listAssets(db, { siteId: 1, limit: 50, offset: 0 });
  const hero = existing.items.find((entry) => entry.filename === 'demo-hero.svg');
  const section = existing.items.find((entry) => entry.filename === 'demo-section.svg');
  if (hero && section) {
    return { heroAssetId: hero.id, sectionAssetId: section.id };
  }

  const storage = new LocalFileStorageProvider(resolve(config.assetsBasePath));
  const heroSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#1e5dff"/><stop offset="1" stop-color="#12b5a6"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="60" y="120" font-size="62" font-family="Arial" fill="white">ContentHead Demo</text><circle cx="1030" cy="280" r="180" fill="rgba(255,255,255,0.2)"/></svg>`
  );
  const sectionSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="100%" height="100%" fill="#f3f8ff"/><rect x="80" y="110" width="1040" height="580" rx="24" fill="#d8e7ff"/><text x="130" y="220" font-size="54" font-family="Arial" fill="#14306e">Composable Sections</text></svg>`
  );

  const heroAsset = hero
    ? hero
    : await createAssetFromUpload(db, storage, {
        siteId: 1,
        filename: 'demo-hero.svg',
        originalName: 'demo-hero.svg',
        mimeType: 'image/svg+xml',
        data: heroSvg,
        createdBy: 'seed'
      });

  const sectionAsset = section
    ? section
    : await createAssetFromUpload(db, storage, {
        siteId: 1,
        filename: 'demo-section.svg',
        originalName: 'demo-section.svg',
        mimeType: 'image/svg+xml',
        data: sectionSvg,
        createdBy: 'seed'
      });

  return { heroAssetId: heroAsset.id, sectionAssetId: sectionAsset.id };
}

async function ensureDemoLandingPage(
  db: DuckDbClient,
  input: { formId: number; heroAssetId: number; sectionAssetId: number }
): Promise<void> {
  const contentType = await db.get<{ id: number }>("SELECT id FROM content_types WHERE site_id = 1 AND name = 'LandingPage'");
  const contentTypeId = contentType?.id ?? (await nextId(db, 'content_types'));

  if (!contentType) {
    await db.run(
      `
INSERT INTO content_types(id, site_id, name, description, fields_json, created_by, updated_by)
VALUES (?, 1, 'LandingPage', 'Marketing landing page schema', ?, 'seed', 'seed')
`,
      [
        contentTypeId,
        JSON.stringify([
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'summary', label: 'Summary', type: 'richtext' },
          { key: 'heroImage', label: 'Hero Image', type: 'assetRef' },
          { key: 'resourceLinks', label: 'Resource Links', type: 'contentLinkList' }
        ])
      ]
    );
  }

  const routeRow = await db.get<{ contentItemId: number }>(
    "SELECT content_item_id as contentItemId FROM content_routes WHERE site_id = 1 AND market_code = 'US' AND locale_code = 'en-US' AND slug = 'demo'"
  );

  const initialFields = {
    title: 'Demo Landing Page',
    summary: '<p>A complete CMS-driven integration target for web rendering and preview workflows.</p>',
    heroImage: input.heroAssetId,
    resourceLinks: [
      { kind: 'internal', url: '/demo#pricing', text: 'Pricing', target: '_self' },
      { kind: 'external', url: 'https://example.com/docs', text: 'Docs', target: '_blank' }
    ]
  };

  const components = {
    hero_1: {
      type: 'hero',
      props: {
        title: 'Build omnichannel pages without slowing down releases',
        subtitle: 'Model once, compose visually, and publish with market and locale precision.',
        primaryCta: { kind: 'internal', url: '/demo#pricing', text: 'Compare plans', target: '_self' },
        secondaryCta: { kind: 'external', url: 'https://example.com/contact', text: 'Book a demo', target: '_blank' },
        backgroundAssetRef: input.heroAssetId
      }
    },
    features_1: {
      type: 'feature_grid',
      props: {
        title: 'Everything needed for modern CMS operations',
        items: [
          { icon: 'pi-bolt', title: 'Visual composition', description: 'Drag, reorder, and inspect components with live bridge sync.' },
          { icon: 'pi-globe', title: 'Market-aware routing', description: 'Support locale and market specific routes with fallbacks.' },
          { icon: 'pi-images', title: 'DAM integration', description: 'Upload assets, assign metadata, and render responsive renditions.' },
          { icon: 'pi-sliders-h', title: 'Variants', description: 'Target experiences by context and traffic split rules.' }
        ]
      }
    },
    teaser_1: {
      type: 'image_text',
      props: {
        title: 'Content model and design in sync',
        body: 'Schema fields, page composition, forms, and workflows all align in one platform.',
        imageAssetRef: input.sectionAssetId,
        invert: false,
        cta: { kind: 'internal', url: '/demo#faq', text: 'Read FAQs', target: '_self' }
      }
    },
    teaser_2: {
      type: 'image_text',
      props: {
        title: 'Preview and visivic-ready',
        body: 'Authors can inspect and edit content directly from the rendered page bridge.',
        imageAssetRef: input.heroAssetId,
        invert: true,
        cta: { kind: 'external', url: 'https://example.com/guides', text: 'Implementation guide', target: '_blank' }
      }
    },
    pricing_1: {
      type: 'pricing',
      props: {
        title: 'Simple pricing',
        tiers: [
          { name: 'Starter', price: '$0', description: 'For prototypes', features: ['1 site', 'Core CMS'], cta: { kind: 'internal', url: '/demo#newsletter', text: 'Start free', target: '_self' } },
          { name: 'Growth', price: '$149', description: 'For delivery teams', features: ['DAM', 'Variants', 'Forms'], cta: { kind: 'external', url: 'https://example.com/sales', text: 'Talk to sales', target: '_blank' } },
          { name: 'Scale', price: 'Custom', description: 'For enterprise', features: ['SSO', 'Workflow automation', 'Connector controls'], cta: { kind: 'external', url: 'https://example.com/contact', text: 'Contact us', target: '_blank' } }
        ]
      }
    },
    faq_1: {
      type: 'faq',
      props: {
        title: 'FAQ',
        items: [
          { question: 'Is this page CMS-driven?', answer: 'Yes. Components and content are resolved by route and variant context.' },
          { question: 'Can we test A/B changes?', answer: 'Yes. A variant set is seeded for this page and can switch hero copy and order.' },
          { question: 'Can forms run validation?', answer: 'Yes. The newsletter block uses evaluateForm for runtime checks.' }
        ]
      }
    },
    newsletter_1: {
      type: 'newsletter_form',
      props: {
        title: 'Get product updates',
        description: 'One monthly email with feature changes and migration notes.',
        formId: input.formId,
        submitLabel: 'Subscribe'
      }
    },
    footer_1: {
      type: 'footer',
      props: {
        copyright: '© ContentHead 2026',
        linkGroups: [
          { title: 'Product', links: [{ kind: 'internal', url: '/demo#features', text: 'Features', target: '_self' }, { kind: 'internal', url: '/demo#pricing', text: 'Pricing', target: '_self' }] },
          { title: 'Company', links: [{ kind: 'external', url: 'https://example.com/about', text: 'About', target: '_blank' }] }
        ],
        socialLinks: [
          { kind: 'external', url: 'https://x.com', text: 'X', target: '_blank' },
          { kind: 'external', url: 'https://linkedin.com', text: 'LinkedIn', target: '_blank' }
        ]
      }
    }
  };

  const composition = {
    areas: [
      {
        name: 'main',
        components: ['hero_1', 'features_1', 'teaser_1', 'pricing_1', 'teaser_2', 'faq_1', 'newsletter_1', 'footer_1']
      }
    ]
  };

  let contentItemId = routeRow?.contentItemId;
  if (!contentItemId) {
    const item = await createContentItem(db, {
      siteId: 1,
      contentTypeId,
      by: 'seed',
      initialFieldsJson: JSON.stringify(initialFields),
      initialCompositionJson: JSON.stringify(composition),
      initialComponentsJson: JSON.stringify(components),
      metadataJson: '{}',
      comment: 'Seed demo landing page'
    });
    contentItemId = item.id;

    const currentDraft = await db.get<{ id: number; versionNumber: number }>(
      'SELECT id, version_number as versionNumber FROM content_versions WHERE id = (SELECT current_draft_version_id FROM content_items WHERE id = ?)',
      [contentItemId]
    );
    if (currentDraft) {
      await publishVersion(db, {
        versionId: currentDraft.id,
        expectedVersionNumber: currentDraft.versionNumber,
        by: 'seed',
        comment: 'Publish demo landing page'
      });
    }
  }

  await upsertRoute(db, {
    siteId: 1,
    contentItemId,
    marketCode: 'US',
    localeCode: 'en-US',
    slug: 'demo',
    isCanonical: true
  });

  await upsertRoute(db, {
    siteId: 1,
    contentItemId,
    marketCode: 'DE',
    localeCode: 'de-DE',
    slug: 'demo',
    isCanonical: true
  });

  const publishedVersion = await db.get<{ id: number; versionNumber: number }>(
    'SELECT id, version_number as versionNumber FROM content_versions WHERE id = (SELECT current_published_version_id FROM content_items WHERE id = ?)',
    [contentItemId]
  );

  if (!publishedVersion) {
    return;
  }

  const variantExists = await db.get<{ id: number }>(
    `
SELECT v.id
FROM variants v
JOIN variant_sets vs ON vs.id = v.variant_set_id
WHERE vs.content_item_id = ? AND vs.market_code = 'US' AND vs.locale_code = 'en-US' AND v.key = 'hero_ab'
LIMIT 1
`,
    [contentItemId]
  );

  if (!variantExists) {
    const draft = await createDraftVersion(db, {
      contentItemId,
      fromVersionId: publishedVersion.id,
      by: 'seed',
      comment: 'Seed A/B variant draft'
    });

    const variantComponents = {
      ...components,
      hero_1: {
        ...(components.hero_1 as Record<string, unknown>),
        props: {
          ...((components.hero_1 as { props: Record<string, unknown> }).props ?? {}),
          title: 'Experiment B: increase conversion with faster onboarding'
        }
      }
    };

    const variantComposition = {
      areas: [
        {
          name: 'main',
          components: ['hero_1', 'features_1', 'pricing_1', 'teaser_1', 'teaser_2', 'faq_1', 'newsletter_1', 'footer_1']
        }
      ]
    };

    const variantDraft = await updateDraftVersion(db, {
      versionId: draft.id,
      expectedVersionNumber: draft.versionNumber,
      patch: {
        compositionJson: JSON.stringify(variantComposition),
        componentsJson: JSON.stringify(variantComponents),
        comment: 'Variant B changes hero headline and section order',
        createdBy: 'seed'
      }
    });

    const variantPublished = await publishVersion(db, {
      versionId: variantDraft.id,
      expectedVersionNumber: variantDraft.versionNumber,
      by: 'seed',
      comment: 'Publish variant B version'
    });

    const set = await upsertVariantSet(db, {
      siteId: 1,
      contentItemId,
      marketCode: 'US',
      localeCode: 'en-US',
      active: true
    });

    await upsertVariant(db, {
      variantSetId: set.id,
      key: 'hero_ab',
      priority: 100,
      ruleJson: JSON.stringify({ op: 'contains', field: 'segments', value: 'experiment_b' }),
      state: 'ACTIVE',
      trafficAllocation: 50,
      contentVersionId: variantPublished.id
    });
  }
}

async function main(): Promise<void> {
  const db = await DuckDbClient.create(config.dbPath);
  await runMigrations(db);
  await ensureBaselineConnectors(db);
  await ensureBaselineSecurity(db);

  const auth = new InternalAuthProvider(
    db,
    config.jwtSecret,
    config.jwtExpiresIn as NonNullable<SignOptions['expiresIn']>
  );
  const existing = await auth.validateCredentials(config.seedAdminUsername, config.seedAdminPassword);

  if (!existing) {
    await auth.createUser({
      username: config.seedAdminUsername,
      password: config.seedAdminPassword,
      displayName: config.seedAdminDisplayName
    });
    console.log(`Seeded admin user: ${config.seedAdminUsername}`);
  } else {
    console.log(`Seed user already exists: ${config.seedAdminUsername}`);
  }

  await db.run(
    `INSERT INTO markets(code, name, currency, timezone, active)
     SELECT 'US', 'United States', 'USD', 'America/New_York', TRUE
     WHERE NOT EXISTS (SELECT 1 FROM markets WHERE code = 'US')`
  );
  await db.run(
    `INSERT INTO markets(code, name, currency, timezone, active)
     SELECT 'DE', 'Germany', 'EUR', 'Europe/Berlin', TRUE
     WHERE NOT EXISTS (SELECT 1 FROM markets WHERE code = 'DE')`
  );
  await db.run(
    `INSERT INTO locales(code, name, active, fallback_locale_code)
     SELECT 'en-US', 'English (US)', TRUE, NULL
     WHERE NOT EXISTS (SELECT 1 FROM locales WHERE code = 'en-US')`
  );
  await db.run(
    `INSERT INTO locales(code, name, active, fallback_locale_code)
     SELECT 'de-DE', 'Deutsch (DE)', TRUE, 'en-US'
     WHERE NOT EXISTS (SELECT 1 FROM locales WHERE code = 'de-DE')`
  );
  await db.run(
    `INSERT INTO site_markets(site_id, market_code, is_default, active)
     SELECT 1, 'US', TRUE, TRUE
     WHERE NOT EXISTS (SELECT 1 FROM site_markets WHERE site_id = 1 AND market_code = 'US')`
  );
  await db.run(
    `INSERT INTO site_markets(site_id, market_code, is_default, active)
     SELECT 1, 'DE', FALSE, TRUE
     WHERE NOT EXISTS (SELECT 1 FROM site_markets WHERE site_id = 1 AND market_code = 'DE')`
  );
  await db.run(
    `INSERT INTO site_locales(site_id, locale_code, is_default, active)
     SELECT 1, 'en-US', TRUE, TRUE
     WHERE NOT EXISTS (SELECT 1 FROM site_locales WHERE site_id = 1 AND locale_code = 'en-US')`
  );
  await db.run(
    `INSERT INTO site_locales(site_id, locale_code, is_default, active)
     SELECT 1, 'de-DE', FALSE, TRUE
     WHERE NOT EXISTS (SELECT 1 FROM site_locales WHERE site_id = 1 AND locale_code = 'de-DE')`
  );
  await db.run(
    `INSERT INTO site_market_locales(site_id, market_code, locale_code, active, is_default_for_market)
     SELECT 1, 'US', 'en-US', TRUE, TRUE
     WHERE NOT EXISTS (
       SELECT 1 FROM site_market_locales WHERE site_id = 1 AND market_code = 'US' AND locale_code = 'en-US'
     )`
  );
  await db.run(
    `INSERT INTO site_market_locales(site_id, market_code, locale_code, active, is_default_for_market)
     SELECT 1, 'DE', 'de-DE', TRUE, TRUE
     WHERE NOT EXISTS (
       SELECT 1 FROM site_market_locales WHERE site_id = 1 AND market_code = 'DE' AND locale_code = 'de-DE'
     )`
  );

  const workflowGraph = JSON.stringify({
    nodes: [
      { id: 'n1', type: 'AI.GenerateContent', config: { prompt: 'Generate homepage content for demo' } },
      { id: 'n2', type: 'CreateDraftVersion', config: {} },
      { id: 'n3', type: 'ManualApproval', config: {} },
      { id: 'n4', type: 'PublishVersion', config: {} },
      { id: 'n5', type: 'ActivateVariant', config: { key: 'default', trafficAllocation: 100 } }
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n4', to: 'n5' }
    ]
  });

  await db.run(
    `INSERT INTO workflow_definitions(
      id,
      name,
      version,
      graph_json,
      input_schema_json,
      permissions_json,
      created_by
    )
    SELECT
      COALESCE((SELECT MAX(id) + 1 FROM workflow_definitions), 1),
      'Default Publish Flow',
      1,
      ?,
      '{"type":"object"}',
      '{"roles":["admin"]}',
      'seed'
    WHERE NOT EXISTS (
      SELECT 1 FROM workflow_definitions WHERE name = 'Default Publish Flow' AND version = 1
    )`,
    [workflowGraph]
  );

  const formId = await ensureDemoForm(db);
  const assets = await ensureDemoAssets(db);
  await ensureDemoLandingPage(db, { formId, ...assets });

  console.log('Seeded demo page, assets, connectors, roles, and market/locale matrix (if missing).');
  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
