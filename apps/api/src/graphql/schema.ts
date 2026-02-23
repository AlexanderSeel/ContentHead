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
  type PageByRouteResult,
  type VariantRecord,
  type VariantSelection,
  type VariantSetRecord,
  deleteVariant,
  deleteVariantSet,
  getPageByRoute,
  listVariantSets,
  listVariants,
  selectVariant,
  upsertVariant,
  upsertVariantSet
} from '../content/variantService.js';
import {
  type FormEvaluation,
  type FormFieldRecord,
  type FormRecord,
  type FormStepRecord,
  deleteForm,
  deleteFormField,
  deleteFormStep,
  evaluateForm,
  listFormFields,
  listForms,
  listFormSteps,
  upsertForm,
  upsertFormField,
  upsertFormStep
} from '../forms/service.js';
import {
  type LocaleCatalogItem,
  type Locale,
  type Market,
  type MarketDefaultLocale,
  type Matrix,
  type MatrixCombination,
  type ResolvedMarketLocale,
  type Site,
  type SiteDefaults,
  getSite,
  getSiteDefaults,
  getSiteMarketLocaleMatrix,
  listLocaleCatalog,
  listLocales,
  listMarkets,
  listSites,
  resolveMarketLocaleFallback,
  setSiteUrlPattern,
  setSiteLocales,
  setSiteMarketLocaleMatrix,
  setSiteMarkets,
  upsertSiteLocaleOverride,
  upsertLocale,
  upsertMarket,
  validateMarketLocale
} from '../marketLocale/service.js';
import {
  aiGenerateContent,
  aiGenerateContentType,
  aiGenerateVariants,
  aiTranslateVersion
} from '../ai/service.js';
import {
  type WorkflowDefinitionRecord,
  type WorkflowRunRecord,
  approveWorkflowStep,
  deleteWorkflowDefinition,
  getWorkflowRun,
  listWorkflowDefinitions,
  listWorkflowRuns,
  retryFailedWorkflowRun,
  startWorkflowRun,
  upsertWorkflowDefinition
} from '../workflow/service.js';
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

type UpsertSiteLocaleOverrideArgs = {
  siteId: number;
  code: string;
  displayName?: string | null | undefined;
  fallbackLocaleCode?: string | null | undefined;
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
    active: t.exposeBoolean('active'),
    urlPattern: t.exposeString('urlPattern')
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

const LocaleCatalogRef = builder.objectRef<LocaleCatalogItem>('LocaleCatalogItem');
LocaleCatalogRef.implement({
  fields: (t) => ({
    code: t.exposeString('code'),
    name: t.exposeString('name'),
    language: t.exposeString('language'),
    region: t.exposeString('region')
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

const VariantSetRef = builder.objectRef<VariantSetRecord>('VariantSet');
VariantSetRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    siteId: t.exposeInt('siteId'),
    contentItemId: t.exposeInt('contentItemId'),
    marketCode: t.exposeString('marketCode'),
    localeCode: t.exposeString('localeCode'),
    fallbackVariantSetId: t.exposeInt('fallbackVariantSetId', { nullable: true }),
    active: t.exposeBoolean('active')
  })
});

const VariantRef = builder.objectRef<VariantRecord>('Variant');
VariantRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    variantSetId: t.exposeInt('variantSetId'),
    key: t.exposeString('key'),
    priority: t.exposeInt('priority'),
    ruleJson: t.exposeString('ruleJson'),
    state: t.exposeString('state'),
    trafficAllocation: t.exposeInt('trafficAllocation', { nullable: true }),
    contentVersionId: t.exposeInt('contentVersionId')
  })
});

const VariantSelectionRef = builder.objectRef<VariantSelection>('VariantSelection');
VariantSelectionRef.implement({
  fields: (t) => ({
    variant: t.field({ type: VariantRef, nullable: true, resolve: (parent) => parent.variant }),
    reason: t.exposeString('reason'),
    variantSetId: t.exposeInt('variantSetId', { nullable: true })
  })
});

const PageByRouteRef = builder.objectRef<PageByRouteResult>('PageByRoute');
PageByRouteRef.implement({
  fields: (t) => ({
    base: t.field({ type: ResolvedRouteRef, resolve: (parent) => parent.base }),
    selectedVariant: t.field({ type: VariantRef, nullable: true, resolve: (parent) => parent.selectedVariant }),
    selectedVersion: t.field({
      type: ContentVersionRef,
      nullable: true,
      resolve: (parent) => parent.selectedVersion
    }),
    selectionReason: t.exposeString('selectionReason')
  })
});

