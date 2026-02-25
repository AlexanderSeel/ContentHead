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

export type ComponentTypeSetting = {
  __typename?: 'ComponentTypeSetting';
  componentTypeId?: Maybe<Scalars['String']['output']>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
  groupName?: Maybe<Scalars['String']['output']>;
  siteId?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
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
  parentId?: Maybe<Scalars['Int']['output']>;
  siteId?: Maybe<Scalars['Int']['output']>;
  sortOrder?: Maybe<Scalars['Int']['output']>;
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
  allowedComponentsJson?: Maybe<Scalars['String']['output']>;
  componentAreaRestrictionsJson?: Maybe<Scalars['String']['output']>;
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

export type DevDiagnostics = {
  __typename?: 'DevDiagnostics';
  permissions?: Maybe<Array<Scalars['String']['output']>>;
  roles?: Maybe<Array<Scalars['String']['output']>>;
  seedStatus?: Maybe<SecuritySeedStatus>;
};

export type EntityAcl = {
  __typename?: 'EntityAcl';
  effect?: Maybe<Scalars['String']['output']>;
  entityId?: Maybe<Scalars['String']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  permissionKey?: Maybe<Scalars['String']['output']>;
  principalId?: Maybe<Scalars['String']['output']>;
  principalType?: Maybe<Scalars['String']['output']>;
};

export type EntityAclEntryInput = {
  effect: Scalars['String']['input'];
  permissionKey: Scalars['String']['input'];
  principalId: Scalars['String']['input'];
  principalType: Scalars['String']['input'];
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
  groupIds?: Maybe<Array<Scalars['Int']['output']>>;
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
  addComponent?: Maybe<ContentVersion>;
  aiGenerateContent?: Maybe<AiContentResult>;
  aiGenerateContentType?: Maybe<ContentType>;
  aiGenerateVariants?: Maybe<AiVariantsResult>;
  aiTranslateVersion?: Maybe<AiContentResult>;
  approveStep?: Maybe<WorkflowRun>;
  archiveContentItem?: Maybe<ContentItem>;
  createAssetFolder?: Maybe<AssetFolder>;
  createChildPage?: Maybe<ContentItem>;
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
  deletePage?: Maybe<Scalars['Boolean']['output']>;
  deletePrincipalGroup?: Maybe<Scalars['Boolean']['output']>;
  deleteRoute?: Maybe<Scalars['Boolean']['output']>;
  deleteTemplate?: Maybe<Scalars['Boolean']['output']>;
  deleteVariant?: Maybe<Scalars['Boolean']['output']>;
  deleteVariantSet?: Maybe<Scalars['Boolean']['output']>;
  deleteVisitorGroup?: Maybe<Scalars['Boolean']['output']>;
  deleteWorkflowDefinition?: Maybe<Scalars['Boolean']['output']>;
  issuePreviewToken?: Maybe<PreviewTokenPayload>;
  login?: Maybe<AuthPayload>;
  moveComponent?: Maybe<ContentVersion>;
  movePage?: Maybe<ContentItem>;
  publishVersion?: Maybe<ContentVersion>;
  reconcileTemplate?: Maybe<VersionDiff>;
  removeComponent?: Maybe<ContentVersion>;
  reorderSiblings?: Maybe<Scalars['Boolean']['output']>;
  replaceEntityAcls?: Maybe<Array<EntityAcl>>;
  resetInternalUserPassword?: Maybe<Scalars['Boolean']['output']>;
  retryFailed?: Maybe<WorkflowRun>;
  rollbackToVersion?: Maybe<ContentVersion>;
  setDefaultConnector?: Maybe<Connector>;
  setSiteLocales?: Maybe<Array<Locale>>;
  setSiteMarketLocaleMatrix?: Maybe<SiteMarketLocaleMatrix>;
  setSiteMarkets?: Maybe<Array<Market>>;
  setSiteName?: Maybe<Site>;
  setSiteUrlPattern?: Maybe<Site>;
  setUserGroups?: Maybe<Scalars['Boolean']['output']>;
  setUserRoles?: Maybe<Scalars['Boolean']['output']>;
  startWorkflowRun?: Maybe<WorkflowRun>;
  submitForm?: Maybe<FormSubmission>;
  testConnector?: Maybe<Scalars['String']['output']>;
  updateAssetMetadata?: Maybe<Asset>;
  updateComponentProps?: Maybe<ContentVersion>;
  updateContentType?: Maybe<ContentType>;
  updateDraftVersion?: Maybe<ContentVersion>;
  updateInternalUser?: Maybe<InternalUser>;
  updateSubmissionStatus?: Maybe<FormSubmission>;
  updateTemplate?: Maybe<Template>;
  upsertComponentTypeSetting?: Maybe<ComponentTypeSetting>;
  upsertConnector?: Maybe<Connector>;
  upsertForm?: Maybe<Form>;
  upsertFormField?: Maybe<FormField>;
  upsertFormStep?: Maybe<FormStep>;
  upsertInternalRole?: Maybe<InternalRole>;
  upsertLocale?: Maybe<Array<Locale>>;
  upsertMarket?: Maybe<Array<Market>>;
  upsertPageAclSettings?: Maybe<PageAclSettings>;
  upsertPageTargeting?: Maybe<PageTargeting>;
  upsertPrincipalGroup?: Maybe<PrincipalGroup>;
  upsertRoute?: Maybe<ContentRoute>;
  upsertSiteLocaleOverride?: Maybe<Array<Locale>>;
  upsertVariant?: Maybe<Variant>;
  upsertVariantSet?: Maybe<VariantSet>;
  upsertVisitorGroup?: Maybe<VisitorGroup>;
  upsertWorkflowDefinition?: Maybe<WorkflowDefinition>;
};


export type MutationAddComponentArgs = {
  area: Scalars['String']['input'];
  componentTypeId: Scalars['String']['input'];
  contentVersionId: Scalars['Int']['input'];
  initialProps?: InputMaybe<Scalars['String']['input']>;
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


export type MutationCreateChildPageArgs = {
  by?: InputMaybe<Scalars['String']['input']>;
  comment?: InputMaybe<Scalars['String']['input']>;
  contentTypeId: Scalars['Int']['input'];
  initialComponentsJson?: InputMaybe<Scalars['String']['input']>;
  initialCompositionJson?: InputMaybe<Scalars['String']['input']>;
  initialFieldsJson?: InputMaybe<Scalars['String']['input']>;
  metadataJson?: InputMaybe<Scalars['String']['input']>;
  parentId: Scalars['Int']['input'];
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
  parentId?: InputMaybe<Scalars['Int']['input']>;
  siteId: Scalars['Int']['input'];
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationCreateContentTypeArgs = {
  allowedComponentsJson?: InputMaybe<Scalars['String']['input']>;
  by?: InputMaybe<Scalars['String']['input']>;
  componentAreaRestrictionsJson?: InputMaybe<Scalars['String']['input']>;
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


export type MutationDeletePageArgs = {
  pageId: Scalars['Int']['input'];
};


export type MutationDeletePrincipalGroupArgs = {
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


export type MutationDeleteVisitorGroupArgs = {
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


export type MutationMoveComponentArgs = {
  instanceId: Scalars['String']['input'];
  newArea: Scalars['String']['input'];
  newSortOrder: Scalars['Int']['input'];
};


export type MutationMovePageArgs = {
  newParentId?: InputMaybe<Scalars['Int']['input']>;
  newSortOrder?: InputMaybe<Scalars['Int']['input']>;
  pageId: Scalars['Int']['input'];
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


export type MutationRemoveComponentArgs = {
  instanceId: Scalars['String']['input'];
};


export type MutationReorderSiblingsArgs = {
  orderedIds: Array<Scalars['Int']['input']>;
  parentId?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationReplaceEntityAclsArgs = {
  entityId: Scalars['String']['input'];
  entityType: Scalars['String']['input'];
  entries: Array<EntityAclEntryInput>;
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


export type MutationSetUserGroupsArgs = {
  groupIds: Array<Scalars['Int']['input']>;
  userId: Scalars['Int']['input'];
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


export type MutationUpdateComponentPropsArgs = {
  instanceId: Scalars['String']['input'];
  patch: Scalars['String']['input'];
};


export type MutationUpdateContentTypeArgs = {
  allowedComponentsJson?: InputMaybe<Scalars['String']['input']>;
  by?: InputMaybe<Scalars['String']['input']>;
  componentAreaRestrictionsJson?: InputMaybe<Scalars['String']['input']>;
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


export type MutationUpsertComponentTypeSettingArgs = {
  by?: InputMaybe<Scalars['String']['input']>;
  componentTypeId: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
  groupName?: InputMaybe<Scalars['String']['input']>;
  siteId: Scalars['Int']['input'];
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


export type MutationUpsertPageAclSettingsArgs = {
  contentItemId: Scalars['Int']['input'];
  inheritFromParent: Scalars['Boolean']['input'];
};


export type MutationUpsertPageTargetingArgs = {
  allowVisitorGroupIdsJson: Scalars['String']['input'];
  contentItemId: Scalars['Int']['input'];
  denyBehavior: Scalars['String']['input'];
  denyVisitorGroupIdsJson: Scalars['String']['input'];
  fallbackContentItemId?: InputMaybe<Scalars['Int']['input']>;
  inheritFromParent: Scalars['Boolean']['input'];
};


export type MutationUpsertPrincipalGroupArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
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


export type MutationUpsertVisitorGroupArgs = {
  id?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  ruleJson: Scalars['String']['input'];
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

export type PageAclSettings = {
  __typename?: 'PageAclSettings';
  contentItemId?: Maybe<Scalars['Int']['output']>;
  inheritFromParent?: Maybe<Scalars['Boolean']['output']>;
};

export type PageByRoute = {
  __typename?: 'PageByRoute';
  base?: Maybe<ResolvedRoute>;
  selectedVariant?: Maybe<Variant>;
  selectedVersion?: Maybe<ContentVersion>;
  selectionReason?: Maybe<Scalars['String']['output']>;
};

export type PageTargeting = {
  __typename?: 'PageTargeting';
  allowVisitorGroupIdsJson?: Maybe<Scalars['String']['output']>;
  contentItemId?: Maybe<Scalars['Int']['output']>;
  denyBehavior?: Maybe<Scalars['String']['output']>;
  denyVisitorGroupIdsJson?: Maybe<Scalars['String']['output']>;
  fallbackContentItemId?: Maybe<Scalars['Int']['output']>;
  inheritFromParent?: Maybe<Scalars['Boolean']['output']>;
};

export type PageTargetingEvaluation = {
  __typename?: 'PageTargetingEvaluation';
  allowed?: Maybe<Scalars['Boolean']['output']>;
  fallbackContentItemId?: Maybe<Scalars['Int']['output']>;
  matchedAllowGroupIds?: Maybe<Array<Scalars['Int']['output']>>;
  matchedDenyGroupIds?: Maybe<Array<Scalars['Int']['output']>>;
  reason?: Maybe<Scalars['String']['output']>;
};

export type PageTreeNode = {
  __typename?: 'PageTreeNode';
  children?: Maybe<Array<PageTreeNode>>;
  id?: Maybe<Scalars['Int']['output']>;
  parentId?: Maybe<Scalars['Int']['output']>;
  route?: Maybe<ContentRoute>;
  slug?: Maybe<Scalars['String']['output']>;
  sortOrder?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type PreviewTokenPayload = {
  __typename?: 'PreviewTokenPayload';
  contentItemId?: Maybe<Scalars['Int']['output']>;
  token?: Maybe<Scalars['String']['output']>;
};

export type PrincipalGroup = {
  __typename?: 'PrincipalGroup';
  createdAt?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  aclPermissionKeys?: Maybe<Array<Scalars['String']['output']>>;
  dbAdminDescribe?: Maybe<DbAdminTable>;
  dbAdminList?: Maybe<DbAdminListResult>;
  dbAdminTables?: Maybe<Array<DbAdminTableListItem>>;
  devDiagnostics?: Maybe<DevDiagnostics>;
  diffVersions?: Maybe<VersionDiff>;
  evaluateForm?: Maybe<FormEvaluation>;
  evaluatePageTargeting?: Maybe<PageTargetingEvaluation>;
  exportFormSubmissions?: Maybe<Scalars['String']['output']>;
  getAsset?: Maybe<Asset>;
  getContentItemDetail?: Maybe<ContentItemDetail>;
  getPageAclSettings?: Maybe<PageAclSettings>;
  getPageByRoute?: Maybe<PageByRoute>;
  getPageTargeting?: Maybe<PageTargeting>;
  getPageTree?: Maybe<Array<PageTreeNode>>;
  getSite?: Maybe<Site>;
  getSiteDefaults?: Maybe<SiteDefaults>;
  getSiteMarketLocaleMatrix?: Maybe<SiteMarketLocaleMatrix>;
  getWorkflowRun?: Maybe<WorkflowRun>;
  internalPermissions?: Maybe<Array<Scalars['String']['output']>>;
  listAssetFolders?: Maybe<Array<AssetFolder>>;
  listAssets?: Maybe<AssetList>;
  listComponentTypeSettings?: Maybe<Array<ComponentTypeSetting>>;
  listConnectors?: Maybe<Array<Connector>>;
  listContentItems?: Maybe<Array<ContentItem>>;
  listContentTypes?: Maybe<Array<ContentType>>;
  listEntityAcls?: Maybe<Array<EntityAcl>>;
  listFormFields?: Maybe<Array<FormField>>;
  listFormSteps?: Maybe<Array<FormStep>>;
  listFormSubmissions?: Maybe<FormSubmissionList>;
  listForms?: Maybe<Array<Form>>;
  listInternalRoles?: Maybe<Array<InternalRole>>;
  listInternalUsers?: Maybe<Array<InternalUser>>;
  listLocales?: Maybe<Array<Locale>>;
  listMarkets?: Maybe<Array<Market>>;
  listPrincipalGroups?: Maybe<Array<PrincipalGroup>>;
  listRoutes?: Maybe<Array<ContentRoute>>;
  listSites?: Maybe<Array<Site>>;
  listTemplates?: Maybe<Array<Template>>;
  listVariantSets?: Maybe<Array<VariantSet>>;
  listVariants?: Maybe<Array<Variant>>;
  listVersions?: Maybe<Array<ContentVersion>>;
  listVisitorGroups?: Maybe<Array<VisitorGroup>>;
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


export type QueryEvaluatePageTargetingArgs = {
  contentItemId: Scalars['Int']['input'];
  contextJson?: InputMaybe<Scalars['String']['input']>;
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


export type QueryGetPageAclSettingsArgs = {
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


export type QueryGetPageTargetingArgs = {
  contentItemId: Scalars['Int']['input'];
};


export type QueryGetPageTreeArgs = {
  localeCode: Scalars['String']['input'];
  marketCode: Scalars['String']['input'];
  siteId: Scalars['Int']['input'];
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


export type QueryListComponentTypeSettingsArgs = {
  siteId: Scalars['Int']['input'];
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


export type QueryListEntityAclsArgs = {
  entityId: Scalars['String']['input'];
  entityType: Scalars['String']['input'];
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


export type QueryListVisitorGroupsArgs = {
  siteId: Scalars['Int']['input'];
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

export type SecuritySeedStatus = {
  __typename?: 'SecuritySeedStatus';
  adminPermissionCoverage?: Maybe<Scalars['Boolean']['output']>;
  adminRoleExists?: Maybe<Scalars['Boolean']['output']>;
  adminUserHasRole?: Maybe<Scalars['Boolean']['output']>;
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

export type VisitorGroup = {
  __typename?: 'VisitorGroup';
  createdAt?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  ruleJson?: Maybe<Scalars['String']['output']>;
  siteId?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
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

export type ListAssetsQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  folderId?: InputMaybe<Scalars['Int']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type ListAssetsQuery = { __typename?: 'Query', listAssets?: { __typename?: 'AssetList', total?: number | null, items?: Array<{ __typename?: 'Asset', id?: number | null, siteId?: number | null, filename?: string | null, originalName?: string | null, mimeType?: string | null, bytes?: number | null, width?: number | null, height?: number | null, checksum?: string | null, storagePath?: string | null, title?: string | null, altText?: string | null, description?: string | null, tagsJson?: string | null, folderId?: number | null, createdAt?: string | null, updatedAt?: string | null }> | null } | null };

export type GetAssetQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetAssetQuery = { __typename?: 'Query', getAsset?: { __typename?: 'Asset', id?: number | null, siteId?: number | null, filename?: string | null, originalName?: string | null, mimeType?: string | null, bytes?: number | null, width?: number | null, height?: number | null, checksum?: string | null, storagePath?: string | null, title?: string | null, altText?: string | null, description?: string | null, tagsJson?: string | null, folderId?: number | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type ListAssetFoldersQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type ListAssetFoldersQuery = { __typename?: 'Query', listAssetFolders?: Array<{ __typename?: 'AssetFolder', id?: number | null, siteId?: number | null, parentId?: number | null, name?: string | null, path?: string | null, createdAt?: string | null, createdBy?: string | null }> | null };

export type CreateAssetFolderMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['Int']['input']>;
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateAssetFolderMutation = { __typename?: 'Mutation', createAssetFolder?: { __typename?: 'AssetFolder', id?: number | null, siteId?: number | null, parentId?: number | null, name?: string | null, path?: string | null, createdAt?: string | null, createdBy?: string | null } | null };

export type UpdateAssetMetadataMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  altText?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  folderId?: InputMaybe<Scalars['Int']['input']>;
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateAssetMetadataMutation = { __typename?: 'Mutation', updateAssetMetadata?: { __typename?: 'Asset', id?: number | null, title?: string | null, altText?: string | null, description?: string | null, tagsJson?: string | null, folderId?: number | null, updatedAt?: string | null } | null };

export type DeleteAssetMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteAssetMutation = { __typename?: 'Mutation', deleteAsset?: boolean | null };

export type ListConnectorsQueryVariables = Exact<{
  domain: Scalars['String']['input'];
}>;


export type ListConnectorsQuery = { __typename?: 'Query', listConnectors?: Array<{ __typename?: 'Connector', id?: number | null, domain?: string | null, type?: string | null, name?: string | null, enabled?: boolean | null, isDefault?: boolean | null, configJson?: string | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type UpsertConnectorMutationVariables = Exact<{
  id?: InputMaybe<Scalars['Int']['input']>;
  domain: Scalars['String']['input'];
  type: Scalars['String']['input'];
  name: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
  isDefault: Scalars['Boolean']['input'];
  configJson: Scalars['String']['input'];
}>;


export type UpsertConnectorMutation = { __typename?: 'Mutation', upsertConnector?: { __typename?: 'Connector', id?: number | null, domain?: string | null, type?: string | null, name?: string | null, enabled?: boolean | null, isDefault?: boolean | null, configJson?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteConnectorMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteConnectorMutation = { __typename?: 'Mutation', deleteConnector?: boolean | null };

export type SetDefaultConnectorMutationVariables = Exact<{
  domain: Scalars['String']['input'];
  id: Scalars['Int']['input'];
}>;


export type SetDefaultConnectorMutation = { __typename?: 'Mutation', setDefaultConnector?: { __typename?: 'Connector', id?: number | null, domain?: string | null, type?: string | null, name?: string | null, enabled?: boolean | null, isDefault?: boolean | null, configJson?: string | null } | null };

export type TestConnectorMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type TestConnectorMutation = { __typename?: 'Mutation', testConnector?: string | null };

export type ListInternalUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type ListInternalUsersQuery = { __typename?: 'Query', listInternalUsers?: Array<{ __typename?: 'InternalUser', id?: number | null, username?: string | null, displayName?: string | null, active?: boolean | null, createdAt?: string | null, roleIds?: Array<number> | null, groupIds?: Array<number> | null }> | null };

export type ListInternalRolesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListInternalRolesQuery = { __typename?: 'Query', listInternalRoles?: Array<{ __typename?: 'InternalRole', id?: number | null, name?: string | null, description?: string | null, permissions?: Array<string> | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type InternalPermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type InternalPermissionsQuery = { __typename?: 'Query', internalPermissions?: Array<string> | null };

export type AclPermissionKeysQueryVariables = Exact<{ [key: string]: never; }>;


export type AclPermissionKeysQuery = { __typename?: 'Query', aclPermissionKeys?: Array<string> | null };

export type CreateInternalUserMutationVariables = Exact<{
  username: Scalars['String']['input'];
  displayName: Scalars['String']['input'];
  password: Scalars['String']['input'];
  active: Scalars['Boolean']['input'];
}>;


export type CreateInternalUserMutation = { __typename?: 'Mutation', createInternalUser?: { __typename?: 'InternalUser', id?: number | null, username?: string | null, displayName?: string | null, active?: boolean | null, createdAt?: string | null, roleIds?: Array<number> | null, groupIds?: Array<number> | null } | null };

export type UpdateInternalUserMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  displayName: Scalars['String']['input'];
  active: Scalars['Boolean']['input'];
}>;


export type UpdateInternalUserMutation = { __typename?: 'Mutation', updateInternalUser?: { __typename?: 'InternalUser', id?: number | null, username?: string | null, displayName?: string | null, active?: boolean | null, createdAt?: string | null, roleIds?: Array<number> | null, groupIds?: Array<number> | null } | null };

export type ResetInternalUserPasswordMutationVariables = Exact<{
  userId: Scalars['Int']['input'];
  password: Scalars['String']['input'];
}>;


export type ResetInternalUserPasswordMutation = { __typename?: 'Mutation', resetInternalUserPassword?: boolean | null };

export type UpsertInternalRoleMutationVariables = Exact<{
  id?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  permissions: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type UpsertInternalRoleMutation = { __typename?: 'Mutation', upsertInternalRole?: { __typename?: 'InternalRole', id?: number | null, name?: string | null, description?: string | null, permissions?: Array<string> | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteInternalRoleMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteInternalRoleMutation = { __typename?: 'Mutation', deleteInternalRole?: boolean | null };

export type SetUserRolesMutationVariables = Exact<{
  userId: Scalars['Int']['input'];
  roleIds: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
}>;


export type SetUserRolesMutation = { __typename?: 'Mutation', setUserRoles?: boolean | null };

export type SetUserGroupsMutationVariables = Exact<{
  userId: Scalars['Int']['input'];
  groupIds: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
}>;


export type SetUserGroupsMutation = { __typename?: 'Mutation', setUserGroups?: boolean | null };

export type ListPrincipalGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListPrincipalGroupsQuery = { __typename?: 'Query', listPrincipalGroups?: Array<{ __typename?: 'PrincipalGroup', id?: number | null, name?: string | null, description?: string | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type UpsertPrincipalGroupMutationVariables = Exact<{
  id?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpsertPrincipalGroupMutation = { __typename?: 'Mutation', upsertPrincipalGroup?: { __typename?: 'PrincipalGroup', id?: number | null, name?: string | null, description?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeletePrincipalGroupMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeletePrincipalGroupMutation = { __typename?: 'Mutation', deletePrincipalGroup?: boolean | null };

export type ListEntityAclsQueryVariables = Exact<{
  entityType: Scalars['String']['input'];
  entityId: Scalars['String']['input'];
}>;


export type ListEntityAclsQuery = { __typename?: 'Query', listEntityAcls?: Array<{ __typename?: 'EntityAcl', id?: number | null, entityType?: string | null, entityId?: string | null, principalType?: string | null, principalId?: string | null, permissionKey?: string | null, effect?: string | null }> | null };

export type ReplaceEntityAclsMutationVariables = Exact<{
  entityType: Scalars['String']['input'];
  entityId: Scalars['String']['input'];
  entries: Array<EntityAclEntryInput> | EntityAclEntryInput;
}>;


export type ReplaceEntityAclsMutation = { __typename?: 'Mutation', replaceEntityAcls?: Array<{ __typename?: 'EntityAcl', id?: number | null, entityType?: string | null, entityId?: string | null, principalType?: string | null, principalId?: string | null, permissionKey?: string | null, effect?: string | null }> | null };

export type GetPageAclSettingsQueryVariables = Exact<{
  contentItemId: Scalars['Int']['input'];
}>;


export type GetPageAclSettingsQuery = { __typename?: 'Query', getPageAclSettings?: { __typename?: 'PageAclSettings', contentItemId?: number | null, inheritFromParent?: boolean | null } | null };

export type UpsertPageAclSettingsMutationVariables = Exact<{
  contentItemId: Scalars['Int']['input'];
  inheritFromParent: Scalars['Boolean']['input'];
}>;


export type UpsertPageAclSettingsMutation = { __typename?: 'Mutation', upsertPageAclSettings?: { __typename?: 'PageAclSettings', contentItemId?: number | null, inheritFromParent?: boolean | null } | null };

export type ListVisitorGroupsQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type ListVisitorGroupsQuery = { __typename?: 'Query', listVisitorGroups?: Array<{ __typename?: 'VisitorGroup', id?: number | null, siteId?: number | null, name?: string | null, ruleJson?: string | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type UpsertVisitorGroupMutationVariables = Exact<{
  id?: InputMaybe<Scalars['Int']['input']>;
  siteId: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  ruleJson: Scalars['String']['input'];
}>;


export type UpsertVisitorGroupMutation = { __typename?: 'Mutation', upsertVisitorGroup?: { __typename?: 'VisitorGroup', id?: number | null, siteId?: number | null, name?: string | null, ruleJson?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteVisitorGroupMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteVisitorGroupMutation = { __typename?: 'Mutation', deleteVisitorGroup?: boolean | null };

export type GetPageTargetingQueryVariables = Exact<{
  contentItemId: Scalars['Int']['input'];
}>;


export type GetPageTargetingQuery = { __typename?: 'Query', getPageTargeting?: { __typename?: 'PageTargeting', contentItemId?: number | null, inheritFromParent?: boolean | null, allowVisitorGroupIdsJson?: string | null, denyVisitorGroupIdsJson?: string | null, denyBehavior?: string | null, fallbackContentItemId?: number | null } | null };

export type EvaluatePageTargetingQueryVariables = Exact<{
  contentItemId: Scalars['Int']['input'];
  contextJson?: InputMaybe<Scalars['String']['input']>;
}>;


export type EvaluatePageTargetingQuery = { __typename?: 'Query', evaluatePageTargeting?: { __typename?: 'PageTargetingEvaluation', allowed?: boolean | null, reason?: string | null, matchedAllowGroupIds?: Array<number> | null, matchedDenyGroupIds?: Array<number> | null, fallbackContentItemId?: number | null } | null };

export type UpsertPageTargetingMutationVariables = Exact<{
  contentItemId: Scalars['Int']['input'];
  inheritFromParent: Scalars['Boolean']['input'];
  allowVisitorGroupIdsJson: Scalars['String']['input'];
  denyVisitorGroupIdsJson: Scalars['String']['input'];
  denyBehavior: Scalars['String']['input'];
  fallbackContentItemId?: InputMaybe<Scalars['Int']['input']>;
}>;


export type UpsertPageTargetingMutation = { __typename?: 'Mutation', upsertPageTargeting?: { __typename?: 'PageTargeting', contentItemId?: number | null, inheritFromParent?: boolean | null, allowVisitorGroupIdsJson?: string | null, denyVisitorGroupIdsJson?: string | null, denyBehavior?: string | null, fallbackContentItemId?: number | null } | null };

export type DbAdminTablesQueryVariables = Exact<{
  dangerMode?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type DbAdminTablesQuery = { __typename?: 'Query', dbAdminTables?: Array<{ __typename?: 'DbAdminTableListItem', name?: string | null, schema?: string | null, rowCount?: number | null }> | null };

export type DbAdminDescribeQueryVariables = Exact<{
  table: Scalars['String']['input'];
  dangerMode?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type DbAdminDescribeQuery = { __typename?: 'Query', dbAdminDescribe?: { __typename?: 'DbAdminTable', table?: string | null, primaryKey?: Array<string> | null, columns?: Array<{ __typename?: 'DbAdminColumn', name?: string | null, type?: string | null, nullable?: boolean | null, defaultValue?: string | null, primaryKey?: boolean | null, position?: number | null }> | null, indexes?: Array<{ __typename?: 'DbAdminIndex', name?: string | null, columns?: Array<string> | null, unique?: boolean | null }> | null } | null };

export type DbAdminListQueryVariables = Exact<{
  table: Scalars['String']['input'];
  paging?: InputMaybe<DbAdminPagingInput>;
  sort?: InputMaybe<DbAdminSortInput>;
  filter?: InputMaybe<Array<DbAdminFilterInput> | DbAdminFilterInput>;
  dangerMode?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type DbAdminListQuery = { __typename?: 'Query', dbAdminList?: { __typename?: 'DbAdminListResult', total?: number | null, rowsJson?: string | null } | null };

export type DbAdminInsertMutationVariables = Exact<{
  table: Scalars['String']['input'];
  rowJson: Scalars['String']['input'];
  dangerMode?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type DbAdminInsertMutation = { __typename?: 'Mutation', dbAdminInsert?: { __typename?: 'DbAdminMutationResult', ok?: boolean | null, affected?: number | null } | null };

export type DbAdminUpdateMutationVariables = Exact<{
  table: Scalars['String']['input'];
  pkJson: Scalars['String']['input'];
  patchJson: Scalars['String']['input'];
  dangerMode?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type DbAdminUpdateMutation = { __typename?: 'Mutation', dbAdminUpdate?: { __typename?: 'DbAdminMutationResult', ok?: boolean | null, affected?: number | null } | null };

export type DbAdminDeleteMutationVariables = Exact<{
  table: Scalars['String']['input'];
  pkJson: Scalars['String']['input'];
  dangerMode?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type DbAdminDeleteMutation = { __typename?: 'Mutation', dbAdminDelete?: { __typename?: 'DbAdminMutationResult', ok?: boolean | null, affected?: number | null } | null };

export type DbAdminSqlMutationVariables = Exact<{
  query: Scalars['String']['input'];
  paramsJson?: InputMaybe<Scalars['String']['input']>;
  allowWrites?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type DbAdminSqlMutation = { __typename?: 'Mutation', dbAdminSql?: { __typename?: 'DbAdminSqlResult', readOnly?: boolean | null, columns?: Array<string> | null, rowsJson?: string | null, rowCount?: number | null, message?: string | null, executedSql?: string | null } | null };

export type ListContentTypesQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type ListContentTypesQuery = { __typename?: 'Query', listContentTypes?: Array<{ __typename?: 'ContentType', id?: number | null, siteId?: number | null, name?: string | null, description?: string | null, fieldsJson?: string | null, allowedComponentsJson?: string | null, componentAreaRestrictionsJson?: string | null, createdAt?: string | null, createdBy?: string | null, updatedAt?: string | null, updatedBy?: string | null }> | null };

export type ListComponentTypeSettingsQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type ListComponentTypeSettingsQuery = { __typename?: 'Query', listComponentTypeSettings?: Array<{ __typename?: 'ComponentTypeSetting', siteId?: number | null, componentTypeId?: string | null, enabled?: boolean | null, groupName?: string | null, updatedAt?: string | null, updatedBy?: string | null }> | null };

export type ListContentItemsQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type ListContentItemsQuery = { __typename?: 'Query', listContentItems?: Array<{ __typename?: 'ContentItem', id?: number | null, siteId?: number | null, contentTypeId?: number | null, parentId?: number | null, sortOrder?: number | null, archived?: boolean | null, createdAt?: string | null, createdBy?: string | null, currentDraftVersionId?: number | null, currentPublishedVersionId?: number | null }> | null };

export type GetContentItemDetailQueryVariables = Exact<{
  contentItemId: Scalars['Int']['input'];
}>;


export type GetContentItemDetailQuery = { __typename?: 'Query', getContentItemDetail?: { __typename?: 'ContentItemDetail', item?: { __typename?: 'ContentItem', id?: number | null, siteId?: number | null, contentTypeId?: number | null, parentId?: number | null, sortOrder?: number | null, archived?: boolean | null, currentDraftVersionId?: number | null, currentPublishedVersionId?: number | null, createdAt?: string | null, createdBy?: string | null } | null, contentType?: { __typename?: 'ContentType', id?: number | null, name?: string | null, fieldsJson?: string | null, allowedComponentsJson?: string | null, componentAreaRestrictionsJson?: string | null } | null, currentDraftVersion?: { __typename?: 'ContentVersion', id?: number | null, versionNumber?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null } | null, currentPublishedVersion?: { __typename?: 'ContentVersion', id?: number | null, versionNumber?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null } | null } | null };

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

export type GetPageTreeQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
  marketCode: Scalars['String']['input'];
  localeCode: Scalars['String']['input'];
}>;


export type GetPageTreeQuery = { __typename?: 'Query', getPageTree?: Array<{ __typename?: 'PageTreeNode', id?: number | null, title?: string | null, slug?: string | null, status?: string | null, parentId?: number | null, sortOrder?: number | null, route?: { __typename?: 'ContentRoute', id?: number | null, siteId?: number | null, contentItemId?: number | null, marketCode?: string | null, localeCode?: string | null, slug?: string | null, isCanonical?: boolean | null, createdAt?: string | null } | null, children?: Array<{ __typename?: 'PageTreeNode', id?: number | null, title?: string | null, slug?: string | null, status?: string | null, parentId?: number | null, sortOrder?: number | null, route?: { __typename?: 'ContentRoute', id?: number | null, siteId?: number | null, contentItemId?: number | null, marketCode?: string | null, localeCode?: string | null, slug?: string | null, isCanonical?: boolean | null, createdAt?: string | null } | null, children?: Array<{ __typename?: 'PageTreeNode', id?: number | null, title?: string | null, slug?: string | null, status?: string | null, parentId?: number | null, sortOrder?: number | null, route?: { __typename?: 'ContentRoute', id?: number | null, siteId?: number | null, contentItemId?: number | null, marketCode?: string | null, localeCode?: string | null, slug?: string | null, isCanonical?: boolean | null, createdAt?: string | null } | null }> | null }> | null }> | null };

export type ResolveRouteQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
  marketCode: Scalars['String']['input'];
  localeCode: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  previewToken?: InputMaybe<Scalars['String']['input']>;
  preview?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type ResolveRouteQuery = { __typename?: 'Query', resolveRoute?: { __typename?: 'ResolvedRoute', mode?: string | null, route?: { __typename?: 'ContentRoute', id?: number | null, slug?: string | null, marketCode?: string | null, localeCode?: string | null, contentItemId?: number | null, isCanonical?: boolean | null } | null, contentItem?: { __typename?: 'ContentItem', id?: number | null, contentTypeId?: number | null, currentDraftVersionId?: number | null, currentPublishedVersionId?: number | null } | null, contentType?: { __typename?: 'ContentType', id?: number | null, name?: string | null, fieldsJson?: string | null, allowedComponentsJson?: string | null, componentAreaRestrictionsJson?: string | null } | null, version?: { __typename?: 'ContentVersion', id?: number | null, versionNumber?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null } | null } | null };

export type CreateContentTypeMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  fieldsJson: Scalars['String']['input'];
  allowedComponentsJson?: InputMaybe<Scalars['String']['input']>;
  componentAreaRestrictionsJson?: InputMaybe<Scalars['String']['input']>;
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateContentTypeMutation = { __typename?: 'Mutation', createContentType?: { __typename?: 'ContentType', id?: number | null, siteId?: number | null, name?: string | null, description?: string | null, fieldsJson?: string | null, allowedComponentsJson?: string | null, componentAreaRestrictionsJson?: string | null } | null };

export type UpdateContentTypeMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  fieldsJson: Scalars['String']['input'];
  allowedComponentsJson?: InputMaybe<Scalars['String']['input']>;
  componentAreaRestrictionsJson?: InputMaybe<Scalars['String']['input']>;
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateContentTypeMutation = { __typename?: 'Mutation', updateContentType?: { __typename?: 'ContentType', id?: number | null, siteId?: number | null, name?: string | null, description?: string | null, fieldsJson?: string | null, allowedComponentsJson?: string | null, componentAreaRestrictionsJson?: string | null } | null };

export type UpsertComponentTypeSettingMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  componentTypeId: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
  groupName?: InputMaybe<Scalars['String']['input']>;
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpsertComponentTypeSettingMutation = { __typename?: 'Mutation', upsertComponentTypeSetting?: { __typename?: 'ComponentTypeSetting', siteId?: number | null, componentTypeId?: string | null, enabled?: boolean | null, groupName?: string | null, updatedAt?: string | null, updatedBy?: string | null } | null };

export type DeleteContentTypeMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteContentTypeMutation = { __typename?: 'Mutation', deleteContentType?: boolean | null };

export type CreateContentItemMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  contentTypeId: Scalars['Int']['input'];
  parentId?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  initialFieldsJson?: InputMaybe<Scalars['String']['input']>;
  initialCompositionJson?: InputMaybe<Scalars['String']['input']>;
  initialComponentsJson?: InputMaybe<Scalars['String']['input']>;
  metadataJson?: InputMaybe<Scalars['String']['input']>;
  comment?: InputMaybe<Scalars['String']['input']>;
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateContentItemMutation = { __typename?: 'Mutation', createContentItem?: { __typename?: 'ContentItem', id?: number | null, siteId?: number | null, contentTypeId?: number | null, parentId?: number | null, sortOrder?: number | null, archived?: boolean | null, currentDraftVersionId?: number | null, currentPublishedVersionId?: number | null } | null };

export type CreateChildPageMutationVariables = Exact<{
  parentId: Scalars['Int']['input'];
  siteId: Scalars['Int']['input'];
  contentTypeId: Scalars['Int']['input'];
  initialFieldsJson?: InputMaybe<Scalars['String']['input']>;
  initialCompositionJson?: InputMaybe<Scalars['String']['input']>;
  initialComponentsJson?: InputMaybe<Scalars['String']['input']>;
  metadataJson?: InputMaybe<Scalars['String']['input']>;
  comment?: InputMaybe<Scalars['String']['input']>;
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateChildPageMutation = { __typename?: 'Mutation', createChildPage?: { __typename?: 'ContentItem', id?: number | null, siteId?: number | null, contentTypeId?: number | null, parentId?: number | null, sortOrder?: number | null, archived?: boolean | null, currentDraftVersionId?: number | null, currentPublishedVersionId?: number | null } | null };

export type MovePageMutationVariables = Exact<{
  pageId: Scalars['Int']['input'];
  newParentId?: InputMaybe<Scalars['Int']['input']>;
  newSortOrder?: InputMaybe<Scalars['Int']['input']>;
}>;


export type MovePageMutation = { __typename?: 'Mutation', movePage?: { __typename?: 'ContentItem', id?: number | null, parentId?: number | null, sortOrder?: number | null } | null };

export type ReorderSiblingsMutationVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']['input']>;
  orderedIds: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
}>;


export type ReorderSiblingsMutation = { __typename?: 'Mutation', reorderSiblings?: boolean | null };

export type DeletePageMutationVariables = Exact<{
  pageId: Scalars['Int']['input'];
}>;


export type DeletePageMutation = { __typename?: 'Mutation', deletePage?: boolean | null };

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

export type AddComponentMutationVariables = Exact<{
  contentVersionId: Scalars['Int']['input'];
  componentTypeId: Scalars['String']['input'];
  area: Scalars['String']['input'];
  initialProps?: InputMaybe<Scalars['String']['input']>;
}>;


export type AddComponentMutation = { __typename?: 'Mutation', addComponent?: { __typename?: 'ContentVersion', id?: number | null, contentItemId?: number | null, versionNumber?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null } | null };

export type UpdateComponentPropsMutationVariables = Exact<{
  instanceId: Scalars['String']['input'];
  patch: Scalars['String']['input'];
}>;


export type UpdateComponentPropsMutation = { __typename?: 'Mutation', updateComponentProps?: { __typename?: 'ContentVersion', id?: number | null, contentItemId?: number | null, versionNumber?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null } | null };

export type RemoveComponentMutationVariables = Exact<{
  instanceId: Scalars['String']['input'];
}>;


export type RemoveComponentMutation = { __typename?: 'Mutation', removeComponent?: { __typename?: 'ContentVersion', id?: number | null, contentItemId?: number | null, versionNumber?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null } | null };

export type MoveComponentMutationVariables = Exact<{
  instanceId: Scalars['String']['input'];
  newArea: Scalars['String']['input'];
  newSortOrder: Scalars['Int']['input'];
}>;


export type MoveComponentMutation = { __typename?: 'Mutation', moveComponent?: { __typename?: 'ContentVersion', id?: number | null, contentItemId?: number | null, versionNumber?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null, comment?: string | null } | null };

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

export type ListVariantSetsQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
  contentItemId?: InputMaybe<Scalars['Int']['input']>;
  marketCode?: InputMaybe<Scalars['String']['input']>;
  localeCode?: InputMaybe<Scalars['String']['input']>;
}>;


export type ListVariantSetsQuery = { __typename?: 'Query', listVariantSets?: Array<{ __typename?: 'VariantSet', id?: number | null, siteId?: number | null, contentItemId?: number | null, marketCode?: string | null, localeCode?: string | null, fallbackVariantSetId?: number | null, active?: boolean | null }> | null };

export type ListVariantsQueryVariables = Exact<{
  variantSetId: Scalars['Int']['input'];
}>;


export type ListVariantsQuery = { __typename?: 'Query', listVariants?: Array<{ __typename?: 'Variant', id?: number | null, variantSetId?: number | null, key?: string | null, priority?: number | null, ruleJson?: string | null, state?: string | null, trafficAllocation?: number | null, contentVersionId?: number | null }> | null };

export type SelectVariantQueryVariables = Exact<{
  variantSetId: Scalars['Int']['input'];
  contextJson?: InputMaybe<Scalars['String']['input']>;
}>;


export type SelectVariantQuery = { __typename?: 'Query', selectVariant?: { __typename?: 'VariantSelection', reason?: string | null, variantSetId?: number | null, variant?: { __typename?: 'Variant', id?: number | null, key?: string | null, contentVersionId?: number | null } | null } | null };

export type GetPageByRouteQueryVariables = Exact<{
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


export type GetPageByRouteQuery = { __typename?: 'Query', getPageByRoute?: { __typename?: 'PageByRoute', selectionReason?: string | null, selectedVariant?: { __typename?: 'Variant', id?: number | null, key?: string | null, contentVersionId?: number | null } | null, selectedVersion?: { __typename?: 'ContentVersion', id?: number | null, state?: string | null, fieldsJson?: string | null, compositionJson?: string | null, componentsJson?: string | null, metadataJson?: string | null } | null, base?: { __typename?: 'ResolvedRoute', mode?: string | null, route?: { __typename?: 'ContentRoute', id?: number | null, slug?: string | null, marketCode?: string | null, localeCode?: string | null } | null, contentItem?: { __typename?: 'ContentItem', id?: number | null, contentTypeId?: number | null } | null, contentType?: { __typename?: 'ContentType', id?: number | null, name?: string | null, fieldsJson?: string | null } | null } | null } | null };

export type UpsertVariantSetMutationVariables = Exact<{
  id?: InputMaybe<Scalars['Int']['input']>;
  siteId: Scalars['Int']['input'];
  contentItemId: Scalars['Int']['input'];
  marketCode: Scalars['String']['input'];
  localeCode: Scalars['String']['input'];
  fallbackVariantSetId?: InputMaybe<Scalars['Int']['input']>;
  active: Scalars['Boolean']['input'];
}>;


export type UpsertVariantSetMutation = { __typename?: 'Mutation', upsertVariantSet?: { __typename?: 'VariantSet', id?: number | null, siteId?: number | null, contentItemId?: number | null, marketCode?: string | null, localeCode?: string | null, fallbackVariantSetId?: number | null, active?: boolean | null } | null };

export type DeleteVariantSetMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteVariantSetMutation = { __typename?: 'Mutation', deleteVariantSet?: boolean | null };

export type UpsertVariantMutationVariables = Exact<{
  id?: InputMaybe<Scalars['Int']['input']>;
  variantSetId: Scalars['Int']['input'];
  key: Scalars['String']['input'];
  priority: Scalars['Int']['input'];
  ruleJson: Scalars['String']['input'];
  state: Scalars['String']['input'];
  trafficAllocation?: InputMaybe<Scalars['Int']['input']>;
  contentVersionId: Scalars['Int']['input'];
}>;


export type UpsertVariantMutation = { __typename?: 'Mutation', upsertVariant?: { __typename?: 'Variant', id?: number | null, variantSetId?: number | null, key?: string | null, priority?: number | null, ruleJson?: string | null, state?: string | null, trafficAllocation?: number | null, contentVersionId?: number | null } | null };

export type DeleteVariantMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteVariantMutation = { __typename?: 'Mutation', deleteVariant?: boolean | null };

export type ListFormsQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type ListFormsQuery = { __typename?: 'Query', listForms?: Array<{ __typename?: 'Form', id?: number | null, siteId?: number | null, name?: string | null, description?: string | null, active?: boolean | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type ListFormStepsQueryVariables = Exact<{
  formId: Scalars['Int']['input'];
}>;


export type ListFormStepsQuery = { __typename?: 'Query', listFormSteps?: Array<{ __typename?: 'FormStep', id?: number | null, formId?: number | null, name?: string | null, position?: number | null }> | null };

export type ListFormFieldsQueryVariables = Exact<{
  formId: Scalars['Int']['input'];
}>;


export type ListFormFieldsQuery = { __typename?: 'Query', listFormFields?: Array<{ __typename?: 'FormField', id?: number | null, stepId?: number | null, formId?: number | null, key?: string | null, label?: string | null, fieldType?: string | null, position?: number | null, conditionsJson?: string | null, validationsJson?: string | null, uiConfigJson?: string | null, active?: boolean | null }> | null };

export type EvaluateFormQueryVariables = Exact<{
  formId: Scalars['Int']['input'];
  answersJson: Scalars['String']['input'];
  contextJson?: InputMaybe<Scalars['String']['input']>;
}>;


export type EvaluateFormQuery = { __typename?: 'Query', evaluateForm?: { __typename?: 'FormEvaluation', formId?: number | null, valid?: boolean | null, evaluatedFieldsJson?: string | null, errorsJson?: string | null } | null };

export type ListFormSubmissionsQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
  formId?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  marketCode?: InputMaybe<Scalars['String']['input']>;
  localeCode?: InputMaybe<Scalars['String']['input']>;
  fromDate?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sortField?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['String']['input']>;
}>;


export type ListFormSubmissionsQuery = { __typename?: 'Query', listFormSubmissions?: { __typename?: 'FormSubmissionList', total?: number | null, rows?: Array<{ __typename?: 'FormSubmission', id?: number | null, siteId?: number | null, formId?: number | null, createdAt?: string | null, submittedByUserId?: string | null, marketCode?: string | null, localeCode?: string | null, pageContentItemId?: number | null, pageRouteSlug?: string | null, status?: string | null, dataJson?: string | null, metaJson?: string | null }> | null } | null };

export type ExportFormSubmissionsQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
  formId?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  marketCode?: InputMaybe<Scalars['String']['input']>;
  localeCode?: InputMaybe<Scalars['String']['input']>;
  fromDate?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['String']['input']>;
  format: Scalars['String']['input'];
}>;


export type ExportFormSubmissionsQuery = { __typename?: 'Query', exportFormSubmissions?: string | null };

export type UpsertFormMutationVariables = Exact<{
  id?: InputMaybe<Scalars['Int']['input']>;
  siteId: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  active: Scalars['Boolean']['input'];
}>;


export type UpsertFormMutation = { __typename?: 'Mutation', upsertForm?: { __typename?: 'Form', id?: number | null, siteId?: number | null, name?: string | null, description?: string | null, active?: boolean | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteFormMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteFormMutation = { __typename?: 'Mutation', deleteForm?: boolean | null };

export type UpsertFormStepMutationVariables = Exact<{
  id?: InputMaybe<Scalars['Int']['input']>;
  formId: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  position: Scalars['Int']['input'];
}>;


export type UpsertFormStepMutation = { __typename?: 'Mutation', upsertFormStep?: { __typename?: 'FormStep', id?: number | null, formId?: number | null, name?: string | null, position?: number | null } | null };

export type DeleteFormStepMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteFormStepMutation = { __typename?: 'Mutation', deleteFormStep?: boolean | null };

export type UpsertFormFieldMutationVariables = Exact<{
  id?: InputMaybe<Scalars['Int']['input']>;
  stepId: Scalars['Int']['input'];
  formId: Scalars['Int']['input'];
  key: Scalars['String']['input'];
  label: Scalars['String']['input'];
  fieldType: Scalars['String']['input'];
  position: Scalars['Int']['input'];
  conditionsJson: Scalars['String']['input'];
  validationsJson: Scalars['String']['input'];
  uiConfigJson: Scalars['String']['input'];
  active: Scalars['Boolean']['input'];
}>;


export type UpsertFormFieldMutation = { __typename?: 'Mutation', upsertFormField?: { __typename?: 'FormField', id?: number | null, stepId?: number | null, formId?: number | null, key?: string | null, label?: string | null, fieldType?: string | null, position?: number | null, conditionsJson?: string | null, validationsJson?: string | null, uiConfigJson?: string | null, active?: boolean | null } | null };

export type DeleteFormFieldMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteFormFieldMutation = { __typename?: 'Mutation', deleteFormField?: boolean | null };

export type SubmitFormMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  formId: Scalars['Int']['input'];
  marketCode: Scalars['String']['input'];
  localeCode: Scalars['String']['input'];
  pageContentItemId?: InputMaybe<Scalars['Int']['input']>;
  pageRouteSlug?: InputMaybe<Scalars['String']['input']>;
  submittedByUserId?: InputMaybe<Scalars['String']['input']>;
  answersJson: Scalars['String']['input'];
  contextJson?: InputMaybe<Scalars['String']['input']>;
  metaJson?: InputMaybe<Scalars['String']['input']>;
}>;


export type SubmitFormMutation = { __typename?: 'Mutation', submitForm?: { __typename?: 'FormSubmission', id?: number | null, siteId?: number | null, formId?: number | null, createdAt?: string | null, status?: string | null } | null };

export type UpdateSubmissionStatusMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  status: Scalars['String']['input'];
}>;


export type UpdateSubmissionStatusMutation = { __typename?: 'Mutation', updateSubmissionStatus?: { __typename?: 'FormSubmission', id?: number | null, status?: string | null } | null };

export type ListWorkflowDefinitionsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListWorkflowDefinitionsQuery = { __typename?: 'Query', listWorkflowDefinitions?: Array<{ __typename?: 'WorkflowDefinition', id?: number | null, name?: string | null, version?: number | null, graphJson?: string | null, inputSchemaJson?: string | null, permissionsJson?: string | null, createdAt?: string | null, createdBy?: string | null }> | null };

export type ListWorkflowRunsQueryVariables = Exact<{
  definitionId?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListWorkflowRunsQuery = { __typename?: 'Query', listWorkflowRuns?: Array<{ __typename?: 'WorkflowRun', id?: number | null, definitionId?: number | null, status?: string | null, contextJson?: string | null, currentNodeId?: string | null, logsJson?: string | null, startedAt?: string | null, startedBy?: string | null, updatedAt?: string | null }> | null };

export type GetWorkflowRunQueryVariables = Exact<{
  runId: Scalars['Int']['input'];
}>;


export type GetWorkflowRunQuery = { __typename?: 'Query', getWorkflowRun?: { __typename?: 'WorkflowRun', id?: number | null, definitionId?: number | null, status?: string | null, contextJson?: string | null, currentNodeId?: string | null, logsJson?: string | null, startedAt?: string | null, startedBy?: string | null, updatedAt?: string | null } | null };

export type UpsertWorkflowDefinitionMutationVariables = Exact<{
  id?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  version: Scalars['Int']['input'];
  graphJson: Scalars['String']['input'];
  inputSchemaJson: Scalars['String']['input'];
  permissionsJson: Scalars['String']['input'];
  createdBy?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpsertWorkflowDefinitionMutation = { __typename?: 'Mutation', upsertWorkflowDefinition?: { __typename?: 'WorkflowDefinition', id?: number | null, name?: string | null, version?: number | null, graphJson?: string | null, inputSchemaJson?: string | null, permissionsJson?: string | null, createdAt?: string | null, createdBy?: string | null } | null };

export type DeleteWorkflowDefinitionMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteWorkflowDefinitionMutation = { __typename?: 'Mutation', deleteWorkflowDefinition?: boolean | null };

export type StartWorkflowRunMutationVariables = Exact<{
  definitionId: Scalars['Int']['input'];
  contextJson: Scalars['String']['input'];
  startedBy?: InputMaybe<Scalars['String']['input']>;
}>;


export type StartWorkflowRunMutation = { __typename?: 'Mutation', startWorkflowRun?: { __typename?: 'WorkflowRun', id?: number | null, definitionId?: number | null, status?: string | null, contextJson?: string | null, currentNodeId?: string | null, logsJson?: string | null, startedAt?: string | null, startedBy?: string | null, updatedAt?: string | null } | null };

export type ApproveStepMutationVariables = Exact<{
  runId: Scalars['Int']['input'];
  nodeId: Scalars['String']['input'];
  approvedBy?: InputMaybe<Scalars['String']['input']>;
}>;


export type ApproveStepMutation = { __typename?: 'Mutation', approveStep?: { __typename?: 'WorkflowRun', id?: number | null, definitionId?: number | null, status?: string | null, contextJson?: string | null, currentNodeId?: string | null, logsJson?: string | null, startedAt?: string | null, startedBy?: string | null, updatedAt?: string | null } | null };

export type RetryFailedMutationVariables = Exact<{
  runId: Scalars['Int']['input'];
}>;


export type RetryFailedMutation = { __typename?: 'Mutation', retryFailed?: { __typename?: 'WorkflowRun', id?: number | null, definitionId?: number | null, status?: string | null, contextJson?: string | null, currentNodeId?: string | null, logsJson?: string | null, startedAt?: string | null, startedBy?: string | null, updatedAt?: string | null } | null };

export type AiGenerateContentTypeMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  prompt: Scalars['String']['input'];
  nameHint?: InputMaybe<Scalars['String']['input']>;
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type AiGenerateContentTypeMutation = { __typename?: 'Mutation', aiGenerateContentType?: { __typename?: 'ContentType', id?: number | null, siteId?: number | null, name?: string | null, description?: string | null, fieldsJson?: string | null } | null };

export type AiGenerateContentMutationVariables = Exact<{
  contentItemId?: InputMaybe<Scalars['Int']['input']>;
  siteId?: InputMaybe<Scalars['Int']['input']>;
  contentTypeId?: InputMaybe<Scalars['Int']['input']>;
  prompt: Scalars['String']['input'];
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type AiGenerateContentMutation = { __typename?: 'Mutation', aiGenerateContent?: { __typename?: 'AiContentResult', contentItemId?: number | null, draftVersionId?: number | null } | null };

export type AiGenerateVariantsMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  contentItemId: Scalars['Int']['input'];
  marketCode: Scalars['String']['input'];
  localeCode: Scalars['String']['input'];
  variantSetId?: InputMaybe<Scalars['Int']['input']>;
  targetVersionId: Scalars['Int']['input'];
  prompt: Scalars['String']['input'];
}>;


export type AiGenerateVariantsMutation = { __typename?: 'Mutation', aiGenerateVariants?: { __typename?: 'AiVariantsResult', variantSetId?: number | null, createdKeys?: Array<string> | null } | null };

export type AiTranslateVersionMutationVariables = Exact<{
  versionId: Scalars['Int']['input'];
  targetMarketCode: Scalars['String']['input'];
  targetLocaleCode: Scalars['String']['input'];
  by?: InputMaybe<Scalars['String']['input']>;
}>;


export type AiTranslateVersionMutation = { __typename?: 'Mutation', aiTranslateVersion?: { __typename?: 'AiContentResult', contentItemId?: number | null, draftVersionId?: number | null } | null };

export type DevDiagnosticsQueryVariables = Exact<{ [key: string]: never; }>;


export type DevDiagnosticsQuery = { __typename?: 'Query', devDiagnostics?: { __typename?: 'DevDiagnostics', roles?: Array<string> | null, permissions?: Array<string> | null, seedStatus?: { __typename?: 'SecuritySeedStatus', adminRoleExists?: boolean | null, adminPermissionCoverage?: boolean | null, adminUserHasRole?: boolean | null } | null } | null };

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

export type UpsertSiteLocaleOverrideMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  code: Scalars['String']['input'];
  displayName?: InputMaybe<Scalars['String']['input']>;
  fallbackLocaleCode?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpsertSiteLocaleOverrideMutation = { __typename?: 'Mutation', upsertSiteLocaleOverride?: Array<{ __typename?: 'Locale', code?: string | null, name?: string | null, active?: boolean | null, fallbackLocaleCode?: string | null, isDefault?: boolean | null }> | null };

export type SetSiteUrlPatternMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  urlPattern: Scalars['String']['input'];
}>;


export type SetSiteUrlPatternMutation = { __typename?: 'Mutation', setSiteUrlPattern?: { __typename?: 'Site', id?: number | null, name?: string | null, active?: boolean | null, urlPattern?: string | null } | null };

export type SetSiteNameMutationVariables = Exact<{
  siteId: Scalars['Int']['input'];
  name: Scalars['String']['input'];
}>;


export type SetSiteNameMutation = { __typename?: 'Mutation', setSiteName?: { __typename?: 'Site', id?: number | null, name?: string | null, active?: boolean | null, urlPattern?: string | null } | null };

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


export type ListSitesQuery = { __typename?: 'Query', listSites?: Array<{ __typename?: 'Site', id?: number | null, name?: string | null, active?: boolean | null, urlPattern?: string | null }> | null };

export type GetSiteQueryVariables = Exact<{
  siteId: Scalars['Int']['input'];
}>;


export type GetSiteQuery = { __typename?: 'Query', getSite?: { __typename?: 'Site', id?: number | null, name?: string | null, active?: boolean | null, urlPattern?: string | null } | null };

export type LocaleCatalogQueryVariables = Exact<{ [key: string]: never; }>;


export type LocaleCatalogQuery = { __typename?: 'Query', localeCatalog?: Array<{ __typename?: 'LocaleCatalogItem', code?: string | null, name?: string | null, language?: string | null, region?: string | null }> | null };

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


export const ListAssetsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListAssets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tags"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listAssets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"tags"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tags"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"originalName"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"bytes"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"checksum"}},{"kind":"Field","name":{"kind":"Name","value":"storagePath"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"altText"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tagsJson"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<ListAssetsQuery, ListAssetsQueryVariables>;
export const GetAssetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAsset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAsset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"originalName"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"bytes"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"checksum"}},{"kind":"Field","name":{"kind":"Name","value":"storagePath"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"altText"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tagsJson"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetAssetQuery, GetAssetQueryVariables>;
export const ListAssetFoldersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListAssetFolders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listAssetFolders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}}]}}]}}]} as unknown as DocumentNode<ListAssetFoldersQuery, ListAssetFoldersQueryVariables>;
export const CreateAssetFolderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAssetFolder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAssetFolder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}}]}}]}}]} as unknown as DocumentNode<CreateAssetFolderMutation, CreateAssetFolderMutationVariables>;
export const UpdateAssetMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAssetMetadata"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"altText"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tags"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAssetMetadata"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"Argument","name":{"kind":"Name","value":"altText"},"value":{"kind":"Variable","name":{"kind":"Name","value":"altText"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"Argument","name":{"kind":"Name","value":"tags"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tags"}}},{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"altText"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tagsJson"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateAssetMetadataMutation, UpdateAssetMetadataMutationVariables>;
export const DeleteAssetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAsset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAsset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAssetMutation, DeleteAssetMutationVariables>;
export const ListConnectorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListConnectors"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"domain"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listConnectors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"domain"},"value":{"kind":"Variable","name":{"kind":"Name","value":"domain"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"configJson"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ListConnectorsQuery, ListConnectorsQueryVariables>;
export const UpsertConnectorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertConnector"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"domain"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isDefault"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"configJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertConnector"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"domain"},"value":{"kind":"Variable","name":{"kind":"Name","value":"domain"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}},{"kind":"Argument","name":{"kind":"Name","value":"isDefault"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isDefault"}}},{"kind":"Argument","name":{"kind":"Name","value":"configJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"configJson"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"configJson"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpsertConnectorMutation, UpsertConnectorMutationVariables>;
export const DeleteConnectorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteConnector"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteConnector"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteConnectorMutation, DeleteConnectorMutationVariables>;
export const SetDefaultConnectorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetDefaultConnector"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"domain"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDefaultConnector"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"domain"},"value":{"kind":"Variable","name":{"kind":"Name","value":"domain"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"configJson"}}]}}]}}]} as unknown as DocumentNode<SetDefaultConnectorMutation, SetDefaultConnectorMutationVariables>;
export const TestConnectorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestConnector"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testConnector"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<TestConnectorMutation, TestConnectorMutationVariables>;
export const ListInternalUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListInternalUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listInternalUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"roleIds"}},{"kind":"Field","name":{"kind":"Name","value":"groupIds"}}]}}]}}]} as unknown as DocumentNode<ListInternalUsersQuery, ListInternalUsersQueryVariables>;
export const ListInternalRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListInternalRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listInternalRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ListInternalRolesQuery, ListInternalRolesQueryVariables>;
export const InternalPermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"InternalPermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"internalPermissions"}}]}}]} as unknown as DocumentNode<InternalPermissionsQuery, InternalPermissionsQueryVariables>;
export const AclPermissionKeysDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AclPermissionKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aclPermissionKeys"}}]}}]} as unknown as DocumentNode<AclPermissionKeysQuery, AclPermissionKeysQueryVariables>;
export const CreateInternalUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateInternalUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"username"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"displayName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"active"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createInternalUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"username"},"value":{"kind":"Variable","name":{"kind":"Name","value":"username"}}},{"kind":"Argument","name":{"kind":"Name","value":"displayName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"displayName"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}},{"kind":"Argument","name":{"kind":"Name","value":"active"},"value":{"kind":"Variable","name":{"kind":"Name","value":"active"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"roleIds"}},{"kind":"Field","name":{"kind":"Name","value":"groupIds"}}]}}]}}]} as unknown as DocumentNode<CreateInternalUserMutation, CreateInternalUserMutationVariables>;
export const UpdateInternalUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateInternalUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"displayName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"active"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateInternalUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"displayName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"displayName"}}},{"kind":"Argument","name":{"kind":"Name","value":"active"},"value":{"kind":"Variable","name":{"kind":"Name","value":"active"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"roleIds"}},{"kind":"Field","name":{"kind":"Name","value":"groupIds"}}]}}]}}]} as unknown as DocumentNode<UpdateInternalUserMutation, UpdateInternalUserMutationVariables>;
export const ResetInternalUserPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetInternalUserPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetInternalUserPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}]}]}}]} as unknown as DocumentNode<ResetInternalUserPasswordMutation, ResetInternalUserPasswordMutationVariables>;
export const UpsertInternalRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertInternalRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"permissions"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertInternalRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"Argument","name":{"kind":"Name","value":"permissions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"permissions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpsertInternalRoleMutation, UpsertInternalRoleMutationVariables>;
export const DeleteInternalRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteInternalRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteInternalRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteInternalRoleMutation, DeleteInternalRoleMutationVariables>;
export const SetUserRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetUserRoles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roleIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setUserRoles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"roleIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roleIds"}}}]}]}}]} as unknown as DocumentNode<SetUserRolesMutation, SetUserRolesMutationVariables>;
export const SetUserGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetUserGroups"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setUserGroups"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"groupIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupIds"}}}]}]}}]} as unknown as DocumentNode<SetUserGroupsMutation, SetUserGroupsMutationVariables>;
export const ListPrincipalGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListPrincipalGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listPrincipalGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ListPrincipalGroupsQuery, ListPrincipalGroupsQueryVariables>;
export const UpsertPrincipalGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertPrincipalGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertPrincipalGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpsertPrincipalGroupMutation, UpsertPrincipalGroupMutationVariables>;
export const DeletePrincipalGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePrincipalGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePrincipalGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeletePrincipalGroupMutation, DeletePrincipalGroupMutationVariables>;
export const ListEntityAclsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListEntityAcls"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"entityType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"entityId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listEntityAcls"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"entityType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"entityType"}}},{"kind":"Argument","name":{"kind":"Name","value":"entityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"entityId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"principalType"}},{"kind":"Field","name":{"kind":"Name","value":"principalId"}},{"kind":"Field","name":{"kind":"Name","value":"permissionKey"}},{"kind":"Field","name":{"kind":"Name","value":"effect"}}]}}]}}]} as unknown as DocumentNode<ListEntityAclsQuery, ListEntityAclsQueryVariables>;
export const ReplaceEntityAclsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReplaceEntityAcls"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"entityType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"entityId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"entries"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EntityAclEntryInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"replaceEntityAcls"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"entityType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"entityType"}}},{"kind":"Argument","name":{"kind":"Name","value":"entityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"entityId"}}},{"kind":"Argument","name":{"kind":"Name","value":"entries"},"value":{"kind":"Variable","name":{"kind":"Name","value":"entries"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"principalType"}},{"kind":"Field","name":{"kind":"Name","value":"principalId"}},{"kind":"Field","name":{"kind":"Name","value":"permissionKey"}},{"kind":"Field","name":{"kind":"Name","value":"effect"}}]}}]}}]} as unknown as DocumentNode<ReplaceEntityAclsMutation, ReplaceEntityAclsMutationVariables>;
export const GetPageAclSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPageAclSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getPageAclSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"inheritFromParent"}}]}}]}}]} as unknown as DocumentNode<GetPageAclSettingsQuery, GetPageAclSettingsQueryVariables>;
export const UpsertPageAclSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertPageAclSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inheritFromParent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertPageAclSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"inheritFromParent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inheritFromParent"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"inheritFromParent"}}]}}]}}]} as unknown as DocumentNode<UpsertPageAclSettingsMutation, UpsertPageAclSettingsMutationVariables>;
export const ListVisitorGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListVisitorGroups"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listVisitorGroups"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ruleJson"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ListVisitorGroupsQuery, ListVisitorGroupsQueryVariables>;
export const UpsertVisitorGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertVisitorGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ruleJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertVisitorGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"ruleJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ruleJson"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ruleJson"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpsertVisitorGroupMutation, UpsertVisitorGroupMutationVariables>;
export const DeleteVisitorGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteVisitorGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteVisitorGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteVisitorGroupMutation, DeleteVisitorGroupMutationVariables>;
export const GetPageTargetingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPageTargeting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getPageTargeting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"inheritFromParent"}},{"kind":"Field","name":{"kind":"Name","value":"allowVisitorGroupIdsJson"}},{"kind":"Field","name":{"kind":"Name","value":"denyVisitorGroupIdsJson"}},{"kind":"Field","name":{"kind":"Name","value":"denyBehavior"}},{"kind":"Field","name":{"kind":"Name","value":"fallbackContentItemId"}}]}}]}}]} as unknown as DocumentNode<GetPageTargetingQuery, GetPageTargetingQueryVariables>;
export const EvaluatePageTargetingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EvaluatePageTargeting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contextJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"evaluatePageTargeting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"contextJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contextJson"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allowed"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"matchedAllowGroupIds"}},{"kind":"Field","name":{"kind":"Name","value":"matchedDenyGroupIds"}},{"kind":"Field","name":{"kind":"Name","value":"fallbackContentItemId"}}]}}]}}]} as unknown as DocumentNode<EvaluatePageTargetingQuery, EvaluatePageTargetingQueryVariables>;
export const UpsertPageTargetingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertPageTargeting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inheritFromParent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"allowVisitorGroupIdsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"denyVisitorGroupIdsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"denyBehavior"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fallbackContentItemId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertPageTargeting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"inheritFromParent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inheritFromParent"}}},{"kind":"Argument","name":{"kind":"Name","value":"allowVisitorGroupIdsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"allowVisitorGroupIdsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"denyVisitorGroupIdsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"denyVisitorGroupIdsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"denyBehavior"},"value":{"kind":"Variable","name":{"kind":"Name","value":"denyBehavior"}}},{"kind":"Argument","name":{"kind":"Name","value":"fallbackContentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fallbackContentItemId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"inheritFromParent"}},{"kind":"Field","name":{"kind":"Name","value":"allowVisitorGroupIdsJson"}},{"kind":"Field","name":{"kind":"Name","value":"denyVisitorGroupIdsJson"}},{"kind":"Field","name":{"kind":"Name","value":"denyBehavior"}},{"kind":"Field","name":{"kind":"Name","value":"fallbackContentItemId"}}]}}]}}]} as unknown as DocumentNode<UpsertPageTargetingMutation, UpsertPageTargetingMutationVariables>;
export const DbAdminTablesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DbAdminTables"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dangerMode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dbAdminTables"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dangerMode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dangerMode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"schema"}},{"kind":"Field","name":{"kind":"Name","value":"rowCount"}}]}}]}}]} as unknown as DocumentNode<DbAdminTablesQuery, DbAdminTablesQueryVariables>;
export const DbAdminDescribeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DbAdminDescribe"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"table"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dangerMode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dbAdminDescribe"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"table"},"value":{"kind":"Variable","name":{"kind":"Name","value":"table"}}},{"kind":"Argument","name":{"kind":"Name","value":"dangerMode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dangerMode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"table"}},{"kind":"Field","name":{"kind":"Name","value":"primaryKey"}},{"kind":"Field","name":{"kind":"Name","value":"columns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"nullable"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}},{"kind":"Field","name":{"kind":"Name","value":"primaryKey"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}},{"kind":"Field","name":{"kind":"Name","value":"indexes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"columns"}},{"kind":"Field","name":{"kind":"Name","value":"unique"}}]}}]}}]}}]} as unknown as DocumentNode<DbAdminDescribeQuery, DbAdminDescribeQueryVariables>;
export const DbAdminListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DbAdminList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"table"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DbAdminPagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DbAdminSortInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DbAdminFilterInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dangerMode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dbAdminList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"table"},"value":{"kind":"Variable","name":{"kind":"Name","value":"table"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"dangerMode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dangerMode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"rowsJson"}}]}}]}}]} as unknown as DocumentNode<DbAdminListQuery, DbAdminListQueryVariables>;
export const DbAdminInsertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DbAdminInsert"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"table"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rowJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dangerMode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dbAdminInsert"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"table"},"value":{"kind":"Variable","name":{"kind":"Name","value":"table"}}},{"kind":"Argument","name":{"kind":"Name","value":"rowJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rowJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"dangerMode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dangerMode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ok"}},{"kind":"Field","name":{"kind":"Name","value":"affected"}}]}}]}}]} as unknown as DocumentNode<DbAdminInsertMutation, DbAdminInsertMutationVariables>;
export const DbAdminUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DbAdminUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"table"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pkJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"patchJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dangerMode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dbAdminUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"table"},"value":{"kind":"Variable","name":{"kind":"Name","value":"table"}}},{"kind":"Argument","name":{"kind":"Name","value":"pkJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pkJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"patchJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"patchJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"dangerMode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dangerMode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ok"}},{"kind":"Field","name":{"kind":"Name","value":"affected"}}]}}]}}]} as unknown as DocumentNode<DbAdminUpdateMutation, DbAdminUpdateMutationVariables>;
export const DbAdminDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DbAdminDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"table"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pkJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dangerMode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dbAdminDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"table"},"value":{"kind":"Variable","name":{"kind":"Name","value":"table"}}},{"kind":"Argument","name":{"kind":"Name","value":"pkJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pkJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"dangerMode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dangerMode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ok"}},{"kind":"Field","name":{"kind":"Name","value":"affected"}}]}}]}}]} as unknown as DocumentNode<DbAdminDeleteMutation, DbAdminDeleteMutationVariables>;
export const DbAdminSqlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DbAdminSql"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paramsJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"allowWrites"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dbAdminSql"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"paramsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paramsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"allowWrites"},"value":{"kind":"Variable","name":{"kind":"Name","value":"allowWrites"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readOnly"}},{"kind":"Field","name":{"kind":"Name","value":"columns"}},{"kind":"Field","name":{"kind":"Name","value":"rowsJson"}},{"kind":"Field","name":{"kind":"Name","value":"rowCount"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"executedSql"}}]}}]}}]} as unknown as DocumentNode<DbAdminSqlMutation, DbAdminSqlMutationVariables>;
export const ListContentTypesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListContentTypes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listContentTypes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"allowedComponentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentAreaRestrictionsJson"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"}}]}}]}}]} as unknown as DocumentNode<ListContentTypesQuery, ListContentTypesQueryVariables>;
export const ListComponentTypeSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListComponentTypeSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listComponentTypeSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"componentTypeId"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"}}]}}]}}]} as unknown as DocumentNode<ListComponentTypeSettingsQuery, ListComponentTypeSettingsQueryVariables>;
export const ListContentItemsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListContentItems"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listContentItems"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentTypeId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"currentDraftVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"currentPublishedVersionId"}}]}}]}}]} as unknown as DocumentNode<ListContentItemsQuery, ListContentItemsQueryVariables>;
export const GetContentItemDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetContentItemDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getContentItemDetail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentTypeId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"currentDraftVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"currentPublishedVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contentType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"allowedComponentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentAreaRestrictionsJson"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentDraftVersion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentPublishedVersion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]}}]} as unknown as DocumentNode<GetContentItemDetailQuery, GetContentItemDetailQueryVariables>;
export const ListVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"sourceVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}}]}}]}}]} as unknown as DocumentNode<ListVersionsQuery, ListVersionsQueryVariables>;
export const DiffVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DiffVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"leftVersionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rightVersionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"diffVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"leftVersionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"leftVersionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"rightVersionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rightVersionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"changedPaths"}},{"kind":"Field","name":{"kind":"Name","value":"leftVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"rightVersionId"}}]}}]}}]} as unknown as DocumentNode<DiffVersionsQuery, DiffVersionsQueryVariables>;
export const ListTemplatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListTemplates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listTemplates"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"constraintsJson"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ListTemplatesQuery, ListTemplatesQueryVariables>;
export const ListRoutesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListRoutes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listRoutes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"isCanonical"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<ListRoutesQuery, ListRoutesQueryVariables>;
export const GetPageTreeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPageTree"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getPageTree"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"route"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"isCanonical"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"route"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"isCanonical"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"route"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"isCanonical"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetPageTreeQuery, GetPageTreeQueryVariables>;
export const ResolveRouteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResolveRoute"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"previewToken"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"preview"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resolveRoute"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}},{"kind":"Argument","name":{"kind":"Name","value":"previewToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"previewToken"}}},{"kind":"Argument","name":{"kind":"Name","value":"preview"},"value":{"kind":"Variable","name":{"kind":"Name","value":"preview"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"route"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"isCanonical"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contentItem"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentTypeId"}},{"kind":"Field","name":{"kind":"Name","value":"currentDraftVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"currentPublishedVersionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contentType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"allowedComponentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentAreaRestrictionsJson"}}]}},{"kind":"Field","name":{"kind":"Name","value":"version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]}}]} as unknown as DocumentNode<ResolveRouteQuery, ResolveRouteQueryVariables>;
export const CreateContentTypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateContentType"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fieldsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"allowedComponentsJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"componentAreaRestrictionsJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContentType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"Argument","name":{"kind":"Name","value":"fieldsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fieldsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"allowedComponentsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"allowedComponentsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"componentAreaRestrictionsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"componentAreaRestrictionsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"allowedComponentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentAreaRestrictionsJson"}}]}}]}}]} as unknown as DocumentNode<CreateContentTypeMutation, CreateContentTypeMutationVariables>;
export const UpdateContentTypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateContentType"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fieldsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"allowedComponentsJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"componentAreaRestrictionsJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContentType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"Argument","name":{"kind":"Name","value":"fieldsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fieldsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"allowedComponentsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"allowedComponentsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"componentAreaRestrictionsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"componentAreaRestrictionsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"allowedComponentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentAreaRestrictionsJson"}}]}}]}}]} as unknown as DocumentNode<UpdateContentTypeMutation, UpdateContentTypeMutationVariables>;
export const UpsertComponentTypeSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertComponentTypeSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"componentTypeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupName"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertComponentTypeSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"componentTypeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"componentTypeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}},{"kind":"Argument","name":{"kind":"Name","value":"groupName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupName"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"componentTypeId"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"}}]}}]}}]} as unknown as DocumentNode<UpsertComponentTypeSettingMutation, UpsertComponentTypeSettingMutationVariables>;
export const DeleteContentTypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteContentType"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteContentType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteContentTypeMutation, DeleteContentTypeMutationVariables>;
export const CreateContentItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateContentItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentTypeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sortOrder"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"initialFieldsJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"initialCompositionJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"initialComponentsJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"metadataJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"comment"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContentItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"contentTypeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentTypeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"sortOrder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sortOrder"}}},{"kind":"Argument","name":{"kind":"Name","value":"initialFieldsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"initialFieldsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"initialCompositionJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"initialCompositionJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"initialComponentsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"initialComponentsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"metadataJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"metadataJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"comment"},"value":{"kind":"Variable","name":{"kind":"Name","value":"comment"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentTypeId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"currentDraftVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"currentPublishedVersionId"}}]}}]}}]} as unknown as DocumentNode<CreateContentItemMutation, CreateContentItemMutationVariables>;
export const CreateChildPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateChildPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentTypeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"initialFieldsJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"initialCompositionJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"initialComponentsJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"metadataJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"comment"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createChildPage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"contentTypeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentTypeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"initialFieldsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"initialFieldsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"initialCompositionJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"initialCompositionJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"initialComponentsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"initialComponentsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"metadataJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"metadataJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"comment"},"value":{"kind":"Variable","name":{"kind":"Name","value":"comment"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentTypeId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"currentDraftVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"currentPublishedVersionId"}}]}}]}}]} as unknown as DocumentNode<CreateChildPageMutation, CreateChildPageMutationVariables>;
export const MovePageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MovePage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newParentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newSortOrder"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"movePage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pageId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pageId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newParentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newParentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newSortOrder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newSortOrder"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]} as unknown as DocumentNode<MovePageMutation, MovePageMutationVariables>;
export const ReorderSiblingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderSiblings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderedIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderSiblings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderedIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderedIds"}}}]}]}}]} as unknown as DocumentNode<ReorderSiblingsMutation, ReorderSiblingsMutationVariables>;
export const DeletePageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pageId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pageId"}}}]}]}}]} as unknown as DocumentNode<DeletePageMutation, DeletePageMutationVariables>;
export const ArchiveContentItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveContentItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"archived"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveContentItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"archived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"archived"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}}]}}]}}]} as unknown as DocumentNode<ArchiveContentItemMutation, ArchiveContentItemMutationVariables>;
export const CreateDraftVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDraftVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromVersionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"comment"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDraftVersion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromVersionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromVersionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"comment"},"value":{"kind":"Variable","name":{"kind":"Name","value":"comment"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]} as unknown as DocumentNode<CreateDraftVersionMutation, CreateDraftVersionMutationVariables>;
export const UpdateDraftVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDraftVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"patch"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDraftPatchInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersionNumber"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDraftVersion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"versionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"patch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"patch"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersionNumber"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersionNumber"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]} as unknown as DocumentNode<UpdateDraftVersionMutation, UpdateDraftVersionMutationVariables>;
export const AddComponentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddComponent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentVersionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"componentTypeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"area"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"initialProps"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addComponent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentVersionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentVersionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"componentTypeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"componentTypeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"area"},"value":{"kind":"Variable","name":{"kind":"Name","value":"area"}}},{"kind":"Argument","name":{"kind":"Name","value":"initialProps"},"value":{"kind":"Variable","name":{"kind":"Name","value":"initialProps"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]} as unknown as DocumentNode<AddComponentMutation, AddComponentMutationVariables>;
export const UpdateComponentPropsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateComponentProps"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"instanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"patch"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateComponentProps"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"instanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"instanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"patch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"patch"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]} as unknown as DocumentNode<UpdateComponentPropsMutation, UpdateComponentPropsMutationVariables>;
export const RemoveComponentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveComponent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"instanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeComponent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"instanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"instanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]} as unknown as DocumentNode<RemoveComponentMutation, RemoveComponentMutationVariables>;
export const MoveComponentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveComponent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"instanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newArea"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newSortOrder"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveComponent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"instanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"instanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newArea"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newArea"}}},{"kind":"Argument","name":{"kind":"Name","value":"newSortOrder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newSortOrder"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]} as unknown as DocumentNode<MoveComponentMutation, MoveComponentMutationVariables>;
export const PublishVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PublishVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersionNumber"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"comment"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishVersion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"versionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersionNumber"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersionNumber"}}},{"kind":"Argument","name":{"kind":"Name","value":"comment"},"value":{"kind":"Variable","name":{"kind":"Name","value":"comment"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]} as unknown as DocumentNode<PublishVersionMutation, PublishVersionMutationVariables>;
export const RollbackToVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RollbackToVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rollbackToVersion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"versionNumber"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]} as unknown as DocumentNode<RollbackToVersionMutation, RollbackToVersionMutationVariables>;
export const CreateTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"compositionJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"componentsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"constraintsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"compositionJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"compositionJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"componentsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"componentsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"constraintsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"constraintsJson"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"constraintsJson"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateTemplateMutation, CreateTemplateMutationVariables>;
export const UpdateTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"compositionJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"componentsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"constraintsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"compositionJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"compositionJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"componentsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"componentsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"constraintsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"constraintsJson"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"constraintsJson"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateTemplateMutation, UpdateTemplateMutationVariables>;
export const DeleteTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTemplateMutation, DeleteTemplateMutationVariables>;
export const ReconcileTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReconcileTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reconcileTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"changedPaths"}},{"kind":"Field","name":{"kind":"Name","value":"leftVersionId"}},{"kind":"Field","name":{"kind":"Name","value":"rightVersionId"}}]}}]}}]} as unknown as DocumentNode<ReconcileTemplateMutation, ReconcileTemplateMutationVariables>;
export const UpsertRouteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertRoute"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isCanonical"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertRoute"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}},{"kind":"Argument","name":{"kind":"Name","value":"isCanonical"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isCanonical"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"isCanonical"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<UpsertRouteMutation, UpsertRouteMutationVariables>;
export const DeleteRouteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRoute"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRoute"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteRouteMutation, DeleteRouteMutationVariables>;
export const IssuePreviewTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"IssuePreviewToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"issuePreviewToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}}]}}]}}]} as unknown as DocumentNode<IssuePreviewTokenMutation, IssuePreviewTokenMutationVariables>;
export const ListVariantSetsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListVariantSets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listVariantSets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"fallbackVariantSetId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<ListVariantSetsQuery, ListVariantSetsQueryVariables>;
export const ListVariantsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListVariants"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"variantSetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listVariants"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"variantSetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"variantSetId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"variantSetId"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"ruleJson"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"trafficAllocation"}},{"kind":"Field","name":{"kind":"Name","value":"contentVersionId"}}]}}]}}]} as unknown as DocumentNode<ListVariantsQuery, ListVariantsQueryVariables>;
export const SelectVariantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SelectVariant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"variantSetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contextJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"selectVariant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"variantSetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"variantSetId"}}},{"kind":"Argument","name":{"kind":"Name","value":"contextJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contextJson"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"variantSetId"}},{"kind":"Field","name":{"kind":"Name","value":"variant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"contentVersionId"}}]}}]}}]}}]} as unknown as DocumentNode<SelectVariantQuery, SelectVariantQueryVariables>;
export const GetPageByRouteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPageByRoute"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contextJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"previewToken"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"preview"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"variantKeyOverride"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionIdOverride"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getPageByRoute"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}},{"kind":"Argument","name":{"kind":"Name","value":"contextJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contextJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"previewToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"previewToken"}}},{"kind":"Argument","name":{"kind":"Name","value":"preview"},"value":{"kind":"Variable","name":{"kind":"Name","value":"preview"}}},{"kind":"Argument","name":{"kind":"Name","value":"variantKeyOverride"},"value":{"kind":"Variable","name":{"kind":"Name","value":"variantKeyOverride"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionIdOverride"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionIdOverride"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"selectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"selectedVariant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"contentVersionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"selectedVersion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"compositionJson"}},{"kind":"Field","name":{"kind":"Name","value":"componentsJson"}},{"kind":"Field","name":{"kind":"Name","value":"metadataJson"}}]}},{"kind":"Field","name":{"kind":"Name","value":"base"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"route"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contentItem"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentTypeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contentType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetPageByRouteQuery, GetPageByRouteQueryVariables>;
export const UpsertVariantSetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertVariantSet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fallbackVariantSetId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"active"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertVariantSet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"fallbackVariantSetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fallbackVariantSetId"}}},{"kind":"Argument","name":{"kind":"Name","value":"active"},"value":{"kind":"Variable","name":{"kind":"Name","value":"active"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"fallbackVariantSetId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<UpsertVariantSetMutation, UpsertVariantSetMutationVariables>;
export const DeleteVariantSetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteVariantSet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteVariantSet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteVariantSetMutation, DeleteVariantSetMutationVariables>;
export const UpsertVariantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertVariant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"variantSetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"priority"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ruleJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"trafficAllocation"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentVersionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertVariant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"variantSetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"variantSetId"}}},{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"Argument","name":{"kind":"Name","value":"priority"},"value":{"kind":"Variable","name":{"kind":"Name","value":"priority"}}},{"kind":"Argument","name":{"kind":"Name","value":"ruleJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ruleJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}},{"kind":"Argument","name":{"kind":"Name","value":"trafficAllocation"},"value":{"kind":"Variable","name":{"kind":"Name","value":"trafficAllocation"}}},{"kind":"Argument","name":{"kind":"Name","value":"contentVersionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentVersionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"variantSetId"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"ruleJson"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"trafficAllocation"}},{"kind":"Field","name":{"kind":"Name","value":"contentVersionId"}}]}}]}}]} as unknown as DocumentNode<UpsertVariantMutation, UpsertVariantMutationVariables>;
export const DeleteVariantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteVariant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteVariant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteVariantMutation, DeleteVariantMutationVariables>;
export const ListFormsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListForms"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listForms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ListFormsQuery, ListFormsQueryVariables>;
export const ListFormStepsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListFormSteps"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"formId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listFormSteps"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"formId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"formId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"formId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}}]}}]} as unknown as DocumentNode<ListFormStepsQuery, ListFormStepsQueryVariables>;
export const ListFormFieldsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListFormFields"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"formId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listFormFields"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"formId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"formId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stepId"}},{"kind":"Field","name":{"kind":"Name","value":"formId"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"conditionsJson"}},{"kind":"Field","name":{"kind":"Name","value":"validationsJson"}},{"kind":"Field","name":{"kind":"Name","value":"uiConfigJson"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<ListFormFieldsQuery, ListFormFieldsQueryVariables>;
export const EvaluateFormDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EvaluateForm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"formId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"answersJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contextJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"evaluateForm"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"formId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"formId"}}},{"kind":"Argument","name":{"kind":"Name","value":"answersJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"answersJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"contextJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contextJson"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"formId"}},{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"evaluatedFieldsJson"}},{"kind":"Field","name":{"kind":"Name","value":"errorsJson"}}]}}]}}]} as unknown as DocumentNode<EvaluateFormQuery, EvaluateFormQueryVariables>;
export const ListFormSubmissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListFormSubmissions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"formId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sortField"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sortOrder"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listFormSubmissions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"formId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"formId"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"toDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"sortField"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sortField"}}},{"kind":"Argument","name":{"kind":"Name","value":"sortOrder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sortOrder"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"formId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"submittedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"pageContentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"pageRouteSlug"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"dataJson"}},{"kind":"Field","name":{"kind":"Name","value":"metaJson"}}]}}]}}]}}]} as unknown as DocumentNode<ListFormSubmissionsQuery, ListFormSubmissionsQueryVariables>;
export const ExportFormSubmissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExportFormSubmissions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"formId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"format"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exportFormSubmissions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"formId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"formId"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"toDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"format"},"value":{"kind":"Variable","name":{"kind":"Name","value":"format"}}}]}]}}]} as unknown as DocumentNode<ExportFormSubmissionsQuery, ExportFormSubmissionsQueryVariables>;
export const UpsertFormDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertForm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"active"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertForm"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"Argument","name":{"kind":"Name","value":"active"},"value":{"kind":"Variable","name":{"kind":"Name","value":"active"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpsertFormMutation, UpsertFormMutationVariables>;
export const DeleteFormDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteForm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteForm"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteFormMutation, DeleteFormMutationVariables>;
export const UpsertFormStepDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertFormStep"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"formId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"position"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertFormStep"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"formId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"formId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"position"},"value":{"kind":"Variable","name":{"kind":"Name","value":"position"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"formId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}}]}}]} as unknown as DocumentNode<UpsertFormStepMutation, UpsertFormStepMutationVariables>;
export const DeleteFormStepDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteFormStep"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteFormStep"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteFormStepMutation, DeleteFormStepMutationVariables>;
export const UpsertFormFieldDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertFormField"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stepId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"formId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"label"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fieldType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"position"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"conditionsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"validationsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"uiConfigJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"active"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertFormField"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"stepId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"stepId"}}},{"kind":"Argument","name":{"kind":"Name","value":"formId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"formId"}}},{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"Argument","name":{"kind":"Name","value":"label"},"value":{"kind":"Variable","name":{"kind":"Name","value":"label"}}},{"kind":"Argument","name":{"kind":"Name","value":"fieldType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fieldType"}}},{"kind":"Argument","name":{"kind":"Name","value":"position"},"value":{"kind":"Variable","name":{"kind":"Name","value":"position"}}},{"kind":"Argument","name":{"kind":"Name","value":"conditionsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"conditionsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"validationsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"validationsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"uiConfigJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"uiConfigJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"active"},"value":{"kind":"Variable","name":{"kind":"Name","value":"active"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stepId"}},{"kind":"Field","name":{"kind":"Name","value":"formId"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"conditionsJson"}},{"kind":"Field","name":{"kind":"Name","value":"validationsJson"}},{"kind":"Field","name":{"kind":"Name","value":"uiConfigJson"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<UpsertFormFieldMutation, UpsertFormFieldMutationVariables>;
export const DeleteFormFieldDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteFormField"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteFormField"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteFormFieldMutation, DeleteFormFieldMutationVariables>;
export const SubmitFormDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitForm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"formId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pageContentItemId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pageRouteSlug"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"submittedByUserId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"answersJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contextJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"metaJson"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitForm"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"formId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"formId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"pageContentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pageContentItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pageRouteSlug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pageRouteSlug"}}},{"kind":"Argument","name":{"kind":"Name","value":"submittedByUserId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"submittedByUserId"}}},{"kind":"Argument","name":{"kind":"Name","value":"answersJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"answersJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"contextJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contextJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"metaJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"metaJson"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"formId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<SubmitFormMutation, SubmitFormMutationVariables>;
export const UpdateSubmissionStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSubmissionStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSubmissionStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<UpdateSubmissionStatusMutation, UpdateSubmissionStatusMutationVariables>;
export const ListWorkflowDefinitionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListWorkflowDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listWorkflowDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"graphJson"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchemaJson"}},{"kind":"Field","name":{"kind":"Name","value":"permissionsJson"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}}]}}]}}]} as unknown as DocumentNode<ListWorkflowDefinitionsQuery, ListWorkflowDefinitionsQueryVariables>;
export const ListWorkflowRunsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListWorkflowRuns"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"definitionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listWorkflowRuns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"definitionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"definitionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"definitionId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"contextJson"}},{"kind":"Field","name":{"kind":"Name","value":"currentNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"logsJson"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"startedBy"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ListWorkflowRunsQuery, ListWorkflowRunsQueryVariables>;
export const GetWorkflowRunDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkflowRun"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"runId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkflowRun"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"runId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"runId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"definitionId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"contextJson"}},{"kind":"Field","name":{"kind":"Name","value":"currentNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"logsJson"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"startedBy"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetWorkflowRunQuery, GetWorkflowRunQueryVariables>;
export const UpsertWorkflowDefinitionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertWorkflowDefinition"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"version"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"graphJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inputSchemaJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"permissionsJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createdBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertWorkflowDefinition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"version"},"value":{"kind":"Variable","name":{"kind":"Name","value":"version"}}},{"kind":"Argument","name":{"kind":"Name","value":"graphJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"graphJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"inputSchemaJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inputSchemaJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"permissionsJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"permissionsJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"createdBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createdBy"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"graphJson"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchemaJson"}},{"kind":"Field","name":{"kind":"Name","value":"permissionsJson"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}}]}}]}}]} as unknown as DocumentNode<UpsertWorkflowDefinitionMutation, UpsertWorkflowDefinitionMutationVariables>;
export const DeleteWorkflowDefinitionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteWorkflowDefinition"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteWorkflowDefinition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteWorkflowDefinitionMutation, DeleteWorkflowDefinitionMutationVariables>;
export const StartWorkflowRunDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StartWorkflowRun"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"definitionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contextJson"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startedBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startWorkflowRun"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"definitionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"definitionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"contextJson"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contextJson"}}},{"kind":"Argument","name":{"kind":"Name","value":"startedBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startedBy"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"definitionId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"contextJson"}},{"kind":"Field","name":{"kind":"Name","value":"currentNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"logsJson"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"startedBy"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<StartWorkflowRunMutation, StartWorkflowRunMutationVariables>;
export const ApproveStepDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApproveStep"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"runId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nodeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"approvedBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approveStep"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"runId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"runId"}}},{"kind":"Argument","name":{"kind":"Name","value":"nodeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nodeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"approvedBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"approvedBy"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"definitionId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"contextJson"}},{"kind":"Field","name":{"kind":"Name","value":"currentNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"logsJson"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"startedBy"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ApproveStepMutation, ApproveStepMutationVariables>;
export const RetryFailedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RetryFailed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"runId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"retryFailed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"runId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"runId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"definitionId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"contextJson"}},{"kind":"Field","name":{"kind":"Name","value":"currentNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"logsJson"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"startedBy"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<RetryFailedMutation, RetryFailedMutationVariables>;
export const AiGenerateContentTypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AiGenerateContentType"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"prompt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nameHint"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aiGenerateContentType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"prompt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"prompt"}}},{"kind":"Argument","name":{"kind":"Name","value":"nameHint"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nameHint"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldsJson"}}]}}]}}]} as unknown as DocumentNode<AiGenerateContentTypeMutation, AiGenerateContentTypeMutationVariables>;
export const AiGenerateContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AiGenerateContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentTypeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"prompt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aiGenerateContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"contentTypeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentTypeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"prompt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"prompt"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"draftVersionId"}}]}}]}}]} as unknown as DocumentNode<AiGenerateContentMutation, AiGenerateContentMutationVariables>;
export const AiGenerateVariantsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AiGenerateVariants"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"variantSetId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetVersionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"prompt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aiGenerateVariants"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"contentItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"variantSetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"variantSetId"}}},{"kind":"Argument","name":{"kind":"Name","value":"targetVersionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetVersionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"prompt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"prompt"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"variantSetId"}},{"kind":"Field","name":{"kind":"Name","value":"createdKeys"}}]}}]}}]} as unknown as DocumentNode<AiGenerateVariantsMutation, AiGenerateVariantsMutationVariables>;
export const AiTranslateVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AiTranslateVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetMarketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetLocaleCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aiTranslateVersion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"versionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"targetMarketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetMarketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"targetLocaleCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetLocaleCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contentItemId"}},{"kind":"Field","name":{"kind":"Name","value":"draftVersionId"}}]}}]}}]} as unknown as DocumentNode<AiTranslateVersionMutation, AiTranslateVersionMutationVariables>;
export const DevDiagnosticsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DevDiagnostics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devDiagnostics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"seedStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminRoleExists"}},{"kind":"Field","name":{"kind":"Name","value":"adminPermissionCoverage"}},{"kind":"Field","name":{"kind":"Name","value":"adminUserHasRole"}}]}}]}}]}}]} as unknown as DocumentNode<DevDiagnosticsQuery, DevDiagnosticsQueryVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"username"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"username"},"value":{"kind":"Variable","name":{"kind":"Name","value":"username"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const UpsertMarketDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertMarket"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currency"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timezone"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"active"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isDefault"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertMarket"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"currency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currency"}}},{"kind":"Argument","name":{"kind":"Name","value":"timezone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timezone"}}},{"kind":"Argument","name":{"kind":"Name","value":"active"},"value":{"kind":"Variable","name":{"kind":"Name","value":"active"}}},{"kind":"Argument","name":{"kind":"Name","value":"isDefault"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isDefault"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<UpsertMarketMutation, UpsertMarketMutationVariables>;
export const UpsertLocaleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertLocale"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"active"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fallbackLocaleCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isDefault"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertLocale"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"active"},"value":{"kind":"Variable","name":{"kind":"Name","value":"active"}}},{"kind":"Argument","name":{"kind":"Name","value":"fallbackLocaleCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fallbackLocaleCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"isDefault"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isDefault"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"fallbackLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<UpsertLocaleMutation, UpsertLocaleMutationVariables>;
export const UpsertSiteLocaleOverrideDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertSiteLocaleOverride"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"displayName"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fallbackLocaleCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertSiteLocaleOverride"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}},{"kind":"Argument","name":{"kind":"Name","value":"displayName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"displayName"}}},{"kind":"Argument","name":{"kind":"Name","value":"fallbackLocaleCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fallbackLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"fallbackLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<UpsertSiteLocaleOverrideMutation, UpsertSiteLocaleOverrideMutationVariables>;
export const SetSiteUrlPatternDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetSiteUrlPattern"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"urlPattern"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setSiteUrlPattern"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"urlPattern"},"value":{"kind":"Variable","name":{"kind":"Name","value":"urlPattern"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"urlPattern"}}]}}]}}]} as unknown as DocumentNode<SetSiteUrlPatternMutation, SetSiteUrlPatternMutationVariables>;
export const SetSiteNameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetSiteName"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setSiteName"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"urlPattern"}}]}}]}}]} as unknown as DocumentNode<SetSiteNameMutation, SetSiteNameMutationVariables>;
export const SetSiteMarketsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetSiteMarkets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"markets"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SiteMarketInput"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"defaultMarketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setSiteMarkets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"markets"},"value":{"kind":"Variable","name":{"kind":"Name","value":"markets"}}},{"kind":"Argument","name":{"kind":"Name","value":"defaultMarketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"defaultMarketCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<SetSiteMarketsMutation, SetSiteMarketsMutationVariables>;
export const SetSiteLocalesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetSiteLocales"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locales"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SiteLocaleInput"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"defaultLocaleCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setSiteLocales"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"locales"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locales"}}},{"kind":"Argument","name":{"kind":"Name","value":"defaultLocaleCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"defaultLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"fallbackLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<SetSiteLocalesMutation, SetSiteLocalesMutationVariables>;
export const SetSiteMarketLocaleMatrixDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetSiteMarketLocaleMatrix"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"combinations"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SiteMarketLocaleInput"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"defaults"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"MatrixDefaultsInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setSiteMarketLocaleMatrix"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"combinations"},"value":{"kind":"Variable","name":{"kind":"Name","value":"combinations"}}},{"kind":"Argument","name":{"kind":"Name","value":"defaults"},"value":{"kind":"Variable","name":{"kind":"Name","value":"defaults"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"combinations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"isDefaultForMarket"}}]}},{"kind":"Field","name":{"kind":"Name","value":"defaults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"defaultMarketCode"}},{"kind":"Field","name":{"kind":"Name","value":"defaultLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"marketDefaultLocales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SetSiteMarketLocaleMatrixMutation, SetSiteMarketLocaleMatrixMutationVariables>;
export const ListSitesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListSites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listSites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"urlPattern"}}]}}]}}]} as unknown as DocumentNode<ListSitesQuery, ListSitesQueryVariables>;
export const GetSiteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"urlPattern"}}]}}]}}]} as unknown as DocumentNode<GetSiteQuery, GetSiteQueryVariables>;
export const LocaleCatalogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LocaleCatalog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"localeCatalog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"region"}}]}}]}}]} as unknown as DocumentNode<LocaleCatalogQuery, LocaleCatalogQueryVariables>;
export const GetSiteDefaultsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSiteDefaults"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSiteDefaults"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"defaultMarketCode"}},{"kind":"Field","name":{"kind":"Name","value":"defaultLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"marketDefaultLocales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}}]}}]}}]}}]} as unknown as DocumentNode<GetSiteDefaultsQuery, GetSiteDefaultsQueryVariables>;
export const GetSiteMarketLocaleMatrixDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSiteMarketLocaleMatrix"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSiteMarketLocaleMatrix"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"markets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}},{"kind":"Field","name":{"kind":"Name","value":"locales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"fallbackLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}},{"kind":"Field","name":{"kind":"Name","value":"combinations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"isDefaultForMarket"}}]}},{"kind":"Field","name":{"kind":"Name","value":"defaults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"defaultMarketCode"}},{"kind":"Field","name":{"kind":"Name","value":"defaultLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"marketDefaultLocales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetSiteMarketLocaleMatrixQuery, GetSiteMarketLocaleMatrixQueryVariables>;
export const ListMarketsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListMarkets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listMarkets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<ListMarketsQuery, ListMarketsQueryVariables>;
export const ListLocalesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListLocales"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listLocales"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"fallbackLocaleCode"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<ListLocalesQuery, ListLocalesQueryVariables>;
export const ValidateMarketLocaleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ValidateMarketLocale"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"validateMarketLocale"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}}]}]}}]} as unknown as DocumentNode<ValidateMarketLocaleQuery, ValidateMarketLocaleQueryVariables>;
export const ResolveMarketLocaleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResolveMarketLocale"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resolveMarketLocale"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"siteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"siteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"marketCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"marketCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"localeCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"localeCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteId"}},{"kind":"Field","name":{"kind":"Name","value":"marketCode"}},{"kind":"Field","name":{"kind":"Name","value":"localeCode"}},{"kind":"Field","name":{"kind":"Name","value":"resolution"}}]}}]}}]} as unknown as DocumentNode<ResolveMarketLocaleQuery, ResolveMarketLocaleQueryVariables>;