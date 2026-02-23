# ContentHead Monorepo

TypeScript-only pnpm workspace:
- `apps/api`: GraphQL API (auth, market/locale matrix, CMS core)
- `apps/admin`: PrimeReact CMS admin shell
- `apps/web`: Next.js renderer (`/[...slug]`)
- `packages/schema`: exported GraphQL SDL
- `packages/shared`: shared TS types
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
- API: `http://localhost:4000/graphql`
- Admin: `http://localhost:5173`
- Web: `http://localhost:3000`

## Root Commands
- `pnpm dev`: start api/admin/web
- `pnpm schema`: export SDL to `packages/schema/dist/schema.graphql`
- `pnpm codegen`: generate TypedDocumentNode outputs
- `pnpm build`: `schema -> codegen -> build all`
- `pnpm typecheck`
- `pnpm test`

## CMS Core Implemented

### Data Model
Migrations:
- `001_initial` users/auth
- `002_sites_markets_locales` site + matrix
- `003_cms_core` content types/items/versions/templates/routes

CMS tables:
- `content_types`
- `content_items`
- `content_versions` (append-only)
- `templates`
- `content_routes`

Route market/locale enforcement:
- `content_routes` references `(site_id, market_code, locale_code)`
- API validates active combo (`INVALID_MARKET_LOCALE` on violation)

### GraphQL (API)
Content Types:
- `listContentTypes`, `createContentType`, `updateContentType`, `deleteContentType`

Content Items + Versions:
- `listContentItems`, `getContentItemDetail`, `archiveContentItem`, `createContentItem`
- `createDraftVersion(fromVersionId?)`
- `updateDraftVersion(versionId, patch, expectedVersionNumber)` (creates new draft version)
- `publishVersion(versionId, expectedVersionNumber)` (creates published version)
- `listVersions(contentItemId)`
- `diffVersions(leftVersionId, rightVersionId)`
- `rollbackToVersion(contentItemId, versionId)` (creates new draft)

Templates:
- `listTemplates`, `createTemplate`, `updateTemplate`, `deleteTemplate`, `reconcileTemplate`

Routes + Resolution:
- `listRoutes`, `upsertRoute`, `deleteRoute`
- `resolveRoute(siteId, marketCode, localeCode, slug, previewToken?, preview?)`

Preview:
- `issuePreviewToken(contentItemId)`
- `resolveRoute` supports preview token / preview flag

### Admin UI (`apps/admin`)
Implemented sections:
- Content Tree (TreeTable from routes)
- Content List (DataTable)
- ContentType Builder (field definitions)
- Content Editor (dynamic fields from ContentType, draft save, publish)
- Version History (list, diff, rollback)
- Template Editor (minimal)
- Route Editor (market/locale picker limited to active combos)
- Topbar site + market + locale selectors

### Web Rendering (`apps/web`)
- Catch-all route: `app/[...slug]/page.tsx`
- Calls SDK `resolveRoute`
- Market/locale from query params:
  - `?siteId=1&market=US&locale=en-US`
- Renders components from published (or preview) version JSON:
  - `Hero`
  - `RichText`
  - `TeaserGrid`

## End-to-End Flow
1. Open Admin (`http://localhost:5173`)
2. Create a ContentType
3. Create a Content Item
4. Edit fields + save draft
5. Publish
6. Create Route (valid active market/locale combo)
7. Open Web route:
   - `http://localhost:3000/<slug>?siteId=1&market=US&locale=en-US`

## Enforcement Example
Invalid combo route upsert (or validation) returns GraphQL error code:
- `INVALID_MARKET_LOCALE`

## Verified
- `pnpm schema` passes
- `pnpm codegen` passes
- `pnpm build` passes
- `pnpm typecheck` passes
- API route resolution + market/locale enforcement + Next catch-all rendering verified