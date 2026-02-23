import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  token?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
};

export type ContentItem = {
  __typename?: 'ContentItem';
  archived?: Maybe<Scalars['Boolean']['output']>;
  contentTypeId?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  currentDraftVersionId?: Maybe<Scalars['Int']['output']>;
  currentPublishedVersionId?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  siteId?: Maybe<Scalars['Int']['output']>;
};

export type ContentItemDetail = {
  __typename?: 'ContentItemDetail';
  contentType?: Maybe<ContentType>;
  currentDraftVersion?: Maybe<ContentVersion>;
  currentPublishedVersion?: Maybe<ContentVersion>;
  item?: Maybe<ContentItem>;
};

export type ContentRoute = {
  __typename?: 'ContentRoute';
  contentItemId?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  isCanonical?: Maybe<Scalars['Boolean']['output']>;
  localeCode?: Maybe<Scalars['String']['output']>;
  marketCode?: Maybe<Scalars['String']['output']>;
  siteId?: Maybe<Scalars['Int']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
};

export type ContentType = {
  __typename?: 'ContentType';
  createdAt?: Maybe<Scalars['String']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  fieldsJson?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  siteId?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
};

export type ContentVersion = {
  __typename?: 'ContentVersion';
  comment?: Maybe<Scalars['String']['output']>;
  componentsJson?: Maybe<Scalars['String']['output']>;
  compositionJson?: Maybe<Scalars['String']['output']>;
  contentItemId?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  fieldsJson?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  metadataJson?: Maybe<Scalars['String']['output']>;
  sourceVersionId?: Maybe<Scalars['Int']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  versionNumber?: Maybe<Scalars['Int']['output']>;
};

