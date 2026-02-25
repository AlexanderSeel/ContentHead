# Permissions and RBAC

## Baseline model

- Users are assigned roles through `user_roles`.
- Roles map to permissions through `role_permissions`.
- Seed ensures baseline `admin` and `editor` roles.
- Seed reconciles the configured admin user and guarantees admin-role linkage.

## Evaluation rules

Permission checks are centralized in `apps/api/src/security/permissionEvaluator.ts`.

Evaluation order:
1. Missing user/action => deny.
2. If user has role `admin` => allow.
3. If explicit `DENY:<ACTION>` exists => deny.
4. If requested action (or fallback action) exists => allow.
5. Otherwise => deny.

## GraphQL guard usage

- `requirePermission(ctx, permission)` for standard protected operations.
- `requireDbAdminAccess(ctx, legacyPermission)` for DB admin operations using fallback semantics.
- Security operations require `SECURITY_MANAGE`.

## Diagnostics

`devDiagnostics` query exposes:
- current user roles
- current user permission list
- seed health checks:
  - admin role exists
  - admin permissions cover baseline internal permissions
  - admin user is linked to admin role

## UI behavior

- Admin pages should pre-check permissions where practical and avoid issuing known-forbidden actions.
- Forbidden states are rendered with shared `ForbiddenState` component for consistency.
