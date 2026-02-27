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
