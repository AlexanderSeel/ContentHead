# ContentHead Admin — PrimeReact → Radix UI Refactor Plan

> **Goal**: Move all PrimeReact usage behind `ui/atoms/` and `ui/molecules/` wrappers,
> then swap implementations component by component with zero feature risk.
>
> **Rule**: A feature page or shared component must never import directly from `primereact/*`.
> Only files in `ui/atoms/`, `ui/molecules/`, `ui/commands/`, `app/UiContext.tsx`, and `main.tsx` may.

---

## Legend

- `[→ atom]` — has an atom wrapper, replace the import
- `[stays]` — no Radix equivalent, remains PrimeReact until a dedicated later phase
- `[needs atom]` — blocked on a new atom wrapper being created first

---

## Atom Coverage

### Already wrapped (`ui/atoms/`)
| Atom | Wraps |
|------|-------|
| `Button` | `primereact/button` |
| `Checkbox` | `primereact/checkbox` |
| `Tag` | `primereact/tag` |
| `Textarea` | `primereact/inputtextarea` |
| `Password` | `primereact/password` |
| `TextInput` | `primereact/inputtext` |
| `NumberInput` | `primereact/inputnumber` |
| `Select` | `primereact/dropdown` |
| `MultiSelect` | `primereact/multiselect` |
| `Switch` | `primereact/inputswitch` |
| `DatePicker` | `primereact/calendar` |
| `RichTextEditor` | `primereact/editor` (Quill) |

### Needs new atom wrapper (Phase 3)
| Atom to create | Wraps | Radix target |
|----------------|-------|--------------|
| `Dialog` | `primereact/dialog` | `@radix-ui/react-dialog` |
| `Tabs` / `TabPanel` | `primereact/tabview` | `@radix-ui/react-tabs` |
| `Accordion` / `AccordionItem` | `primereact/accordion` | `@radix-ui/react-accordion` |
| `Card` | `primereact/card` | native `<div>` |
| `Tooltip` | `primereact/tooltip` | `@radix-ui/react-tooltip` |

### Stays PrimeReact (no Radix equivalent — migrated separately in Phase 8/9)
| Component | Files | Phase |
|-----------|-------|-------|
| `DataTable` / `Column` | ~25 files | Phase 8 → TanStack Table |
| `Splitter` / `SplitterPanel` | ~6 files | Phase 9 → custom |
| `ContextMenu` | ~7 files | Phase 9 → `@radix-ui/react-context-menu` in molecule |
| `Tree` / `TreeNode` | 2 files | Phase 9 |
| `AutoComplete` | 2 files | Phase 9 |
| `Chips` | 3 files | Phase 9 |
| `Slider` | 2 files | Phase 9 |
| `FileUpload` | 1 file | Phase 9 |
| `ProgressBar` | 1 file | Phase 9 |
| `Message` | 1 file | Phase 9 |

---

## Phase 1 — Seal the Abstraction Boundary

> **Status: COMPLETE**

- [x] Create `Button` atom (`ui/atoms/Button.tsx`)
- [x] Create `Checkbox` atom (`ui/atoms/Checkbox.tsx`)
- [x] Create `Tag` atom (`ui/atoms/Tag.tsx`)
- [x] Create `Textarea` atom (`ui/atoms/Textarea.tsx`)
- [x] Create `Password` atom (`ui/atoms/Password.tsx`)
- [x] Fix `Select` atom — remove spread-conditional noise
- [x] Update `ui/atoms/index.ts` barrel export
- [x] Define local `ToastOptions` type in `ui/toast.ts` — remove `primereact/toast` import
- [x] Update `UiContext.tsx` — cast `ToastOptions → ToastMessage` at boundary only
- [x] Delete compiled artifact `ui/toast.js`
- [x] Migrate `features/security/UsersPage.tsx` as template

---

## Phase 2 — Migrate Files Using Only Wrapped Atoms

> **Status: COMPLETE**
>
> Files that only use components that already have atom wrappers.
> `DataTable`/`Column`/`Splitter`/`ContextMenu` stay where present.

### 2A — Single-atom files (Button only or trivial)

- [x] `layout/Sidebar.tsx` — `Button [→ atom]`
- [x] `extensions/schedulerBooking/SchedulerBookingPage.tsx` — `Button [→ atom]`
- [x] `extensions/schedulerBooking/BookingInspectorPanel.tsx` — `Button [→ atom]`
- [x] `features/content/builder/VisualBuilderWorkspace.tsx` — `Button [→ atom]`
- [x] `components/inputs/MarketLocalePicker.tsx` — `Dropdown [→ Select atom]`

