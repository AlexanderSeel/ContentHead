# ContentHead Monorepo

TypeScript-only pnpm workspace:
- `apps/api`: GraphQL API (auth, matrix, CMS core, variants, forms, workflows, AI connector)
- `apps/admin`: Vite + React + PrimeReact admin (content, variants, visivic preview, forms, workflow designer, DAM, connectors, security)
- `apps/web`: Next.js renderer (`/[...slug]`, `/demo`, `/preview`)
- `packages/schema`: exported GraphQL SDL
- `packages/shared`: shared deterministic rule/condition engines
- `packages/sdk`: typed GraphQL client (`graphql-request` + TypedDocumentNode)

## Prerequisites
- Node.js 20+
- pnpm 10+

## Setup
```bash
pnpm install
cp .env.example .env
pnpm --filter @contenthead/api migrate
pnpm --filter @contenthead/api seed
```

## Credentials
- Username: `admin`
- Password: `admin123!`

## URLs
- API GraphQL: `http://localhost:4000/graphql`
- Admin: `http://localhost:5173`
- Web: `http://localhost:3000`
- Web Demo Landing: `http://localhost:3000/demo?siteId=1&market=US&locale=en-US`
- Web Preview (Visivic): `http://localhost:3000/preview?contentItemId=<id>&token=<previewToken>&siteId=1&market=US&locale=en-US`

## Demo Import
- Demo payload: `apps/admin/public/demo/contenthead-demo-import.json`
- Import screen: `/settings/global/duckdb`
- Click `Load Demo Import`, then `Import JSON`.
- Backward-compatible format: `schemaVersion: 1` with optional sections:
  - `siteConfig` (`urlPattern`, `markets`, `locales`, `matrix`)
  - `forms` (forms + steps + fields)
  - `variants` (item-indexed variant definitions + optional version patch payload)
- Import now auto-publishes imported items so routes work in `apps/web` immediately.

### Demo Routes
- `/{market}/{locale}/home`
- `/{market}/{locale}/demo`
- `/{market}/{locale}/products`
- `/{market}/{locale}/products/product-a`
- `/{market}/{locale}/articles`
- `/{market}/{locale}/articles/first`
- `/{market}/{locale}/articles/second`
- `/{market}/{locale}/contact`

### Variant Testing
- Demo page (`demo`) has A/B variants for `US/en-US`.
- Target rule: `segments` contains `beta` OR `country == US`.
- Weighted split: `variant_a` 50 / `variant_b` 50.
- Test:
  - `/demo?siteId=1&market=US&locale=en-US&segments=beta`
  - Force: add `&variantKey=variant_b`

### Form Submissions
- Web forms now persist through `submitForm`.
- Admin submissions grid: `/forms/submissions`.
- Features: filters, search, grouping, paging, bulk status updates, row expand JSON, CSV/JSON export.

## Theme Switcher
- Admin topbar now includes:
  - PrimeReact theme switcher (10 presets, including dark themes)
  - UI scale slider (12px-16px base font size)
- Selection is persisted in localStorage and restored on reload.
- Dev diagnostics includes a theme token panel at `/dev/diagnostics` to inspect active CSS variables (`--surface-*`, `--text-color`, `--primary-color`).

## Ask AI
- Every major admin section exposes an `Ask AI` action in the page header.
- Context-specific prompt templates are included for:
  - Content Types
  - Content Editing
  - Forms
  - Workflows
  - GraphQL
- Suggested text can be copied, inserted into active editors, or applied where supported.

## Root Commands
- `pnpm dev`: run API + Admin + Web
- `pnpm schema`: export SDL to `packages/schema/dist/schema.graphql`
- `pnpm codegen`: generate TypedDocumentNode outputs
- `pnpm build`: `schema -> codegen -> build all`
- `pnpm typecheck`
- `pnpm test`
- `pnpm ops:inventory`: export schema + validate UI-used GraphQL operations against schema
- `pnpm test:health`: seed + ops inventory + API integration tests + admin tests


