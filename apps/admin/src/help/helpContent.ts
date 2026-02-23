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
    markdown: 'Use samples to bootstrap operations.\n\nSession auth uses your current admin token.\n\nOverride headers in Advanced when needed.'
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
  }
};