### 2B — Simple multi-atom files (no structural PrimeReact)

- [x] `features/security/GroupsPage.tsx` — `Button`, `InputText`, `InputTextarea [→ atoms]` · `DataTable/Column [stays]`
- [x] `features/security/RolesPage.tsx` — `Button`, `InputText`, `InputTextarea`, `MultiSelect`, `Tag [→ atoms]` · `Column [stays]`
- [x] `features/siteSettings/SiteOverviewPage.tsx` — `Button`, `InputText`, `Dropdown [→ atoms]` · `Card [needs atom]`
- [x] `routes/AccessDeniedPage.tsx` — `Button [→ atom]` · `Card [needs atom]`
- [x] `routes/NotFoundPage.tsx` — `Button [→ atom]` · `Card [needs atom]`
- [ ] `routes/DashboardPage.tsx` — `Card [needs atom]`
- [x] `features/devtools/GraphiQLPage.tsx` — `Button`, `InputText [→ atoms]`
- [x] `components/inputs/SlugEditor.tsx` — `Button`, `InputText [→ atoms]`
- [x] `features/content/components/ComponentList.tsx` — `Button`, `Dropdown [→ atoms]`
- [x] `features/personalization/VisitorGroupsPage.tsx` — `Button`, `InputText`, `InputTextarea [→ atoms]` · `DataTable/Column [stays]`
- [x] `features/personalization/VariantsPage.tsx` — `Button`, `InputText`, `InputTextarea`, `Dropdown [→ atoms]` · `DataTable/Column/Splitter [stays]`
- [x] `features/personalization/PersonalizationWorkflowsPage.tsx` — `Button`, `InputText`, `Dropdown [→ atoms]` · `Message [stays]`
- [x] `features/content/fieldRenderers/FieldRenderer.tsx` — all replaceable: `Calendar`, `Checkbox`, `Dropdown`, `InputNumber`, `InputText`, `InputTextarea`, `MultiSelect [→ atoms]`
- [x] `features/content/fieldRenderers/FieldPreview.tsx` — all replaceable: `Calendar`, `Checkbox`, `Dropdown`, `InputNumber`, `InputText`, `InputTextarea`, `MultiSelect [→ atoms]`
- [x] `features/content/fieldRenderers/AssetEditors.tsx` — `Button`, `Dropdown`, `InputNumber`, `Checkbox [→ atoms]` · `DataTable/Column [stays]`
- [x] `features/content/fieldRenderers/ContentLinkEditors.tsx` — `Button`, `InputText`, `Dropdown [→ atoms]` · `DataTable/Column [stays]`
- [x] `features/schema/ContentTypeList.tsx` — `Button`, `InputText [→ atoms]` · `DataTable/Column [stays]`
- [x] `features/schema/FieldList.tsx` — `Button`, `Checkbox [→ atoms]` · `DataTable/Column [stays]`
- [x] `features/content/RoutesPage.tsx` — `Button`, `InputText`, `Checkbox [→ atoms]` · `DataTable/Column/ContextMenu/Splitter [stays]`
- [x] `features/content/TemplatesPage.tsx` — no wrappable non-DataTable imports · `DataTable/Column/ContextMenu [stays]`
- [x] `features/assets/AssetLibraryPage.tsx` — `Button`, `InputText`, `InputTextarea [→ atoms]` · `DataTable/Column/ContextMenu/Chips [stays]`
- [x] `routes/LoginPage.tsx` — `Button`, `InputText`, `Password [→ atoms]` · `Card [needs atom]`
- [x] `components/common/EmptyState.tsx` — `Button [→ atom]` · `Card [needs atom]`

### 2C — Files with Accordion/TabView/Dialog still present (partial migration)

> Migrate only the replaceable atoms; Accordion/TabView/Dialog stay until Phase 4.

