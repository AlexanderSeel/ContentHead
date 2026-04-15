# ContentHead Admin — Open Work

_Generated after Phases A–D of ARCHITECTURE_REFACTOR.md._

---

## Phase D — Remaining migration quality

### D1: Legacy WorkspaceGrid call-sites ✅ DONE

All six `WorkspaceGrid` usages are on `data`/`columns` (TanStack) mode:

- `AssetLibraryPage.tsx` — migrated (multi-select, thumbnail column)
- `FormSubmissionsPage.tsx` — migrated (server sort/page, rowExpansionTemplate)
- `DbAdminPage.tsx` — migrated (dynamic columns, server sort/page)
- `RolesPage.tsx`, `UsersPage.tsx`, `WorkflowRunsPage.tsx` — already on new mode

### D2: WorkflowRunsPage WorkspaceGrid audit ✅ DONE

Already on new mode.

---

### D3: AssetPickerDialog — Tree component parity

The native `Tree` in `TreePanel.tsx` supports `selectionMode="single"` only.
AssetPickerDialog currently only needs single-select, but add `multiple`/`checkbox` if future use requires it.

---

### D4: primereact/primeflex CSS — remove stylesheet imports ✅ DONE

- Created `styles/utilities.css` — thin compatibility layer covering all PrimeFlex utility classes
  actually used in the codebase (grid, col-\*, w-\*, spacing, flex, border-round, object-fit).
- Replaced `import 'primeflex/primeflex.css'` in `main.tsx` with `import './styles/utilities.css'`.
- Deleted stale `main.js` artifact (missed by Phase A — last compiled version still had primeflex).
- `pnpm remove --filter @contenthead/admin primeflex` — package removed.
- _PrimeIcons_ kept standalone (`primeicons/primeicons.css` still imported — no React dependency).

---

### D5: Uninstall primereact package ✅ DONE

`pnpm remove --filter @contenthead/admin primereact` — package removed.
No remaining `from 'primereact'` imports in source. Zero TypeScript errors. Build passes.

---

## Phase E — Design token CSS system ✅ DONE

- Created `styles/tokens.css` — CSS custom properties for light/dark modes matching PrimeReact lara variable names
  (`--surface-card`, `--surface-border`, `--text-color`, `--primary-color`, semantic palette, etc.).
  Applied via `data-theme="light"` / `data-theme="dark"` on `<html>`.
- Rewrote `theme/themeManager.ts` — sets `document.documentElement.dataset.theme` instead of injecting a CDN `<link>`.
- Simplified `theme/themeList.ts` — removed `href` field; no more CDN dependency.
- Imported `styles/tokens.css` in `main.tsx` (before `layout.css`).
- TypeScript: zero errors. All existing component CSS using `var(--surface-*)` / `var(--text-color)` continues to work.

---

## Phase F — Extension nav injection API ✅ DONE

- Created `layout/navRegistry.ts` — `navRegistry.register(item)` / `navRegistry.getAll()` API with `icon` and `order` fields.
- Added `icon` and `order` to `ExtensionMenuItem` in `extensions/core/types.ts`.
- `extensions/core/registry.ts` now calls `navRegistry.register()` for each extension's menu items at module-init time.
- `Nav.ts` reads from `navRegistry.getAll()` instead of the old `extensionNavItems` export; respects `item.icon` (no longer hardcodes `pi pi-link`).
- Updated both extensions (`schedulerBooking`, `customerOrganisation`) to declare `icon` and `order`.
- Removed `extensionNavItems` export (no longer needed).
- TypeScript: zero errors.

---

## Phase G — Code quality

### G2: Remove PrimeFlex layout utility classes from JSX

Pages use `className="grid"`, `col-12`, `col-md-6`, `flex align-items-center`, `gap-2`, `mb-3`, etc.
These will break when PrimeFlex is removed. Audit and replace:

```sh
grep -rn "col-\|p-col-\|p-grid\|p-flex\|align-items\|justify-content" src --include="*.tsx"
```

### G3: Dead import cleanup

Some files still import from `primereact/menuitem` indirectly via `toTieredMenuItems`.
Run `npx eslint --rule 'no-unused-vars: error'` after package removal to catch stragglers.

### G4: SplitterLayout — vertical layout drag ✅ DONE

Verified: `onResizeEnd` already uses `.height` in vertical mode. No fix needed.

### G5: Splitter — React key warnings ✅ DONE

Fixed: replaced bare `<>` fragments with `<Fragment key={idx}>` in `SplitterLayout.tsx`.

### G6: FormSubmissionsPage — remove Column expander dependency ✅ DONE

Page already uses TanStack mode with `rowExpansionTemplate`. Removed stale `expandedRows` state.

---

## Architectural notes

### ContextMenuPanel model shape

The `MenuItem` type is now defined in `src/ui/commands/menuModel.ts`.
All context menu models must be built via `toTieredMenuItems(commands, context)`.
**Do not** construct raw `MenuItem[]` by hand — use the command registry.

### TreeTable selection

`ContentPagesPage` uses `onSelectionChange` where `event.value` is the string key of the selected row.
The native `TreeTable` in `TreeTablePanel.tsx` emits the same shape.
The context-menu selection path (`onContextMenuSelectionChange`) also works the same way.

### SidebarPanel position

`FormBuilderSection` uses `<Sidebar position="right" className="w-11 ...">`.
The native `Sidebar` in `SidebarPanel.tsx` maps `position` to a CSS class (`p-sidebar-right`).
The `w-11` / `md:w-10` etc. classes are now served by `styles/utilities.css` (D4 complete).

---

## Deferred / out-of-scope

- **`apps/web`** (Next.js): No refactor planned — it uses a different component set.
- **`apps/api`** (GraphQL): No UI changes needed.
- **E2E tests**: There are no E2E tests for the admin app. Consider adding Playwright smoke tests after the PrimeReact uninstall is complete to catch regressions.
