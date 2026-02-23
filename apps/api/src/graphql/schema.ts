import SchemaBuilder from '@pothos/core';

import type { InternalAuthProvider } from '../auth/InternalAuthProvider.js';
import type { DbClient } from '../db/DbClient.js';
import {
  type ContentItemRecord,
  type ContentRouteRecord,
  type ContentTypeRecord,
  type ContentVersionRecord,
  type DiffResult,
  type ResolvedRoute,
  type TemplateRecord,
  archiveContentItem,
  createContentItem,
  createContentType,
  createDraftVersion,
  createTemplate,
  deleteContentType,
  deleteRoute,
  deleteTemplate,
  diffVersions,
  getContentItemDetail,
  issuePreviewTokenPayload,
  listContentItems,
  listContentTypes,
  listRoutes,
  listTemplates,
  listVersions,
  publishVersion,
  reconcileTemplate,
  resolveRoute,
  rollbackToVersion,
  updateContentType,
  updateDraftVersion,
  updateTemplate,
  upsertRoute
} from '../content/service.js';
import {
  type Locale,
  type Market,
  type MarketDefaultLocale,
  type Matrix,
  type MatrixCombination,
  type ResolvedMarketLocale,
  type Site,
  type SiteDefaults,
  getSiteDefaults,
  getSiteMarketLocaleMatrix,
  listLocales,
  listMarkets,
  listSites,
  resolveMarketLocaleFallback,
  setSiteLocales,
  setSiteMarketLocaleMatrix,
  setSiteMarkets,
  upsertLocale,
  upsertMarket,
  validateMarketLocale
} from '../marketLocale/service.js';
import type { SafeUser } from '../types/user.js';

export type GraphqlContext = {
  auth: InternalAuthProvider;
  db: DbClient;
  currentUser: SafeUser | null;
};

type LoginInput = {
  username: string;
  password: string;
};

type AuthPayload = {
  token: string;
  user: SafeUser;
};

type UpsertMarketArgs = {
  siteId: number;
  code: string;
  name: string;
  currency?: string | null | undefined;
  timezone?: string | null | undefined;
  active: boolean;
  isDefault: boolean;
};

type UpsertLocaleArgs = {
  siteId: number;
  code: string;
  name: string;
  active: boolean;
  fallbackLocaleCode?: string | null | undefined;
  isDefault: boolean;
};

type SetSiteMarketsArgs = {
  siteId: number;
  markets: { code: string; active: boolean }[];
  defaultMarketCode: string;
};

type SetSiteLocalesArgs = {
  siteId: number;
  locales: { code: string; active: boolean }[];
  defaultLocaleCode: string;
};

type SetSiteMatrixArgs = {
  siteId: number;
  combinations: {
    marketCode: string;
    localeCode: string;
    active: boolean;
    isDefaultForMarket?: boolean | null | undefined;
  }[];
  defaults?: {
    marketDefaultLocales: { marketCode: string; localeCode: string }[];
  } | null | undefined;
};

const builder = new SchemaBuilder<{ Context: GraphqlContext }>({});

const UserRef = builder.objectRef<SafeUser>('User');
UserRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    username: t.exposeString('username'),
    displayName: t.exposeString('displayName'),
    createdAt: t.exposeString('createdAt')
  })
});

const AuthPayloadRef = builder.objectRef<AuthPayload>('AuthPayload');
AuthPayloadRef.implement({
  fields: (t) => ({
    token: t.exposeString('token'),
    user: t.field({ type: UserRef, resolve: (parent) => parent.user })
  })
});

const SiteRef = builder.objectRef<Site>('Site');
SiteRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    name: t.exposeString('name'),
    active: t.exposeBoolean('active')
  })
});

const MarketRef = builder.objectRef<Market>('Market');
MarketRef.implement({
  fields: (t) => ({
    code: t.exposeString('code'),
    name: t.exposeString('name'),
    currency: t.exposeString('currency', { nullable: true }),
    timezone: t.exposeString('timezone', { nullable: true }),
    active: t.exposeBoolean('active'),
    isDefault: t.exposeBoolean('isDefault')
  })
});

const LocaleRef = builder.objectRef<Locale>('Locale');
LocaleRef.implement({
  fields: (t) => ({
    code: t.exposeString('code'),
    name: t.exposeString('name'),
    active: t.exposeBoolean('active'),
    fallbackLocaleCode: t.exposeString('fallbackLocaleCode', { nullable: true }),
    isDefault: t.exposeBoolean('isDefault')
  })
});