const FormRef = builder.objectRef<FormRecord>('Form');
FormRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    siteId: t.exposeInt('siteId'),
    name: t.exposeString('name'),
    description: t.exposeString('description', { nullable: true }),
    active: t.exposeBoolean('active'),
    createdAt: t.exposeString('createdAt'),
    updatedAt: t.exposeString('updatedAt')
  })
});

const FormStepRef = builder.objectRef<FormStepRecord>('FormStep');
FormStepRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    formId: t.exposeInt('formId'),
    name: t.exposeString('name'),
    position: t.exposeInt('position')
  })
});

const FormFieldRef = builder.objectRef<FormFieldRecord>('FormField');
FormFieldRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    stepId: t.exposeInt('stepId'),
    formId: t.exposeInt('formId'),
    key: t.exposeString('key'),
    label: t.exposeString('label'),
    fieldType: t.exposeString('fieldType'),
    position: t.exposeInt('position'),
    conditionsJson: t.exposeString('conditionsJson'),
    validationsJson: t.exposeString('validationsJson'),
    uiConfigJson: t.exposeString('uiConfigJson'),
    active: t.exposeBoolean('active')
  })
});

const FormEvaluationRef = builder.objectRef<FormEvaluation>('FormEvaluation');
FormEvaluationRef.implement({
  fields: (t) => ({
    formId: t.exposeInt('formId'),
    valid: t.exposeBoolean('valid'),
    evaluatedFieldsJson: t.exposeString('evaluatedFieldsJson'),
    errorsJson: t.exposeString('errorsJson')
  })
});

const WorkflowDefinitionRef = builder.objectRef<WorkflowDefinitionRecord>('WorkflowDefinition');
WorkflowDefinitionRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    name: t.exposeString('name'),
    version: t.exposeInt('version'),
    graphJson: t.exposeString('graphJson'),
    inputSchemaJson: t.exposeString('inputSchemaJson'),
    permissionsJson: t.exposeString('permissionsJson'),
    createdAt: t.exposeString('createdAt'),
    createdBy: t.exposeString('createdBy')
  })
});

const WorkflowRunRef = builder.objectRef<WorkflowRunRecord>('WorkflowRun');
WorkflowRunRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    definitionId: t.exposeInt('definitionId'),
    status: t.exposeString('status'),
    contextJson: t.exposeString('contextJson'),
    currentNodeId: t.exposeString('currentNodeId', { nullable: true }),
    logsJson: t.exposeString('logsJson'),
    startedAt: t.exposeString('startedAt'),
    startedBy: t.exposeString('startedBy'),
    updatedAt: t.exposeString('updatedAt')
  })
});

const AiContentResultRef = builder.objectRef<{ contentItemId: number; draftVersionId: number }>('AiContentResult');
AiContentResultRef.implement({
  fields: (t) => ({
    contentItemId: t.exposeInt('contentItemId'),
    draftVersionId: t.exposeInt('draftVersionId')
  })
});

