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
    | 'componentRef'
    | 'objectRef'
    | 'objectList'
    | 'json';
  options?: Array<{ label: string; value: string }>;
  fields?: ComponentUiField[];
  itemLabelKey?: string;
  required?: boolean;
  defaultValue?: unknown;
  control?: string;
  refComponentTypes?: string[];
};

export type ComponentRegistryEntry = {
  id: string;
  label: string;
  description?: string;
  icon: string;
  schema: z.ZodTypeAny;
  defaultProps: Record<string, unknown>;
  fields: ComponentUiField[];
};

export type ComponentTypeSetting = {
  componentTypeId: string;
  enabled: boolean;
  label?: string | null;
  groupName?: string | null;
  schemaJson?: string | null;
  uiMetaJson?: string | null;
  defaultPropsJson?: string | null;
};

export type ResolvedComponentRegistryEntry = ComponentRegistryEntry & {
  enabled: boolean;
  groupName: string;
  propsSchemaJson: string;
};

type PersistedComponentField = {
  key?: unknown;
  label?: unknown;
  type?: unknown;
  options?: unknown;
  fields?: unknown;
  itemLabelKey?: unknown;
  required?: unknown;
  defaultValue?: unknown;
  control?: unknown;
  refComponentTypes?: unknown;
};

function toLegacyFieldType(rawType: string): ComponentUiField['type'] {
  const normalized = rawType.trim().toLowerCase();
  if (normalized === 'string') {
    return 'text';
  }
  if (normalized === 'list') {
    return 'stringList';
  }
  if (normalized === 'link') {
    return 'contentLink';
  }
  if (normalized === 'asset') {
    return 'assetRef';
  }
  if (normalized === 'formref') {
    return 'formRef';
  }
  if (normalized === 'componentref') {
    return 'componentRef';
  }
  if (normalized === 'objectref') {
    return 'objectRef';
  }
  if (normalized === 'object' || normalized === 'subtype' || normalized === 'complex') {
    return 'objectList';
  }
  if (
    normalized === 'text' ||
    normalized === 'number' ||
    normalized === 'select' ||
    normalized === 'boolean' ||
    normalized === 'multiline' ||
    normalized === 'richtext' ||
    normalized === 'stringlist' ||
    normalized === 'assetref' ||
    normalized === 'assetlist' ||
    normalized === 'contentlink' ||
    normalized === 'contentlinklist' ||
    normalized === 'formref' ||
    normalized === 'objectlist' ||
    normalized === 'json'
  ) {
    return normalized as ComponentUiField['type'];
  }
  return 'text';
}

function parsePersistedField(entry: PersistedComponentField): ComponentUiField | null {
  const key = typeof entry.key === 'string' ? entry.key.trim() : '';
  if (!key) {
    return null;
  }
  const label = typeof entry.label === 'string' && entry.label.trim() ? entry.label : key;
  const type = toLegacyFieldType(typeof entry.type === 'string' ? entry.type : 'text');
  const options = Array.isArray(entry.options)
    ? entry.options
        .filter((option) => option && typeof option === 'object')
        .map((option) => {
          const item = option as Record<string, unknown>;
          return {
            label: String(item.label ?? item.value ?? ''),
            value: String(item.value ?? '')
          };
        })
        .filter((option) => option.value)
    : undefined;
  const nestedFields = Array.isArray(entry.fields)
    ? entry.fields
        .filter((field) => field && typeof field === 'object' && !Array.isArray(field))
        .map((field) => parsePersistedField(field as PersistedComponentField))
        .filter((field): field is ComponentUiField => Boolean(field))
    : undefined;
  const refComponentTypes = Array.isArray(entry.refComponentTypes)
    ? entry.refComponentTypes
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    : undefined;
  return {
    key,
    label,
    type,
    ...(options && options.length > 0 ? { options } : {}),
    ...(nestedFields && nestedFields.length > 0 ? { fields: nestedFields } : {}),
    ...(typeof entry.itemLabelKey === 'string' && entry.itemLabelKey.trim() ? { itemLabelKey: entry.itemLabelKey.trim() } : {}),
    ...(typeof entry.required === 'boolean' ? { required: entry.required } : {}),
    ...('defaultValue' in entry ? { defaultValue: entry.defaultValue } : {}),
    ...(typeof entry.control === 'string' && entry.control.trim() ? { control: entry.control } : {}),
    ...(refComponentTypes && refComponentTypes.length > 0 ? { refComponentTypes } : {})
  } as ComponentUiField;
}

