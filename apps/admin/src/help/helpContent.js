export const helpContent = {
    content_pages: {
        title: 'Content Pages',
        tooltip: 'Edit page fields, composition components, routes and preview.',
        markdown: 'Use **Edit** for visual field and component editing.\n\nUse **Advanced JSON** only for power-user fixes.\n\nRoutes bind content to market/locale URLs.'
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