const MarketDefaultLocaleRef = builder.objectRef<MarketDefaultLocale>('MarketDefaultLocale');
MarketDefaultLocaleRef.implement({
  fields: (t) => ({
    marketCode: t.exposeString('marketCode'),
    localeCode: t.exposeString('localeCode')
  })
});

const SiteDefaultsRef = builder.objectRef<SiteDefaults>('SiteDefaults');
SiteDefaultsRef.implement({
  fields: (t) => ({
    siteId: t.exposeInt('siteId'),
    defaultMarketCode: t.exposeString('defaultMarketCode', { nullable: true }),
    defaultLocaleCode: t.exposeString('defaultLocaleCode', { nullable: true }),
    marketDefaultLocales: t.field({
      type: [MarketDefaultLocaleRef],
      resolve: (parent) => parent.marketDefaultLocales
    })
  })
});

const MatrixCombinationRef = builder.objectRef<MatrixCombination>('SiteMarketLocaleCombination');
MatrixCombinationRef.implement({
  fields: (t) => ({
    siteId: t.exposeInt('siteId'),
    marketCode: t.exposeString('marketCode'),
    localeCode: t.exposeString('localeCode'),
    active: t.exposeBoolean('active'),
    isDefaultForMarket: t.exposeBoolean('isDefaultForMarket')
  })
});

const MatrixRef = builder.objectRef<Matrix>('SiteMarketLocaleMatrix');
MatrixRef.implement({
  fields: (t) => ({
    siteId: t.exposeInt('siteId'),
    markets: t.field({ type: [MarketRef], resolve: (parent) => parent.markets }),
    locales: t.field({ type: [LocaleRef], resolve: (parent) => parent.locales }),
    combinations: t.field({ type: [MatrixCombinationRef], resolve: (parent) => parent.combinations }),
    defaults: t.field({ type: SiteDefaultsRef, resolve: (parent) => parent.defaults })
  })
});

const ResolvedMarketLocaleRef = builder.objectRef<ResolvedMarketLocale>('ResolvedMarketLocale');
ResolvedMarketLocaleRef.implement({
  fields: (t) => ({
    siteId: t.exposeInt('siteId'),
    marketCode: t.exposeString('marketCode'),
    localeCode: t.exposeString('localeCode'),
    resolution: t.exposeString('resolution')
  })
});

const ContentTypeRef = builder.objectRef<ContentTypeRecord>('ContentType');
ContentTypeRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    siteId: t.exposeInt('siteId'),
    name: t.exposeString('name'),
    description: t.exposeString('description', { nullable: true }),
    fieldsJson: t.exposeString('fieldsJson'),
    createdAt: t.exposeString('createdAt'),
    createdBy: t.exposeString('createdBy'),
    updatedAt: t.exposeString('updatedAt'),
    updatedBy: t.exposeString('updatedBy')
  })
});

const ContentVersionRef = builder.objectRef<ContentVersionRecord>('ContentVersion');
ContentVersionRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    contentItemId: t.exposeInt('contentItemId'),
    versionNumber: t.exposeInt('versionNumber'),
    state: t.exposeString('state'),
    sourceVersionId: t.exposeInt('sourceVersionId', { nullable: true }),
    fieldsJson: t.exposeString('fieldsJson'),
    compositionJson: t.exposeString('compositionJson'),
    componentsJson: t.exposeString('componentsJson'),
    metadataJson: t.exposeString('metadataJson'),
    comment: t.exposeString('comment', { nullable: true }),
    createdAt: t.exposeString('createdAt'),
    createdBy: t.exposeString('createdBy')
  })
});

const ContentItemRef = builder.objectRef<ContentItemRecord>('ContentItem');
ContentItemRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    siteId: t.exposeInt('siteId'),
    contentTypeId: t.exposeInt('contentTypeId'),
    archived: t.exposeBoolean('archived'),
    createdAt: t.exposeString('createdAt'),
    createdBy: t.exposeString('createdBy'),
    currentDraftVersionId: t.exposeInt('currentDraftVersionId', { nullable: true }),
    currentPublishedVersionId: t.exposeInt('currentPublishedVersionId', { nullable: true })
  })
});