export type Locale = {
  __typename?: 'Locale';
  active?: Maybe<Scalars['Boolean']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  fallbackLocaleCode?: Maybe<Scalars['String']['output']>;
  isDefault?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type Market = {
  __typename?: 'Market';
  active?: Maybe<Scalars['Boolean']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
  isDefault?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  timezone?: Maybe<Scalars['String']['output']>;
};

export type MarketDefaultLocale = {
  __typename?: 'MarketDefaultLocale';
  localeCode?: Maybe<Scalars['String']['output']>;
  marketCode?: Maybe<Scalars['String']['output']>;
};

export type MarketDefaultLocaleInput = {
  localeCode: Scalars['String']['input'];
  marketCode: Scalars['String']['input'];
};

export type MatrixDefaultsInput = {
  marketDefaultLocales: Array<MarketDefaultLocaleInput>;
};

export type Mutation = {
  __typename?: 'Mutation';
  archiveContentItem?: Maybe<ContentItem>;
  createContentItem?: Maybe<ContentItem>;
  createContentType?: Maybe<ContentType>;
  createDraftVersion?: Maybe<ContentVersion>;
  createTemplate?: Maybe<Template>;
  deleteContentType?: Maybe<Scalars['Boolean']['output']>;
  deleteRoute?: Maybe<Scalars['Boolean']['output']>;
  deleteTemplate?: Maybe<Scalars['Boolean']['output']>;
  issuePreviewToken?: Maybe<PreviewTokenPayload>;
  login?: Maybe<AuthPayload>;
  publishVersion?: Maybe<ContentVersion>;
  reconcileTemplate?: Maybe<VersionDiff>;
  rollbackToVersion?: Maybe<ContentVersion>;
  setSiteLocales?: Maybe<Array<Locale>>;
  setSiteMarketLocaleMatrix?: Maybe<SiteMarketLocaleMatrix>;
  setSiteMarkets?: Maybe<Array<Market>>;
  updateContentType?: Maybe<ContentType>;
  updateDraftVersion?: Maybe<ContentVersion>;
  updateTemplate?: Maybe<Template>;
  upsertLocale?: Maybe<Array<Locale>>;
  upsertMarket?: Maybe<Array<Market>>;
  upsertRoute?: Maybe<ContentRoute>;
};


export type MutationArchiveContentItemArgs = {
  archived: Scalars['Boolean']['input'];
  id: Scalars['Int']['input'];
};


export type MutationCreateContentItemArgs = {
  by?: InputMaybe<Scalars['String']['input']>;
  comment?: InputMaybe<Scalars['String']['input']>;
  contentTypeId: Scalars['Int']['input'];
  initialComponentsJson?: InputMaybe<Scalars['String']['input']>;
  initialCompositionJson?: InputMaybe<Scalars['String']['input']>;
  initialFieldsJson?: InputMaybe<Scalars['String']['input']>;
  metadataJson?: InputMaybe<Scalars['String']['input']>;
  siteId: Scalars['Int']['input'];
};


export type MutationCreateContentTypeArgs = {
  by?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  fieldsJson: Scalars['String']['input'];
  name: Scalars['String']['input'];
  siteId: Scalars['Int']['input'];
};


export type MutationCreateDraftVersionArgs = {
  by?: InputMaybe<Scalars['String']['input']>;
  comment?: InputMaybe<Scalars['String']['input']>;
  contentItemId: Scalars['Int']['input'];
  fromVersionId?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationCreateTemplateArgs = {
  componentsJson: Scalars['String']['input'];
  compositionJson: Scalars['String']['input'];
  constraintsJson: Scalars['String']['input'];
  name: Scalars['String']['input'];
  siteId: Scalars['Int']['input'];
};


export type MutationDeleteContentTypeArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteRouteArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteTemplateArgs = {
  id: Scalars['Int']['input'];
};


export type MutationIssuePreviewTokenArgs = {
  contentItemId: Scalars['Int']['input'];
};


export type MutationLoginArgs = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationPublishVersionArgs = {
  by?: InputMaybe<Scalars['String']['input']>;
  comment?: InputMaybe<Scalars['String']['input']>;
  expectedVersionNumber: Scalars['Int']['input'];
  versionId: Scalars['Int']['input'];
};


export type MutationReconcileTemplateArgs = {
  templateId: Scalars['Int']['input'];
};


export type MutationRollbackToVersionArgs = {
  by?: InputMaybe<Scalars['String']['input']>;
  contentItemId: Scalars['Int']['input'];
  versionId: Scalars['Int']['input'];
};


export type MutationSetSiteLocalesArgs = {
  defaultLocaleCode: Scalars['String']['input'];
  locales: Array<SiteLocaleInput>;
  siteId: Scalars['Int']['input'];
};


export type MutationSetSiteMarketLocaleMatrixArgs = {
  combinations: Array<SiteMarketLocaleInput>;
  defaults?: InputMaybe<MatrixDefaultsInput>;
  siteId: Scalars['Int']['input'];
};


export type MutationSetSiteMarketsArgs = {
  defaultMarketCode: Scalars['String']['input'];
  markets: Array<SiteMarketInput>;
  siteId: Scalars['Int']['input'];
};


export type MutationUpdateContentTypeArgs = {
  by?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  fieldsJson: Scalars['String']['input'];
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateDraftVersionArgs = {
  expectedVersionNumber: Scalars['Int']['input'];
  patch: UpdateDraftPatchInput;
  versionId: Scalars['Int']['input'];
};


export type MutationUpdateTemplateArgs = {
  componentsJson: Scalars['String']['input'];
  compositionJson: Scalars['String']['input'];
  constraintsJson: Scalars['String']['input'];
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpsertLocaleArgs = {
  active: Scalars['Boolean']['input'];
  code: Scalars['String']['input'];
  fallbackLocaleCode?: InputMaybe<Scalars['String']['input']>;
  isDefault: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  siteId: Scalars['Int']['input'];
};


export type MutationUpsertMarketArgs = {
  active: Scalars['Boolean']['input'];
  code: Scalars['String']['input'];
  currency?: InputMaybe<Scalars['String']['input']>;
  isDefault: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  siteId: Scalars['Int']['input'];
  timezone?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpsertRouteArgs = {
  contentItemId: Scalars['Int']['input'];
  id?: InputMaybe<Scalars['Int']['input']>;
  isCanonical: Scalars['Boolean']['input'];
  localeCode: Scalars['String']['input'];
  marketCode: Scalars['String']['input'];
  siteId: Scalars['Int']['input'];
  slug: Scalars['String']['input'];
};

export type PreviewTokenPayload = {
  __typename?: 'PreviewTokenPayload';
  contentItemId?: Maybe<Scalars['Int']['output']>;
  token?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  diffVersions?: Maybe<VersionDiff>;
  getContentItemDetail?: Maybe<ContentItemDetail>;
  getSiteDefaults?: Maybe<SiteDefaults>;
  getSiteMarketLocaleMatrix?: Maybe<SiteMarketLocaleMatrix>;
  listContentItems?: Maybe<Array<ContentItem>>;
  listContentTypes?: Maybe<Array<ContentType>>;
  listLocales?: Maybe<Array<Locale>>;
  listMarkets?: Maybe<Array<Market>>;
  listRoutes?: Maybe<Array<ContentRoute>>;
  listSites?: Maybe<Array<Site>>;
  listTemplates?: Maybe<Array<Template>>;
  listVersions?: Maybe<Array<ContentVersion>>;
  me?: Maybe<User>;
  resolveMarketLocale?: Maybe<ResolvedMarketLocale>;
  resolveRoute?: Maybe<ResolvedRoute>;
  validateMarketLocale?: Maybe<Scalars['Boolean']['output']>;
};


export type QueryDiffVersionsArgs = {
  leftVersionId: Scalars['Int']['input'];
  rightVersionId: Scalars['Int']['input'];
};


export type QueryGetContentItemDetailArgs = {
  contentItemId: Scalars['Int']['input'];
};


export type QueryGetSiteDefaultsArgs = {
  siteId: Scalars['Int']['input'];
};


export type QueryGetSiteMarketLocaleMatrixArgs = {
  siteId: Scalars['Int']['input'];
};


export type QueryListContentItemsArgs = {
  siteId: Scalars['Int']['input'];
};


export type QueryListContentTypesArgs = {
  siteId: Scalars['Int']['input'];
};


export type QueryListLocalesArgs = {
  siteId: Scalars['Int']['input'];
};


export type QueryListMarketsArgs = {
  siteId: Scalars['Int']['input'];
};


export type QueryListRoutesArgs = {
  localeCode?: InputMaybe<Scalars['String']['input']>;
  marketCode?: InputMaybe<Scalars['String']['input']>;
  siteId: Scalars['Int']['input'];
};


export type QueryListTemplatesArgs = {
  siteId: Scalars['Int']['input'];
};


export type QueryListVersionsArgs = {
  contentItemId: Scalars['Int']['input'];
};


export type QueryResolveMarketLocaleArgs = {
  localeCode: Scalars['String']['input'];
  marketCode: Scalars['String']['input'];
  siteId: Scalars['Int']['input'];
};


export type QueryResolveRouteArgs = {
  localeCode: Scalars['String']['input'];
  marketCode: Scalars['String']['input'];
  preview?: InputMaybe<Scalars['Boolean']['input']>;
  previewToken?: InputMaybe<Scalars['String']['input']>;
  siteId: Scalars['Int']['input'];
  slug: Scalars['String']['input'];
};


export type QueryValidateMarketLocaleArgs = {
  localeCode: Scalars['String']['input'];
  marketCode: Scalars['String']['input'];
  siteId: Scalars['Int']['input'];
};

export type ResolvedMarketLocale = {
  __typename?: 'ResolvedMarketLocale';
  localeCode?: Maybe<Scalars['String']['output']>;
  marketCode?: Maybe<Scalars['String']['output']>;
  resolution?: Maybe<Scalars['String']['output']>;
  siteId?: Maybe<Scalars['Int']['output']>;
};

export type ResolvedRoute = {
  __typename?: 'ResolvedRoute';
  contentItem?: Maybe<ContentItem>;
  contentType?: Maybe<ContentType>;
  mode?: Maybe<Scalars['String']['output']>;
  route?: Maybe<ContentRoute>;
  version?: Maybe<ContentVersion>;
};

export type Site = {
  __typename?: 'Site';
  active?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type SiteDefaults = {
  __typename?: 'SiteDefaults';
  defaultLocaleCode?: Maybe<Scalars['String']['output']>;
  defaultMarketCode?: Maybe<Scalars['String']['output']>;
  marketDefaultLocales?: Maybe<Array<MarketDefaultLocale>>;
  siteId?: Maybe<Scalars['Int']['output']>;
};

export type SiteLocaleInput = {
  active: Scalars['Boolean']['input'];
  code: Scalars['String']['input'];
};

export type SiteMarketInput = {
  active: Scalars['Boolean']['input'];
  code: Scalars['String']['input'];
};

export type SiteMarketLocaleCombination = {
  __typename?: 'SiteMarketLocaleCombination';
  active?: Maybe<Scalars['Boolean']['output']>;
  isDefaultForMarket?: Maybe<Scalars['Boolean']['output']>;
  localeCode?: Maybe<Scalars['String']['output']>;
  marketCode?: Maybe<Scalars['String']['output']>;
  siteId?: Maybe<Scalars['Int']['output']>;
};

export type SiteMarketLocaleInput = {
  active: Scalars['Boolean']['input'];
  isDefaultForMarket?: InputMaybe<Scalars['Boolean']['input']>;
  localeCode: Scalars['String']['input'];
  marketCode: Scalars['String']['input'];
};

export type SiteMarketLocaleMatrix = {
  __typename?: 'SiteMarketLocaleMatrix';
  combinations?: Maybe<Array<SiteMarketLocaleCombination>>;
  defaults?: Maybe<SiteDefaults>;
  locales?: Maybe<Array<Locale>>;
  markets?: Maybe<Array<Market>>;
  siteId?: Maybe<Scalars['Int']['output']>;
};

export type Template = {
  __typename?: 'Template';
  componentsJson?: Maybe<Scalars['String']['output']>;
  compositionJson?: Maybe<Scalars['String']['output']>;
  constraintsJson?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  siteId?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type UpdateDraftPatchInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  componentsJson?: InputMaybe<Scalars['String']['input']>;
  compositionJson?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  fieldsJson?: InputMaybe<Scalars['String']['input']>;
  metadataJson?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  createdAt?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type VersionDiff = {
  __typename?: 'VersionDiff';
  changedPaths?: Maybe<Array<Scalars['String']['output']>>;
  leftVersionId?: Maybe<Scalars['Int']['output']>;
  rightVersionId?: Maybe<Scalars['Int']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
};

export type ListContentTypesQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type ListContentTypesQuery = { __typename?: 'Query', listContentTypes?: Array<{ __typename?: 'ContentType', id?: number | null, siteId?: number | null, name?: string | null, description?: string | null, fieldsJson?: string | null, createdAt?: string | null, createdBy?: string | null, updatedAt?: string | null, updatedBy?: string | null }> | null };

export type ListContentItemsQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type ListContentItemsQuery = { __typename?: 'Query', listContentItems?: Array<{ __typename?: 'ContentItem', id?: number | null, siteId?: number | null, contentTypeId?: number | null, archived?: boolean | null, createdAt?: string | null, createdBy?: string | null, currentDraftVersionId?: number | null, currentPublishedVersionId?: number | null }> | null };

export type GetContentItemDetailQueryVariables = Exact<{
  contentItemId: Scalars['Int']['input'];
}>;


export type GetContentItemDetailQuery = { __typename?: 'Query', getContentItemDetail?: { __typename?: 'ContentItemDetail', item?: { __typename?: 'ContentItem', id?: number | null, siteId?: number | null, contentTypeId?: number | null, archived?: boolean | null, currentDraftVersionId?: number | null, currentPublishedVersionId?: number | null, createdAt?: string | null, createdBy?: string | null } | null, contentType?: { __typename?: 'ContentType', id?: number | null, name?: string | null, fieldsJson?: string | null } | null, currentDraftVersion?: { __typename?: 'ContentVersion', id?: number | null, versionNumber?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null } | null, currentPublishedVersion?: { __typename?: 'ContentVersion', id?: number | null, versionNumber?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null } | null } | null };

export type ListVersionsQueryVariables = Exact<{
  contentItemId: Scalars['Int']['input'];
}>;


export type ListVersionsQuery = { __typename?: 'Query', listVersions?: Array<{ __typename?: 'ContentVersion', id?: number | null, contentItemId?: number | null, versionNumber?: number | null, state?: string | null, sourceVersionId?: number | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null, createdAt?: string | null, createdBy?: string | null }> | null };

export type DiffVersionsQueryVariables = Exact<{
  leftVersionId: Scalars['Int']['input'];
  rightVersionId: Scalars['Int']['input'];
}>;


export type DiffVersionsQuery = { __typename?: 'Query', diffVersions?: { __typename?: 'VersionDiff', summary?: string | null, changedPaths?: Array<string> | null, leftVersionId?: number | null, rightVersionId?: number | null } | null };

export type ListTemplatesQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type ListTemplatesQuery = { __typename?: 'Query', listTemplates?: Array<{ __typename?: 'Template', id?: number | null, siteId?: number | null, name?: string | null, compositionJson?: string | null, componentsJson?: string | null, constraintsJson?: string | null, updatedAt?: string | null }> | null };

export type ListRoutesQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
  marketCode?: InputMaybe<Scalars['String']['input']>;
  localeCode?: InputMaybe<Scalars['String']['input']>;
}>;


export type ListRoutesQuery = { __typename?: 'Query', listRoutes?: Array<{ __typename?: 'ContentRoute', id?: number | null, siteId?: number | null, contentItemId?: number | null, marketCode?: string | null, localeCode?: string | null, slug?: string | null, isCanonical?: boolean | null, createdAt?: string | null }> | null };

export type ResolveRouteQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
  marketCode: Scalars['String']['input'];
  localeCode: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  previewToken?: InputMaybe<Scalars['String']['input']>;
  preview?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type ResolveRouteQuery = { __typename?: 'Query', resolveRoute?: { __typename?: 'ResolvedRoute', mode?: string | null, route?: { __typename?: 'ContentRoute', id?: number | null, slug?: string | null, marketCode?: string | null, localeCode?: string | null, contentItemId?: number | null, isCanonical?: boolean | null } | null, contentItem?: { __typename?: 'ContentItem', id?: number | null, contentTypeId?: number | null, currentDraftVersionId?: number | null, currentPublishedVersionId?: number | null } | null, contentType?: { __typename?: 'ContentType', id?: number | null, name?: string | null, fieldsJson?: string | null } | null, version?: { __typename?: 'ContentVersion', id?: number | null, versionNumber?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null } | null } | null };

export type CreateContentTypeMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  fieldsJson: Scalars['String']['input'];
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateContentTypeMutation = { __typename?: 'Mutation', createContentType?: { __typename?: 'ContentType', id?: number | null, siteId?: number | null, name?: string | null, description?: string | null, fieldsJson?: string | null } | null };

export type UpdateContentTypeMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  fieldsJson: Scalars['String']['input'];
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateContentTypeMutation = { __typename?: 'Mutation', updateContentType?: { __typename?: 'ContentType', id?: number | null, siteId?: number | null, name?: string | null, description?: string | null, fieldsJson?: string | null } | null };

export type DeleteContentTypeMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteContentTypeMutation = { __typename?: 'Mutation', deleteContentType?: boolean | null };

export type CreateContentItemMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  contentTypeId: Scalars['Int']['input'];
  initialFieldsJson?: InputMaybe<Scalars['String']['input']>;
  initialCompositionJson?: InputMaybe<Scalars['String']['input']>;
  initialComponentsJson?: InputMaybe<Scalars['String']['input']>;
  metadataJson?: InputMaybe<Scalars['String']['input']>;
  comment?: InputMaybe<Scalars['String']['input']>;
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateContentItemMutation = { __typename?: 'Mutation', createContentItem?: { __typename?: 'ContentItem', id?: number | null, siteId?: number | null, contentTypeId?: number | null, archived?: boolean | null, currentDraftVersionId?: number | null, currentPublishedVersionId?: number | null } | null };

export type ArchiveContentItemMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  archived: Scalars['Boolean']['input'];
}>;


export type ArchiveContentItemMutation = { __typename?: 'Mutation', archiveContentItem?: { __typename?: 'ContentItem', id?: number | null, archived?: boolean | null } | null };

export type CreateDraftVersionMutationVariables = Exact<{
  contentItemId: Scalars['Int']['input'];
  fromVersionId?: InputMaybe<Scalars['Int']['input']>;
  comment?: InputMaybe<Scalars['String']['input']>;
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateDraftVersionMutation = { __typename?: 'Mutation', createDraftVersion?: { __typename?: 'ContentVersion', id?: number | null, contentItemId?: number | null, versionNumber?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null } | null };

export type UpdateDraftVersionMutationVariables = Exact<{
  versionId: Scalars['Int']['input'];
  patch: UpdateDraftPatchInput;
  expectedVersionNumber: Scalars['Int']['input'];
}>;


export type UpdateDraftVersionMutation = { __typename?: 'Mutation', updateDraftVersion?: { __typename?: 'ContentVersion', id?: number | null, contentItemId?: number | null, versionNumber?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null } | null };

export type PublishVersionMutationVariables = Exact<{
  versionId: Scalars['Int']['input'];
  expectedVersionNumber: Scalars['Int']['input'];
  comment?: InputMaybe<Scalars['String']['input']>;
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type PublishVersionMutation = { __typename?: 'Mutation', publishVersion?: { __typename?: 'ContentVersion', id?: number | null, contentItemId?: number | null, versionNumber?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null } | null };

export type RollbackToVersionMutationVariables = Exact<{
  contentItemId: Scalars['Int']['input'];
  versionId: Scalars['Int']['input'];
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type RollbackToVersionMutation = { __typename?: 'Mutation', rollbackToVersion?: { __typename?: 'ContentVersion', id?: number | null, contentItemId?: number | null, versionNumber?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null } | null };

export type CreateTemplateMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  compositionJson: Scalars['String']['input'];
  componentsJson: Scalars['String']['input'];
  constraintsJson: Scalars['String']['input'];
}>;


export type CreateTemplateMutation = { __typename?: 'Mutation', createTemplate?: { __typename?: 'Template', id?: number | null, siteId?: number | null, name?: string | null, compositionJson?: string | null, componentsJson?: string | null, constraintsJson?: string | null, updatedAt?: string | null } | null };

export type UpdateTemplateMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  compositionJson: Scalars['String']['input'];
  componentsJson: Scalars['String']['input'];
  constraintsJson: Scalars['String']['input'];
}>;


export type UpdateTemplateMutation = { __typename?: 'Mutation', updateTemplate?: { __typename?: 'Template', id?: number | null, siteId?: number | null, name?: string | null, compositionJson?: string | null, componentsJson?: string | null, constraintsJson?: string | null, updatedAt?: string | null } | null };

export type DeleteTemplateMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteTemplateMutation = { __typename?: 'Mutation', deleteTemplate?: boolean | null };

export type ReconcileTemplateMutationVariables = Exact<{
  templateId: Scalars['Int']['input'];
}>;


export type ReconcileTemplateMutation = { __typename?: 'Mutation', reconcileTemplate?: { __typename?: 'VersionDiff', summary?: string | null, changedPaths?: Array<string> | null, leftVersionId?: number | null, rightVersionId?: number | null } | null };

export type UpsertRouteMutationVariables = Exact<{
  id?: InputMaybe<Scalars['Int']['input']>;
  siteId: Scalars['Int']['input'];
  contentItemId: Scalars['Int']['input'];
  marketCode: Scalars['String']['input'];
  localeCode: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  isCanonical: Scalars['Boolean']['input'];
}>;


export type UpsertRouteMutation = { __typename?: 'Mutation', upsertRoute?: { __typename?: 'ContentRoute', id?: number | null, siteId?: number | null, contentItemId?: number | null, marketCode?: string | null, localeCode?: string | null, slug?: string | null, isCanonical?: boolean | null, createdAt?: string | null } | null };

export type DeleteRouteMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteRouteMutation = { __typename?: 'Mutation', deleteRoute?: boolean | null };

export type IssuePreviewTokenMutationVariables = Exact<{
  contentItemId: Scalars['Int']['input'];
}>;


export type IssuePreviewTokenMutation = { __typename?: 'Mutation', issuePreviewToken?: { __typename?: 'PreviewTokenPayload', token?: string | null, contentItemId?: number | null } | null };

export type LoginMutationVariables = Exact<{
  username: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login?: { __typename?: 'AuthPayload', token?: string | null, user?: { __typename?: 'User', id?: number | null, username?: string | null, displayName?: string | null, createdAt?: string | null } | null } | null };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id?: number | null, username?: string | null, displayName?: string | null, createdAt?: string | null } | null };

export type UpsertMarketMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  code: Scalars['String']['input'];
  name: Scalars['String']['input'];
  currency?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  active: Scalars['Boolean']['input'];
  isDefault: Scalars['Boolean']['input'];
}>;


export type UpsertMarketMutation = { __typename?: 'Mutation', upsertMarket?: Array<{ __typename?: 'Market', code?: string | null, name?: string | null, currency?: string | null, timezone?: string | null, active?: boolean | null, isDefault?: boolean | null }> | null };

export type UpsertLocaleMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  code: Scalars['String']['input'];
  name: Scalars['String']['input'];
  active: Scalars['Boolean']['input'];
  fallbackLocaleCode?: InputMaybe<Scalars['String']['input']>;
  isDefault: Scalars['Boolean']['input'];
}>;


export type UpsertLocaleMutation = { __typename?: 'Mutation', upsertLocale?: Array<{ __typename?: 'Locale', code?: string | null, name?: string | null, active?: boolean | null, fallbackLocaleCode?: string | null, isDefault?: boolean | null }> | null };

export type SetSiteMarketsMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  markets: Array<SiteMarketInput> | SiteMarketInput;
  defaultMarketCode: Scalars['String']['input'];
}>;


export type SetSiteMarketsMutation = { __typename?: 'Mutation', setSiteMarkets?: Array<{ __typename?: 'Market', code?: string | null, name?: string | null, currency?: string | null, timezone?: string | null, active?: boolean | null, isDefault?: boolean | null }> | null };

export type SetSiteLocalesMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  locales: Array<SiteLocaleInput> | SiteLocaleInput;
  defaultLocaleCode: Scalars['String']['input'];
}>;