- [x] `features/schema/FieldInspector.tsx` — `Checkbox`, `Dropdown`, `InputNumber`, `InputText`, `InputTextarea`, `MultiSelect [→ atoms]` · `Accordion/Chips [stays]`
- [x] `features/workflows/NodeInspector.tsx` — `Dropdown`, `InputNumber`, `InputText`, `InputTextarea`, `MultiSelect`, `Checkbox [→ atoms]` · `Accordion [stays]`
- [x] `features/workflows/WorkflowRunsPage.tsx` — `Button [→ atom]` · `DataTable/Column/ContextMenu/Accordion [stays]`
- [x] `features/settings/ConnectorSettingsPage.tsx` — `Button`, `Checkbox`, `InputText`, `InputTextarea`, `Dropdown`, `Tag [→ atoms]` · `Accordion/Splitter/DataTable/Column [stays]`
- [x] `features/settings/DbAdminPage.tsx` — `Button`, `Calendar`, `Checkbox`, `Dropdown`, `InputNumber`, `InputSwitch`, `InputText`, `InputTextarea`, `Tag [→ atoms]` · `Accordion/TabView/DataTable/Column [stays]`
- [x] `features/settings/DuckDbAdminPage.tsx` — `Button`, `InputTextarea [→ atoms]` · `Dialog/FileUpload/ProgressBar [stays]`
- [x] `features/settings/PreferencesPage.tsx` — `Button`, `Dropdown`, `Tag [→ atoms]` · `DataTable/Column/Slider [stays]`
- [x] `features/forms/FormSubmissionsPage.tsx` — `Button`, `InputText`, `Dropdown`, `Tag`, `Calendar [→ atoms]` · `DataTable/Column/ContextMenu [stays]` · type import `DataTableSortEvent [stays]`
- [x] `features/devtools/DiagnosticsPage.tsx` — `Button`, `Dropdown`, `InputNumber`, `InputText`, `InputSwitch [→ atoms]` · `Accordion/TabView/Card/DataTable/Column [stays]`
- [x] `features/siteSettings/MarketsLocalesPage.tsx` — `Button`, `InputText`, `Checkbox`, `Dropdown [→ atoms]` · `TabView/DataTable/Column/AutoComplete [stays]`
- [x] `features/schema/ContentTypesPage.tsx` — `Button`, `Checkbox`, `Dropdown`, `InputText`, `MultiSelect [→ atoms]` · `Dialog/DataTable/Column/Splitter [stays]`
- [x] `features/schema/ComponentRegistryPage.tsx` — `Button`, `Dropdown`, `InputSwitch`, `InputText`, `InputTextarea`, `MultiSelect`, `Tag [→ atoms]` · `TabView/DataTable/Column [stays]`
- [x] `extensions/customerOrganisation/CustomerOrganisationPage.tsx` — `Button [→ atom]` · `TabView [stays]`
- [x] `features/WorkflowDesignerSection.tsx` — `Button`, `Dropdown`, `InputNumber`, `InputText`, `InputTextarea [→ atoms]` · `Accordion [stays]`
- [x] `features/content/components/ComponentInspector.tsx` — `Button`, `Checkbox`, `Dropdown`, `InputNumber`, `InputText`, `InputTextarea [→ atoms]` · `Dialog/DataTable/Column/Chips [stays]`
- [x] `components/rules/RuleEditorDialog.tsx` — `Button`, `Dropdown`, `InputText`, `InputTextarea [→ atoms]` · `Dialog/TabView [stays]`
- [x] `components/assist/AskAiDialog.tsx` — `Button`, `Dropdown`, `InputTextarea`, `Checkbox [→ atoms]` · `Dialog [stays]`
- [x] `features/content/fieldRenderers/LinkSelectorDialog.tsx` — `Button`, `InputText`, `Checkbox [→ atoms]` · `Dialog/TabView/DataTable/Column [stays]`
- [x] `components/inputs/AssetPickerDialog.tsx` — `Button`, `InputText [→ atoms]` · `Dialog/Tree/DataTable/Column [stays]`
- [x] `help/HelpDialog.tsx` — `Dialog [stays]`
- [x] `help/HelpIcon.tsx` — `Button [→ atom]` · `Tooltip [stays]`
- [x] `features/FormBuilderSection.tsx` _(1,202 lines)_ — `Button`, `Checkbox`, `Dropdown`, `InputNumber`, `InputText`, `InputTextarea [→ atoms]` · `DataTable/Column/TabView/Sidebar [stays]`
- [x] `features/assets/AssetImageEditorDialog.tsx` _(1,633 lines)_ — `Button`, `InputText`, `InputTextarea`, `Checkbox`, `InputNumber`, `Dropdown [→ atoms]` · `Dialog/TabView/DataTable/Column/Slider [stays]`
- [x] `features/content/ContentPagesPage.tsx` _(4,566 lines)_ — ⚠️ large file, migrate atoms only

