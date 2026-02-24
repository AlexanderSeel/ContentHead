import { z } from 'zod';

export type ComponentUiField = {
  key: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'select'
    | 'boolean'
    | 'multiline'
    | 'richtext'
    | 'stringList'
    | 'assetRef'
    | 'assetList'
    | 'contentLink'
    | 'contentLinkList'
    | 'formRef'
    | 'objectList'
    | 'json';
  options?: Array<{ label: string; value: string }>;
  fields?: ComponentUiField[];
  itemLabelKey?: string;
};

export type ComponentRegistryEntry = {
  id: string;
  label: string;
  icon: string;
  schema: z.ZodTypeAny;
  defaultProps: Record<string, unknown>;
  fields: ComponentUiField[];
};

const contentLinkSchema = z.object({
  kind: z.enum(['internal', 'external']),
  url: z.string().optional(),
  contentItemId: z.number().optional(),
  text: z.string().optional(),
  target: z.enum(['_self', '_blank']).optional()
});

export const componentRegistry: ComponentRegistryEntry[] = [
  {
    id: 'hero',
    label: 'Hero',
    icon: 'pi pi-star',
    schema: z.object({
      title: z.string().min(1),
      subtitle: z.string().optional(),
      primaryCta: contentLinkSchema.optional(),
      secondaryCta: contentLinkSchema.optional(),
      backgroundAssetRef: z.number().nullable().optional()
    }),
    defaultProps: {
      title: 'Ship faster with ContentHead',
      subtitle: 'Compose pages visually, localize, personalize, and deploy with confidence.',
      primaryCta: { kind: 'internal', url: '/demo#pricing', text: 'View Pricing', target: '_self' },
      secondaryCta: { kind: 'external', url: 'https://example.com/docs', text: 'Read Docs', target: '_blank' },
      backgroundAssetRef: null
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'multiline' },
      { key: 'primaryCta', label: 'Primary CTA', type: 'contentLink' },
      { key: 'secondaryCta', label: 'Secondary CTA', type: 'contentLink' },
      { key: 'backgroundAssetRef', label: 'Background Asset', type: 'assetRef' }
    ]
  },
  {
    id: 'feature_grid',
    label: 'Feature Grid',
    icon: 'pi pi-th-large',
    schema: z.object({
      title: z.string().optional(),
      items: z.array(
        z.object({
          icon: z.string().optional(),
          title: z.string().min(1),
          description: z.string().min(1)
        })
      )
    }),
    defaultProps: {
      title: 'Why teams choose ContentHead',
      items: [
        { icon: 'pi-bolt', title: 'Fast authoring', description: 'Live preview and on-page editing for rapid iteration.' },
        { icon: 'pi-globe', title: 'Market ready', description: 'Built-in market and locale routing with overrides.' },
        { icon: 'pi-sliders-h', title: 'Variants', description: 'Personalize with variant sets and deterministic rules.' }
      ]
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      {
        key: 'items',
        label: 'Items',
        type: 'objectList',
        itemLabelKey: 'title',
        fields: [
          { key: 'icon', label: 'Icon', type: 'text' },
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'multiline' }
        ]
      }
    ]
  },
  {
    id: 'image_text',
    label: 'Image + Text',
    icon: 'pi pi-images',
    schema: z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      imageAssetRef: z.number().nullable().optional(),
      invert: z.boolean().default(false),
      cta: contentLinkSchema.optional()
    }),
    defaultProps: {
      title: 'Composable sections',
      body: 'Use reusable blocks with field-level validation and smart defaults.',
      imageAssetRef: null,
      invert: false,
      cta: { kind: 'internal', url: '/demo#faq', text: 'Learn more', target: '_self' }
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'body', label: 'Body', type: 'multiline' },
      { key: 'imageAssetRef', label: 'Image Asset', type: 'assetRef' },
      { key: 'invert', label: 'Invert Layout', type: 'boolean' },
      { key: 'cta', label: 'CTA', type: 'contentLink' }
    ]
  },
  {
    id: 'pricing',
    label: 'Pricing',
    icon: 'pi pi-wallet',
    schema: z.object({
      title: z.string().optional(),
      tiers: z.array(
        z.object({
          name: z.string().min(1),
          price: z.string().min(1),
          description: z.string().optional(),
          features: z.array(z.string()).optional(),
          cta: contentLinkSchema.optional()
        })
      )
    }),
    defaultProps: {
      title: 'Pricing',
      tiers: [
        { name: 'Starter', price: '$0', description: 'For experiments', features: ['1 site', 'Core CMS'], cta: { kind: 'internal', url: '/demo#newsletter', text: 'Start free', target: '_self' } },
        { name: 'Growth', price: '$149', description: 'For teams', features: ['Multi-market', 'Variants', 'Forms'], cta: { kind: 'external', url: 'https://example.com/sales', text: 'Talk to sales', target: '_blank' } },
        { name: 'Enterprise', price: 'Custom', description: 'For scale', features: ['SSO', 'Advanced workflows'], cta: { kind: 'external', url: 'https://example.com/contact', text: 'Contact', target: '_blank' } }
      ]
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      {
        key: 'tiers',
        label: 'Tiers',
        type: 'objectList',
        itemLabelKey: 'name',
        fields: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'price', label: 'Price', type: 'text' },
          { key: 'description', label: 'Description', type: 'multiline' },
          { key: 'features', label: 'Features', type: 'stringList' },
          { key: 'cta', label: 'CTA', type: 'contentLink' }
        ]
      }
    ]
  },
  {
    id: 'faq',
    label: 'FAQ',
    icon: 'pi pi-question-circle',
    schema: z.object({
      title: z.string().optional(),
      items: z.array(
        z.object({
          question: z.string().min(1),
          answer: z.string().min(1)
        })
      )
    }),
    defaultProps: {
      title: 'Frequently asked questions',
      items: [
        { question: 'Can I preview before publishing?', answer: 'Yes, use preview tokens and on-page bridge integration.' },
        { question: 'Can I run A/B tests?', answer: 'Yes, variant sets support targeted or traffic-based variants.' }
      ]
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      {
        key: 'items',
        label: 'FAQ Items',
        type: 'objectList',
        itemLabelKey: 'question',
        fields: [
          { key: 'question', label: 'Question', type: 'text' },
          { key: 'answer', label: 'Answer', type: 'multiline' }
        ]
      }
    ]
  },
  {
    id: 'newsletter_form',
    label: 'Newsletter Form',
    icon: 'pi pi-envelope',
    schema: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      formId: z.number().nullable().optional(),
      submitLabel: z.string().optional()
    }),
    defaultProps: {
      title: 'Stay in the loop',
      description: 'Get monthly product updates and release notes.',
      formId: null,
      submitLabel: 'Subscribe'
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'multiline' },
      { key: 'formId', label: 'Form', type: 'formRef' },
      { key: 'submitLabel', label: 'Submit Label', type: 'text' }
    ]
  },
  {
    id: 'footer',
    label: 'Footer',
    icon: 'pi pi-minus',
    schema: z.object({
      copyright: z.string().optional(),
      linkGroups: z.array(
        z.object({
          title: z.string().min(1),
          links: z.array(contentLinkSchema).optional()
        })
      ),
      socialLinks: z.array(contentLinkSchema).optional()
    }),
    defaultProps: {
      copyright: '© ContentHead',
      linkGroups: [
        { title: 'Product', links: [{ kind: 'internal', url: '/demo#features', text: 'Features' }, { kind: 'internal', url: '/demo#pricing', text: 'Pricing' }] },
        { title: 'Company', links: [{ kind: 'external', url: 'https://example.com/about', text: 'About', target: '_blank' }] }
      ],
      socialLinks: [
        { kind: 'external', url: 'https://x.com', text: 'X', target: '_blank' },
        { kind: 'external', url: 'https://linkedin.com', text: 'LinkedIn', target: '_blank' }
      ]
    },
    fields: [
      { key: 'copyright', label: 'Copyright', type: 'text' },
      {
        key: 'linkGroups',
        label: 'Link Groups',
        type: 'objectList',
        itemLabelKey: 'title',
        fields: [
          { key: 'title', label: 'Group Title', type: 'text' },
          { key: 'links', label: 'Links', type: 'contentLinkList' }
        ]
      },
      { key: 'socialLinks', label: 'Social Links', type: 'contentLinkList' }
    ]
  },
  {
    id: 'text_block',
    label: 'Text Block',
    icon: 'pi pi-align-left',
    schema: z.object({ body: z.string().min(1), columns: z.number().int().min(1).max(3).default(1) }),
    defaultProps: { body: 'Lorem ipsum', columns: 1 },
    fields: [
      { key: 'body', label: 'Body', type: 'richtext' },
      { key: 'columns', label: 'Columns', type: 'number' }
    ]
  },
  {
    id: 'cta',
    label: 'CTA Button',
    icon: 'pi pi-bolt',
    schema: z.object({ text: z.string().min(1), href: z.string().min(1), style: z.enum(['primary', 'secondary']).default('primary') }),
    defaultProps: { text: 'Learn more', href: '/learn-more', style: 'primary' },
    fields: [
      { key: 'text', label: 'Label', type: 'text' },
      { key: 'href', label: 'URL', type: 'text' },
      { key: 'style', label: 'Style', type: 'select', options: [{ label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' }] }
    ]
  }
];

export function getComponentRegistryEntry(id: string): ComponentRegistryEntry | null {
  return componentRegistry.find((entry) => entry.id === id) ?? null;
}

export function validateComponentProps(type: string, props: Record<string, unknown>): string[] {
  const entry = getComponentRegistryEntry(type);
  if (!entry) {
    return [`Unsupported component type: ${type}`];
  }
  const parsed = entry.schema.safeParse(props);
  if (parsed.success) {
    return [];
  }
  return parsed.error.issues.map((issue) => `${issue.path.join('.') || 'props'}: ${issue.message}`);
}
