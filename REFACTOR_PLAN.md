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

> Single-file changes inside `ui/atoms/`. Feature code is untouched.

- [ ] Install `@radix-ui/react-checkbox`; swap `Checkbox.tsx` implementation
- [ ] Install `@radix-ui/react-switch`; swap `Switch.tsx` implementation
- [ ] Swap `Button.tsx` to native `<button>` + CSS classes (remove primereact dep)
- [ ] Swap `TextInput.tsx` to native `<input>` (remove primereact dep)
- [ ] Swap `Textarea.tsx` to native `<textarea>` (remove primereact dep)
- [ ] Swap `NumberInput.tsx` to native `<input type="number">` or controlled component
- [ ] Swap `Tag.tsx` to native `<span>` + CSS (remove primereact dep)

---

## Phase 6 — Radix swap: medium primitives

- [ ] Install `@radix-ui/react-toast`; swap `UiContext` Toast + `ui/toast.ts` dispatcher
- [ ] Install `@radix-ui/react-alert-dialog`; swap `UiContext` ConfirmDialog
- [ ] Install `@radix-ui/react-dialog`; swap `DialogPanel.tsx` implementation
- [ ] Install `@radix-ui/react-tabs`; swap `Tabs.tsx` implementation
- [ ] Install `@radix-ui/react-accordion`; swap `Accordion.tsx` implementation
- [ ] Install `@radix-ui/react-tooltip`; swap `Tooltip.tsx` implementation

---

## Phase 7 — Radix swap: Select / MultiSelect

> `@radix-ui/react-select` supports single-select only.
> MultiSelect requires a custom `Popover + Checkbox list` pattern.

- [ ] Install `@radix-ui/react-select`; swap `Select.tsx` implementation
- [ ] Design and implement Radix-based `MultiSelect.tsx` (Popover + CheckboxGroup)
- [ ] Test all MultiSelect call sites

---

## Phase 8 — Replace DataTable → TanStack Table

> ~25 files affected. Highest risk phase. Plan separately before starting.

- [ ] Install `@tanstack/react-table`
- [ ] Create `ui/molecules/DataGrid.tsx` wrapping TanStack Table (replaces `EntityTable`)
- [ ] Migrate `EntityTable.tsx` → `DataGrid.tsx` API
- [ ] Migrate each feature page DataTable usage, one file at a time:
  - [ ] `features/security/GroupsPage.tsx`
  - [ ] `features/security/RolesPage.tsx`
  - [ ] `features/schema/ContentTypeList.tsx`
  - [ ] `features/schema/FieldList.tsx`
  - [ ] `features/schema/ComponentRegistryPage.tsx`
  - [ ] `features/settings/ConnectorSettingsPage.tsx`
  - [ ] `features/settings/DbAdminPage.tsx`
  - [ ] `features/settings/PreferencesPage.tsx`
  - [ ] `features/forms/FormSubmissionsPage.tsx`
  - [ ] `features/personalization/VisitorGroupsPage.tsx`
  - [ ] `features/personalization/VariantsPage.tsx`
  - [ ] `features/devtools/DiagnosticsPage.tsx`
  - [ ] `features/workflows/WorkflowRunsPage.tsx`
  - [ ] `features/content/RoutesPage.tsx`
  - [ ] `features/content/TemplatesPage.tsx`
  - [ ] `features/content/fieldRenderers/AssetEditors.tsx`
  - [ ] `features/content/fieldRenderers/ContentLinkEditors.tsx`
  - [ ] `features/content/fieldRenderers/LinkSelectorDialog.tsx`
  - [ ] `features/content/components/ComponentInspector.tsx`
  - [ ] `components/inputs/AssetPickerDialog.tsx`
  - [ ] `features/assets/AssetLibraryPage.tsx`
  - [ ] `features/assets/AssetImageEditorDialog.tsx`
  - [ ] `features/content/ContentPagesPage.tsx` ⚠️ largest file
  - [ ] `features/FormBuilderSection.tsx`
  - [ ] `features/siteSettings/MarketsLocalesPage.tsx`
  - [ ] `features/schema/ContentTypesPage.tsx`

