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

export type AiContentResult = {
  __typename?: 'AiContentResult';
  contentItemId?: Maybe<Scalars['Int']['output']>;
  draftVersionId?: Maybe<Scalars['Int']['output']>;
};

export type AiVariantsResult = {
  __typename?: 'AiVariantsResult';
  createdKeys?: Maybe<Array<Scalars['String']['output']>>;
  variantSetId?: Maybe<Scalars['Int']['output']>;
};

export type Asset = {
  __typename?: 'Asset';
  altText?: Maybe<Scalars['String']['output']>;
  bytes?: Maybe<Scalars['Int']['output']>;
  checksum?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  filename?: Maybe<Scalars['String']['output']>;
  folderId?: Maybe<Scalars['Int']['output']>;
  height?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  mimeType?: Maybe<Scalars['String']['output']>;
  originalName?: Maybe<Scalars['String']['output']>;
  siteId?: Maybe<Scalars['Int']['output']>;
  storagePath?: Maybe<Scalars['String']['output']>;
  tagsJson?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  width?: Maybe<Scalars['Int']['output']>;
};

export type AssetFolder = {
  __typename?: 'AssetFolder';
  createdAt?: Maybe<Scalars['String']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  parentId?: Maybe<Scalars['Int']['output']>;
  path?: Maybe<Scalars['String']['output']>;
  siteId?: Maybe<Scalars['Int']['output']>;
};

export type AssetList = {
  __typename?: 'AssetList';
  items?: Maybe<Array<Asset>>;
  total?: Maybe<Scalars['Int']['output']>;
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  token?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
};

