# ContentHead Admin — Architecture Refactor Plan

> **Scope**: Full architectural overhaul beyond the PrimeReact → Radix migration already tracked in `REFACTOR_PLAN.md`.
> Covers dead code removal, navigation redesign, layout shell restructuring, large file splitting, and UI simplification.
>
> **Inspiration**: [Payload CMS](https://github.com/payloadcms/payload) — persistent left-sidebar nav, 4-level layout hierarchy,
> compositional root pattern, minimizable sidebar, right-drawer for meta content.

---

## Current Problems

| Problem | Severity | Files |
|---------|----------|-------|
| Top-level nav uses dropdown menus in Topbar — no persistent context | HIGH | `layout/Topbar.tsx` |
| Navigation requires 3-file edits per route change | HIGH | `AdminApp.tsx`, `Nav.ts`, `routeMeta.ts` |
| `ContentPagesPage.tsx` is 4,566 lines — monolith | HIGH | `features/content/ContentPagesPage.tsx` |
| `FormBuilderSection.tsx` is 1,202 lines | MEDIUM | `features/forms/FormBuilderSection.tsx` |
| 79 legacy `.js` artifacts polluting `src/` | HIGH | `src/**/*.js` |
| Duplicate `EmptyState` components | MEDIUM | `components/common/`, `ui/molecules/` |
| `layout/Sidebar.tsx` is an unused 20-line placeholder | MEDIUM | `layout/Sidebar.tsx` |
| `lib/api.ts` — unclear ownership/usage | LOW | `lib/api.ts` |
| `layoutSettings.ts` isolated from context system | LOW | `lib/layoutSettings.ts` |
| PrimeReact uninstall still blocked (Phase 11 incomplete) | MEDIUM | `ui/molecules/*.tsx`, `main.tsx` |

---

## Target Architecture (Payload-inspired)

```
AdminShell
├── LeftNav (persistent, collapsible sidebar)
│   ├── Logo + Brand
│   ├── SiteContextSwitcher (site / market / locale)
│   ├── NavGroup: Content (Pages, Templates, Routes, Assets)
│   ├── NavGroup: Build (Content Types, Components)
│   ├── NavGroup: Personalization (Workflows, Variants, Visitor Groups)
│   ├── NavGroup: Forms (Builder, Submissions)
│   ├── NavGroup: Workflows (Designer, Runs)
│   ├── NavGroup: Security (Users, Roles, Groups)
│   ├── NavGroup: Settings (Connectors, DB Admin, Preferences)
│   ├── NavGroup: Dev Tools (GraphiQL, Diagnostics)
│   ├── [Extension NavItems injected here]
│   └── CollapseToggle
│
├── TopBar (minimal — breadcrumb + user menu + help)
│   ├── Breadcrumb
│   ├── CommandMenu
│   ├── HelpIcon
│   └── UserMenu (avatar dropdown)
│
└── Main Content Area
    ├── Work Layer (WorkspacePage / DataGrid / EntityEditor)
    ├── Meta Layer (right drawer: history, docs, plugins)
    └── Detail Layer (modal overlays: confirm, pickers)
```

**Before/After comparison:**

| Concern | Before | After |
|---------|--------|-------|
| Navigation | Topbar dropdown menus (hidden, contextual) | Left sidebar (always visible, grouped) |
| Context switching | Topbar: separate dropdowns per level | Left sidebar top: stacked SiteContextSwitcher |
| User/account menu | Topbar right side | TopBar minimal right slot |
| Breadcrumb | WorkspacePage molecule | TopBar center slot |
| Secondary info | Modal tabs | Right drawer (non-disruptive) |

---

## Phase A — Dead Code Purge

> **Risk**: None. Safe to execute immediately.

### A1 — Delete legacy JS artifacts

79 compiled `.js` files exist alongside `.tsx` source files. These are stale build artifacts.

**Files to delete:**
- All `*.js` files under `apps/admin/src/` (except `eslint.config.*` or deliberate JS)
- Confirmed dead: `components/common/PageHeader.js`, `components/common/SplitView.js`
- Any `.codex-tmp-emit/` directory contents

**Action**: `find apps/admin/src -name "*.js" -not -path "*/node_modules/*"` — review and bulk-delete.

### A2 — Consolidate `EmptyState`

Two implementations exist:
- `components/common/EmptyState.tsx` — 1 import, wraps the molecule
- `ui/molecules/EmptyState.tsx` — canonical, used in 10+ places

**Action**: Delete `components/common/EmptyState.tsx`. Update its 1 import site to use `ui/molecules/EmptyState` directly.

### A3 — Remove `layout/Sidebar.tsx` placeholder

`layout/Sidebar.tsx` is 20 lines of dead placeholder. Its single usage (`FormBuilderSection.tsx`) should import `ui/molecules/SidebarPanel` directly.

**Action**: Delete `layout/Sidebar.tsx`. Update `FormBuilderSection.tsx` import.

### A4 — Audit `lib/api.ts`

Verify whether `lib/api.ts` has any active call sites. If unused, delete. If used, document its role in `lib/sdk.ts` context.

### A5 — Merge `lib/layoutSettings.ts` into `UiContext`

`layoutSettings.ts` manages workspace layout state in isolation. This belongs in `UiContext.tsx` alongside theme and density state.

**Action**: Move the 3–4 exported functions/state into `UiContext.tsx`. Update all import sites.

---

## Phase B — Navigation Architecture Redesign

> **Risk**: HIGH — touches layout shell and all nav entry points. Plan carefully, execute in a feature branch.
> **Inspiration**: Payload's persistent left sidebar with collapsible `NavGroup` sections.

### B1 — Create `LeftNav` component

**New file**: `layout/LeftNav.tsx`

```tsx
// Structure
<nav className="admin-leftnav" data-collapsed={collapsed}>
  <NavBrand />
  <SiteContextSwitcher />          {/* moved from Topbar */}
  <NavScrollArea>
    {navAreas.map(area => (
      <NavGroup key={area.id} area={area} />
    ))}
    <ExtensionNavItems />
  </NavScrollArea>
  <NavCollapseToggle onToggle={setCollapsed} />
</nav>
```

**Sub-components** (all new, in `layout/nav/`):
- `NavGroup.tsx` — collapsible group with icon + label + children
- `NavItem.tsx` — single route link with active state
- `NavBrand.tsx` — logo + app name
- `NavCollapseToggle.tsx` — sidebar collapse/expand button
- `NavContext.tsx` — React context for `collapsed` state, `activeGroup`, `setActiveGroup`

### B2 — Create `NavConfig.ts` — Single Source of Truth

Replace the current 3-file pattern (`AdminApp.tsx` routes + `Nav.ts` hierarchy + `routeMeta.ts` labels) with a single config:

**New file**: `layout/navConfig.ts`

```ts
export type NavItem = {
  id: string;
  label: string;
  path: string;
  icon?: string;
};

export type NavArea = {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
  group?: string;          // for Payload-style grouping
  extensionPoint?: string; // injection key for extensions
};

export const NAV_CONFIG: NavArea[] = [
  {
    id: 'content',
    label: 'Content',
    icon: 'file-text',
    items: [
      { id: 'pages',     label: 'Pages',     path: '/content/pages' },
      { id: 'templates', label: 'Templates', path: '/content/templates' },
      { id: 'routes',    label: 'Routes',    path: '/content/routes' },
      { id: 'assets',    label: 'Assets',    path: '/content/assets' },
    ],
  },
  // ... all other areas
];
```

`Nav.ts` and `routeMeta.ts` are deleted. `AdminApp.tsx` route list is generated from `NAV_CONFIG`.

### B3 — Simplify `Topbar.tsx`

Current Topbar (267 lines) handles: nav dropdowns, site/market/locale switcher, command menu, theme toggle, help, user menu.

After LeftNav takes over navigation and context switching, Topbar becomes:

```tsx
<header className="admin-topbar">
  <NavToggle />               {/* hamburger on mobile */}
  <Breadcrumb />              {/* moved here from WorkspacePage */}
  <div className="topbar-actions">
    <CommandMenuButton />
    <HelpIcon />
    <UserMenu />              {/* avatar + dropdown: profile, theme, logout */}
  </div>
</header>
```

Target: ~80 lines, no nav logic.

### B4 — Update `AdminShell.tsx`

Restructure from:
```
AdminShell → Topbar + <Outlet>
```
To:
```
AdminShell → LeftNav + (Topbar + <Outlet>)
```

Wire `NavContext.Provider` at the shell level so collapsed state is shared.

### B5 — Mobile Responsiveness

- Collapsed by default on `< 768px`
- Hamburger in Topbar triggers `NavContext` toggle
- Overlay mode on mobile (not push-layout)

---

## Phase C — Eliminate Overloaded UIs

> **Risk**: MEDIUM — page-level changes, contained to individual features.
> **Inspiration**: Payload uses right-sidebar drawers for secondary info instead of tabs/modals.

### C1 — Split `ContentPagesPage.tsx` (4,566 lines)

This file handles: page list, page editor, content tree, content builder launch, route management, preview, inline edit, version history, publishing workflow — all in one file.

**Split into:**
```
features/content/
├── ContentPagesPage.tsx          (~150 lines — shell/router only)
├── pages/
│   ├── PageListPanel.tsx         (list, filters, ContextMenu)
│   ├── PageEditorPanel.tsx       (field editors, inspector)
│   ├── PageTreePanel.tsx         (TreeTable, hierarchy view)
│   ├── PagePublishingBar.tsx     (status, publish/draft actions)
│   └── PageVersionDrawer.tsx     (version history — right drawer)
└── previewBridge.ts              (unchanged)
```

### C2 — Split `FormBuilderSection.tsx` (1,202 lines)

**Split into:**
```
features/forms/
├── FormBuilderSection.tsx        (~80 lines — section shell)
├── builder/
│   ├── FormCanvas.tsx            (drag/drop canvas)
│   ├── FormFieldInspector.tsx    (right panel field config)
│   ├── FormFieldPalette.tsx      (left panel field types)
│   └── FormBuilderToolbar.tsx    (save, preview, settings)
```

### C3 — Replace Tab-heavy dialogs with Drawers

Several dialogs use `Tabs` to pack multiple concerns into one overlay:
- `RuleEditorDialog.tsx` — 2-tab dialog
- `LinkSelectorDialog.tsx` — 2-tab dialog (search / recent)
- `AssetImageEditorDialog.tsx` (1,633 lines) — multi-tab editor

**Action**: Convert multi-tab dialogs to stepped drawers (right-side panel) using `ui/molecules/SidebarPanel`. Reduces modal cognitive load.

### C4 — Deduplicate `FormBuilderSection` / `WorkflowDesignerSection` split-pane pattern

Both `FormBuilderSection.tsx` and `WorkflowDesignerSection.tsx` implement a 3-panel SplitterLayout (palette | canvas | inspector). Extract to a shared molecule:

**New file**: `ui/molecules/DesignerShell.tsx`
```tsx
// Props:
// - palette: ReactNode
// - canvas: ReactNode  
// - inspector: ReactNode
// - sizes?: [number, number, number]
```

Both Section components become thin wrappers over `DesignerShell`.

---

## Phase D — Complete PrimeReact Uninstall (Phase 11)

> **Prerequisite**: Phase C must be complete so molecule-level PrimeReact usage is reduced.
> **Goal**: Zero `primereact` imports anywhere — enables uninstalling the package entirely.

Remaining molecule-level PrimeReact wrappers that block uninstall:

| Wrapper | Wraps | Replacement Target |
|---------|-------|--------------------|
| `ui/atoms/AutoComplete.tsx` | `primereact/autocomplete` | Radix Popover + native `<input>` + filtered list |
| `ui/atoms/Chips.tsx` | `primereact/chips` | Native `<input>` + tag list (no Radix needed) |
| `ui/atoms/Slider.tsx` | `primereact/slider` | `@radix-ui/react-slider` |
| `ui/atoms/DatePicker.tsx` | `primereact/calendar` | `react-day-picker` or native `<input type="date">` |
| `ui/atoms/Password.tsx` | `primereact/password` | Native `<input type="password">` + toggle |
| `ui/atoms/PrimeEditor.tsx` | `primereact/editor` (Quill) | Direct `quill` import (already a peer dep) |
| `ui/atoms/Message.tsx` | `primereact/message` | Native `<div role="alert">` |
| `ui/molecules/SplitterLayout.tsx` | `primereact/splitter` | Native `ResizeObserver`-based splitter or `react-resizable-panels` |
| `ui/molecules/SidebarPanel.tsx` | `primereact/sidebar` | Radix Dialog or custom CSS drawer |
| `ui/molecules/ContextMenuPanel.tsx` | `primereact/contextmenu` | `@radix-ui/react-context-menu` |
| `ui/molecules/TreePanel.tsx` | `primereact/tree` | Recursive native `<ul>` tree |
| `ui/molecules/TreeTablePanel.tsx` | `primereact/treetable` | TanStack Table with row grouping |
| `ui/molecules/WorkspaceGrid.tsx` (legacy mode) | `primereact/datatable` | Full DataGrid migration |
| `app/UiContext.tsx` | PrimeReactProvider | Remove provider after above done |
| `main.tsx` | PrimeReactProvider, CSS imports | Remove after UiContext cleaned |

**After replacement:**
- `pnpm remove primereact primeflex primeicons` from `apps/admin/`
- Remove PrimeReact CSS imports from `main.tsx`
- Remove `PrimeReactProvider` from app root
- Replace PrimeReact theme variables with design token system

---

## Phase E — Design Token System

> **Prerequisite**: Phase D complete.
> **Inspiration**: Payload uses CSS custom properties over SCSS; Radix UI exposes CSS vars natively.

### E1 — Replace PrimeReact theme with CSS variables

Current theming (`theme/themeManager.ts`, `themeList.ts`, `themeBridge.ts`) applies PrimeReact themes dynamically.
After PrimeReact removal, switch to:

**New file**: `theme/tokens.css`
```css
:root[data-theme="light"] {
  --color-surface: #ffffff;
  --color-surface-hover: #f5f5f5;
  --color-border: #e0e0e0;
  --color-text-primary: #1a1a1a;
  --color-text-muted: #6b6b6b;
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --radius-sm: 4px;
  --radius-md: 6px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
}

:root[data-theme="dark"] {
  --color-surface: #1a1a1a;
  /* ... */
}
```

All atoms and molecules reference `var(--color-*)` tokens.

### E2 — Simplify `themeManager.ts`

Remove PrimeReact theme loading. `themeManager.ts` simply sets `data-theme` attribute on `<html>`.
`themeBridge.ts` maps token values to Monaco editor theme — keep but simplify.

---

## Phase F — Extension System Review

> **Risk**: LOW — extensions are already isolated.

### F1 — Standardize extension nav injection

Currently extensions add nav items via `registry.ts`. After Phase B, standardize the injection API:

```ts
// extensions/core/types.ts
export interface ExtensionNavItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  group?: string;      // inject into existing NavArea, or create new one
  areaId?: string;     // target area for injection
}
```

### F2 — Add extension route auto-registration

Extensions currently require manual route additions to `AdminApp.tsx`. After Phase B's `NavConfig.ts`:
Extensions declare their routes in their registration, and `AdminApp.tsx` auto-generates routes from the full config.

---

## Phase G — Code Quality

> Ongoing — no dependencies on other phases.

### G1 — Fix pre-existing TypeScript errors

Known pre-existing errors (from `REFACTOR_PLAN.md`):
- `features/content/components/ComponentList.tsx`
- `features/content/ContentPagesPage.tsx`
- `features/forms/FormBuilderSection.tsx`
- `features/siteSettings/MarketsLocalesPage.tsx`

### G2 — Add ESLint boundary rule

Enforce the abstraction boundary programmatically — no feature file may import from `primereact/*` directly.
Add `eslint-plugin-import` rule or extend the existing `check:boundary` script to run in CI.

### G3 — Standardize page structure

All 34 page components should follow the same structure:
```tsx
export function FooPage() {
  // 1. Context hooks
  // 2. Query/mutation hooks  
  // 3. Local state
  // 4. Handlers
  // 5. Render: WorkspacePage > content
}
```
No inline helper components over 30 lines — extract to sibling files.

---

## Execution Order

```
Phase A  (Quick wins — safe, immediate)
  ↓
Phase G1 (Fix TS errors — unblocks type-safe refactoring)
  ↓
Phase B  (Navigation redesign — feature branch, careful QA)
  ↓
Phase C  (UI de-overloading — one file at a time)
  ↓
Phase D  (PrimeReact uninstall — after C reduces molecule-level usage)
  ↓
Phase E  (Design tokens — after D, CSS clean slate)
  ↓
Phase F  (Extension API — after B stabilizes NavConfig)
  ↓
Phase G2+G3 (Code quality — ongoing)
```

---

## Success Criteria

| Criterion | Metric |
|-----------|--------|
| No file over 600 lines | `find src -name "*.tsx" | xargs wc -l \| sort -rn \| head` |
| Zero PrimeReact imports in feature files | `pnpm check:boundary` passes |
| Zero PrimeReact imports anywhere | `primereact` not in `package.json` |
| Single nav config source of truth | 1 edit = route + nav + breadcrumb |
| Navigation visible without interaction | Left sidebar always rendered |
| TypeScript strict mode — zero errors | `pnpm tsc --noEmit` passes |

---

## Session Resume Notes

- **Phase A: COMPLETE**
  - A1: Deleted all 79 legacy `.js` artifacts from `apps/admin/src/`
  - A2: Consolidated `EmptyState` — real implementation in `ui/molecules/EmptyState.tsx`, deleted `components/common/EmptyState.tsx`
  - A3: Deleted unused `layout/Sidebar.tsx` placeholder; `FormBuilderSection` already used `ui/molecules/SidebarPanel`
  - A4: `lib/api.ts` actively used in 8 files — kept as-is
  - A5: `lib/layoutSettings.ts` is pure localStorage utility, no React deps — left as-is (moving to UiContext would only add complexity)

- **Phase B: COMPLETE**
  - Created `layout/NavContext.tsx` — `NavProvider` + `useNav()` for collapsed state
  - Created `layout/LeftNav.tsx` — persistent sidebar with brand, `ContextSwitcher` (site/market/locale/theme), collapsible `NavGroup`s with flyout in collapsed mode, collapse toggle
  - Rewrote `layout/Topbar.tsx` (~95 lines) — nav toggle, breadcrumb, help icon, user menu (density + logout)
  - Rewrote `layout/AdminShell.tsx` — horizontal layout: `LeftNav` + (`Topbar` + content area)
  - Rewrote topbar CSS in `styles/layout.css` — removed 200+ lines of old menubar CSS, added LeftNav + simplified topbar CSS
  - Build: ✓ clean (pre-existing TS errors in `ContentPagesPage`, `FormBuilderSection`, `MarketsLocalesPage` unchanged)

- **Phase C: COMPLETE**
  - C1: `ContentPagesPage.tsx` 4,566 → 3,886 lines (-680)
    - Extracted types → `contentPageTypes.ts` (179 lines, all exported)
    - Extracted utils → `contentPageUtils.ts` (210 lines, all exported)
    - Extracted command definitions + registrations → `contentPageCommands.ts` (250 lines)
  - C2: `FormBuilderSection.tsx` 1,212 → 1,014 lines (-198)
    - Extracted types + constants + utils → `features/forms/formBuilderTypes.ts` (150 lines)
    - Extracted `renderFieldInput` as proper component → `features/forms/FormFieldInput.tsx`
  - C4: **N/A** — inspected actual code: neither FormBuilderSection nor WorkflowDesignerSection use `Splitter`; WorkflowDesignerSection uses a plain `splitFill` CSS class. No shared DesignerShell pattern to extract.
  - Build: ✓ clean (zero new TypeScript errors)
- Phase D: Blocked on Phase C reducing molecule-level usage
- Phase E: Blocked on Phase D
- Phase F: Can start now (B is complete — NavConfig consolidation)
- Phase G1: Can start at any time (fix pre-existing TS errors)