---

## Phase 9 — Replace remaining structural PrimeReact

> One-off components with no Radix primitive equivalent.

- [ ] Replace `Splitter`/`SplitterPanel` in `WorkspacePanels.tsx` molecule with custom CSS resizable panels
- [ ] Replace `Splitter` in `VariantsPage.tsx`, `RoutesPage.tsx`, `ContentTypesPage.tsx`, `ConnectorSettingsPage.tsx`
- [ ] Replace `ContextMenu` in `EntityTable.tsx` molecule with `@radix-ui/react-context-menu`
- [ ] Migrate `ContextMenu` in `AssetLibraryPage.tsx`, `FormSubmissionsPage.tsx`, `TemplatesPage.tsx`, `RoutesPage.tsx`, `WorkflowRunsPage.tsx`
- [ ] Evaluate `AutoComplete` in `AssetPickerDialog.tsx`, `MarketsLocalesPage.tsx` → Radix Popover + input or Combobox
- [ ] Evaluate `Chips` in `AssetLibraryPage.tsx`, `ComponentInspector.tsx`, `FieldInspector.tsx`
- [ ] Evaluate `Slider` in `PreferencesPage.tsx`, `AssetImageEditorDialog.tsx`
- [ ] `FileUpload` in `DuckDbAdminPage.tsx` — native `<input type="file">` or dedicated library
- [ ] `ProgressBar` in `DuckDbAdminPage.tsx` — native `<progress>` or custom CSS

---

## Phase 10 — Layout / Navigation

> Topbar is the most complex component (Menu, Menubar, OverlayPanel, Dropdown).
> Sidebar and AdminShell are simpler.

- [ ] `layout/Sidebar.tsx` — already Button-only after Phase 2
- [ ] `ui/molecules/WorkspacePage.tsx` — `BreadCrumb`, `Button`, `Menu`, `MenuItem [→ atoms]`
- [ ] `ui/molecules/WorkspacePanels.tsx` — `Splitter` (handled in Phase 9), `Button [→ atom]`
- [ ] `ui/molecules/EntityTable.tsx` — `ContextMenu` (Phase 9), `DataTable`/`Column` (Phase 8)
- [ ] `ui/molecules/EntityEditor.tsx` — audit and migrate
- [ ] `ui/molecules/WorkspaceGrid.tsx` — `DataTable`/`Column` (Phase 8)
- [ ] `ui/molecules/ForbiddenState.tsx` — audit
- [ ] `ui/molecules/InspectorSection.tsx` — audit
- [ ] `ui/commands/CommandMenuButton.tsx` — `Button [→ atom]`
- [ ] `ui/commands/menuModel.ts` — `MenuItem` type (PrimeReact type usage in command model)
- [ ] `layout/Topbar.tsx` ⚠️ complex: `Dropdown`, `Menu`, `Menubar`, `OverlayPanel`, `MenuItem` — plan separately
- [ ] `ui/helpers/feedback.ts` — update if `useToast` signature changes

---

## Phase 11 — Final cleanup

- [ ] Remove `PrimeReactProvider` from `main.tsx` (only once all components migrated)
- [ ] Uninstall `primereact`, `primeflex`, `primeicons` from `package.json`
- [ ] Add ESLint rule or CI grep to block future `from 'primereact/*'` imports outside `ui/`
- [ ] Remove local PrimeReact theme files from `public/themes/`
- [ ] Replace `themeList.ts` / `themeManager.ts` with a design-token–based system
- [ ] Remove `theme/themeBridge.ts` if no consumers remain

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

- Last completed: **Phases 1–4** (all atom wrappers created; all Dialog/Tabs/Accordion/Card/Tooltip call sites migrated)
- Next session entry point: **Phase 5** — swap atom implementations from PrimeReact to native/Radix (single-file changes inside `ui/atoms/`)
- To verify progress: `grep -rl "from 'primereact/" apps/admin/src --include="*.tsx" --include="*.ts" | grep -v "ui/atoms\|ui/molecules\|ui/commands\|UiContext\|main.tsx"`