function parsePersistedFields(value: string | null | undefined): ComponentUiField[] | null {
  if (!value || !value.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed
      .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
      .map((entry) => parsePersistedField(entry as PersistedComponentField))
      .filter((entry): entry is ComponentUiField => Boolean(entry));
  } catch {
    return null;
  }
}

function parseDefaultProps(value: string | null | undefined): Record<string, unknown> | null {
  if (!value || !value.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

type PersistedSchemaField = {
  key: string;
  label: string;
  type: ComponentUiField['type'];
  required: boolean;
  control?: string;
  options?: Array<{ label: string; value: string }>;
  defaultValue?: unknown;
  refComponentTypes?: string[];
  itemLabelKey?: string;
  fields?: PersistedSchemaField[];
};

function propsSchemaFromFields(fields: ComponentUiField[]): PersistedSchemaField[] {
  return fields.map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type,
    required: Boolean(field.required),
    ...(field.control ? { control: field.control } : {}),
    ...(Array.isArray(field.options) && field.options.length > 0 ? { options: field.options } : {}),
    ...('defaultValue' in field ? { defaultValue: field.defaultValue } : {}),
    ...(Array.isArray(field.refComponentTypes) && field.refComponentTypes.length > 0
      ? { refComponentTypes: field.refComponentTypes }
      : {}),
    ...(typeof field.itemLabelKey === 'string' && field.itemLabelKey.trim() ? { itemLabelKey: field.itemLabelKey } : {}),
    ...(Array.isArray(field.fields) && field.fields.length > 0 ? { fields: propsSchemaFromFields(field.fields) } : {})
  }));
}

const contentLinkSchema = z.object({
  kind: z.enum(['internal', 'external']),
  url: z.string().optional(),
  contentItemId: z.number().optional(),
  text: z.string().optional(),
  target: z.enum(['_self', '_blank']).optional()
});

