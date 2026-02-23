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

export type LoginMutationVariables = Exact<{
  username: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login?: { __typename?: 'AuthPayload', token?: string | null, user?: { __typename?: 'User', id?: number | null, username?: string | null, displayName?: string | null, createdAt?: string | null } | null } | null };

export type WebValidateMarketLocaleQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
  marketCode: Scalars['String']['input'];
  localeCode: Scalars['String']['input'];
}>;


export type WebValidateMarketLocaleQuery = { __typename?: 'Query', validateMarketLocale?: boolean | null };

export type WebSiteDefaultsQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type WebSiteDefaultsQuery = { __typename?: 'Query', getSiteDefaults?: { __typename?: 'SiteDefaults', defaultMarketCode?: string | null, defaultLocaleCode?: string | null } | null };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id?: number | null, username?: string | null, displayName?: string | null, createdAt?: string | null } | null };

export type WebResolveRouteQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
  marketCode: Scalars['String']['input'];
  localeCode: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  previewToken?: InputMaybe<Scalars['String']['input']>;
  preview?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type WebResolveRouteQuery = { __typename?: 'Query', resolveRoute?: { __typename?: 'ResolvedRoute', mode?: string | null, route?: { __typename?: 'ContentRoute', id?: number | null, slug?: string | null } | null, contentType?: { __typename?: 'ContentType', id?: number | null, name?: string | null, fieldsJson?: string | null } | null, version?: { __typename?: 'ContentVersion', id?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null } | null } | null };


export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"username"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"username"},"value":{"kind":"Variable","name":{"kind":"Name","value":"username"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const WebValidateMarketLocaleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebValidateMarketLocale"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"validateMarketLocale"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}}]}]}}]} as unknown as DocumentNode<WebValidateMarketLocaleQuery, WebValidateMarketLocaleQueryVariables>;
export const WebSiteDefaultsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebSiteDefaults"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSiteDefaults"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"defaultMarketCode"}},{"kind":"Field","name":{"kind":"Name","value":"defaultLocaleCode"}}]}}]}}]} as unknown as DocumentNode<WebSiteDefaultsQuery, WebSiteDefaultsQueryVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const WebResolveRouteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebResolveRoute"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"previewToken"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"preview"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resolveRoute"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}},{"kind":"Argument","name":{"kind":"Name","value":"previewToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"previewToken"}}},{"kind":"Argument","name":{"kind":"Name","value":"preview"},"value":{"kind":"Variable","name":{"kind":"Name","value":"preview"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"route"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contentType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}}]}},{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}}]}}]}}]}}]} as unknown as DocumentNode<WebResolveRouteQuery, WebResolveRouteQueryVariables>;