const ContentItemDetailRef = builder.objectRef<{
  item: ContentItemRecord;
  contentType: ContentTypeRecord;
  currentDraftVersion: ContentVersionRecord | null;
  currentPublishedVersion: ContentVersionRecord | null;
}>('ContentItemDetail');
ContentItemDetailRef.implement({
  fields: (t) => ({
    item: t.field({ type: ContentItemRef, resolve: (parent) => parent.item }),
    contentType: t.field({ type: ContentTypeRef, resolve: (parent) => parent.contentType }),
    currentDraftVersion: t.field({
      type: ContentVersionRef,
      nullable: true,
      resolve: (parent) => parent.currentDraftVersion
    }),
    currentPublishedVersion: t.field({
      type: ContentVersionRef,
      nullable: true,
      resolve: (parent) => parent.currentPublishedVersion
    })
  })
});

const TemplateRef = builder.objectRef<TemplateRecord>('Template');
TemplateRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    siteId: t.exposeInt('siteId'),
    name: t.exposeString('name'),
    compositionJson: t.exposeString('compositionJson'),
    componentsJson: t.exposeString('componentsJson'),
    constraintsJson: t.exposeString('constraintsJson'),
    updatedAt: t.exposeString('updatedAt')
  })
});

const ContentRouteRef = builder.objectRef<ContentRouteRecord>('ContentRoute');
ContentRouteRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    siteId: t.exposeInt('siteId'),
    contentItemId: t.exposeInt('contentItemId'),
    marketCode: t.exposeString('marketCode'),
    localeCode: t.exposeString('localeCode'),
    slug: t.exposeString('slug'),
    isCanonical: t.exposeBoolean('isCanonical'),
    createdAt: t.exposeString('createdAt')
  })
});

const DiffResultRef = builder.objectRef<DiffResult>('VersionDiff');
DiffResultRef.implement({
  fields: (t) => ({
    summary: t.exposeString('summary'),
    changedPaths: t.exposeStringList('changedPaths'),
    leftVersionId: t.exposeInt('leftVersionId'),
    rightVersionId: t.exposeInt('rightVersionId')
  })
});

const ResolvedRouteRef = builder.objectRef<ResolvedRoute>('ResolvedRoute');
ResolvedRouteRef.implement({
  fields: (t) => ({
    route: t.field({ type: ContentRouteRef, resolve: (parent) => parent.route }),
    contentItem: t.field({ type: ContentItemRef, resolve: (parent) => parent.contentItem }),
    contentType: t.field({ type: ContentTypeRef, resolve: (parent) => parent.contentType }),
    version: t.field({ type: ContentVersionRef, nullable: true, resolve: (parent) => parent.version }),
    mode: t.exposeString('mode')
  })
});

const PreviewTokenRef = builder.objectRef<{ token: string; contentItemId: number }>('PreviewTokenPayload');
PreviewTokenRef.implement({
  fields: (t) => ({
    token: t.exposeString('token'),
    contentItemId: t.exposeInt('contentItemId')
  })
});

const SiteMarketInputRef = builder.inputRef<{ code: string; active: boolean }>('SiteMarketInput');
SiteMarketInputRef.implement({
  fields: (t) => ({
    code: t.string({ required: true }),
    active: t.boolean({ required: true })
  })
});

const SiteLocaleInputRef = builder.inputRef<{ code: string; active: boolean }>('SiteLocaleInput');
SiteLocaleInputRef.implement({
  fields: (t) => ({
    code: t.string({ required: true }),
    active: t.boolean({ required: true })
  })
});

const SiteMarketLocaleInputRef = builder.inputRef<{
  marketCode: string;
  localeCode: string;
  active: boolean;
  isDefaultForMarket?: boolean | null | undefined;
}>('SiteMarketLocaleInput');
SiteMarketLocaleInputRef.implement({
  fields: (t) => ({
    marketCode: t.string({ required: true }),
    localeCode: t.string({ required: true }),
    active: t.boolean({ required: true }),
    isDefaultForMarket: t.boolean({ required: false })
  })
});

const MarketDefaultLocaleInputRef = builder.inputRef<{ marketCode: string; localeCode: string }>(
  'MarketDefaultLocaleInput'
);
MarketDefaultLocaleInputRef.implement({
  fields: (t) => ({
    marketCode: t.string({ required: true }),
    localeCode: t.string({ required: true })
  })
});

