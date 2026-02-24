# Admin UI Operations Inventory

This inventory tracks GraphQL operations used by admin panels via `@contenthead/sdk` and local admin queries.

## Local Admin Operations

- `AdminSiteMatrix`
- `Me`
- `Login`

## SDK Operations by Panel

- Content Pages / Routes / Templates / Content Types
  - `ListContentTypes`, `CreateContentType`, `UpdateContentType`, `DeleteContentType`
  - `ListContentItems`, `GetContentItemDetail`, `ListVersions`, `CreateDraftVersion`, `UpdateDraftVersion`, `PublishVersion`, `RollbackToVersion`
  - `ListTemplates`, `CreateTemplate`, `UpdateTemplate`, `DeleteTemplate`, `ReconcileTemplate`
  - `ListRoutes`, `UpsertRoute`, `DeleteRoute`, `GetPageTree`, `IssuePreviewToken`
- DAM / Assets
  - `ListAssets`, `GetAsset`, `ListAssetFolders`, `CreateAssetFolder`, `UpdateAssetMetadata`, `DeleteAsset`
- Variants / Personalization
  - `ListVariantSets`, `UpsertVariantSet`, `DeleteVariantSet`
  - `ListVariants`, `SelectVariant`, `UpsertVariant`, `DeleteVariant`
  - `ListVisitorGroups`, `UpsertVisitorGroup`, `DeleteVisitorGroup`
  - `GetPageTargeting`, `EvaluatePageTargeting`, `UpsertPageTargeting`
- Forms
  - `ListForms`, `UpsertForm`, `DeleteForm`
  - `ListFormSteps`, `UpsertFormStep`, `DeleteFormStep`
  - `ListFormFields`, `UpsertFormField`, `DeleteFormField`
  - `ListFormSubmissions`, `ExportFormSubmissions`, `SubmitForm`, `UpdateSubmissionStatus`, `EvaluateForm`
- Workflows
  - `ListWorkflowDefinitions`, `UpsertWorkflowDefinition`, `DeleteWorkflowDefinition`
  - `ListWorkflowRuns`, `GetWorkflowRun`, `StartWorkflowRun`, `ApproveStep`, `RetryFailed`
- Connectors / Security / DB Admin
  - `ListConnectors`, `UpsertConnector`, `DeleteConnector`, `SetDefaultConnector`, `TestConnector`
  - `ListInternalUsers`, `CreateInternalUser`, `UpdateInternalUser`, `ResetInternalUserPassword`
  - `ListInternalRoles`, `UpsertInternalRole`, `DeleteInternalRole`, `SetUserRoles`
  - `ListPrincipalGroups`, `UpsertPrincipalGroup`, `DeletePrincipalGroup`, `SetUserGroups`
  - `ListEntityAcls`, `ReplaceEntityAcls`, `GetPageAclSettings`, `UpsertPageAclSettings`
  - `DbAdminTables`, `DbAdminDescribe`, `DbAdminList`, `DbAdminInsert`, `DbAdminUpdate`, `DbAdminDelete`, `DbAdminSql`
- Site Settings (Markets/Locales)
  - `ListSites`, `GetSite`, `LocaleCatalog`, `GetSiteDefaults`, `GetSiteMarketLocaleMatrix`
  - `UpsertMarket`, `UpsertLocale`, `UpsertSiteLocaleOverride`
  - `SetSiteName`, `SetSiteUrlPattern`, `SetSiteMarkets`, `SetSiteLocales`, `SetSiteMarketLocaleMatrix`