---

## Phase 3 — Create Structural Atom Wrappers

> **Status: COMPLETE**

- [x] Create `ui/atoms/DialogPanel.tsx` — wraps `primereact/dialog` · export `{ DialogPanel }`
- [x] Create `ui/atoms/Tabs.tsx` — wraps `primereact/tabview` · export `{ Tabs, TabItem }`
- [x] Create `ui/atoms/Accordion.tsx` — wraps `primereact/accordion` · export `{ Accordion, AccordionItem }`
- [x] Create `ui/atoms/Card.tsx` — wraps `primereact/card` (or native `<div>`) · export `{ Card }`
- [x] Create `ui/atoms/Tooltip.tsx` — wraps `primereact/tooltip` · export `{ Tooltip }`
- [x] Update `ui/atoms/index.ts` — export all new atoms

---

## Phase 4 — Migrate Dialog / Tabs / Accordion / Card / Tooltip call sites

> **Status: COMPLETE**

- [x] `help/HelpDialog.tsx` — `Dialog [→ DialogPanel atom]`
- [x] `components/assist/AskAiDialog.tsx` — `Dialog [→ DialogPanel atom]`
- [x] `components/rules/RuleEditorDialog.tsx` — `Dialog [→ DialogPanel atom]`, `TabView [→ Tabs atom]`
- [x] `features/content/fieldRenderers/LinkSelectorDialog.tsx` — `Dialog [→ DialogPanel]`, `TabView [→ Tabs]`
- [x] `components/inputs/AssetPickerDialog.tsx` — `Dialog [→ DialogPanel]`
- [x] `features/schema/ContentTypesPage.tsx` — `Dialog [→ DialogPanel]`
- [x] `features/schema/FieldInspector.tsx` — `Accordion [→ Accordion atom]`
- [x] `features/workflows/NodeInspector.tsx` — `Accordion [→ Accordion atom]`
- [x] `features/workflows/WorkflowRunsPage.tsx` — `Accordion [→ Accordion atom]`
- [x] `features/settings/ConnectorSettingsPage.tsx` — `Accordion [→ Accordion atom]`
- [x] `features/settings/DbAdminPage.tsx` — `Accordion [→ Accordion atom]`, `TabView [→ Tabs atom]`
- [x] `features/devtools/DiagnosticsPage.tsx` — `Accordion [→ Accordion atom]`, `TabView [→ Tabs atom]`, `Card [→ Card atom]`
- [x] `features/siteSettings/MarketsLocalesPage.tsx` — `TabView [→ Tabs atom]`
- [x] `features/schema/ComponentRegistryPage.tsx` — `TabView [→ Tabs atom]`
- [x] `extensions/customerOrganisation/CustomerOrganisationPage.tsx` — `TabView [→ Tabs atom]`
- [x] `features/WorkflowDesignerSection.tsx` — `Accordion [→ Accordion atom]`
- [x] `features/content/components/ComponentInspector.tsx` — `Dialog [→ DialogPanel atom]`
- [x] `features/settings/DuckDbAdminPage.tsx` — `Dialog [→ DialogPanel atom]`
- [x] `routes/AccessDeniedPage.tsx` — `Card [→ Card atom]`
- [x] `routes/NotFoundPage.tsx` — `Card [→ Card atom]`
- [x] `routes/DashboardPage.tsx` — `Card [→ Card atom]`
- [x] `routes/LoginPage.tsx` — `Card [→ Card atom]`
- [x] `features/siteSettings/SiteOverviewPage.tsx` — `Card [→ Card atom]`
- [x] `components/common/EmptyState.tsx` — `Card [→ Card atom]`
- [x] `help/HelpIcon.tsx` — `Tooltip [→ Tooltip atom]`
- [x] `features/assets/AssetImageEditorDialog.tsx` — `Dialog [→ DialogPanel]`, `TabView [→ Tabs]`
- [x] `features/FormBuilderSection.tsx` — `TabView [→ Tabs]`
- [x] `features/content/ContentPagesPage.tsx` — `Dialog [→ DialogPanel]`, `TabView [→ Tabs]`

---

## Phase 5 — Radix swap: easy primitives

> **Status: COMPLETE**