const MatrixDefaultsInputRef = builder.inputRef<{ marketDefaultLocales: { marketCode: string; localeCode: string }[] }>(
  'MatrixDefaultsInput'
);
MatrixDefaultsInputRef.implement({
  fields: (t) => ({
    marketDefaultLocales: t.field({ type: [MarketDefaultLocaleInputRef], required: true })
  })
});

const DraftPatchInputRef = builder.inputRef<{
  fieldsJson?: string | null | undefined;
  compositionJson?: string | null | undefined;
  componentsJson?: string | null | undefined;
  metadataJson?: string | null | undefined;
  comment?: string | null | undefined;
  createdBy?: string | null | undefined;
}>('UpdateDraftPatchInput');
DraftPatchInputRef.implement({
  fields: (t) => ({
    fieldsJson: t.string({ required: false }),
    compositionJson: t.string({ required: false }),
    componentsJson: t.string({ required: false }),
    metadataJson: t.string({ required: false }),
    comment: t.string({ required: false }),
    createdBy: t.string({ required: false })
  })
});

builder.queryType({
  fields: (t) => ({
    me: t.field({
      type: UserRef,
      nullable: true,
      resolve: (_root, _args, ctx) => ctx.currentUser
    }),
    listSites: t.field({
      type: [SiteRef],
      resolve: async (_root, _args, ctx) => listSites(ctx.db)
    }),
    listMarkets: t.field({
      type: [MarketRef],
      args: { siteId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { siteId: number }, ctx) => listMarkets(ctx.db, args.siteId)
    }),
    listLocales: t.field({
      type: [LocaleRef],
      args: { siteId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { siteId: number }, ctx) => listLocales(ctx.db, args.siteId)
    }),
    getSiteDefaults: t.field({
      type: SiteDefaultsRef,
      args: { siteId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { siteId: number }, ctx) => getSiteDefaults(ctx.db, args.siteId)
    }),
    getSiteMarketLocaleMatrix: t.field({
      type: MatrixRef,
      args: { siteId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { siteId: number }, ctx) => getSiteMarketLocaleMatrix(ctx.db, args.siteId)
    }),
    validateMarketLocale: t.boolean({
      args: {
        siteId: t.arg.int({ required: true }),
        marketCode: t.arg.string({ required: true }),
        localeCode: t.arg.string({ required: true })
      },
      resolve: async (_root, args: { siteId: number; marketCode: string; localeCode: string }, ctx) =>
        validateMarketLocale(ctx.db, args.siteId, args.marketCode, args.localeCode)
    }),
    resolveMarketLocale: t.field({
      type: ResolvedMarketLocaleRef,
      args: {
        siteId: t.arg.int({ required: true }),
        marketCode: t.arg.string({ required: true }),
        localeCode: t.arg.string({ required: true })
      },
      resolve: async (_root, args: { siteId: number; marketCode: string; localeCode: string }, ctx) =>
        resolveMarketLocaleFallback(ctx.db, args.siteId, args.marketCode, args.localeCode)
    }),
    listContentTypes: t.field({
      type: [ContentTypeRef],
      args: { siteId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { siteId: number }, ctx) => listContentTypes(ctx.db, args.siteId)
    }),
    listContentItems: t.field({
      type: [ContentItemRef],
      args: { siteId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { siteId: number }, ctx) => listContentItems(ctx.db, args.siteId)
    }),
    getContentItemDetail: t.field({
      type: ContentItemDetailRef,
      args: { contentItemId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { contentItemId: number }, ctx) => getContentItemDetail(ctx.db, args.contentItemId)
    }),
    listVersions: t.field({
      type: [ContentVersionRef],
      args: { contentItemId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { contentItemId: number }, ctx) => listVersions(ctx.db, args.contentItemId)
    }),
    diffVersions: t.field({
      type: DiffResultRef,
      args: {
        leftVersionId: t.arg.int({ required: true }),
        rightVersionId: t.arg.int({ required: true })
      },
      resolve: async (_root, args: { leftVersionId: number; rightVersionId: number }, ctx) =>
        diffVersions(ctx.db, args.leftVersionId, args.rightVersionId)
    }),
    listTemplates: t.field({
      type: [TemplateRef],
      args: { siteId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { siteId: number }, ctx) => listTemplates(ctx.db, args.siteId)
    }),
    listRoutes: t.field({
      type: [ContentRouteRef],
      args: {
        siteId: t.arg.int({ required: true }),
        marketCode: t.arg.string({ required: false }),
        localeCode: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: { siteId: number; marketCode?: string | null | undefined; localeCode?: string | null | undefined },
        ctx
      ) => listRoutes(ctx.db, args)
    }),
    resolveRoute: t.field({
      type: ResolvedRouteRef,
      nullable: true,
      args: {
        siteId: t.arg.int({ required: true }),
        marketCode: t.arg.string({ required: true }),
        localeCode: t.arg.string({ required: true }),
        slug: t.arg.string({ required: true }),
        previewToken: t.arg.string({ required: false }),
        preview: t.arg.boolean({ required: false })
      },
      resolve: async (
        _root,
        args: {
          siteId: number;
          marketCode: string;
          localeCode: string;
          slug: string;
          previewToken?: string | null | undefined;
          preview?: boolean | null | undefined;
        },
        ctx
      ) => {
        let previewAllowed = false;

        if (args.previewToken) {
          const claims = ctx.auth.verifyPreviewToken(args.previewToken);
          if (claims) {
            previewAllowed = true;
          }
        }

        if (args.preview && ctx.currentUser) {
          previewAllowed = true;
        }

        return resolveRoute(ctx.db, {
          siteId: args.siteId,
          marketCode: args.marketCode,
          localeCode: args.localeCode,
          slug: args.slug,
          previewAllowed
        });
      }
    })
  })
});