const featureGridItemSelectionSchema = z
  .object({
    item: z.string().min(1).optional(),
    icon: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional()
  })
  .superRefine((value, ctx) => {
    const hasRef = typeof value.item === 'string' && value.item.trim().length > 0;
    const hasInlineTitle = typeof value.title === 'string' && value.title.trim().length > 0;
    const hasInlineDescription = typeof value.description === 'string' && value.description.trim().length > 0;
    if (!hasRef && !(hasInlineTitle && hasInlineDescription)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide inline title and description for each item.',
        path: ['item']
      });
    }
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
    id: 'feature_grid_item',
    label: 'Feature Grid Item',
    icon: 'pi pi-th-large',
    schema: z.object({
      icon: z.string().optional(),
      title: z.string().min(1),
      description: z.string().min(1)
    }),
    defaultProps: {
      icon: 'pi-bolt',
      title: 'Feature title',
      description: 'Feature description'
    },
    fields: [
      { key: 'icon', label: 'Icon', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'multiline' }
    ]
  },
  {
    id: 'feature_grid',
    label: 'Feature Grid',
    icon: 'pi pi-th-large',
    schema: z.object({
      title: z.string().optional(),
      items: z.array(featureGridItemSelectionSchema)
    }),
    defaultProps: {
      title: 'Why teams choose ContentHead',
      items: []
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      {
        key: 'items',
        label: 'Items',
        type: 'objectList',
        itemLabelKey: 'title',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'multiline' },
          { key: 'icon', label: 'Icon', type: 'text' }
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
    id: 'main_menu',
    label: 'Main Menu',
    icon: 'pi pi-bars',
    schema: z.object({
      brandLabel: z.string().min(1),
      brandLink: contentLinkSchema.optional(),
      items: z.array(
        z.object({
          label: z.string().min(1),
          description: z.string().optional(),
          link: contentLinkSchema.optional(),
          groupTitle: z.string().optional(),
          subLinks: z.array(contentLinkSchema).optional()
        })
      ),
      cta: contentLinkSchema.optional(),
      localeLinks: z.array(contentLinkSchema).optional(),
      sticky: z.boolean().optional()
    }),
    defaultProps: {
      brandLabel: 'ContentHead',
      brandLink: { kind: 'internal', routeSlug: '', text: 'ContentHead', target: '_self' },
      items: [
        {
          label: 'Platform',
          description: 'Composable CMS platform',
          link: { kind: 'internal', routeSlug: 'platform', text: 'Platform', target: '_self' },
          groupTitle: 'Platform',
          subLinks: [
            { kind: 'internal', routeSlug: 'platform/features', text: 'Features', target: '_self' },
            { kind: 'internal', routeSlug: 'platform/integrations', text: 'Integrations', target: '_self' },
            { kind: 'internal', routeSlug: 'platform/security', text: 'Security', target: '_self' }
          ]
        },
        {
          label: 'Solutions',
          description: 'Use-case driven experiences',
          link: { kind: 'internal', routeSlug: 'solutions', text: 'Solutions', target: '_self' },
          groupTitle: 'Solutions',
          subLinks: [
            { kind: 'internal', routeSlug: 'solutions/for-marketing', text: 'For Marketing', target: '_self' },
            { kind: 'internal', routeSlug: 'solutions/for-commerce', text: 'For Commerce', target: '_self' },
            { kind: 'internal', routeSlug: 'solutions/for-enterprises', text: 'For Enterprises', target: '_self' }
          ]
        },
        {
          label: 'Resources',
          description: 'Articles and guides',
          link: { kind: 'internal', routeSlug: 'resources', text: 'Resources', target: '_self' },
          groupTitle: 'Resources',
          subLinks: [
            { kind: 'internal', routeSlug: 'resources/blog', text: 'Blog', target: '_self' },
            { kind: 'internal', routeSlug: 'resources/guides', text: 'Guides', target: '_self' }
          ]
        }
      ],
      cta: { kind: 'internal', routeSlug: 'contact', text: 'Book demo', target: '_self' },
      localeLinks: [
        { kind: 'internal', routeSlug: '', text: 'EN (US)', target: '_self' },
        { kind: 'internal', routeSlug: '', text: 'DE', target: '_self' }
      ],
      sticky: true
    },
    fields: [
      { key: 'brandLabel', label: 'Brand Label', type: 'text' },
      { key: 'brandLink', label: 'Brand Link', type: 'contentLink' },
      {
        key: 'items',
        label: 'Menu Items',
        type: 'objectList',
        itemLabelKey: 'label',
        fields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'description', label: 'Description', type: 'multiline' },
          { key: 'link', label: 'Link', type: 'contentLink' },
          { key: 'groupTitle', label: 'Mega Group Title', type: 'text' },
          { key: 'subLinks', label: 'Mega Group Links', type: 'contentLinkList' }
        ]
      },
      { key: 'cta', label: 'CTA Link', type: 'contentLink' },
      { key: 'localeLinks', label: 'Locale Links', type: 'contentLinkList' },
      { key: 'sticky', label: 'Sticky', type: 'boolean' }
    ]
  },
  {
    id: 'anchor_nav',
    label: 'Anchor Navigation',
    icon: 'pi pi-anchor',
    schema: z.object({
      title: z.string().optional(),
      sticky: z.boolean().optional(),
      smoothScroll: z.boolean().optional(),
      sections: z.array(
        z.object({
          label: z.string().min(1),
          anchorId: z.string().min(1)
        })
      )
    }),
    defaultProps: {
      title: 'On this page',
      sticky: true,
      smoothScroll: true,
      sections: [
        { label: 'Overview', anchorId: 'overview' },
        { label: 'Features', anchorId: 'features' },
        { label: 'Pricing', anchorId: 'pricing' },
        { label: 'FAQ', anchorId: 'faq' }
      ]
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'sticky', label: 'Sticky', type: 'boolean' },
      { key: 'smoothScroll', label: 'Smooth Scroll', type: 'boolean' },
      {
        key: 'sections',
        label: 'Sections',
        type: 'objectList',
        itemLabelKey: 'label',
        fields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'anchorId', label: 'Anchor ID', type: 'text' }
        ]
      }
    ]
  },
  {
    id: 'card_slider',
    label: 'Card Slider',
    icon: 'pi pi-images',
    schema: z.object({
      title: z.string().optional(),
      autoplay: z.boolean().optional(),
      showArrows: z.boolean().optional(),
      showDots: z.boolean().optional(),
      cards: z.array(
        z.object({
          imageAssetRef: z.number().nullable().optional(),
          title: z.string().min(1),
          text: z.string().optional(),
          link: contentLinkSchema.optional()
        })
      )
    }),
    defaultProps: {
      title: 'Highlights',
      autoplay: false,
      showArrows: true,
      showDots: true,
      cards: []
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'autoplay', label: 'Autoplay', type: 'boolean' },
      { key: 'showArrows', label: 'Show Arrows', type: 'boolean' },
      { key: 'showDots', label: 'Show Dots', type: 'boolean' },
      {
        key: 'cards',
        label: 'Cards',
        type: 'objectList',
        itemLabelKey: 'title',
        fields: [
          { key: 'imageAssetRef', label: 'Image', type: 'assetRef' },
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'text', label: 'Text', type: 'multiline' },
          { key: 'link', label: 'Link', type: 'contentLink' }
        ]
      }
    ]
  },
  {
    id: 'stats_strip',
    label: 'Stats / KPI Strip',
    icon: 'pi pi-chart-bar',
    schema: z.object({
      title: z.string().optional(),
      items: z.array(
        z.object({
          value: z.string().min(1),
          label: z.string().min(1),
          suffix: z.string().optional()
        })
      )
    }),
    defaultProps: {
      title: 'At a glance',
      items: [
        { value: '140+', label: 'Enterprise teams', suffix: '' },
        { value: '36', label: 'Markets launched', suffix: '' },
        { value: '99.95', label: 'Avg uptime', suffix: '%' }
      ]
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      {
        key: 'items',
        label: 'Stats',
        type: 'objectList',
        itemLabelKey: 'label',
        fields: [
          { key: 'value', label: 'Value', type: 'text' },
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'suffix', label: 'Suffix', type: 'text' }
        ]
      }
    ]
  },
  {
    id: 'testimonials_slider',
    label: 'Testimonials Slider',
    icon: 'pi pi-comments',
    schema: z.object({
      title: z.string().optional(),
      autoplay: z.boolean().optional(),
      items: z.array(
        z.object({
          quote: z.string().min(1),
          name: z.string().min(1),
          role: z.string().optional(),
          avatarAssetRef: z.number().nullable().optional()
        })
      )
    }),
    defaultProps: {
      title: 'What teams say',
      autoplay: true,
      items: []
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'autoplay', label: 'Autoplay', type: 'boolean' },
      {
        key: 'items',
        label: 'Testimonials',
        type: 'objectList',
        itemLabelKey: 'name',
        fields: [
          { key: 'quote', label: 'Quote', type: 'multiline' },
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'role', label: 'Role', type: 'text' },
          { key: 'avatarAssetRef', label: 'Avatar', type: 'assetRef' }
        ]
      }
    ]
  },
  {
    id: 'content_teasers',
    label: 'Content Teasers',
    icon: 'pi pi-book',
    schema: z.object({
      title: z.string().optional(),
      intro: z.string().optional(),
      items: z.array(
        z.object({
          title: z.string().min(1),
          summary: z.string().optional(),
          tag: z.string().optional(),
          imageAssetRef: z.number().nullable().optional(),
          link: contentLinkSchema.optional()
        })
      )
    }),
    defaultProps: {
      title: 'From the resource hub',
      intro: 'Read practical articles and deep implementation guides.',
      items: []
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'intro', label: 'Intro', type: 'multiline' },
      {
        key: 'items',
        label: 'Teasers',
        type: 'objectList',
        itemLabelKey: 'title',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'summary', label: 'Summary', type: 'multiline' },
          { key: 'tag', label: 'Tag', type: 'text' },
          { key: 'imageAssetRef', label: 'Image', type: 'assetRef' },
          { key: 'link', label: 'Link', type: 'contentLink' }
        ]
      }
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