- [x] Install `@radix-ui/react-checkbox`; swap `Checkbox.tsx` implementation (Radix Root inside `div.p-checkbox`)
- [x] Install `@radix-ui/react-switch`; swap `Switch.tsx` implementation (native DOM replicating PrimeReact structure)
- [x] Swap `Button.tsx` to native `<button>` + PrimeReact CSS classes
- [x] Swap `TextInput.tsx` to native `<input type="text">` + `p-inputtext p-component`
- [x] Swap `Textarea.tsx` to native `<textarea>` + `p-inputtextarea p-component` (autoResize via useEffect)
- [x] Swap `NumberInput.tsx` to native `<input type="number">` + `p-inputtext p-component`
- [x] Swap `Tag.tsx` to native `<span class="p-tag [p-tag-severity]">` + inner `p-tag-value`
- [x] Fix cascading type errors across call sites (FieldRenderer, DiagnosticsPage, ComponentRegistryPage, ContentPagesPage, etc.)

---

## Phase 6 — Radix swap: medium primitives

> **Status: COMPLETE**

- [x] Install `@radix-ui/react-toast`; swap `UiContext` Toast (Radix ToastProvider + managed state queue)
- [x] Install `@radix-ui/react-alert-dialog`; swap `UiContext` ConfirmDialog (Radix AlertDialog, promise-based)
- [x] Install `@radix-ui/react-dialog`; swap `DialogPanel.tsx` (Radix Portal+Overlay+Content, PrimeReact CSS classes)
- [x] Install `@radix-ui/react-tabs`; swap `Tabs.tsx` (native DOM replicating p-tabview structure)
- [x] Install `@radix-ui/react-accordion`; swap `Accordion.tsx` (native DOM replicating p-accordion structure)
- [x] Install `@radix-ui/react-tooltip`; swap `Tooltip.tsx` (declarative Radix API, updated HelpIcon)
- [x] `Card.tsx` → native `div.p-card > div.p-card-body > div.p-card-content`
- [x] Fix `commands/types.ts` — replace `ToastMessage` with `ToastOptions` (removes PrimeReact dep)
- [x] Fix `ui/helpers/feedback.ts` — remove PrimeReact import, return `toast` directly
- [x] Fix `ui/toast.ts` — add `| undefined` to optional fields for `exactOptionalPropertyTypes`

---

## Phase 7 — Radix swap: Select / MultiSelect

> **Status: COMPLETE**

- [x] Install `@radix-ui/react-select` + `@radix-ui/react-popover`; swap `Select.tsx`
  - Standard: Radix Select with PrimeReact CSS classes (`p-dropdown`, `p-dropdown-panel`, etc.)
  - `filter=true`: Popover branch with visible search input (2 call sites use this)
- [x] Implement Radix-based `MultiSelect.tsx` (Popover + Radix Checkbox list)
  - chip/comma display, filter, maxSelectedLabels all supported
- [x] Zero call-site changes needed; API fully compatible

---

## Phase 8 — Replace DataTable → TanStack Table

> **Status: COMPLETE** — All feature files migrated. WorkspaceGrid legacy mode remains as a compatibility bridge within `ui/molecules/` (allowed boundary).

- [x] Install `@tanstack/react-table`
- [x] Create `ui/molecules/DataGrid.tsx` wrapping TanStack Table (replaces `EntityTable`)
- [x] Migrate `EntityTable.tsx` → `DataGrid.tsx` API
- [x] Migrate each feature page DataTable usage, one file at a time:
  - [x] `features/security/GroupsPage.tsx`
  - [x] `features/security/RolesPage.tsx`
  - [x] `features/schema/ContentTypeList.tsx`
  - [x] `features/schema/FieldList.tsx` — `reorderableRows` → HTML5 DnD (native drag/drop, no extra deps)
  - [x] `features/schema/ComponentRegistryPage.tsx` (uses `pageSize` pagination)
  - [x] `features/settings/ConnectorSettingsPage.tsx`
  - [x] `features/settings/DbAdminPage.tsx` — standalone DataTables → DataGrid; rows panel stays WorkspaceGrid legacy mode (molecules boundary)
  - [x] `features/settings/PreferencesPage.tsx`
  - [x] `features/forms/FormSubmissionsPage.tsx` — complex WorkspaceGrid legacy mode (server-side pagination, row groups, ContextMenu); Column imported from molecules
  - [x] `features/personalization/VisitorGroupsPage.tsx`
  - [x] `features/personalization/VariantsPage.tsx`
  - [x] `features/devtools/DiagnosticsPage.tsx`
  - [x] `features/workflows/WorkflowRunsPage.tsx`
  - [x] `features/content/RoutesPage.tsx`
  - [x] `features/content/TemplatesPage.tsx`
  - [x] `features/content/fieldRenderers/AssetEditors.tsx`
  - [x] `features/content/fieldRenderers/ContentLinkEditors.tsx`
  - [x] `features/content/fieldRenderers/LinkSelectorDialog.tsx`
  - [x] `features/content/components/ComponentInspector.tsx`
  - [x] `components/inputs/AssetPickerDialog.tsx` — DataTable replaced with plain `<table>` with row-click selection; Tree done in Phase 9
  - [x] `features/assets/AssetLibraryPage.tsx` — WorkspaceGrid legacy mode; Column imported from molecules
  - [x] `features/assets/AssetImageEditorDialog.tsx`
  - [x] `features/content/ContentPagesPage.tsx` ⚠️ largest file
  - [x] `features/FormBuilderSection.tsx`
  - [x] `features/siteSettings/MarketsLocalesPage.tsx`
  - [x] `features/schema/ContentTypesPage.tsx`