builder.mutationType({
  fields: (t) => ({
    login: t.field({
      type: AuthPayloadRef,
      nullable: true,
      args: {
        username: t.arg.string({ required: true }),
        password: t.arg.string({ required: true })
      },
      resolve: async (_root, args: LoginInput, ctx): Promise<AuthPayload | null> => {
        const user = await ctx.auth.validateCredentials(args.username, args.password);
        if (!user) {
          return null;
        }

        return {
          token: ctx.auth.issueToken(user),
          user
        };
      }
    }),
    upsertMarket: t.field({
      type: [MarketRef],
      args: {
        siteId: t.arg.int({ required: true }),
        code: t.arg.string({ required: true }),
        name: t.arg.string({ required: true }),
        currency: t.arg.string({ required: false }),
        timezone: t.arg.string({ required: false }),
        active: t.arg.boolean({ required: true }),
        isDefault: t.arg.boolean({ required: true })
      },
      resolve: async (_root, args: UpsertMarketArgs, ctx) => upsertMarket(ctx.db, args)
    }),
    upsertLocale: t.field({
      type: [LocaleRef],
      args: {
        siteId: t.arg.int({ required: true }),
        code: t.arg.string({ required: true }),
        name: t.arg.string({ required: true }),
        active: t.arg.boolean({ required: true }),
        fallbackLocaleCode: t.arg.string({ required: false }),
        isDefault: t.arg.boolean({ required: true })
      },
      resolve: async (_root, args: UpsertLocaleArgs, ctx) => upsertLocale(ctx.db, args)
    }),
    setSiteMarkets: t.field({
      type: [MarketRef],
      args: {
        siteId: t.arg.int({ required: true }),
        markets: t.arg({ type: [SiteMarketInputRef], required: true }),
        defaultMarketCode: t.arg.string({ required: true })
      },
      resolve: async (_root, args: SetSiteMarketsArgs, ctx) =>
        setSiteMarkets(ctx.db, args.siteId, args.markets, args.defaultMarketCode)
    }),
    setSiteLocales: t.field({
      type: [LocaleRef],
      args: {
        siteId: t.arg.int({ required: true }),
        locales: t.arg({ type: [SiteLocaleInputRef], required: true }),
        defaultLocaleCode: t.arg.string({ required: true })
      },
      resolve: async (_root, args: SetSiteLocalesArgs, ctx) =>
        setSiteLocales(ctx.db, args.siteId, args.locales, args.defaultLocaleCode)
    }),
    setSiteMarketLocaleMatrix: t.field({
      type: MatrixRef,
      args: {
        siteId: t.arg.int({ required: true }),
        combinations: t.arg({ type: [SiteMarketLocaleInputRef], required: true }),
        defaults: t.arg({ type: MatrixDefaultsInputRef, required: false })
      },
      resolve: async (_root, args: SetSiteMatrixArgs, ctx) =>
        setSiteMarketLocaleMatrix(
          ctx.db,
          args.siteId,
          args.combinations,
          args.defaults?.marketDefaultLocales ?? []
        )
    }),
    createContentType: t.field({
      type: ContentTypeRef,
      args: {
        siteId: t.arg.int({ required: true }),
        name: t.arg.string({ required: true }),
        description: t.arg.string({ required: false }),
        fieldsJson: t.arg.string({ required: true }),
        by: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: {
          siteId: number;
          name: string;
          description?: string | null | undefined;
          fieldsJson: string;
          by?: string | null | undefined;
        },
        ctx
      ) =>
        createContentType(ctx.db, {
          siteId: args.siteId,
          name: args.name,
          description: args.description,
          fieldsJson: args.fieldsJson,
          by: args.by ?? ctx.currentUser?.username ?? 'system'
        })
    }),
    updateContentType: t.field({
      type: ContentTypeRef,
      args: {
        id: t.arg.int({ required: true }),
        name: t.arg.string({ required: true }),
        description: t.arg.string({ required: false }),
        fieldsJson: t.arg.string({ required: true }),
        by: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: {
          id: number;
          name: string;
          description?: string | null | undefined;
          fieldsJson: string;
          by?: string | null | undefined;
        },
        ctx
      ) =>
        updateContentType(ctx.db, {
          id: args.id,
          name: args.name,
          description: args.description,
          fieldsJson: args.fieldsJson,
          by: args.by ?? ctx.currentUser?.username ?? 'system'
        })
    }),
    deleteContentType: t.boolean({
      args: { id: t.arg.int({ required: true }) },
      resolve: async (_root, args: { id: number }, ctx) => deleteContentType(ctx.db, args.id)
    }),
    createContentItem: t.field({
      type: ContentItemRef,
      args: {
        siteId: t.arg.int({ required: true }),
        contentTypeId: t.arg.int({ required: true }),
        initialFieldsJson: t.arg.string({ required: false }),
        initialCompositionJson: t.arg.string({ required: false }),
        initialComponentsJson: t.arg.string({ required: false }),
        metadataJson: t.arg.string({ required: false }),
        comment: t.arg.string({ required: false }),
        by: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: {
          siteId: number;
          contentTypeId: number;
          initialFieldsJson?: string | null | undefined;
          initialCompositionJson?: string | null | undefined;
          initialComponentsJson?: string | null | undefined;
          metadataJson?: string | null | undefined;
          comment?: string | null | undefined;
          by?: string | null | undefined;
        },
        ctx
      ) =>
        createContentItem(ctx.db, {
          siteId: args.siteId,
          contentTypeId: args.contentTypeId,
          initialFieldsJson: args.initialFieldsJson,
          initialCompositionJson: args.initialCompositionJson,
          initialComponentsJson: args.initialComponentsJson,
          metadataJson: args.metadataJson,
          comment: args.comment,
          by: args.by ?? ctx.currentUser?.username ?? 'system'
        })
    }),
    archiveContentItem: t.field({
      type: ContentItemRef,
      args: {
        id: t.arg.int({ required: true }),
        archived: t.arg.boolean({ required: true })
      },
      resolve: async (_root, args: { id: number; archived: boolean }, ctx) =>
        archiveContentItem(ctx.db, args.id, args.archived)
    }),
    createDraftVersion: t.field({
      type: ContentVersionRef,
      args: {
        contentItemId: t.arg.int({ required: true }),
        fromVersionId: t.arg.int({ required: false }),
        comment: t.arg.string({ required: false }),
        by: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: {
          contentItemId: number;
          fromVersionId?: number | null | undefined;
          comment?: string | null | undefined;
          by?: string | null | undefined;
        },
        ctx
      ) =>
        createDraftVersion(ctx.db, {
          contentItemId: args.contentItemId,
          fromVersionId: args.fromVersionId,
          comment: args.comment,
          by: args.by ?? ctx.currentUser?.username ?? 'system'
        })
    }),
    updateDraftVersion: t.field({
      type: ContentVersionRef,
      args: {
        versionId: t.arg.int({ required: true }),
        patch: t.arg({ type: DraftPatchInputRef, required: true }),
        expectedVersionNumber: t.arg.int({ required: true })
      },
      resolve: async (
        _root,
        args: {
          versionId: number;
          patch: {
            fieldsJson?: string | null | undefined;
            compositionJson?: string | null | undefined;
            componentsJson?: string | null | undefined;
            metadataJson?: string | null | undefined;
            comment?: string | null | undefined;
            createdBy?: string | null | undefined;
          };
          expectedVersionNumber: number;
        },
        ctx
      ) =>
        updateDraftVersion(ctx.db, {
          versionId: args.versionId,
          patch: {
            ...args.patch,
            createdBy: args.patch.createdBy ?? ctx.currentUser?.username ?? 'system'
          },
          expectedVersionNumber: args.expectedVersionNumber
        })
    }),
    publishVersion: t.field({
      type: ContentVersionRef,
      args: {
        versionId: t.arg.int({ required: true }),
        expectedVersionNumber: t.arg.int({ required: true }),
        comment: t.arg.string({ required: false }),
        by: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: {
          versionId: number;
          expectedVersionNumber: number;
          comment?: string | null | undefined;
          by?: string | null | undefined;
        },
        ctx
      ) =>
        publishVersion(ctx.db, {
          versionId: args.versionId,
          expectedVersionNumber: args.expectedVersionNumber,
          comment: args.comment,
          by: args.by ?? ctx.currentUser?.username ?? 'system'
        })
    }),
    rollbackToVersion: t.field({
      type: ContentVersionRef,
      args: {
        contentItemId: t.arg.int({ required: true }),
        versionId: t.arg.int({ required: true }),
        by: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: { contentItemId: number; versionId: number; by?: string | null | undefined },
        ctx
      ) =>
        rollbackToVersion(ctx.db, {
          contentItemId: args.contentItemId,
          versionId: args.versionId,
          by: args.by ?? ctx.currentUser?.username ?? 'system'
        })
    }),
    createTemplate: t.field({
      type: TemplateRef,
      args: {
        siteId: t.arg.int({ required: true }),
        name: t.arg.string({ required: true }),
        compositionJson: t.arg.string({ required: true }),
        componentsJson: t.arg.string({ required: true }),
        constraintsJson: t.arg.string({ required: true })
      },
      resolve: async (
        _root,
        args: {
          siteId: number;
          name: string;
          compositionJson: string;
          componentsJson: string;
          constraintsJson: string;
        },
        ctx
      ) => createTemplate(ctx.db, args)
    }),
    updateTemplate: t.field({
      type: TemplateRef,
      args: {
        id: t.arg.int({ required: true }),
        name: t.arg.string({ required: true }),
        compositionJson: t.arg.string({ required: true }),
        componentsJson: t.arg.string({ required: true }),
        constraintsJson: t.arg.string({ required: true })
      },
      resolve: async (
        _root,
        args: {
          id: number;
          name: string;
          compositionJson: string;
          componentsJson: string;
          constraintsJson: string;
        },
        ctx
      ) => updateTemplate(ctx.db, args)
    }),
    deleteTemplate: t.boolean({
      args: { id: t.arg.int({ required: true }) },
      resolve: async (_root, args: { id: number }, ctx) => deleteTemplate(ctx.db, args.id)
    }),
    reconcileTemplate: t.field({
      type: DiffResultRef,
      args: { templateId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { templateId: number }, ctx) => reconcileTemplate(ctx.db, args.templateId)
    }),
    upsertRoute: t.field({
      type: ContentRouteRef,
      args: {
        id: t.arg.int({ required: false }),
        siteId: t.arg.int({ required: true }),
        contentItemId: t.arg.int({ required: true }),
        marketCode: t.arg.string({ required: true }),
        localeCode: t.arg.string({ required: true }),
        slug: t.arg.string({ required: true }),
        isCanonical: t.arg.boolean({ required: true })
      },
      resolve: async (
        _root,
        args: {
          id?: number | null | undefined;
          siteId: number;
          contentItemId: number;
          marketCode: string;
          localeCode: string;
          slug: string;
          isCanonical: boolean;
        },
        ctx
      ) => upsertRoute(ctx.db, args)
    }),
    deleteRoute: t.boolean({
      args: { id: t.arg.int({ required: true }) },
      resolve: async (_root, args: { id: number }, ctx) => deleteRoute(ctx.db, args.id)
    }),
    issuePreviewToken: t.field({
      type: PreviewTokenRef,
      args: { contentItemId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { contentItemId: number }, ctx) => {
        const payload = await issuePreviewTokenPayload(ctx.db, args.contentItemId);
        const token = ctx.auth.issuePreviewToken(args.contentItemId);
        return { token, contentItemId: payload.contentItemId };
      }
    })
  })
});

export const schema = builder.toSchema({});