export type SetSiteLocalesMutation = { __typename?: 'Mutation', setSiteLocales?: Array<{ __typename?: 'Locale', code?: string | null, name?: string | null, active?: boolean | null, fallbackLocaleCode?: string | null, isDefault?: boolean | null }> | null };

export type SetSiteMarketLocaleMatrixMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  combinations: Array<SiteMarketLocaleInput> | SiteMarketLocaleInput;
  defaults?: InputMaybe<MatrixDefaultsInput>;
}>;


export type SetSiteMarketLocaleMatrixMutation = { __typename?: 'Mutation', setSiteMarketLocaleMatrix?: { __typename?: 'SiteMarketLocaleMatrix', siteId?: number | null, combinations?: Array<{ __typename?: 'SiteMarketLocaleCombination', marketCode?: string | null, localeCode?: string | null, active?: boolean | null, isDefaultForMarket?: boolean | null }> | null, defaults?: { __typename?: 'SiteDefaults', defaultMarketCode?: string | null, defaultLocaleCode?: string | null, marketDefaultLocales?: Array<{ __typename?: 'MarketDefaultLocale', marketCode?: string | null, localeCode?: string | null }> | null } | null } | null };

export type ListSitesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListSitesQuery = { __typename?: 'Query', listSites?: Array<{ __typename?: 'Site', id?: number | null, name?: string | null, active?: boolean | null }> | null };

