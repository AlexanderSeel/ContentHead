import { GraphQLClient } from 'graphql-request';

import {
  ArchiveContentItemDocument,
  type ArchiveContentItemMutation,
  type ArchiveContentItemMutationVariables,
  CreateContentItemDocument,
  type CreateContentItemMutation,
  type CreateContentItemMutationVariables,
  CreateContentTypeDocument,
  type CreateContentTypeMutation,
  type CreateContentTypeMutationVariables,
  CreateDraftVersionDocument,
  type CreateDraftVersionMutation,
  type CreateDraftVersionMutationVariables,
  CreateTemplateDocument,
  type CreateTemplateMutation,
  type CreateTemplateMutationVariables,
  DeleteContentTypeDocument,
  type DeleteContentTypeMutation,
  type DeleteContentTypeMutationVariables,
  DeleteRouteDocument,
  type DeleteRouteMutation,
  type DeleteRouteMutationVariables,
  DeleteTemplateDocument,
  type DeleteTemplateMutation,
  type DeleteTemplateMutationVariables,
  DiffVersionsDocument,
  type DiffVersionsQuery,
  type DiffVersionsQueryVariables,
  GetContentItemDetailDocument,
  type GetContentItemDetailQuery,
  type GetContentItemDetailQueryVariables,
  GetSiteDefaultsDocument,
  type GetSiteDefaultsQuery,
  type GetSiteDefaultsQueryVariables,
  GetSiteMarketLocaleMatrixDocument,
  type GetSiteMarketLocaleMatrixQuery,
  type GetSiteMarketLocaleMatrixQueryVariables,
  IssuePreviewTokenDocument,
  type IssuePreviewTokenMutation,
  type IssuePreviewTokenMutationVariables,
  ListContentItemsDocument,
  type ListContentItemsQuery,
  type ListContentItemsQueryVariables,
  ListContentTypesDocument,
  type ListContentTypesQuery,
  type ListContentTypesQueryVariables,
  ListLocalesDocument,
  type ListLocalesQuery,
  type ListLocalesQueryVariables,
  ListMarketsDocument,
  type ListMarketsQuery,
  type ListMarketsQueryVariables,
  ListRoutesDocument,
  type ListRoutesQuery,
  type ListRoutesQueryVariables,
  ListSitesDocument,
  type ListSitesQuery,
  ListTemplatesDocument,
  type ListTemplatesQuery,
  type ListTemplatesQueryVariables,
  ListVersionsDocument,
  type ListVersionsQuery,
  type ListVersionsQueryVariables,
  LoginDocument,
  type LoginMutation,
  type LoginMutationVariables,
  MeDocument,
  type MeQuery,
  PublishVersionDocument,
  type PublishVersionMutation,
  type PublishVersionMutationVariables,
  ReconcileTemplateDocument,
  type ReconcileTemplateMutation,
  type ReconcileTemplateMutationVariables,
  ResolveMarketLocaleDocument,
  type ResolveMarketLocaleQuery,
  type ResolveMarketLocaleQueryVariables,
  ResolveRouteDocument,
  type ResolveRouteQuery,
  type ResolveRouteQueryVariables,
  RollbackToVersionDocument,
  type RollbackToVersionMutation,
  type RollbackToVersionMutationVariables,
  SetSiteLocalesDocument,
  type SetSiteLocalesMutation,
  type SetSiteLocalesMutationVariables,
  SetSiteMarketLocaleMatrixDocument,
  type SetSiteMarketLocaleMatrixMutation,
  type SetSiteMarketLocaleMatrixMutationVariables,
  SetSiteMarketsDocument,
  type SetSiteMarketsMutation,
  type SetSiteMarketsMutationVariables,
  UpdateContentTypeDocument,
  type UpdateContentTypeMutation,
  type UpdateContentTypeMutationVariables,
  UpdateDraftVersionDocument,
  type UpdateDraftVersionMutation,
  type UpdateDraftVersionMutationVariables,
  UpdateTemplateDocument,
  type UpdateTemplateMutation,
  type UpdateTemplateMutationVariables,
  UpsertLocaleDocument,
  type UpsertLocaleMutation,
  type UpsertLocaleMutationVariables,
  UpsertMarketDocument,
  type UpsertMarketMutation,
  type UpsertMarketMutationVariables,
  UpsertRouteDocument,
  type UpsertRouteMutation,
  type UpsertRouteMutationVariables,
  ValidateMarketLocaleDocument,
  type ValidateMarketLocaleQuery,
  type ValidateMarketLocaleQueryVariables
} from './graphql/generated';

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

  const execute = async <TData, TVariables extends object>(
    document: unknown,
    variables: TVariables,
    requestOptions?: RequestOptions
  ) => {
    const client = await getClient(requestOptions);
    return (client as any).request(document, variables) as Promise<TData>;
  };

  return {
    login: (variables: LoginMutationVariables, requestOptions?: RequestOptions) =>
      execute<LoginMutation, LoginMutationVariables>(LoginDocument, variables, requestOptions),
    me: (requestOptions?: RequestOptions) => execute<MeQuery, Record<string, never>>(MeDocument, {}, requestOptions),

    listSites: (requestOptions?: RequestOptions) =>
      execute<ListSitesQuery, Record<string, never>>(ListSitesDocument, {}, requestOptions),
    listMarkets: (variables: ListMarketsQueryVariables, requestOptions?: RequestOptions) =>
      execute<ListMarketsQuery, ListMarketsQueryVariables>(ListMarketsDocument, variables, requestOptions),
    listLocales: (variables: ListLocalesQueryVariables, requestOptions?: RequestOptions) =>
      execute<ListLocalesQuery, ListLocalesQueryVariables>(ListLocalesDocument, variables, requestOptions),
    getSiteDefaults: (variables: GetSiteDefaultsQueryVariables, requestOptions?: RequestOptions) =>
      execute<GetSiteDefaultsQuery, GetSiteDefaultsQueryVariables>(
        GetSiteDefaultsDocument,
        variables,
        requestOptions
      ),
    getSiteMarketLocaleMatrix: (
      variables: GetSiteMarketLocaleMatrixQueryVariables,
      requestOptions?: RequestOptions
    ) =>
      execute<GetSiteMarketLocaleMatrixQuery, GetSiteMarketLocaleMatrixQueryVariables>(
        GetSiteMarketLocaleMatrixDocument,
        variables,
        requestOptions
      ),
    validateMarketLocale: (variables: ValidateMarketLocaleQueryVariables, requestOptions?: RequestOptions) =>
      execute<ValidateMarketLocaleQuery, ValidateMarketLocaleQueryVariables>(
        ValidateMarketLocaleDocument,
        variables,
        requestOptions
      ),
    resolveMarketLocale: (variables: ResolveMarketLocaleQueryVariables, requestOptions?: RequestOptions) =>
      execute<ResolveMarketLocaleQuery, ResolveMarketLocaleQueryVariables>(
        ResolveMarketLocaleDocument,
        variables,
        requestOptions
      ),

    createContentType: (variables: CreateContentTypeMutationVariables, requestOptions?: RequestOptions) =>
      execute<CreateContentTypeMutation, CreateContentTypeMutationVariables>(
        CreateContentTypeDocument,
        variables,
        requestOptions
      ),
    updateContentType: (variables: UpdateContentTypeMutationVariables, requestOptions?: RequestOptions) =>
      execute<UpdateContentTypeMutation, UpdateContentTypeMutationVariables>(
        UpdateContentTypeDocument,
        variables,
        requestOptions
      ),
    deleteContentType: (variables: DeleteContentTypeMutationVariables, requestOptions?: RequestOptions) =>
      execute<DeleteContentTypeMutation, DeleteContentTypeMutationVariables>(
        DeleteContentTypeDocument,
        variables,
        requestOptions
      ),
    listContentTypes: (variables: ListContentTypesQueryVariables, requestOptions?: RequestOptions) =>
      execute<ListContentTypesQuery, ListContentTypesQueryVariables>(
        ListContentTypesDocument,
        variables,
        requestOptions
      ),

    createContentItem: (variables: CreateContentItemMutationVariables, requestOptions?: RequestOptions) =>
      execute<CreateContentItemMutation, CreateContentItemMutationVariables>(
        CreateContentItemDocument,
        variables,
        requestOptions
      ),
    archiveContentItem: (variables: ArchiveContentItemMutationVariables, requestOptions?: RequestOptions) =>
      execute<ArchiveContentItemMutation, ArchiveContentItemMutationVariables>(
        ArchiveContentItemDocument,
        variables,
        requestOptions
      ),
    listContentItems: (variables: ListContentItemsQueryVariables, requestOptions?: RequestOptions) =>
      execute<ListContentItemsQuery, ListContentItemsQueryVariables>(
        ListContentItemsDocument,
        variables,
        requestOptions
      ),
    getContentItemDetail: (variables: GetContentItemDetailQueryVariables, requestOptions?: RequestOptions) =>
      execute<GetContentItemDetailQuery, GetContentItemDetailQueryVariables>(
        GetContentItemDetailDocument,
        variables,
        requestOptions
      ),

    createDraftVersion: (variables: CreateDraftVersionMutationVariables, requestOptions?: RequestOptions) =>
      execute<CreateDraftVersionMutation, CreateDraftVersionMutationVariables>(
        CreateDraftVersionDocument,
        variables,
        requestOptions
      ),
    updateDraftVersion: (variables: UpdateDraftVersionMutationVariables, requestOptions?: RequestOptions) =>
      execute<UpdateDraftVersionMutation, UpdateDraftVersionMutationVariables>(
        UpdateDraftVersionDocument,
        variables,
        requestOptions
      ),
    publishVersion: (variables: PublishVersionMutationVariables, requestOptions?: RequestOptions) =>
      execute<PublishVersionMutation, PublishVersionMutationVariables>(
        PublishVersionDocument,
        variables,
        requestOptions
      ),
    listVersions: (variables: ListVersionsQueryVariables, requestOptions?: RequestOptions) =>
      execute<ListVersionsQuery, ListVersionsQueryVariables>(ListVersionsDocument, variables, requestOptions),
    diffVersions: (variables: DiffVersionsQueryVariables, requestOptions?: RequestOptions) =>
      execute<DiffVersionsQuery, DiffVersionsQueryVariables>(DiffVersionsDocument, variables, requestOptions),
    rollbackToVersion: (variables: RollbackToVersionMutationVariables, requestOptions?: RequestOptions) =>
      execute<RollbackToVersionMutation, RollbackToVersionMutationVariables>(
        RollbackToVersionDocument,
        variables,
        requestOptions
      ),

    createTemplate: (variables: CreateTemplateMutationVariables, requestOptions?: RequestOptions) =>
      execute<CreateTemplateMutation, CreateTemplateMutationVariables>(
        CreateTemplateDocument,
        variables,
        requestOptions
      ),
    updateTemplate: (variables: UpdateTemplateMutationVariables, requestOptions?: RequestOptions) =>
      execute<UpdateTemplateMutation, UpdateTemplateMutationVariables>(
        UpdateTemplateDocument,
        variables,
        requestOptions
      ),
    deleteTemplate: (variables: DeleteTemplateMutationVariables, requestOptions?: RequestOptions) =>
      execute<DeleteTemplateMutation, DeleteTemplateMutationVariables>(
        DeleteTemplateDocument,
        variables,
        requestOptions
      ),
    listTemplates: (variables: ListTemplatesQueryVariables, requestOptions?: RequestOptions) =>
      execute<ListTemplatesQuery, ListTemplatesQueryVariables>(ListTemplatesDocument, variables, requestOptions),
    reconcileTemplate: (variables: ReconcileTemplateMutationVariables, requestOptions?: RequestOptions) =>
      execute<ReconcileTemplateMutation, ReconcileTemplateMutationVariables>(
        ReconcileTemplateDocument,
        variables,
        requestOptions
      ),

    upsertRoute: (variables: UpsertRouteMutationVariables, requestOptions?: RequestOptions) =>
      execute<UpsertRouteMutation, UpsertRouteMutationVariables>(UpsertRouteDocument, variables, requestOptions),
    deleteRoute: (variables: DeleteRouteMutationVariables, requestOptions?: RequestOptions) =>
      execute<DeleteRouteMutation, DeleteRouteMutationVariables>(DeleteRouteDocument, variables, requestOptions),
    listRoutes: (variables: ListRoutesQueryVariables, requestOptions?: RequestOptions) =>
      execute<ListRoutesQuery, ListRoutesQueryVariables>(ListRoutesDocument, variables, requestOptions),
    resolveRoute: (variables: ResolveRouteQueryVariables, requestOptions?: RequestOptions) =>
      execute<ResolveRouteQuery, ResolveRouteQueryVariables>(ResolveRouteDocument, variables, requestOptions),

    issuePreviewToken: (variables: IssuePreviewTokenMutationVariables, requestOptions?: RequestOptions) =>
      execute<IssuePreviewTokenMutation, IssuePreviewTokenMutationVariables>(
        IssuePreviewTokenDocument,
        variables,
        requestOptions
      ),

    upsertMarket: (variables: UpsertMarketMutationVariables, requestOptions?: RequestOptions) =>
      execute<UpsertMarketMutation, UpsertMarketMutationVariables>(UpsertMarketDocument, variables, requestOptions),
    upsertLocale: (variables: UpsertLocaleMutationVariables, requestOptions?: RequestOptions) =>
      execute<UpsertLocaleMutation, UpsertLocaleMutationVariables>(UpsertLocaleDocument, variables, requestOptions),
    setSiteMarkets: (variables: SetSiteMarketsMutationVariables, requestOptions?: RequestOptions) =>
      execute<SetSiteMarketsMutation, SetSiteMarketsMutationVariables>(
        SetSiteMarketsDocument,
        variables,
        requestOptions
      ),
    setSiteLocales: (variables: SetSiteLocalesMutationVariables, requestOptions?: RequestOptions) =>
      execute<SetSiteLocalesMutation, SetSiteLocalesMutationVariables>(
        SetSiteLocalesDocument,
        variables,
        requestOptions
      ),
    setSiteMarketLocaleMatrix: (
      variables: SetSiteMarketLocaleMatrixMutationVariables,
      requestOptions?: RequestOptions
    ) =>
      execute<SetSiteMarketLocaleMatrixMutation, SetSiteMarketLocaleMatrixMutationVariables>(
        SetSiteMarketLocaleMatrixDocument,
        variables,
        requestOptions
      )
  };
}
