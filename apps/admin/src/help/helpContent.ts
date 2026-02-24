export type HelpTopic = {
  title: string;
  tooltip: string;
  markdown: string;
};

export const helpContent: Record<string, HelpTopic> = {
  content_pages: {
    title: 'Content Pages',
    tooltip: 'Click elements in preview to edit fields/components in place.',
    markdown: 'Use the 3-pane workspace: **Tree**, **Editor**, and **On-page Preview**.\n\nClick any annotated element in Preview to select and edit the mapped field/component.\n\nUse **Advanced** for raw JSON only when needed.\n\nRoutes bind content to market/locale URLs.'
  },
  content_types: {
    title: 'Content Types',
    tooltip: 'Define schema fields with validations and UI metadata.',
    markdown: 'Create fields in the middle pane, then configure validations/UI in the inspector.\n\nPreview shows how editors render in content editing.'
  },
  workflows: {
    title: 'Workflow Designer',
    tooltip: 'Build node graphs for content generation/publishing flows.',
    markdown: 'Use the palette on the left, connect nodes on canvas, edit properties in inspector.\n\nAdvanced JSON is optional fallback.'
  },
  graphiql: {
    title: 'GraphiQL',
    tooltip: 'Run and inspect GraphQL queries with session auth and headers.',
    markdown: 'Run queries/mutations with docs + explorer.\n\nSession auth uses your current admin token.\n\nOverride headers and variables when needed.'
  },
  graphiql_headers: {
    title: 'GraphiQL Headers & Variables',
    tooltip: 'Override headers, preview tokens, and variables for testing.',
    markdown: 'Use **Session Auth** to toggle your current admin token.\n\nAdd `x-preview-token` for preview content requests.\n\nVariables must be valid JSON.'
  },
  forms: {
    title: 'Form Builder',
    tooltip: 'Design multi-step forms with conditions and validations.',
    markdown: 'Designer = layout and drag/drop.\nPreview = runtime behavior.\nStructure = bulk editing.'
  },
  variants: {
    title: 'Variants',
    tooltip: 'Manage A/B variants and targeting rules.',
    markdown: 'Select content item + variant set, then define variants.\n\nUse Rule Editor to avoid hand-writing JSON.'
  },
  personalization_workflows: {
    title: 'Personalization Workflows',
    tooltip: 'Guided setup for audiences, experiences, and rollout workflows.',
    markdown: 'Use the guided 5-step flow:\n\n1. Pick page/content item.\n2. Define 2-3 experience variants.\n3. Build audience targeting in Rule Editor.\n4. Choose rollout strategy.\n5. Generate workflow definition and run it.'
  },
  rules: {
    title: 'Rules',
    tooltip: 'Targeting rules for personalization and workflows.',
    markdown: 'Define conditions using **ALL** (AND) or **ANY** (OR).\n\nUse **Advanced JSON** only for complex cases.'
  },
  dam: {
    title: 'Asset Library (DAM)',
    tooltip: 'Upload, tag, and organize assets with renditions.',
    markdown: 'Use folders/tags to organize assets.\n\nSelect an asset to edit metadata and see renditions.'
  },
  db_admin: {
    title: 'DB Admin',
    tooltip: 'Browse tables, edit rows, and run safe SQL.',
    markdown: 'Use **Danger Mode** to access all tables.\n\nRow edits require a primary key.\n\nSQL console is read-only unless you enable writes.'
  }
};