export type GetSiteDefaultsQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type GetSiteDefaultsQuery = { __typename?: 'Query', getSiteDefaults?: { __typename?: 'SiteDefaults', siteId?: number | null, defaultMarketCode?: string | null, defaultLocaleCode?: string | null, marketDefaultLocales?: Array<{ __typename?: 'MarketDefaultLocale', marketCode?: string | null, localeCode?: string | null }> | null } | null };

export type GetSiteMarketLocaleMatrixQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type GetSiteMarketLocaleMatrixQuery = { __typename?: 'Query', getSiteMarketLocaleMatrix?: { __typename?: 'SiteMarketLocaleMatrix', siteId?: number | null, markets?: Array<{ __typename?: 'Market', code?: string | null, name?: string | null, currency?: string | null, timezone?: string | null, active?: boolean | null, isDefault?: boolean | null }> | null, locales?: Array<{ __typename?: 'Locale', code?: string | null, name?: string | null, active?: boolean | null, fallbackLocaleCode?: string | null, isDefault?: boolean | null }> | null, combinations?: Array<{ __typename?: 'SiteMarketLocaleCombination', siteId?: number | null, marketCode?: string | null, localeCode?: string | null, active?: boolean | null, isDefaultForMarket?: boolean | null }> | null, defaults?: { __typename?: 'SiteDefaults', siteId?: number | null, defaultMarketCode?: string | null, defaultLocaleCode?: string | null, marketDefaultLocales?: Array<{ __typename?: 'MarketDefaultLocale', marketCode?: string | null, localeCode?: string | null }> | null } | null } | null };

