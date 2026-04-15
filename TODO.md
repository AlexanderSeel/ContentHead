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

### D4: primereact/primeflex CSS — remove stylesheet imports
`main.tsx` still imports:
```ts
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
```
- **PrimeFlex** is used for utility classes (`p-2`, `col-12`, `grid`, `flex`, etc.) across many feature pages. Either replace each usage with Tailwind/CSS modules or add a PrimeFlex-equivalent utility layer before removing.
- **PrimeIcons** (`pi pi-*`) are used everywhere for icons. Replace with a self-hosted icon set (e.g. Lucide, Heroicons) or keep PrimeIcons standalone (it has no React dependency).

---

### D5: Uninstall primereact package ✅ DONE
`pnpm remove --filter @contenthead/admin primereact` — package removed.
No remaining `from 'primereact'` imports in source. Zero TypeScript errors. Build passes.

---

## Phase E — Design token CSS system

Replace hardcoded PrimeFlex/PrimeReact CSS class strings with a token-based design system.

- Define CSS custom properties for colors, spacing, radius, shadow in `styles/tokens.css`
- Replace `p-2`, `mt-3`, `mb-2`, `gap-2` etc. with token-based utility classes
- Replace `p-button`, `p-inputtext`, `p-dropdown` class strings in atom components with scoped component CSS

**Blocked on D4** (PrimeFlex removal).

---

## Phase F — Extension nav injection API

The `LeftNav` sidebar currently hardcodes nav groups via `buildNavAreas()` from `Nav.ts`.  
Extensions (`schedulerBooking`, `customerOrganisation`) contribute nav items via the same static list.

**Goal:** allow extensions to register nav entries at runtime without touching `Nav.ts`.

- Define `navRegistry.register({ area, label, icon, path, guard? })` API
- Call it from each extension's entry point
- `LeftNav` reads from the registry instead of the static array
- Support ordering/priority hints

---

## Phase G — Code quality

### G2: Remove PrimeFlex layout utility classes from JSX
Pages use `className="grid"`, `col-12`, `col-md-6`, `flex align-items-center`, `gap-2`, `mb-3`, etc.  
These will break when PrimeFlex is removed. Audit and replace:
```
grep -rn "col-\|p-col-\|p-grid\|p-flex\|align-items\|justify-content" src --include="*.tsx"
```

### G3: Dead import cleanup
Some files still import from `primereact/menuitem` indirectly via `toTieredMenuItems`.  
Run `npx eslint --rule 'no-unused-vars: error'` after package removal to catch stragglers.

### G4: SplitterLayout — vertical layout drag incomplete
The `WorkspacePanels.tsx` vertical `Splitter` uses `layout="vertical"` which now works structurally,  
but the `onResizeEnd` size reporting uses pixel widths even in vertical mode — this should use heights.  
(The `startDrag` callback in `SplitterLayout.tsx` correctly uses `clientY`/height, so this may already be fixed — verify with a manual test.)

### G5: Splitter — React key warnings
`SplitterLayout.tsx` renders fragments with `<>` inside a `.map()` — each fragment needs a `key`.  
Replace with `<React.Fragment key={...}>` for both the panel div and gutter div.

### G6: FormSubmissionsPage — remove `Column` expander dependency
`FormSubmissionsPage` uses `<Column expander />` which in the legacy table shim is ignored (no expand/collapse UI).  
Migrate this page to a collapsible detail row using TanStack Table's `getExpandedRowModel`.

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
The `w-11` / `md:w-10` etc. classes are PrimeFlex and will need to be converted to percentage widths when PrimeFlex is removed (Phase D4).

---

## Deferred / out-of-scope

- **`apps/web`** (Next.js): No refactor planned — it uses a different component set.
- **`apps/api`** (GraphQL): No UI changes needed.
- **E2E tests**: There are no E2E tests for the admin app. Consider adding Playwright smoke tests after the PrimeReact uninstall is complete to catch regressions.
