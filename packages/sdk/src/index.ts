import { GraphQLClient } from 'graphql-request';

import * as G from './graphql/generated';

export type CreateSdkOptions = {
  endpoint: string;
  headersProvider?: () => Promise<Record<string, string> | undefined> | Record<string, string> | undefined;
};

export type RequestOptions = {
  authorization?: string;
};

export function createSdk(options: CreateSdkOptions) {
  const getClient = async (requestOptions?: RequestOptions) => {
    const baseHeaders = (await options.headersProvider?.()) ?? {};
    return new GraphQLClient(options.endpoint, {
      headers: {
        ...baseHeaders,
        ...(requestOptions?.authorization ? { authorization: requestOptions.authorization } : {})
      }
    });
  };

  const execute = async <TData>(document: unknown, variables: object, requestOptions?: RequestOptions) => {
    const client = await getClient(requestOptions);
    return (client as any).request(document, variables) as Promise<TData>;
  };

  return {
    login: (variables: G.LoginMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.LoginMutation>(G.LoginDocument, variables, requestOptions),
    me: (requestOptions?: RequestOptions) =>
      execute<G.MeQuery>(G.MeDocument, {}, requestOptions),

    listSites: (requestOptions?: RequestOptions) =>
      execute<G.ListSitesQuery>(G.ListSitesDocument, {}, requestOptions),
    getSite: (variables: G.GetSiteQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.GetSiteQuery>(G.GetSiteDocument, variables, requestOptions),
    localeCatalog: (requestOptions?: RequestOptions) =>
      execute<G.LocaleCatalogQuery>(G.LocaleCatalogDocument, {}, requestOptions),
    listMarkets: (variables: G.ListMarketsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListMarketsQuery>(G.ListMarketsDocument, variables, requestOptions),
    listLocales: (variables: G.ListLocalesQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListLocalesQuery>(G.ListLocalesDocument, variables, requestOptions),
    getSiteDefaults: (variables: G.GetSiteDefaultsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.GetSiteDefaultsQuery>(G.GetSiteDefaultsDocument, variables, requestOptions),
    getSiteMarketLocaleMatrix: (
      variables: G.GetSiteMarketLocaleMatrixQueryVariables,
      requestOptions?: RequestOptions
    ) => execute<G.GetSiteMarketLocaleMatrixQuery>(G.GetSiteMarketLocaleMatrixDocument, variables, requestOptions),
    validateMarketLocale: (variables: G.ValidateMarketLocaleQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ValidateMarketLocaleQuery>(G.ValidateMarketLocaleDocument, variables, requestOptions),
    resolveMarketLocale: (variables: G.ResolveMarketLocaleQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ResolveMarketLocaleQuery>(G.ResolveMarketLocaleDocument, variables, requestOptions),

    createContentType: (variables: G.CreateContentTypeMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.CreateContentTypeMutation>(G.CreateContentTypeDocument, variables, requestOptions),
    updateContentType: (variables: G.UpdateContentTypeMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpdateContentTypeMutation>(G.UpdateContentTypeDocument, variables, requestOptions),
    deleteContentType: (variables: G.DeleteContentTypeMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.DeleteContentTypeMutation>(G.DeleteContentTypeDocument, variables, requestOptions),
    listContentTypes: (variables: G.ListContentTypesQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListContentTypesQuery>(G.ListContentTypesDocument, variables, requestOptions),

    createContentItem: (variables: G.CreateContentItemMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.CreateContentItemMutation>(G.CreateContentItemDocument, variables, requestOptions),
    archiveContentItem: (variables: G.ArchiveContentItemMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.ArchiveContentItemMutation>(G.ArchiveContentItemDocument, variables, requestOptions),
    listContentItems: (variables: G.ListContentItemsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListContentItemsQuery>(G.ListContentItemsDocument, variables, requestOptions),
    getContentItemDetail: (variables: G.GetContentItemDetailQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.GetContentItemDetailQuery>(G.GetContentItemDetailDocument, variables, requestOptions),

    createDraftVersion: (variables: G.CreateDraftVersionMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.CreateDraftVersionMutation>(G.CreateDraftVersionDocument, variables, requestOptions),
    updateDraftVersion: (variables: G.UpdateDraftVersionMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpdateDraftVersionMutation>(G.UpdateDraftVersionDocument, variables, requestOptions),
    publishVersion: (variables: G.PublishVersionMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.PublishVersionMutation>(G.PublishVersionDocument, variables, requestOptions),
    listVersions: (variables: G.ListVersionsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListVersionsQuery>(G.ListVersionsDocument, variables, requestOptions),
    diffVersions: (variables: G.DiffVersionsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.DiffVersionsQuery>(G.DiffVersionsDocument, variables, requestOptions),
    rollbackToVersion: (variables: G.RollbackToVersionMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.RollbackToVersionMutation>(G.RollbackToVersionDocument, variables, requestOptions),

    createTemplate: (variables: G.CreateTemplateMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.CreateTemplateMutation>(G.CreateTemplateDocument, variables, requestOptions),
    updateTemplate: (variables: G.UpdateTemplateMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpdateTemplateMutation>(G.UpdateTemplateDocument, variables, requestOptions),
    deleteTemplate: (variables: G.DeleteTemplateMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.DeleteTemplateMutation>(G.DeleteTemplateDocument, variables, requestOptions),
    listTemplates: (variables: G.ListTemplatesQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListTemplatesQuery>(G.ListTemplatesDocument, variables, requestOptions),
    reconcileTemplate: (variables: G.ReconcileTemplateMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.ReconcileTemplateMutation>(G.ReconcileTemplateDocument, variables, requestOptions),

    upsertRoute: (variables: G.UpsertRouteMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpsertRouteMutation>(G.UpsertRouteDocument, variables, requestOptions),
    deleteRoute: (variables: G.DeleteRouteMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.DeleteRouteMutation>(G.DeleteRouteDocument, variables, requestOptions),
    listRoutes: (variables: G.ListRoutesQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListRoutesQuery>(G.ListRoutesDocument, variables, requestOptions),
    resolveRoute: (variables: G.ResolveRouteQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ResolveRouteQuery>(G.ResolveRouteDocument, variables, requestOptions),
    getPageByRoute: (variables: G.GetPageByRouteQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.GetPageByRouteQuery>(G.GetPageByRouteDocument, variables, requestOptions),
    listAssets: (variables: G.ListAssetsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListAssetsQuery>(G.ListAssetsDocument, variables, requestOptions),
    getAsset: (variables: G.GetAssetQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.GetAssetQuery>(G.GetAssetDocument, variables, requestOptions),
    listAssetFolders: (variables: G.ListAssetFoldersQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListAssetFoldersQuery>(G.ListAssetFoldersDocument, variables, requestOptions),
    createAssetFolder: (variables: G.CreateAssetFolderMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.CreateAssetFolderMutation>(G.CreateAssetFolderDocument, variables, requestOptions),
    updateAssetMetadata: (
      variables: G.UpdateAssetMetadataMutationVariables,
      requestOptions?: RequestOptions
    ) => execute<G.UpdateAssetMetadataMutation>(G.UpdateAssetMetadataDocument, variables, requestOptions),
    deleteAsset: (variables: G.DeleteAssetMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.DeleteAssetMutation>(G.DeleteAssetDocument, variables, requestOptions),
    listConnectors: (variables: G.ListConnectorsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListConnectorsQuery>(G.ListConnectorsDocument, variables, requestOptions),
    upsertConnector: (variables: G.UpsertConnectorMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpsertConnectorMutation>(G.UpsertConnectorDocument, variables, requestOptions),
    deleteConnector: (variables: G.DeleteConnectorMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.DeleteConnectorMutation>(G.DeleteConnectorDocument, variables, requestOptions),
    setDefaultConnector: (variables: G.SetDefaultConnectorMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.SetDefaultConnectorMutation>(G.SetDefaultConnectorDocument, variables, requestOptions),
    testConnector: (variables: G.TestConnectorMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.TestConnectorMutation>(G.TestConnectorDocument, variables, requestOptions),
    listInternalUsers: (requestOptions?: RequestOptions) =>
      execute<G.ListInternalUsersQuery>(G.ListInternalUsersDocument, {}, requestOptions),
    listInternalRoles: (requestOptions?: RequestOptions) =>
      execute<G.ListInternalRolesQuery>(G.ListInternalRolesDocument, {}, requestOptions),
    internalPermissions: (requestOptions?: RequestOptions) =>
      execute<G.InternalPermissionsQuery>(G.InternalPermissionsDocument, {}, requestOptions),
    createInternalUser: (variables: G.CreateInternalUserMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.CreateInternalUserMutation>(G.CreateInternalUserDocument, variables, requestOptions),
    updateInternalUser: (variables: G.UpdateInternalUserMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpdateInternalUserMutation>(G.UpdateInternalUserDocument, variables, requestOptions),
    resetInternalUserPassword: (
      variables: G.ResetInternalUserPasswordMutationVariables,
      requestOptions?: RequestOptions
    ) =>
      execute<G.ResetInternalUserPasswordMutation>(G.ResetInternalUserPasswordDocument, variables, requestOptions),
    upsertInternalRole: (variables: G.UpsertInternalRoleMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpsertInternalRoleMutation>(G.UpsertInternalRoleDocument, variables, requestOptions),
    deleteInternalRole: (variables: G.DeleteInternalRoleMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.DeleteInternalRoleMutation>(G.DeleteInternalRoleDocument, variables, requestOptions),
    setUserRoles: (variables: G.SetUserRolesMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.SetUserRolesMutation>(G.SetUserRolesDocument, variables, requestOptions),

    listVariantSets: (variables: G.ListVariantSetsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListVariantSetsQuery>(G.ListVariantSetsDocument, variables, requestOptions),
    upsertVariantSet: (variables: G.UpsertVariantSetMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpsertVariantSetMutation>(G.UpsertVariantSetDocument, variables, requestOptions),
    deleteVariantSet: (variables: G.DeleteVariantSetMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.DeleteVariantSetMutation>(G.DeleteVariantSetDocument, variables, requestOptions),
    listVariants: (variables: G.ListVariantsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListVariantsQuery>(G.ListVariantsDocument, variables, requestOptions),
    upsertVariant: (variables: G.UpsertVariantMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpsertVariantMutation>(G.UpsertVariantDocument, variables, requestOptions),
    deleteVariant: (variables: G.DeleteVariantMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.DeleteVariantMutation>(G.DeleteVariantDocument, variables, requestOptions),
    selectVariant: (variables: G.SelectVariantQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.SelectVariantQuery>(G.SelectVariantDocument, variables, requestOptions),
    listForms: (variables: G.ListFormsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListFormsQuery>(G.ListFormsDocument, variables, requestOptions),
    upsertForm: (variables: G.UpsertFormMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpsertFormMutation>(G.UpsertFormDocument, variables, requestOptions),
    deleteForm: (variables: G.DeleteFormMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.DeleteFormMutation>(G.DeleteFormDocument, variables, requestOptions),
    listFormSteps: (variables: G.ListFormStepsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListFormStepsQuery>(G.ListFormStepsDocument, variables, requestOptions),
    upsertFormStep: (variables: G.UpsertFormStepMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpsertFormStepMutation>(G.UpsertFormStepDocument, variables, requestOptions),
    deleteFormStep: (variables: G.DeleteFormStepMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.DeleteFormStepMutation>(G.DeleteFormStepDocument, variables, requestOptions),
    listFormFields: (variables: G.ListFormFieldsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListFormFieldsQuery>(G.ListFormFieldsDocument, variables, requestOptions),
    upsertFormField: (variables: G.UpsertFormFieldMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpsertFormFieldMutation>(G.UpsertFormFieldDocument, variables, requestOptions),
    deleteFormField: (variables: G.DeleteFormFieldMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.DeleteFormFieldMutation>(G.DeleteFormFieldDocument, variables, requestOptions),
    evaluateForm: (variables: G.EvaluateFormQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.EvaluateFormQuery>(G.EvaluateFormDocument, variables, requestOptions),
    submitForm: (variables: G.SubmitFormMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.SubmitFormMutation>(G.SubmitFormDocument, variables, requestOptions),
    listFormSubmissions: (variables: G.ListFormSubmissionsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListFormSubmissionsQuery>(G.ListFormSubmissionsDocument, variables, requestOptions),
    exportFormSubmissions: (variables: G.ExportFormSubmissionsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ExportFormSubmissionsQuery>(G.ExportFormSubmissionsDocument, variables, requestOptions),
    updateSubmissionStatus: (variables: G.UpdateSubmissionStatusMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpdateSubmissionStatusMutation>(G.UpdateSubmissionStatusDocument, variables, requestOptions),
    listWorkflowDefinitions: (requestOptions?: RequestOptions) =>
      execute<G.ListWorkflowDefinitionsQuery>(G.ListWorkflowDefinitionsDocument, {}, requestOptions),
    upsertWorkflowDefinition: (
      variables: G.UpsertWorkflowDefinitionMutationVariables,
      requestOptions?: RequestOptions
    ) => execute<G.UpsertWorkflowDefinitionMutation>(G.UpsertWorkflowDefinitionDocument, variables, requestOptions),
    deleteWorkflowDefinition: (
      variables: G.DeleteWorkflowDefinitionMutationVariables,
      requestOptions?: RequestOptions
    ) => execute<G.DeleteWorkflowDefinitionMutation>(G.DeleteWorkflowDefinitionDocument, variables, requestOptions),
    listWorkflowRuns: (variables: G.ListWorkflowRunsQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.ListWorkflowRunsQuery>(G.ListWorkflowRunsDocument, variables, requestOptions),
    getWorkflowRun: (variables: G.GetWorkflowRunQueryVariables, requestOptions?: RequestOptions) =>
      execute<G.GetWorkflowRunQuery>(G.GetWorkflowRunDocument, variables, requestOptions),
    startWorkflowRun: (variables: G.StartWorkflowRunMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.StartWorkflowRunMutation>(G.StartWorkflowRunDocument, variables, requestOptions),
    approveStep: (variables: G.ApproveStepMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.ApproveStepMutation>(G.ApproveStepDocument, variables, requestOptions),
    retryFailed: (variables: G.RetryFailedMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.RetryFailedMutation>(G.RetryFailedDocument, variables, requestOptions),
    aiGenerateContentType: (variables: G.AiGenerateContentTypeMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.AiGenerateContentTypeMutation>(G.AiGenerateContentTypeDocument, variables, requestOptions),
    aiGenerateContent: (variables: G.AiGenerateContentMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.AiGenerateContentMutation>(G.AiGenerateContentDocument, variables, requestOptions),
    aiGenerateVariants: (variables: G.AiGenerateVariantsMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.AiGenerateVariantsMutation>(G.AiGenerateVariantsDocument, variables, requestOptions),
    aiTranslateVersion: (variables: G.AiTranslateVersionMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.AiTranslateVersionMutation>(G.AiTranslateVersionDocument, variables, requestOptions),

    issuePreviewToken: (variables: G.IssuePreviewTokenMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.IssuePreviewTokenMutation>(G.IssuePreviewTokenDocument, variables, requestOptions),

    upsertMarket: (variables: G.UpsertMarketMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpsertMarketMutation>(G.UpsertMarketDocument, variables, requestOptions),
    upsertLocale: (variables: G.UpsertLocaleMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.UpsertLocaleMutation>(G.UpsertLocaleDocument, variables, requestOptions),
    upsertSiteLocaleOverride: (
      variables: G.UpsertSiteLocaleOverrideMutationVariables,
      requestOptions?: RequestOptions
    ) =>
      execute<G.UpsertSiteLocaleOverrideMutation>(G.UpsertSiteLocaleOverrideDocument, variables, requestOptions),
    setSiteUrlPattern: (variables: G.SetSiteUrlPatternMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.SetSiteUrlPatternMutation>(G.SetSiteUrlPatternDocument, variables, requestOptions),
    setSiteName: (variables: G.SetSiteNameMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.SetSiteNameMutation>(G.SetSiteNameDocument, variables, requestOptions),
    setSiteMarkets: (variables: G.SetSiteMarketsMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.SetSiteMarketsMutation>(G.SetSiteMarketsDocument, variables, requestOptions),
    setSiteLocales: (variables: G.SetSiteLocalesMutationVariables, requestOptions?: RequestOptions) =>
      execute<G.SetSiteLocalesMutation>(G.SetSiteLocalesDocument, variables, requestOptions),
    setSiteMarketLocaleMatrix: (
      variables: G.SetSiteMarketLocaleMatrixMutationVariables,
      requestOptions?: RequestOptions
    ) => execute<G.SetSiteMarketLocaleMatrixMutation>(G.SetSiteMarketLocaleMatrixDocument, variables, requestOptions)
  };
}