## Architecture / Reliability Docs
- System health checklist: `docs/health.md`
- Architecture overview: `docs/architecture.md`
- RBAC rules: `docs/permissions.md`
- Preview bridge protocol: `docs/preview-visivic.md`

## Admin Navigation
Admin now uses routed backend UI with shell layout:
- Topbar + Breadcrumbs + Site/Market/Locale switchers + user menu
- Sidebar sections:
  - Dashboard
  - Site Settings (`/site/overview`, `/site/markets-locales`, `/site/content-types`)
  - Content (`/content/pages`, `/content/templates`, `/content/routes`, `/content/assets`)
  - Connector Settings (`/settings/global/connectors/auth|db|dam|ai`)
  - DB Admin (`/settings/global/db-admin`)
  - Personalization (`/personalization/variants`)
  - Forms (`/forms/builder`, `/forms/submissions`)
  - Workflows (`/workflows/designer`, `/workflows/runs`)
  - Security (`/security/users`, `/security/roles`)

Content Pages route (`/content/pages`) now uses a full-width CMS workspace:
- Left pane: `Tree` + `Search` tabs with slug/title/status, URL-synced selection
- Center pane tabs: `Fields`, `Components`, `Routes`, `Versions`, `Variants`, `Advanced`
- Right pane: live on-page preview iframe (Visivic bridge)
- Sticky action bar: create/save/publish, issue preview token, open `Preview website`, Ask AI
- Raw JSON editing is `Advanced`-only (explicit enable toggle)
- `contentLink` and `contentLinkList` field types keep the Link Selector dialog with internal/external tabs.
- `assetRef` and `assetList` field types use DAM picker dialogs (folders, thumbnail grid, metadata preview).

## Demo Landing Page
- Seed creates a CMS-driven **Demo Landing Page** route at:
  - `US/en-US`: `/demo`
  - `DE/de-DE`: `/demo`
- Composition includes:
  - Hero
  - Feature grid
  - Alternating image/text teasers
  - Pricing table
  - FAQ
  - Newsletter form block (`formRef`)
  - Footer with link groups and social links
- Seed also creates:
  - DAM assets (`demo-hero.svg`, `demo-section.svg`)
  - Newsletter form (`Newsletter Signup`)
  - Variant `hero_ab` changing hero headline and section ordering

## DAM (Digital Asset Management)
- API:
  - GraphQL:
    - Core: `listAssets`, `getAsset`, `listAssetFolders`, `createAssetFolder`, `updateAssetMetadata`, `deleteAsset`
    - Image editor: `updateAssetFocalPoint`, `upsertAssetPois`, `upsertAssetRenditionPresets`, `generateAssetRendition`, `deleteAssetRendition`
  - Upload endpoint: `POST /api/assets/upload?siteId=<id>[&folderId=<id>]` (multipart form)
  - Serve original: `GET /assets/:id`
  - Serve rendition: `GET /assets/:id/rendition/:kind` (`thumb|small|medium|large`)
  - Serve preset rendition: `GET /assets/:id/rendition/preset/:presetId` (or `GET /assets/:id/rendition/:kind?presetId=<presetId>`)
- Storage:
  - `AssetStorageProvider` interface with `LocalFileStorageProvider`
  - local default path: `apps/api/.data/assets` (configurable via DAM connector / `ASSETS_BASE_PATH`)
  - image thumbnails and preset renditions generated with `sharp` (cover/contain, focal crop, optional explicit crop)
- Admin:
  - Asset library page: `/content/assets`
  - Visual **Edit Image** workspace (asset library row action + asset picker preview)
    - Crop & focal point
    - Rendition presets (sizes, mode, format, quality, optional crop)
    - POIs/hotspots with per-POI internal/external links
    - Metadata and collapsed Advanced JSON
  - Content editing integration:
    - `assetRef` picker supports `presetId` + `showPois`
    - quick link: **Edit image**