export type ListMarketsQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type ListMarketsQuery = { __typename?: 'Query', listMarkets?: Array<{ __typename?: 'Market', code?: string | null, name?: string | null, currency?: string | null, timezone?: string | null, active?: boolean | null, isDefault?: boolean | null }> | null };

export type ListLocalesQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type ListLocalesQuery = { __typename?: 'Query', listLocales?: Array<{ __typename?: 'Locale', code?: string | null, name?: string | null, active?: boolean | null, fallbackLocaleCode?: string | null, isDefault?: boolean | null }> | null };

export type ValidateMarketLocaleQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
  marketCode: Scalars['String']['input'];
  localeCode: Scalars['String']['input'];
}>;


export type ValidateMarketLocaleQuery = { __typename?: 'Query', validateMarketLocale?: boolean | null };

export type ResolveMarketLocaleQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
  marketCode: Scalars['String']['input'];
  localeCode: Scalars['String']['input'];
}>;


export type ResolveMarketLocaleQuery = { __typename?: 'Query', resolveMarketLocale?: { __typename?: 'ResolvedMarketLocale', siteId?: number | null, marketCode?: string | null, localeCode?: string | null, resolution?: string | null } | null };


export const ListContentTypesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListContentTypes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listContentTypes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"}}]}}]}}]} as unknown as DocumentNode<ListContentTypesQuery, ListContentTypesQueryVariables>;
export const ListContentItemsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListContentItems"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listContentItems"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentTypeId"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"currentDraftVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"currentPublishedVersionId"}}]}}]}}]} as unknown as DocumentNode<ListContentItemsQuery, ListContentItemsQueryVariables>;
export const GetContentItemDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetContentItemDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getContentItemDetail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentTypeId"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"currentDraftVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"currentPublishedVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contentType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentDraftVersion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentPublishedVersion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]}}]} as unknown as DocumentNode<GetContentItemDetailQuery, GetContentItemDetailQueryVariables>;
export const ListVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"sourceVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}}]}}]}}]} as unknown as DocumentNode<ListVersionsQuery, ListVersionsQueryVariables>;
export const DiffVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DiffVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"leftVersionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rightVersionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"diffVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"leftVersionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"leftVersionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"rightVersionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rightVersionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"changedPaths"}},{"kind":"Field","name":{"kind":"Name","value":"leftVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"rightVersionId"}}]}}]}}]} as unknown as DocumentNode<DiffVersionsQuery, DiffVersionsQueryVariables>;
export const ListTemplatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListTemplates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listTemplates"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"constraintsJson"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ListTemplatesQuery, ListTemplatesQueryVariables>;
export const ListRoutesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListRoutes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listRoutes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"isCanonical"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<ListRoutesQuery, ListRoutesQueryVariables>;
export const ResolveRouteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResolveRoute"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"previewToken"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"preview"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resolveRoute"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}},{"kind":"Argument","name":{"kind":"Name","value":"previewToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"previewToken"}}},{"kind":"Argument","name":{"kind":"Name","value":"preview"},"value":{"kind":"Variable","name":{"kind":"Name","value":"preview"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"route"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"isCanonical"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contentItem"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentTypeId"}},{"kind":"Field","name":{"kind":"Name","value":"currentDraftVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"currentPublishedVersionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contentType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}}]}},{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]}}]} as unknown as DocumentNode<ResolveRouteQuery, ResolveRouteQueryVariables>;
export const CreateContentTypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateContentType"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fieldsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContentType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"Argument","name":{"kind":"Name","value":"fieldsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fieldsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}}]}}]}}]} as unknown as DocumentNode<CreateContentTypeMutation, CreateContentTypeMutationVariables>;
export const UpdateContentTypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateContentType"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fieldsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContentType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"Argument","name":{"kind":"Name","value":"fieldsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fieldsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}}]}}]}}]} as unknown as DocumentNode<UpdateContentTypeMutation, UpdateContentTypeMutationVariables>;
export const DeleteContentTypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteContentType"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteContentType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteContentTypeMutation, DeleteContentTypeMutationVariables>;
export const CreateContentItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateContentItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentTypeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"initialFieldsJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"initialCompositionJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"initialComponentsJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"metadataJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"comment"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContentItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"contentTypeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentTypeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"initialFieldsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"initialFieldsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"initialCompositionJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"initialCompositionJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"initialComponentsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"initialComponentsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"metadataJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"metadataJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"comment"},"value":{"kind":"Variable","name":{"kind":"Name","value":"comment"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentTypeId"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"currentDraftVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"currentPublishedVersionId"}}]}}]}}]} as unknown as DocumentNode<CreateContentItemMutation, CreateContentItemMutationVariables>;
export const ArchiveContentItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveContentItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"archived"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveContentItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"archived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"archived"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}}]}}]}}]} as unknown as DocumentNode<ArchiveContentItemMutation, ArchiveContentItemMutationVariables>;
export const CreateDraftVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDraftVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromVersionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"comment"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDraftVersion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromVersionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromVersionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"comment"},"value":{"kind":"Variable","name":{"kind":"Name","value":"comment"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]} as unknown as DocumentNode<CreateDraftVersionMutation, CreateDraftVersionMutationVariables>;
export const UpdateDraftVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDraftVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"patch"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDraftPatchInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersionNumber"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDraftVersion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"versionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"patch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"patch"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersionNumber"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersionNumber"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]} as unknown as DocumentNode<UpdateDraftVersionMutation, UpdateDraftVersionMutationVariables>;
export const PublishVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PublishVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersionNumber"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"comment"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishVersion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"versionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersionNumber"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersionNumber"}}},{"kind":"Argument","name":{"kind":"Name","value":"comment"},"value":{"kind":"Variable","name":{"kind":"Name","value":"comment"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]} as unknown as DocumentNode<PublishVersionMutation, PublishVersionMutationVariables>;
export const RollbackToVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RollbackToVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rollbackToVersion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]} as unknown as DocumentNode<RollbackToVersionMutation, RollbackToVersionMutationVariables>;
export const CreateTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"compositionJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"componentsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"constraintsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"compositionJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"compositionJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"componentsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"componentsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"constraintsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"constraintsJson"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"constraintsJson"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateTemplateMutation, CreateTemplateMutationVariables>;
export const UpdateTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"compositionJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"componentsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"constraintsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"compositionJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"compositionJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"componentsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"componentsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"constraintsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"constraintsJson"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"constraintsJson"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateTemplateMutation, UpdateTemplateMutationVariables>;
export const DeleteTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTemplateMutation, DeleteTemplateMutationVariables>;
export const ReconcileTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReconcileTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reconcileTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"changedPaths"}},{"kind":"Field","name":{"kind":"Name","value":"leftVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"rightVersionId"}}]}}]}}]} as unknown as DocumentNode<ReconcileTemplateMutation, ReconcileTemplateMutationVariables>;
export const UpsertRouteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertRoute"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isCanonical"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertRoute"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}},{"kind":"Argument","name":{"kind":"Name","value":"isCanonical"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isCanonical"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"isCanonical"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<UpsertRouteMutation, UpsertRouteMutationVariables>;
export const DeleteRouteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRoute"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRoute"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteRouteMutation, DeleteRouteMutationVariables>;
export const IssuePreviewTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"IssuePreviewToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"issuePreviewToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}}]}}]}}]} as unknown as DocumentNode<IssuePreviewTokenMutation, IssuePreviewTokenMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"username"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"username"},"value":{"kind":"Variable","name":{"kind":"Name","value":"username"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const UpsertMarketDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertMarket"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currency"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timezone"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"active"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isDefault"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertMarket"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"currency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currency"}}},{"kind":"Argument","name":{"kind":"Name","value":"timezone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timezone"}}},{"kind":"Argument","name":{"kind":"Name","value":"active"},"value":{"kind":"Variable","name":{"kind":"Name","value":"active"}}},{"kind":"Argument","name":{"kind":"Name","value":"isDefault"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isDefault"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<UpsertMarketMutation, UpsertMarketMutationVariables>;
export const UpsertLocaleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertLocale"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"active"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fallbackLocaleCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isDefault"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertLocale"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"active"},"value":{"kind":"Variable","name":{"kind":"Name","value":"active"}}},{"kind":"Argument","name":{"kind":"Name","value":"fallbackLocaleCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fallbackLocaleCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"isDefault"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isDefault"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"fallbackLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<UpsertLocaleMutation, UpsertLocaleMutationVariables>;
export const SetSiteMarketsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetSiteMarkets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"markets"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SiteMarketInput"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"defaultMarketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setSiteMarkets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"markets"},"value":{"kind":"Variable","name":{"kind":"Name","value":"markets"}}},{"kind":"Argument","name":{"kind":"Name","value":"defaultMarketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"defaultMarketCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<SetSiteMarketsMutation, SetSiteMarketsMutationVariables>;
export const SetSiteLocalesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetSiteLocales"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locales"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SiteLocaleInput"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"defaultLocaleCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setSiteLocales"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"locales"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locales"}}},{"kind":"Argument","name":{"kind":"Name","value":"defaultLocaleCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"defaultLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"fallbackLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<SetSiteLocalesMutation, SetSiteLocalesMutationVariables>;
export const SetSiteMarketLocaleMatrixDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetSiteMarketLocaleMatrix"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"combinations"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SiteMarketLocaleInput"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"defaults"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"MatrixDefaultsInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setSiteMarketLocaleMatrix"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"combinations"},"value":{"kind":"Variable","name":{"kind":"Name","value":"combinations"}}},{"kind":"Argument","name":{"kind":"Name","value":"defaults"},"value":{"kind":"Variable","name":{"kind":"Name","value":"defaults"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"combinations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"isDefaultForMarket"}}]}},{"kind":"Field","name":{"kind":"Name","value":"defaults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"defaultMarketCode"}},{"kind":"Field","name":{"kind":"Name","value":"defaultLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"marketDefaultLocales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SetSiteMarketLocaleMatrixMutation, SetSiteMarketLocaleMatrixMutationVariables>;
export const ListSitesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListSites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listSites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<ListSitesQuery, ListSitesQueryVariables>;
export const GetSiteDefaultsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSiteDefaults"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSiteDefaults"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"defaultMarketCode"}},{"kind":"Field","name":{"kind":"Name","value":"defaultLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"marketDefaultLocales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}}]}}]}}]}}]} as unknown as DocumentNode<GetSiteDefaultsQuery, GetSiteDefaultsQueryVariables>;
export const GetSiteMarketLocaleMatrixDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSiteMarketLocaleMatrix"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSiteMarketLocaleMatrix"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"markets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}},{"kind":"Field","name":{"kind":"Name","value":"locales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"fallbackLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}},{"kind":"Field","name":{"kind":"Name","value":"combinations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"isDefaultForMarket"}}]}},{"kind":"Field","name":{"kind":"Name","value":"defaults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"defaultMarketCode"}},{"kind":"Field","name":{"kind":"Name","value":"defaultLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"marketDefaultLocales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetSiteMarketLocaleMatrixQuery, GetSiteMarketLocaleMatrixQueryVariables>;
export const ListMarketsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListMarkets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listMarkets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<ListMarketsQuery, ListMarketsQueryVariables>;
export const ListLocalesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListLocales"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listLocales"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"fallbackLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<ListLocalesQuery, ListLocalesQueryVariables>;
export const ValidateMarketLocaleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ValidateMarketLocale"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"validateMarketLocale"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}}]}]}}]} as unknown as DocumentNode<ValidateMarketLocaleQuery, ValidateMarketLocaleQueryVariables>;
export const ResolveMarketLocaleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResolveMarketLocale"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resolveMarketLocale"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"resolution"}}]}}]}}]} as unknown as DocumentNode<ResolveMarketLocaleQuery, ResolveMarketLocaleQueryVariables>;