---

## Phase 9 — Replace remaining structural PrimeReact

> **Status: COMPLETE** — All components moved behind `ui/atoms/` or `ui/molecules/` wrappers.
>
> Strategy: thin PrimeReact wrappers for complex components (AutoComplete, Chips, Slider, Tree, TreeTable, Splitter, Sidebar, ContextMenu);
> native HTML for trivial ones (FileUpload → `<input type="file">`, ProgressBar → `<progress>`);
> `ContextMenuPanel` uses `useImperativeHandle` for imperative `.show()` API compatibility.

- [x] Create `ui/molecules/SplitterLayout.tsx` — re-exports `Splitter`, `SplitterPanel`
- [x] Migrate `Splitter` in `VariantsPage.tsx`, `RoutesPage.tsx`, `ContentTypesPage.tsx`, `ConnectorSettingsPage.tsx`, `ContentPagesPage.tsx`
- [x] Create `ui/molecules/ContextMenuPanel.tsx` — imperative `ContextMenuHandle` ref API
- [x] Migrate `ContextMenu` in `EntityTable.tsx`, `AssetLibraryPage.tsx`, `FormSubmissionsPage.tsx`, `TemplatesPage.tsx`, `RoutesPage.tsx`, `WorkflowRunsPage.tsx`, `ContentPagesPage.tsx`
- [x] Create `ui/atoms/AutoComplete.tsx` — thin PrimeReact wrapper
- [x] Migrate `AutoComplete` in `ContentReferencePicker.tsx`, `MarketsLocalesPage.tsx`
- [x] Create `ui/atoms/Chips.tsx` — thin PrimeReact wrapper
- [x] Migrate `Chips` in `AssetLibraryPage.tsx`, `ComponentInspector.tsx`, `FieldInspector.tsx`
- [x] Create `ui/atoms/Slider.tsx` — thin PrimeReact wrapper
- [x] Migrate `Slider` in `PreferencesPage.tsx`, `AssetImageEditorDialog.tsx`
- [x] `FileUpload` in `DuckDbAdminPage.tsx` → native `<label><input type="file" /></label>`
- [x] `ProgressBar` in `DuckDbAdminPage.tsx` → native `<progress>`
- [x] Create `ui/molecules/TreePanel.tsx` — re-exports `Tree`, `TreeNode`
- [x] Migrate `Tree` in `AssetPickerDialog.tsx`
- [x] Create `ui/molecules/TreeTablePanel.tsx` — re-exports `TreeTable`, `Column`, `TreeNode`
- [x] Migrate `TreeTable`/`Column` in `ContentPagesPage.tsx`
- [x] Create `ui/atoms/PrimeEditor.tsx` — raw Quill Editor export (used by `fieldRenderers/RichTextEditor.tsx`)
- [x] Create `ui/atoms/Message.tsx` — thin PrimeReact wrapper
- [x] Migrate `Message` in `PersonalizationWorkflowsPage.tsx`
- [x] Create `ui/molecules/SidebarPanel.tsx` — re-exports `Sidebar`
- [x] Migrate `Sidebar` in `FormBuilderSection.tsx`

---

## Phase 10 — Layout / Navigation

> **Status: COMPLETE**
>
> All layout and molecule components migrated. `MenuItem` from primereact replaced with local `NavMenuItem` type.
> Topbar rewritten using Radix Popover for submenus and overlay panels.