- Web:
  - `CmsImage` helper supports `presetId` and optional POI overlays with keyboard-accessible hotspot links.

## Connector Settings
- Generic connector framework (`connectors` table + GraphQL CRUD/test/default operations)
- Settings pages:
  - `/settings/global/connectors/auth`
  - `/settings/global/connectors/db`
  - `/settings/global/connectors/dam`
  - `/settings/global/connectors/ai`
- Baseline providers seeded:
  - Auth: `internal`
  - DB: `duckdb` (runtime still fixed to DuckDB for now)
  - DAM: `localfs`
  - AI: `mock`

## Internal Security Baseline
- Users and Roles are fully manageable in admin:
  - `/security/users`: create user, activate/deactivate, reset password, assign roles
  - `/security/roles`: CRUD roles and permissions
- Seed ensures baseline roles/permissions and internal auth fallback.
- Login page shows external auth provider stubs when enabled connectors exist; internal auth remains default fallback.

## Rule Editor
- Variants and Form Builder conditions now provide a visual Rule Editor dialog.
- Supports `ALL/ANY` groups and comparators: `eq`, `neq`, `in`, `contains`, `gt`, `lt`, `regex`.
- Includes:
  - visual row builder
  - Advanced JSON tab
  - test context evaluation panel

## Dev Tools GraphiQL
- Route: `/dev/graphiql` (development mode only)
- Embedded GraphiQL executes against `http://localhost:4000/graphql` (or `VITE_API_URL`)
- Supports current session bearer token, `x-preview-token`, and editable headers JSON
- Includes explorer, docs, headers/variables editor, and response inspector (no built-in samples)
- Includes docs explorer and explorer sidebar plugin.
- Splitter layout is now resizable and includes response inspector + quick actions:
  - Prettify
  - Copy cURL
  - Copy fetch()
  - Clear/Copy response

## URL Pattern Configuration
- Site settings support per-site URL rewrite pattern:
  - `/{market}/{locale}/...`
  - `/{market}-{locale}/...`
  - `/{locale}/{market}/...`
  - Custom patterns containing `{market}` and `{locale}`
- Web route resolution now reads market/locale from path based on site `urlPattern`.
- Query parameters (`market`, `locale`) still override path values for development/testing.

## Implemented Feature Set

### Market/Locale Matrix
- Site market/locale matrix with active/default combos in DuckDB
- API enforcement for invalid combos (`INVALID_MARKET_LOCALE`)
- Route and variant-set binding to active combos only

### CMS Core
- Content Types CRUD
- Content Items CRUD
- Append-only Content Versions (`DRAFT|PUBLISHED|ARCHIVED`)
- Templates CRUD + basic reconcile suggestions
- Routes CRUD + route resolution + preview token support

### Variants
- VariantSet/Variant CRUD per `site + contentItem + market + locale`
- Deterministic rule evaluation (`all/any/not`, `eq/neq/in/contains/gt/lt/regex`)
- Deterministic traffic allocation hash for A/B
- `getPageByRoute(...)` selects variant + version by context

### Visivic (Visual Editing)
- `Preview website` opens the real Next.js renderer:
  - Draft: `/preview?contentItemId=&siteId=&market=&locale=&token=&versionId=`
  - Published: localized public route using site `urlPattern`
- Preview/public pages now annotate editable DOM:
  - `data-cms-content-item-id`
  - `data-cms-version-id`
  - `data-cms-component-id`
  - `data-cms-component-type`
  - `data-cms-field-path`
- PostMessage bridge (admin <-> iframe):
  - iframe -> admin: `CMS_SELECT`
  - admin -> iframe: `CMS_HIGHLIGHT`, `CMS_SCROLL_TO`, `CMS_REFRESH`
- Editing flow:
  - click element in preview to select matching field/component in admin
  - selecting in admin highlights/scrolls corresponding preview element
  - save draft refreshes preview render

### Form Engine
- DB tables:
  - `forms`
  - `form_steps`
  - `form_fields`
