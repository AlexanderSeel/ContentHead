# ContentHead Monorepo

TypeScript-only pnpm workspace:
- `apps/api`: GraphQL API (auth, matrix, CMS core, variants, forms, workflows, AI connector)
- `apps/admin`: Vite + React + PrimeReact admin (content, variants, visivic preview, forms, workflow designer)
- `apps/web`: Next.js renderer (`/[...slug]` + `/preview`)
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
- Web Preview (Visivic): `http://localhost:3000/preview?contentItemId=<id>&token=<previewToken>&siteId=1&market=US&locale=en-US`

## Theme Switcher
- Admin topbar now includes:
  - PrimeReact theme switcher (10 presets, including dark themes)
  - UI scale slider (12px-16px base font size)
- Selection is persisted in localStorage and restored on reload.
- Dev diagnostics includes a theme token panel at `/dev/diagnostics` to inspect active CSS variables (`--surface-*`, `--text-color`, `--primary-color`).

## Root Commands
- `pnpm dev`: run API + Admin + Web
- `pnpm schema`: export SDL to `packages/schema/dist/schema.graphql`
- `pnpm codegen`: generate TypedDocumentNode outputs
- `pnpm build`: `schema -> codegen -> build all`
- `pnpm typecheck`
- `pnpm test`

## Admin Navigation
Admin now uses routed backend UI with shell layout:
- Topbar + Breadcrumbs + Site/Market/Locale switchers + user menu
- Sidebar sections:
  - Dashboard
  - Site Settings (`/site/overview`, `/site/markets-locales`)
  - Content (`/content/pages`, `/content/templates`, `/content/routes`)
  - Schema (`/schema/content-types`)
  - Personalization (`/personalization/variants`)
  - Forms (`/forms/builder`)
  - Workflows (`/workflows/designer`, `/workflows/runs`)
  - Security (`/security/users`, `/security/roles`)

Content Pages route (`/content/pages`) uses split-pane UX:
- Left: TreeTable + Search tabs
- Right: Edit / Routes / Versions / Variants / Preview tabs
  - Edit uses visual PrimeReact property editors for content fields and component props
  - Raw JSON is available in Advanced sections with explicit enable toggle

## Dev Tools GraphiQL
- Route: `/dev/graphiql` (development mode only)
- Embedded GraphiQL executes against `http://localhost:4000/graphql` (or `VITE_API_URL`)
- Supports current session bearer token, `x-preview-token`, and editable headers JSON
- Includes sample query insertion (`me`, `listSites`, matrix, route resolution, versions, workflow operations)
- Includes docs explorer and explorer sidebar plugin.

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
- New web route: `/preview?contentItemId=&token=&variantKey?=&versionId?`
- Preview DOM annotations:
  - `data-cms-content-item-id`
  - `data-cms-version-id`
  - `data-cms-component-id`
  - `data-cms-field-path`
- PostMessage bridge from web iframe to admin on hover/click:
  - payload includes `fieldPath`, `componentId`, `contentItemId`, `versionId`
- Admin preview iframe listens and focuses/highlights matching field editor

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
- Admin Form Builder:
  - designer + preview + structure modes
  - visual inspector for properties, validation and conditions
  - advanced JSON only for power-user fallback

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

4. Create content:
- create content type
- create content item
- save draft
- publish
- add route (for example `home`)

5. Variants:
- create/select variant set for `US/en-US`
- add at least two variants with different rules
- bind each variant to a content version

6. Visivic preview:
- issue preview token in Content Editor
- open iframe preview panel
- click/hover annotated element in preview
- admin focuses/highlights corresponding field row

7. Forms:
- open Form Builder
- create form + step + field
- set `conditionsJson` (example: `{"showIf":{"op":"eq","field":"country","value":"US"}}`)
- run Evaluate Form with `contextJson` `{ "country": "US" }`

8. Workflows:
- open Workflow Designer
- save workflow definition (or use seeded one)
- start run
- run pauses on `ManualApproval`
- click Approve
- run resumes and completes

9. Web published rendering:
- open route: `http://localhost:3000/home?siteId=1&market=US&locale=en-US`
- optional variant context: `&segments=vip`

## Validation Status
Passed locally:
- `pnpm schema`
- `pnpm codegen`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