export type Connector = {
  __typename?: 'Connector';
  configJson?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  domain?: Maybe<Scalars['String']['output']>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  isDefault?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
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

export type DbAdminColumn = {
  __typename?: 'DbAdminColumn';
  defaultValue?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  nullable?: Maybe<Scalars['Boolean']['output']>;
  position?: Maybe<Scalars['Int']['output']>;
  primaryKey?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type DbAdminFilterInput = {
  column: Scalars['String']['input'];
  op: Scalars['String']['input'];
  value?: InputMaybe<Scalars['String']['input']>;
  values?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type DbAdminIndex = {
  __typename?: 'DbAdminIndex';
  columns?: Maybe<Array<Scalars['String']['output']>>;
  name?: Maybe<Scalars['String']['output']>;
  unique?: Maybe<Scalars['Boolean']['output']>;
};

export type DbAdminListResult = {
  __typename?: 'DbAdminListResult';
  rowsJson?: Maybe<Scalars['String']['output']>;
  total?: Maybe<Scalars['Int']['output']>;
};

export type DbAdminMutationResult = {
  __typename?: 'DbAdminMutationResult';
  affected?: Maybe<Scalars['Int']['output']>;
  ok?: Maybe<Scalars['Boolean']['output']>;
};

export type DbAdminPagingInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type DbAdminSortInput = {
  column?: InputMaybe<Scalars['String']['input']>;
  direction?: InputMaybe<Scalars['String']['input']>;
};

export type DbAdminSqlResult = {
  __typename?: 'DbAdminSqlResult';
  columns?: Maybe<Array<Scalars['String']['output']>>;
  executedSql?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  readOnly?: Maybe<Scalars['Boolean']['output']>;
  rowCount?: Maybe<Scalars['Int']['output']>;
  rowsJson?: Maybe<Scalars['String']['output']>;
};

export type DbAdminTable = {
  __typename?: 'DbAdminTable';
  columns?: Maybe<Array<DbAdminColumn>>;
  indexes?: Maybe<Array<DbAdminIndex>>;
  primaryKey?: Maybe<Array<Scalars['String']['output']>>;
  table?: Maybe<Scalars['String']['output']>;
};

export type DbAdminTableListItem = {
  __typename?: 'DbAdminTableListItem';
  name?: Maybe<Scalars['String']['output']>;
  rowCount?: Maybe<Scalars['Int']['output']>;
  schema?: Maybe<Scalars['String']['output']>;
};

export type Form = {
  __typename?: 'Form';
  active?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  siteId?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type FormEvaluation = {
  __typename?: 'FormEvaluation';
  errorsJson?: Maybe<Scalars['String']['output']>;
  evaluatedFieldsJson?: Maybe<Scalars['String']['output']>;
  formId?: Maybe<Scalars['Int']['output']>;
  valid?: Maybe<Scalars['Boolean']['output']>;
};

export type FormField = {
  __typename?: 'FormField';
  active?: Maybe<Scalars['Boolean']['output']>;
  conditionsJson?: Maybe<Scalars['String']['output']>;
  fieldType?: Maybe<Scalars['String']['output']>;
  formId?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  key?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  position?: Maybe<Scalars['Int']['output']>;
  stepId?: Maybe<Scalars['Int']['output']>;
  uiConfigJson?: Maybe<Scalars['String']['output']>;
  validationsJson?: Maybe<Scalars['String']['output']>;
};

export type FormStep = {
  __typename?: 'FormStep';
  formId?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  position?: Maybe<Scalars['Int']['output']>;
};

export type FormSubmission = {
  __typename?: 'FormSubmission';
  createdAt?: Maybe<Scalars['String']['output']>;
  dataJson?: Maybe<Scalars['String']['output']>;
  formId?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  localeCode?: Maybe<Scalars['String']['output']>;
  marketCode?: Maybe<Scalars['String']['output']>;
  metaJson?: Maybe<Scalars['String']['output']>;
  pageContentItemId?: Maybe<Scalars['Int']['output']>;
  pageRouteSlug?: Maybe<Scalars['String']['output']>;
  siteId?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  submittedByUserId?: Maybe<Scalars['String']['output']>;
};

export type FormSubmissionList = {
  __typename?: 'FormSubmissionList';
  rows?: Maybe<Array<FormSubmission>>;
  total?: Maybe<Scalars['Int']['output']>;
};

export type InternalRole = {
  __typename?: 'InternalRole';
  createdAt?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  permissions?: Maybe<Array<Scalars['String']['output']>>;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type InternalUser = {
  __typename?: 'InternalUser';
  active?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  roleIds?: Maybe<Array<Scalars['Int']['output']>>;
  username?: Maybe<Scalars['String']['output']>;
};

export type Locale = {
  __typename?: 'Locale';
  active?: Maybe<Scalars['Boolean']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  fallbackLocaleCode?: Maybe<Scalars['String']['output']>;
  isDefault?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type LocaleCatalogItem = {
  __typename?: 'LocaleCatalogItem';
  code?: Maybe<Scalars['String']['output']>;
  language?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
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
  aiGenerateContent?: Maybe<AiContentResult>;
  aiGenerateContentType?: Maybe<ContentType>;
  aiGenerateVariants?: Maybe<AiVariantsResult>;
  aiTranslateVersion?: Maybe<AiContentResult>;
  approveStep?: Maybe<WorkflowRun>;
  archiveContentItem?: Maybe<ContentItem>;
  createAssetFolder?: Maybe<AssetFolder>;
  createContentItem?: Maybe<ContentItem>;
  createContentType?: Maybe<ContentType>;
  createDraftVersion?: Maybe<ContentVersion>;
  createInternalUser?: Maybe<InternalUser>;
  createTemplate?: Maybe<Template>;
  dbAdminDelete?: Maybe<DbAdminMutationResult>;
  dbAdminInsert?: Maybe<DbAdminMutationResult>;
  dbAdminSql?: Maybe<DbAdminSqlResult>;
  dbAdminUpdate?: Maybe<DbAdminMutationResult>;
  deleteAsset?: Maybe<Scalars['Boolean']['output']>;
  deleteConnector?: Maybe<Scalars['Boolean']['output']>;
  deleteContentType?: Maybe<Scalars['Boolean']['output']>;
  deleteForm?: Maybe<Scalars['Boolean']['output']>;
  deleteFormField?: Maybe<Scalars['Boolean']['output']>;
  deleteFormStep?: Maybe<Scalars['Boolean']['output']>;
  deleteInternalRole?: Maybe<Scalars['Boolean']['output']>;
  deleteRoute?: Maybe<Scalars['Boolean']['output']>;
  deleteTemplate?: Maybe<Scalars['Boolean']['output']>;
  deleteVariant?: Maybe<Scalars['Boolean']['output']>;
  deleteVariantSet?: Maybe<Scalars['Boolean']['output']>;
  deleteWorkflowDefinition?: Maybe<Scalars['Boolean']['output']>;
  issuePreviewToken?: Maybe<PreviewTokenPayload>;
  login?: Maybe<AuthPayload>;
  publishVersion?: Maybe<ContentVersion>;
  reconcileTemplate?: Maybe<VersionDiff>;
  resetInternalUserPassword?: Maybe<Scalars['Boolean']['output']>;
  retryFailed?: Maybe<WorkflowRun>;
  rollbackToVersion?: Maybe<ContentVersion>;
  setDefaultConnector?: Maybe<Connector>;
  setSiteLocales?: Maybe<Array<Locale>>;
  setSiteMarketLocaleMatrix?: Maybe<SiteMarketLocaleMatrix>;
  setSiteMarkets?: Maybe<Array<Market>>;
  setSiteName?: Maybe<Site>;
  setSiteUrlPattern?: Maybe<Site>;
  setUserRoles?: Maybe<Scalars['Boolean']['output']>;
  startWorkflowRun?: Maybe<WorkflowRun>;
  submitForm?: Maybe<FormSubmission>;
  testConnector?: Maybe<Scalars['String']['output']>;
  updateAssetMetadata?: Maybe<Asset>;
  updateContentType?: Maybe<ContentType>;
  updateDraftVersion?: Maybe<ContentVersion>;
  updateInternalUser?: Maybe<InternalUser>;
  updateSubmissionStatus?: Maybe<FormSubmission>;
  updateTemplate?: Maybe<Template>;
  upsertConnector?: Maybe<Connector>;
  upsertForm?: Maybe<Form>;
  upsertFormField?: Maybe<FormField>;
  upsertFormStep?: Maybe<FormStep>;
  upsertInternalRole?: Maybe<InternalRole>;
  upsertLocale?: Maybe<Array<Locale>>;
  upsertMarket?: Maybe<Array<Market>>;
  upsertRoute?: Maybe<ContentRoute>;
  upsertSiteLocaleOverride?: Maybe<Array<Locale>>;
  upsertVariant?: Maybe<Variant>;
  upsertVariantSet?: Maybe<VariantSet>;
  upsertWorkflowDefinition?: Maybe<WorkflowDefinition>;
};


export type MutationAiGenerateContentArgs = {
  by?: InputMaybe<Scalars['String']['input']>;
  contentItemId?: InputMaybe<Scalars['Int']['input']>;
  contentTypeId?: InputMaybe<Scalars['Int']['input']>;
  prompt: Scalars['String']['input'];
  siteId?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationAiGenerateContentTypeArgs = {
  by?: InputMaybe<Scalars['String']['input']>;
  nameHint?: InputMaybe<Scalars['String']['input']>;
  prompt: Scalars['String']['input'];
  siteId: Scalars['Int']['input'];
};


export type MutationAiGenerateVariantsArgs = {
  contentItemId: Scalars['Int']['input'];
  localeCode: Scalars['String']['input'];
  marketCode: Scalars['String']['input'];
  prompt: Scalars['String']['input'];
  siteId: Scalars['Int']['input'];
  targetVersionId: Scalars['Int']['input'];
  variantSetId?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationAiTranslateVersionArgs = {
  by?: InputMaybe<Scalars['String']['input']>;
  targetLocaleCode: Scalars['String']['input'];
  targetMarketCode: Scalars['String']['input'];
  versionId: Scalars['Int']['input'];
};


export type MutationApproveStepArgs = {
  approvedBy?: InputMaybe<Scalars['String']['input']>;
  nodeId: Scalars['String']['input'];
  runId: Scalars['Int']['input'];
};


export type MutationArchiveContentItemArgs = {
  archived: Scalars['Boolean']['input'];
  id: Scalars['Int']['input'];
};


export type MutationCreateAssetFolderArgs = {
  by?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['Int']['input']>;
  siteId: Scalars['Int']['input'];
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


export type MutationCreateInternalUserArgs = {
  active: Scalars['Boolean']['input'];
  displayName: Scalars['String']['input'];
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationCreateTemplateArgs = {
  componentsJson: Scalars['String']['input'];
  compositionJson: Scalars['String']['input'];
  constraintsJson: Scalars['String']['input'];
  name: Scalars['String']['input'];
  siteId: Scalars['Int']['input'];
};


export type MutationDbAdminDeleteArgs = {
  dangerMode?: InputMaybe<Scalars['Boolean']['input']>;
  pkJson: Scalars['String']['input'];
  table: Scalars['String']['input'];
};


export type MutationDbAdminInsertArgs = {
  dangerMode?: InputMaybe<Scalars['Boolean']['input']>;
  rowJson: Scalars['String']['input'];
  table: Scalars['String']['input'];
};


export type MutationDbAdminSqlArgs = {
  allowWrites?: InputMaybe<Scalars['Boolean']['input']>;
  paramsJson?: InputMaybe<Scalars['String']['input']>;
  query: Scalars['String']['input'];
};


export type MutationDbAdminUpdateArgs = {
  dangerMode?: InputMaybe<Scalars['Boolean']['input']>;
  patchJson: Scalars['String']['input'];
  pkJson: Scalars['String']['input'];
  table: Scalars['String']['input'];
};


export type MutationDeleteAssetArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteConnectorArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteContentTypeArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteFormArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteFormFieldArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteFormStepArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteInternalRoleArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteRouteArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteTemplateArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteVariantArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteVariantSetArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteWorkflowDefinitionArgs = {
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


export type MutationResetInternalUserPasswordArgs = {
  password: Scalars['String']['input'];
  userId: Scalars['Int']['input'];
};


export type MutationRetryFailedArgs = {
  runId: Scalars['Int']['input'];
};


export type MutationRollbackToVersionArgs = {
  by?: InputMaybe<Scalars['String']['input']>;
  contentItemId: Scalars['Int']['input'];
  versionId: Scalars['Int']['input'];
};


export type MutationSetDefaultConnectorArgs = {
  domain: Scalars['String']['input'];
  id: Scalars['Int']['input'];
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


export type MutationSetSiteNameArgs = {
  name: Scalars['String']['input'];
  siteId: Scalars['Int']['input'];
};


export type MutationSetSiteUrlPatternArgs = {
  siteId: Scalars['Int']['input'];
  urlPattern: Scalars['String']['input'];
};


export type MutationSetUserRolesArgs = {
  roleIds: Array<Scalars['Int']['input']>;
  userId: Scalars['Int']['input'];
};


export type MutationStartWorkflowRunArgs = {
  contextJson: Scalars['String']['input'];
  definitionId: Scalars['Int']['input'];
  startedBy?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSubmitFormArgs = {
  answersJson: Scalars['String']['input'];
  contextJson?: InputMaybe<Scalars['String']['input']>;
  formId: Scalars['Int']['input'];
  localeCode: Scalars['String']['input'];
  marketCode: Scalars['String']['input'];
  metaJson?: InputMaybe<Scalars['String']['input']>;
  pageContentItemId?: InputMaybe<Scalars['Int']['input']>;
  pageRouteSlug?: InputMaybe<Scalars['String']['input']>;
  siteId: Scalars['Int']['input'];
  submittedByUserId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationTestConnectorArgs = {
  id: Scalars['Int']['input'];
};


export type MutationUpdateAssetMetadataArgs = {
  altText?: InputMaybe<Scalars['String']['input']>;
  by?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  folderId?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['Int']['input'];
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
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


export type MutationUpdateInternalUserArgs = {
  active: Scalars['Boolean']['input'];
  displayName: Scalars['String']['input'];
  id: Scalars['Int']['input'];
};


export type MutationUpdateSubmissionStatusArgs = {
  id: Scalars['Int']['input'];
  status: Scalars['String']['input'];
};


export type MutationUpdateTemplateArgs = {
  componentsJson: Scalars['String']['input'];
  compositionJson: Scalars['String']['input'];
  constraintsJson: Scalars['String']['input'];
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpsertConnectorArgs = {
  configJson: Scalars['String']['input'];
  domain: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
  id?: InputMaybe<Scalars['Int']['input']>;
  isDefault: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
};


export type MutationUpsertFormArgs = {
  active: Scalars['Boolean']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  siteId: Scalars['Int']['input'];
};


export type MutationUpsertFormFieldArgs = {
  active: Scalars['Boolean']['input'];
  conditionsJson: Scalars['String']['input'];
  fieldType: Scalars['String']['input'];
  formId: Scalars['Int']['input'];
  id?: InputMaybe<Scalars['Int']['input']>;
  key: Scalars['String']['input'];
  label: Scalars['String']['input'];
  position: Scalars['Int']['input'];
  stepId: Scalars['Int']['input'];
  uiConfigJson: Scalars['String']['input'];
  validationsJson: Scalars['String']['input'];
};


export type MutationUpsertFormStepArgs = {
  formId: Scalars['Int']['input'];
  id?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  position: Scalars['Int']['input'];
};


export type MutationUpsertInternalRoleArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  permissions: Array<Scalars['String']['input']>;
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


export type MutationUpsertSiteLocaleOverrideArgs = {
  code: Scalars['String']['input'];
  displayName?: InputMaybe<Scalars['String']['input']>;
  fallbackLocaleCode?: InputMaybe<Scalars['String']['input']>;
  siteId: Scalars['Int']['input'];
};


export type MutationUpsertVariantArgs = {
  contentVersionId: Scalars['Int']['input'];
  id?: InputMaybe<Scalars['Int']['input']>;
  key: Scalars['String']['input'];
  priority: Scalars['Int']['input'];
  ruleJson: Scalars['String']['input'];
  state: Scalars['String']['input'];
  trafficAllocation?: InputMaybe<Scalars['Int']['input']>;
  variantSetId: Scalars['Int']['input'];
};


export type MutationUpsertVariantSetArgs = {
  active: Scalars['Boolean']['input'];
  contentItemId: Scalars['Int']['input'];
  fallbackVariantSetId?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['Int']['input']>;
  localeCode: Scalars['String']['input'];
  marketCode: Scalars['String']['input'];
  siteId: Scalars['Int']['input'];
};


export type MutationUpsertWorkflowDefinitionArgs = {
  createdBy?: InputMaybe<Scalars['String']['input']>;
  graphJson: Scalars['String']['input'];
  id?: InputMaybe<Scalars['Int']['input']>;
  inputSchemaJson: Scalars['String']['input'];
  name: Scalars['String']['input'];
  permissionsJson: Scalars['String']['input'];
  version: Scalars['Int']['input'];
};

export type PageByRoute = {
  __typename?: 'PageByRoute';
  base?: Maybe<ResolvedRoute>;
  selectedVariant?: Maybe<Variant>;
  selectedVersion?: Maybe<ContentVersion>;
  selectionReason?: Maybe<Scalars['String']['output']>;
};

export type PreviewTokenPayload = {
  __typename?: 'PreviewTokenPayload';
  contentItemId?: Maybe<Scalars['Int']['output']>;
  token?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  dbAdminDescribe?: Maybe<DbAdminTable>;
  dbAdminList?: Maybe<DbAdminListResult>;
  dbAdminTables?: Maybe<Array<DbAdminTableListItem>>;
  diffVersions?: Maybe<VersionDiff>;
  evaluateForm?: Maybe<FormEvaluation>;
  exportFormSubmissions?: Maybe<Scalars['String']['output']>;
  getAsset?: Maybe<Asset>;
  getContentItemDetail?: Maybe<ContentItemDetail>;
  getPageByRoute?: Maybe<PageByRoute>;
  getSite?: Maybe<Site>;
  getSiteDefaults?: Maybe<SiteDefaults>;
  getSiteMarketLocaleMatrix?: Maybe<SiteMarketLocaleMatrix>;
  getWorkflowRun?: Maybe<WorkflowRun>;
  internalPermissions?: Maybe<Array<Scalars['String']['output']>>;
  listAssetFolders?: Maybe<Array<AssetFolder>>;
  listAssets?: Maybe<AssetList>;
  listConnectors?: Maybe<Array<Connector>>;
  listContentItems?: Maybe<Array<ContentItem>>;
  listContentTypes?: Maybe<Array<ContentType>>;
  listFormFields?: Maybe<Array<FormField>>;
  listFormSteps?: Maybe<Array<FormStep>>;
  listFormSubmissions?: Maybe<FormSubmissionList>;
  listForms?: Maybe<Array<Form>>;
  listInternalRoles?: Maybe<Array<InternalRole>>;
  listInternalUsers?: Maybe<Array<InternalUser>>;
  listLocales?: Maybe<Array<Locale>>;
  listMarkets?: Maybe<Array<Market>>;
  listRoutes?: Maybe<Array<ContentRoute>>;
  listSites?: Maybe<Array<Site>>;
  listTemplates?: Maybe<Array<Template>>;
  listVariantSets?: Maybe<Array<VariantSet>>;
  listVariants?: Maybe<Array<Variant>>;
  listVersions?: Maybe<Array<ContentVersion>>;
  listWorkflowDefinitions?: Maybe<Array<WorkflowDefinition>>;
  listWorkflowRuns?: Maybe<Array<WorkflowRun>>;
  localeCatalog?: Maybe<Array<LocaleCatalogItem>>;
  me?: Maybe<User>;
  resolveMarketLocale?: Maybe<ResolvedMarketLocale>;
  resolveRoute?: Maybe<ResolvedRoute>;
  selectVariant?: Maybe<VariantSelection>;
  validateMarketLocale?: Maybe<Scalars['Boolean']['output']>;
};


export type QueryDbAdminDescribeArgs = {
  dangerMode?: InputMaybe<Scalars['Boolean']['input']>;
  table: Scalars['String']['input'];
};


export type QueryDbAdminListArgs = {
  dangerMode?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Array<DbAdminFilterInput>>;
  paging?: InputMaybe<DbAdminPagingInput>;
  sort?: InputMaybe<DbAdminSortInput>;
  table: Scalars['String']['input'];
};


export type QueryDbAdminTablesArgs = {
  dangerMode?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryDiffVersionsArgs = {
  leftVersionId: Scalars['Int']['input'];
  rightVersionId: Scalars['Int']['input'];
};


export type QueryEvaluateFormArgs = {
  answersJson: Scalars['String']['input'];
  contextJson?: InputMaybe<Scalars['String']['input']>;
  formId: Scalars['Int']['input'];
};


export type QueryExportFormSubmissionsArgs = {
  formId?: InputMaybe<Scalars['Int']['input']>;
  format: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['String']['input']>;
  localeCode?: InputMaybe<Scalars['String']['input']>;
  marketCode?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  siteId: Scalars['Int']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAssetArgs = {
  id: Scalars['Int']['input'];
};


export type QueryGetContentItemDetailArgs = {
  contentItemId: Scalars['Int']['input'];
};


export type QueryGetPageByRouteArgs = {
  contextJson?: InputMaybe<Scalars['String']['input']>;
  localeCode: Scalars['String']['input'];
  marketCode: Scalars['String']['input'];
  preview?: InputMaybe<Scalars['Boolean']['input']>;
  previewToken?: InputMaybe<Scalars['String']['input']>;
  siteId: Scalars['Int']['input'];
  slug: Scalars['String']['input'];
  variantKeyOverride?: InputMaybe<Scalars['String']['input']>;
  versionIdOverride?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetSiteArgs = {
  siteId: Scalars['Int']['input'];
};


export type QueryGetSiteDefaultsArgs = {
  siteId: Scalars['Int']['input'];
};


export type QueryGetSiteMarketLocaleMatrixArgs = {
  siteId: Scalars['Int']['input'];
};


export type QueryGetWorkflowRunArgs = {
  runId: Scalars['Int']['input'];
};


export type QueryListAssetFoldersArgs = {
  siteId: Scalars['Int']['input'];
};


export type QueryListAssetsArgs = {
  folderId?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  siteId: Scalars['Int']['input'];
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryListConnectorsArgs = {
  domain: Scalars['String']['input'];
};


export type QueryListContentItemsArgs = {
  siteId: Scalars['Int']['input'];
};


export type QueryListContentTypesArgs = {
  siteId: Scalars['Int']['input'];
};


export type QueryListFormFieldsArgs = {
  formId: Scalars['Int']['input'];
};


export type QueryListFormStepsArgs = {
  formId: Scalars['Int']['input'];
};


export type QueryListFormSubmissionsArgs = {
  formId?: InputMaybe<Scalars['Int']['input']>;
  fromDate?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  localeCode?: InputMaybe<Scalars['String']['input']>;
  marketCode?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  siteId: Scalars['Int']['input'];
  sortField?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryListFormsArgs = {
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


export type QueryListVariantSetsArgs = {
  contentItemId?: InputMaybe<Scalars['Int']['input']>;
  localeCode?: InputMaybe<Scalars['String']['input']>;
  marketCode?: InputMaybe<Scalars['String']['input']>;
  siteId: Scalars['Int']['input'];
};


export type QueryListVariantsArgs = {
  variantSetId: Scalars['Int']['input'];
};


export type QueryListVersionsArgs = {
  contentItemId: Scalars['Int']['input'];
};


export type QueryListWorkflowRunsArgs = {
  definitionId?: InputMaybe<Scalars['Int']['input']>;
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


export type QuerySelectVariantArgs = {
  contextJson?: InputMaybe<Scalars['String']['input']>;
  variantSetId: Scalars['Int']['input'];
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
  urlPattern?: Maybe<Scalars['String']['output']>;
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

export type Variant = {
  __typename?: 'Variant';
  contentVersionId?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  key?: Maybe<Scalars['String']['output']>;
  priority?: Maybe<Scalars['Int']['output']>;
  ruleJson?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  trafficAllocation?: Maybe<Scalars['Int']['output']>;
  variantSetId?: Maybe<Scalars['Int']['output']>;
};

export type VariantSelection = {
  __typename?: 'VariantSelection';
  reason?: Maybe<Scalars['String']['output']>;
  variant?: Maybe<Variant>;
  variantSetId?: Maybe<Scalars['Int']['output']>;
};

export type VariantSet = {
  __typename?: 'VariantSet';
  active?: Maybe<Scalars['Boolean']['output']>;
  contentItemId?: Maybe<Scalars['Int']['output']>;
  fallbackVariantSetId?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  localeCode?: Maybe<Scalars['String']['output']>;
  marketCode?: Maybe<Scalars['String']['output']>;
  siteId?: Maybe<Scalars['Int']['output']>;
};

export type VersionDiff = {
  __typename?: 'VersionDiff';
  changedPaths?: Maybe<Array<Scalars['String']['output']>>;
  leftVersionId?: Maybe<Scalars['Int']['output']>;
  rightVersionId?: Maybe<Scalars['Int']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
};

export type WorkflowDefinition = {
  __typename?: 'WorkflowDefinition';
  createdAt?: Maybe<Scalars['String']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  graphJson?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  inputSchemaJson?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  permissionsJson?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['Int']['output']>;
};

export type WorkflowRun = {
  __typename?: 'WorkflowRun';
  contextJson?: Maybe<Scalars['String']['output']>;
  currentNodeId?: Maybe<Scalars['String']['output']>;
  definitionId?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  logsJson?: Maybe<Scalars['String']['output']>;
  startedAt?: Maybe<Scalars['String']['output']>;
  startedBy?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
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

export type WebSiteQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type WebSiteQuery = { __typename?: 'Query', getSite?: { __typename?: 'Site', id?: number | null, urlPattern?: string | null } | null };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id?: number | null, username?: string | null, displayName?: string | null, createdAt?: string | null } | null };

export type WebGetPageByRouteQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
  marketCode: Scalars['String']['input'];
  localeCode: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  contextJson?: InputMaybe<Scalars['String']['input']>;
  previewToken?: InputMaybe<Scalars['String']['input']>;
  preview?: InputMaybe<Scalars['Boolean']['input']>;
  variantKeyOverride?: InputMaybe<Scalars['String']['input']>;
  versionIdOverride?: InputMaybe<Scalars['Int']['input']>;
}>;


export type WebGetPageByRouteQuery = { __typename?: 'Query', getPageByRoute?: { __typename?: 'PageByRoute', selectionReason?: string | null, selectedVariant?: { __typename?: 'Variant', key?: string | null } | null, selectedVersion?: { __typename?: 'ContentVersion', id?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null } | null, base?: { __typename?: 'ResolvedRoute', contentType?: { __typename?: 'ContentType', name?: string | null } | null } | null } | null };

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
export const WebSiteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebSite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"urlPattern"}}]}}]}}]} as unknown as DocumentNode<WebSiteQuery, WebSiteQueryVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const WebGetPageByRouteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebGetPageByRoute"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contextJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"previewToken"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"preview"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"variantKeyOverride"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionIdOverride"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getPageByRoute"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}},{"kind":"Argument","name":{"kind":"Name","value":"contextJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contextJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"previewToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"previewToken"}}},{"kind":"Argument","name":{"kind":"Name","value":"preview"},"value":{"kind":"Variable","name":{"kind":"Name","value":"preview"}}},{"kind":"Argument","name":{"kind":"Name","value":"variantKeyOverride"},"value":{"kind":"Variable","name":{"kind":"Name","value":"variantKeyOverride"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionIdOverride"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionIdOverride"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"selectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"selectedVariant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}}]}},{"kind":"Field","name":{"kind":"Name","value":"selectedVersion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}}]}},{"kind":"Field","name":{"kind":"Name","value":"base"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contentType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<WebGetPageByRouteQuery, WebGetPageByRouteQueryVariables>;
export const WebResolveRouteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebResolveRoute"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"previewToken"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"preview"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resolveRoute"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}},{"kind":"Argument","name":{"kind":"Name","value":"previewToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"previewToken"}}},{"kind":"Argument","name":{"kind":"Name","value":"preview"},"value":{"kind":"Variable","name":{"kind":"Name","value":"preview"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"route"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contentType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}}]}},{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}}]}}]}}]}}]} as unknown as DocumentNode<WebResolveRouteQuery, WebResolveRouteQueryVariables>;