const AiVariantsResultRef = builder.objectRef<{ variantSetId: number; createdKeys: string[] }>('AiVariantsResult');
AiVariantsResultRef.implement({
  fields: (t) => ({
    variantSetId: t.exposeInt('variantSetId'),
    createdKeys: t.exposeStringList('createdKeys')
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
    getSite: t.field({
      type: SiteRef,
      args: { siteId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { siteId: number }, ctx) => getSite(ctx.db, args.siteId)
    }),
    localeCatalog: t.field({
      type: [LocaleCatalogRef],
      resolve: async () => listLocaleCatalog()
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
    listVariantSets: t.field({
      type: [VariantSetRef],
      args: {
        siteId: t.arg.int({ required: true }),
        contentItemId: t.arg.int({ required: false }),
        marketCode: t.arg.string({ required: false }),
        localeCode: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: {
          siteId: number;
          contentItemId?: number | null | undefined;
          marketCode?: string | null | undefined;
          localeCode?: string | null | undefined;
        },
        ctx
      ) => listVariantSets(ctx.db, args)
    }),
    listVariants: t.field({
      type: [VariantRef],
      args: {
        variantSetId: t.arg.int({ required: true })
      },
      resolve: async (_root, args: { variantSetId: number }, ctx) => listVariants(ctx.db, args.variantSetId)
    }),
    selectVariant: t.field({
      type: VariantSelectionRef,
      args: {
        variantSetId: t.arg.int({ required: true }),
        contextJson: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: { variantSetId: number; contextJson?: string | null | undefined },
        ctx
      ) => selectVariant(ctx.db, args)
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
    }),
    getPageByRoute: t.field({
      type: PageByRouteRef,
      nullable: true,
      args: {
        siteId: t.arg.int({ required: true }),
        marketCode: t.arg.string({ required: true }),
        localeCode: t.arg.string({ required: true }),
        slug: t.arg.string({ required: true }),
        contextJson: t.arg.string({ required: false }),
        previewToken: t.arg.string({ required: false }),
        preview: t.arg.boolean({ required: false }),
        variantKeyOverride: t.arg.string({ required: false }),
        versionIdOverride: t.arg.int({ required: false })
      },
      resolve: async (
        _root,
        args: {
          siteId: number;
          marketCode: string;
          localeCode: string;
          slug: string;
          contextJson?: string | null | undefined;
          previewToken?: string | null | undefined;
          preview?: boolean | null | undefined;
          variantKeyOverride?: string | null | undefined;
          versionIdOverride?: number | null | undefined;
        },
        ctx
      ) => {
        let previewAllowed = false;
        if (args.previewToken) {
          previewAllowed = Boolean(ctx.auth.verifyPreviewToken(args.previewToken));
        }
        if (args.preview && ctx.currentUser) {
          previewAllowed = true;
        }

        return getPageByRoute(ctx.db, {
          siteId: args.siteId,
          marketCode: args.marketCode,
          localeCode: args.localeCode,
          slug: args.slug,
          contextJson: args.contextJson,
          previewAllowed,
          variantKeyOverride: args.variantKeyOverride,
          versionIdOverride: args.versionIdOverride
        });
      }
    }),
    listForms: t.field({
      type: [FormRef],
      args: { siteId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { siteId: number }, ctx) => listForms(ctx.db, args.siteId)
    }),
    listFormSteps: t.field({
      type: [FormStepRef],
      args: { formId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { formId: number }, ctx) => listFormSteps(ctx.db, args.formId)
    }),
    listFormFields: t.field({
      type: [FormFieldRef],
      args: { formId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { formId: number }, ctx) => listFormFields(ctx.db, args.formId)
    }),
    evaluateForm: t.field({
      type: FormEvaluationRef,
      args: {
        formId: t.arg.int({ required: true }),
        answersJson: t.arg.string({ required: true }),
        contextJson: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: { formId: number; answersJson: string; contextJson?: string | null | undefined },
        ctx
      ) => evaluateForm(ctx.db, args)
    }),
    listWorkflowDefinitions: t.field({
      type: [WorkflowDefinitionRef],
      resolve: async (_root, _args, ctx) => listWorkflowDefinitions(ctx.db)
    }),
    listWorkflowRuns: t.field({
      type: [WorkflowRunRef],
      args: {
        definitionId: t.arg.int({ required: false })
      },
      resolve: async (_root, args: { definitionId?: number | null | undefined }, ctx) =>
        listWorkflowRuns(ctx.db, args.definitionId)
    }),
    getWorkflowRun: t.field({
      type: WorkflowRunRef,
      args: { runId: t.arg.int({ required: true }) },
      resolve: async (_root, args: { runId: number }, ctx) => getWorkflowRun(ctx.db, args.runId)
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
    upsertSiteLocaleOverride: t.field({
      type: [LocaleRef],
      args: {
        siteId: t.arg.int({ required: true }),
        code: t.arg.string({ required: true }),
        displayName: t.arg.string({ required: false }),
        fallbackLocaleCode: t.arg.string({ required: false })
      },
      resolve: async (_root, args: UpsertSiteLocaleOverrideArgs, ctx) => upsertSiteLocaleOverride(ctx.db, args)
    }),
    setSiteUrlPattern: t.field({
      type: SiteRef,
      args: {
        siteId: t.arg.int({ required: true }),
        urlPattern: t.arg.string({ required: true })
      },
      resolve: async (_root, args: { siteId: number; urlPattern: string }, ctx) =>
        setSiteUrlPattern(ctx.db, args.siteId, args.urlPattern)
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
    upsertVariantSet: t.field({
      type: VariantSetRef,
      args: {
        id: t.arg.int({ required: false }),
        siteId: t.arg.int({ required: true }),
        contentItemId: t.arg.int({ required: true }),
        marketCode: t.arg.string({ required: true }),
        localeCode: t.arg.string({ required: true }),
        fallbackVariantSetId: t.arg.int({ required: false }),
        active: t.arg.boolean({ required: true })
      },
      resolve: async (
        _root,
        args: {
          id?: number | null | undefined;
          siteId: number;
          contentItemId: number;
          marketCode: string;
          localeCode: string;
          fallbackVariantSetId?: number | null | undefined;
          active: boolean;
        },
        ctx
      ) => upsertVariantSet(ctx.db, args)
    }),
    deleteVariantSet: t.boolean({
      args: { id: t.arg.int({ required: true }) },
      resolve: async (_root, args: { id: number }, ctx) => deleteVariantSet(ctx.db, args.id)
    }),
    upsertVariant: t.field({
      type: VariantRef,
      args: {
        id: t.arg.int({ required: false }),
        variantSetId: t.arg.int({ required: true }),
        key: t.arg.string({ required: true }),
        priority: t.arg.int({ required: true }),
        ruleJson: t.arg.string({ required: true }),
        state: t.arg.string({ required: true }),
        trafficAllocation: t.arg.int({ required: false }),
        contentVersionId: t.arg.int({ required: true })
      },
      resolve: async (
        _root,
        args: {
          id?: number | null | undefined;
          variantSetId: number;
          key: string;
          priority: number;
          ruleJson: string;
          state: string;
          trafficAllocation?: number | null | undefined;
          contentVersionId: number;
        },
        ctx
      ) => upsertVariant(ctx.db, args)
    }),
    deleteVariant: t.boolean({
      args: { id: t.arg.int({ required: true }) },
      resolve: async (_root, args: { id: number }, ctx) => deleteVariant(ctx.db, args.id)
    }),
    upsertForm: t.field({
      type: FormRef,
      args: {
        id: t.arg.int({ required: false }),
        siteId: t.arg.int({ required: true }),
        name: t.arg.string({ required: true }),
        description: t.arg.string({ required: false }),
        active: t.arg.boolean({ required: true })
      },
      resolve: async (
        _root,
        args: {
          id?: number | null | undefined;
          siteId: number;
          name: string;
          description?: string | null | undefined;
          active: boolean;
        },
        ctx
      ) => upsertForm(ctx.db, args)
    }),
    deleteForm: t.boolean({
      args: { id: t.arg.int({ required: true }) },
      resolve: async (_root, args: { id: number }, ctx) => deleteForm(ctx.db, args.id)
    }),
    upsertFormStep: t.field({
      type: FormStepRef,
      args: {
        id: t.arg.int({ required: false }),
        formId: t.arg.int({ required: true }),
        name: t.arg.string({ required: true }),
        position: t.arg.int({ required: true })
      },
      resolve: async (
        _root,
        args: { id?: number | null | undefined; formId: number; name: string; position: number },
        ctx
      ) => upsertFormStep(ctx.db, args)
    }),
    deleteFormStep: t.boolean({
      args: { id: t.arg.int({ required: true }) },
      resolve: async (_root, args: { id: number }, ctx) => deleteFormStep(ctx.db, args.id)
    }),
    upsertFormField: t.field({
      type: FormFieldRef,
      args: {
        id: t.arg.int({ required: false }),
        stepId: t.arg.int({ required: true }),
        formId: t.arg.int({ required: true }),
        key: t.arg.string({ required: true }),
        label: t.arg.string({ required: true }),
        fieldType: t.arg.string({ required: true }),
        position: t.arg.int({ required: true }),
        conditionsJson: t.arg.string({ required: true }),
        validationsJson: t.arg.string({ required: true }),
        uiConfigJson: t.arg.string({ required: true }),
        active: t.arg.boolean({ required: true })
      },
      resolve: async (
        _root,
        args: {
          id?: number | null | undefined;
          stepId: number;
          formId: number;
          key: string;
          label: string;
          fieldType: string;
          position: number;
          conditionsJson: string;
          validationsJson: string;
          uiConfigJson: string;
          active: boolean;
        },
        ctx
      ) => upsertFormField(ctx.db, args)
    }),
    deleteFormField: t.boolean({
      args: { id: t.arg.int({ required: true }) },
      resolve: async (_root, args: { id: number }, ctx) => deleteFormField(ctx.db, args.id)
    }),
    upsertWorkflowDefinition: t.field({
      type: WorkflowDefinitionRef,
      args: {
        id: t.arg.int({ required: false }),
        name: t.arg.string({ required: true }),
        version: t.arg.int({ required: true }),
        graphJson: t.arg.string({ required: true }),
        inputSchemaJson: t.arg.string({ required: true }),
        permissionsJson: t.arg.string({ required: true }),
        createdBy: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: {
          id?: number | null | undefined;
          name: string;
          version: number;
          graphJson: string;
          inputSchemaJson: string;
          permissionsJson: string;
          createdBy?: string | null | undefined;
        },
        ctx
      ) =>
        upsertWorkflowDefinition(ctx.db, {
          ...args,
          createdBy: args.createdBy ?? ctx.currentUser?.username ?? 'system'
        })
    }),
    deleteWorkflowDefinition: t.boolean({
      args: { id: t.arg.int({ required: true }) },
      resolve: async (_root, args: { id: number }, ctx) => deleteWorkflowDefinition(ctx.db, args.id)
    }),
    startWorkflowRun: t.field({
      type: WorkflowRunRef,
      args: {
        definitionId: t.arg.int({ required: true }),
        contextJson: t.arg.string({ required: true }),
        startedBy: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: { definitionId: number; contextJson: string; startedBy?: string | null | undefined },
        ctx
      ) =>
        startWorkflowRun(ctx.db, {
          ...args,
          startedBy: args.startedBy ?? ctx.currentUser?.username ?? 'system'
        })
    }),
    approveStep: t.field({
      type: WorkflowRunRef,
      args: {
        runId: t.arg.int({ required: true }),
        nodeId: t.arg.string({ required: true }),
        approvedBy: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: { runId: number; nodeId: string; approvedBy?: string | null | undefined },
        ctx
      ) =>
        approveWorkflowStep(ctx.db, {
          runId: args.runId,
          nodeId: args.nodeId,
          approvedBy: args.approvedBy ?? ctx.currentUser?.username ?? 'system'
        })
    }),
    retryFailed: t.field({
      type: WorkflowRunRef,
      args: {
        runId: t.arg.int({ required: true })
      },
      resolve: async (_root, args: { runId: number }, ctx) => retryFailedWorkflowRun(ctx.db, args.runId)
    }),
    aiGenerateContentType: t.field({
      type: ContentTypeRef,
      args: {
        siteId: t.arg.int({ required: true }),
        prompt: t.arg.string({ required: true }),
        nameHint: t.arg.string({ required: false }),
        by: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: { siteId: number; prompt: string; nameHint?: string | null | undefined; by?: string | null | undefined },
        ctx
      ) =>
        aiGenerateContentType(ctx.db, {
          siteId: args.siteId,
          prompt: args.prompt,
          nameHint: args.nameHint,
          by: args.by ?? ctx.currentUser?.username ?? 'system'
        })
    }),
    aiGenerateContent: t.field({
      type: AiContentResultRef,
      args: {
        contentItemId: t.arg.int({ required: false }),
        siteId: t.arg.int({ required: false }),
        contentTypeId: t.arg.int({ required: false }),
        prompt: t.arg.string({ required: true }),
        by: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: {
          contentItemId?: number | null | undefined;
          siteId?: number | null | undefined;
          contentTypeId?: number | null | undefined;
          prompt: string;
          by?: string | null | undefined;
        },
        ctx
      ) =>
        aiGenerateContent(ctx.db, {
          contentItemId: args.contentItemId,
          siteId: args.siteId,
          contentTypeId: args.contentTypeId,
          prompt: args.prompt,
          by: args.by ?? ctx.currentUser?.username ?? 'system'
        })
    }),
    aiGenerateVariants: t.field({
      type: AiVariantsResultRef,
      args: {
        siteId: t.arg.int({ required: true }),
        contentItemId: t.arg.int({ required: true }),
        marketCode: t.arg.string({ required: true }),
        localeCode: t.arg.string({ required: true }),
        variantSetId: t.arg.int({ required: false }),
        targetVersionId: t.arg.int({ required: true }),
        prompt: t.arg.string({ required: true })
      },
      resolve: async (
        _root,
        args: {
          siteId: number;
          contentItemId: number;
          marketCode: string;
          localeCode: string;
          variantSetId?: number | null | undefined;
          targetVersionId: number;
          prompt: string;
        },
        ctx
      ) => aiGenerateVariants(ctx.db, args)
    }),
    aiTranslateVersion: t.field({
      type: AiContentResultRef,
      args: {
        versionId: t.arg.int({ required: true }),
        targetMarketCode: t.arg.string({ required: true }),
        targetLocaleCode: t.arg.string({ required: true }),
        by: t.arg.string({ required: false })
      },
      resolve: async (
        _root,
        args: {
          versionId: number;
          targetMarketCode: string;
          targetLocaleCode: string;
          by?: string | null | undefined;
        },
        ctx
      ) =>
        aiTranslateVersion(ctx.db, {
          versionId: args.versionId,
          targetMarketCode: args.targetMarketCode,
          targetLocaleCode: args.targetLocaleCode,
          by: args.by ?? ctx.currentUser?.username ?? 'system'
        })
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