const STRUCTURED_FIELD_TYPES = new Set<ComponentUiField['type']>([
  'assetRef',
  'assetList',
  'contentLink',
  'contentLinkList',
  'formRef',
  'componentRef',
  'objectRef',
  'objectList',
  'json'
]);

function reconcileFieldList(
  overrideFields: ComponentUiField[] | null | undefined,
  canonicalFields: ComponentUiField[]
): ComponentUiField[] {
  if (!overrideFields || overrideFields.length === 0) {
    return canonicalFields;
  }

  const canonicalByKey = new Map(canonicalFields.map((field) => [field.key, field]));
  const merged = overrideFields.map((field) => {
    const canonical = canonicalByKey.get(field.key);
    if (!canonical) {
      return field;
    }

    // Root cause fix: persisted schema overrides could downgrade structured props to text,
    // which made the inspector render "[object Object]" instead of specialized editors.
    const forceCanonicalType = STRUCTURED_FIELD_TYPES.has(canonical.type) && field.type !== canonical.type;
    const nextType = forceCanonicalType ? canonical.type : field.type;
    const nextFields =
      nextType === 'objectList'
        ? reconcileFieldList(field.fields, canonical.fields ?? [])
        : Array.isArray(field.fields) && field.fields.length > 0
          ? field.fields
          : canonical.fields;

    return {
      ...field,
      type: nextType,
      ...(nextFields && nextFields.length > 0 ? { fields: nextFields } : {}),
      ...(nextType === 'objectList'
        ? { itemLabelKey: field.itemLabelKey ?? canonical.itemLabelKey }
        : {}),
      ...(nextType === 'componentRef' || nextType === 'objectRef'
        ? { refComponentTypes: field.refComponentTypes ?? canonical.refComponentTypes }
        : {}),
      ...(nextType === 'select' ? { options: field.options ?? canonical.options } : {})
    };
  });

  const existingKeys = new Set(merged.map((field) => field.key));
  const missingCanonicalFields = canonicalFields.filter((field) => !existingKeys.has(field.key));
  return [...merged, ...missingCanonicalFields];
}

