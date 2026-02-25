# ContentHead Architecture

## Monorepo modules

- `apps/api`: GraphQL-first backend (schema + resolvers + services + seed/migrations).
- `apps/admin`: React/PrimeReact authoring and administration UI.
- `apps/web`: Next.js rendering app (`/[...slug]`, `/preview`, `/demo`).
- `packages/sdk`: generated GraphQL client wrapper consumed by admin/web.
- `packages/schema`: exported GraphQL SDL artifact.
- `packages/shared`: cross-app shared utilities/types.

## Data flow

1. API schema is defined in `apps/api/src/graphql/schema.ts`.
2. `pnpm schema` exports SDL to `packages/schema/dist/schema.graphql`.
3. `pnpm codegen` regenerates typed operations in admin/web/sdk.
4. Admin and web call API via `packages/sdk` methods.
5. Admin edits content and publishes versions.
6. Web resolves route -> content -> variant and renders page/components.

## Reliability gates

- `pnpm ops:inventory`: validates all operations used by admin/web/sdk exist in schema.
- `pnpm test:health`: seed + ops inventory + API integration tests + admin tests.
- `pnpm build`: schema + codegen + workspace build.

## Feature boundaries

- `auth`: login/me, internal auth provider.
- `content`: content types, items, versions, routes, component instances.
- `assets`: DAM storage + metadata.
- `personalization`: variant sets/variants and targeting.
- `forms`: builder, validation, submissions/export.
- `workflows`: definitions/runs/approval.
- `settings`: connectors/preferences/DB admin.
- `security`: roles, groups, ACL, permission evaluation.
- `devtools`: diagnostics + GraphiQL.