- [x] `layout/Sidebar.tsx` — already Button-only after Phase 2
- [x] `ui/molecules/WorkspacePage.tsx` — `BreadCrumb` → native `<nav>`, `Button` → atom, `Menu` popup → Radix `Popover`; defined local `NavMenuItem` type
- [x] `ui/molecules/WorkspacePanels.tsx` — `Button` → atom, `Splitter` → SplitterLayout wrapper, `MenuItem` → `NavMenuItem`
- [x] `ui/molecules/EntityEditor.tsx` — `Dialog` → `DialogPanel` atom
- [x] `ui/molecules/ForbiddenState.tsx` — `Button` → atom
- [x] `ui/molecules/InspectorSection.tsx` — `Button` → atom
- [x] `ui/commands/CommandMenuButton.tsx` — `Button` → atom, `TieredMenu` popup → Radix `Popover` with custom list renderer
- [x] `ui/atoms/AssetPickerButton.tsx` — `Button` → atom
- [x] `ui/atoms/LinkPickerButton.tsx` — `Button` → atom
- [x] `ui/atoms/RuleButton.tsx` — `Button` → atom
- [x] `layout/Topbar.tsx` — full rewrite: `Menubar` → native `<ul>` + Radix `Popover` per nav area; `Menu`/`OverlayPanel` → Radix `Popover`; `Dropdown` → `Select` atom; `Button` → atom; `MenuItem` → local type
- [x] `ui/molecules/EntityTable.tsx` — ContextMenu → ContextMenuPanel (done in Phase 9)
- [x] `ui/molecules/WorkspaceGrid.tsx` — DataTable/Column stay (Phase 8B legacy fallback)

---

## Phase 11 — Final cleanup

> **Status: PARTIAL** — Boundary enforced and scripted. Uninstall blocked by remaining molecule wrappers.

- [x] Add boundary enforcement script: `scripts/check-primereact-boundary.mjs` — run via `pnpm check:boundary`
- [x] Remove stale compiled `.js` theme artifacts (`theme/themeList.js`, `theme/themeManager.js`)
- [ ] **Blocked** — Remove `PrimeReactProvider` from `main.tsx`: still needed by molecule wrappers (Splitter, Tree, ContextMenu, Sidebar, WorkspaceGrid LegacyTable, AutoComplete, Chips, Slider, DatePicker, Password, PrimeEditor)
- [ ] **Blocked** — Uninstall `primereact`, `primeflex`, `primeicons`: same reason as above
- [ ] Remove local PrimeReact theme fallback files from `public/themes/` (no public/themes dir exists currently)
- [ ] Replace `themeList.ts` / `themeManager.ts` with a design-token–based system (separate project; PrimeReact CSS vars still in use)
- [ ] Remove `theme/themeBridge.ts` — still used by UiContext for Monaco editor theming

---

## Risk Register

| Risk | Affected Phase | Mitigation |
|------|---------------|------------|
| DataTable feature parity (sort, filter, pagination, context menu) | Phase 8 | Prototype TanStack Table wrapper before batch migration |
| Splitter replacement — panel resize/persist logic | Phase 9 | Existing `WorkspacePanels.tsx` persist logic must be preserved exactly |
| Theme system breaks during Radix rollout | Phase 5–7 | Keep PrimeReact themes active; Radix components styled with CSS vars separately |
| Topbar navigation complexity | Phase 10 | Plan Topbar as its own mini-project |
| `ToastMessage` type cast in `UiContext.tsx` | Active | Document and isolate; reviewed when Toast migrated in Phase 6 |
| Large files (ContentPagesPage 4.5k, AssetImageEditorDialog 1.6k) | Phase 2/4 | Atom-swap only; full split is a separate refactor |

---

## Session Resume Notes

- Last completed: **Phases 1–10 + 8B + Phase 11 (partial)** — Abstraction boundary fully enforced and scripted.
- Boundary verified: zero primereact imports outside allowed files.
- Run `pnpm check:boundary` from `apps/admin/` to verify at any time.
- Remaining uninstall (primereact/primeflex/primeicons) is blocked until molecule wrappers are replaced with pure Radix/native implementations. That work is a separate future phase.
- Pre-existing TS errors (not from refactor): `ComponentList.tsx`, `ContentPagesPage.tsx`, `FormBuilderSection.tsx`, `MarketsLocalesPage.tsx`.