export function resolveComponentRegistry(settings: ComponentTypeSetting[]): ResolvedComponentRegistryEntry[] {
  const settingsMap = new Map(settings.map((entry) => [entry.componentTypeId, entry]));
  return componentRegistry.map((entry) => {
    const setting = settingsMap.get(entry.id);
    const enabled = setting?.enabled ?? true;
    const groupName = setting?.groupName?.trim() || 'General';
    const overrideFields = parsePersistedFields(setting?.schemaJson);
    const fields = reconcileFieldList(overrideFields, entry.fields);
    const persistedDefaultProps = parseDefaultProps(setting?.defaultPropsJson);
    const defaultProps =
      persistedDefaultProps ??
      (fields.length > 0
        ? fields.reduce<Record<string, unknown>>((acc, field) => {
            if ('defaultValue' in field) {
              acc[field.key] = field.defaultValue;
            } else if (entry.defaultProps[field.key] !== undefined) {
              acc[field.key] = entry.defaultProps[field.key];
            }
            return acc;
          }, {})
        : entry.defaultProps);
    const propsSchema = propsSchemaFromFields(fields);

    return {
      ...entry,
      label: setting?.label?.trim() || entry.label,
      fields,
      defaultProps,
      description: entry.description ?? `${setting?.label?.trim() || entry.label} component`,
      enabled,
      groupName,
      propsSchemaJson: JSON.stringify(propsSchema, null, 2)
    };
  });
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
