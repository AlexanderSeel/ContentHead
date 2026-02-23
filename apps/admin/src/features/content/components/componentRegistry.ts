import { z } from 'zod';

export type ComponentUiField = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'multiline';
  options?: Array<{ label: string; value: string }>;
};

export type ComponentRegistryEntry = {
  id: string;
  label: string;
  icon: string;
  schema: z.ZodTypeAny;
  defaultProps: Record<string, unknown>;
  fields: ComponentUiField[];
};

export const componentRegistry: ComponentRegistryEntry[] = [
  {
    id: 'hero',
    label: 'Hero',
    icon: 'pi pi-star',
    schema: z.object({ title: z.string().min(1), subtitle: z.string().optional(), align: z.enum(['left', 'center', 'right']).default('left') }),
    defaultProps: { title: 'Hero title', subtitle: 'Subtitle', align: 'left' },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'multiline' },
      { key: 'align', label: 'Alignment', type: 'select', options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }] }
    ]
  },
  {
    id: 'text_block',
    label: 'Text Block',
    icon: 'pi pi-align-left',
    schema: z.object({ body: z.string().min(1), columns: z.number().int().min(1).max(3).default(1) }),
    defaultProps: { body: 'Lorem ipsum', columns: 1 },
    fields: [
      { key: 'body', label: 'Body', type: 'multiline' },
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