- Shared condition evaluator (`packages/shared/src/forms/conditions.ts`)
  - show/hide, required-if, enable/disable via rule conditions
- GraphQL:
  - Form CRUD (`upsert/delete/list` for forms, steps, fields)
  - `evaluateForm(formId, answersJson, contextJson)`
  - `submitForm(...)`
  - `listFormSubmissions(...)`
  - `updateSubmissionStatus(...)`
  - `exportFormSubmissions(..., format: CSV|JSON)`
- Admin Form Builder:
  - designer + preview + structure modes
  - visual inspector for properties, validation and conditions
  - advanced JSON only for power-user fallback
- Admin Submissions page:
  - DataGrid filters/search/grouping/paging
  - expandable JSON answer/meta inspection
  - CSV and JSON export

### Workflow Engine
- DB tables:
  - `workflow_definitions`
  - `workflow_runs`
  - `workflow_step_states`
- Deterministic executor:
  - persists run/step state after each node
  - supports pause/resume with `ManualApproval`
- Supported node types:
  - `FetchContent`
  - `CreateDraftVersion`
  - `ManualApproval`
  - `PublishVersion`
  - `ActivateVariant`
  - `AI.GenerateType`
  - `AI.GenerateContent`
  - `AI.GenerateVariants`
  - `AI.Translate`
  - `Notify` (stub)
- GraphQL:
  - definition CRUD
  - run start/get/list
  - `approveStep`
  - `retryFailed`
- Admin React Flow UI:
  - node palette
  - graph view
  - visual node config inspector
  - advanced JSON fallback for node config
  - run viewer with approve/retry

### AI Connector
- `AIProvider` interface (`apps/api/src/ai/provider.ts`)
- `MockAIProvider` deterministic, no network
- `OpenAICompatibleProviderStub` structural (enabled only if `OPENAI_API_KEY` exists)
- GraphQL mutations:
  - `aiGenerateContentType`
  - `aiGenerateContent`
  - `aiGenerateVariants`
  - `aiTranslateVersion`
- All AI payloads validated with Zod before commit to DB
- AI actions are workflow-node compatible
- Default AI provider now resolves from connector settings (fallback: `mock`)

## Seeded Workflow
`pnpm --filter @contenthead/api seed` creates `Default Publish Flow v1`:
1. `AI.GenerateContent`
2. `CreateDraftVersion`
3. `ManualApproval`
4. `PublishVersion`
5. `ActivateVariant(default)`

## Demo Path (End-to-End)
1. Start all apps:
```bash
pnpm dev
```
2. Open Admin: `http://localhost:5173`
3. Matrix setup:
- ensure active combo `US / en-US` (already seeded)

4. Open seeded demo:
- `http://localhost:3000/demo?siteId=1&market=US&locale=en-US`
- optional variant segment trigger: `&segments=experiment_b`

5. Visivic preview:
- open `Content -> Pages`
- select the `demo` route
- use on-page bridge to select and edit fields/components

6. DAM flow:
- go to `/content/assets`
- upload image(s), edit metadata
- use `assetRef`/`assetList` in fields or component props

7. Forms:
- demo import includes `Newsletter Signup` and `Contact / Quote Request`
- submit from `/demo` and `/contact`
- inspect/export in admin at `/forms/submissions`

8. Workflows:
- open Workflow Designer
- save workflow definition (or use seeded one)
- start run
- run pauses on `ManualApproval`
- click Approve
- run resumes and completes

9. Web published rendering:
- open route: `http://localhost:3000/demo?siteId=1&market=US&locale=en-US`
- optional variant context: `&segments=experiment_b`

## Validation Status
Passed locally:
- `pnpm schema`
- `pnpm codegen`
- `pnpm typecheck`
- `pnpm test`
- `pnpm ops:inventory`: export schema + validate UI-used GraphQL operations against schema
- `pnpm test:health`: seed + ops inventory + API integration tests + admin tests
- `pnpm build`
