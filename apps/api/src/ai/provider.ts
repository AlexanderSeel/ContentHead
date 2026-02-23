export type AiGenerateTypeInput = {
  prompt: string;
  nameHint?: string | null | undefined;
};

export type AiGenerateContentInput = {
  prompt: string;
  contentTypeName?: string | null | undefined;
};

export type AiGenerateVariantsInput = {
  prompt: string;
};

export type AiTranslateInput = {
  targetLocale: string;
  targetMarket: string;
  source: {
    fields: Record<string, unknown>;
    composition: Record<string, unknown>;
    components: Record<string, unknown>;
    metadata: Record<string, unknown>;
  };
};

export type AIProvider = {
  generateContentType(input: AiGenerateTypeInput): Promise<unknown>;
  generateContent(input: AiGenerateContentInput): Promise<unknown>;
  generateVariants(input: AiGenerateVariantsInput): Promise<unknown>;
  translate(input: AiTranslateInput): Promise<unknown>;
};

export class MockAIProvider implements AIProvider {
  async generateContentType(input: AiGenerateTypeInput): Promise<unknown> {
    const normalized = (input.nameHint ?? 'Generated Type').trim();
    return {
      name: normalized,
      description: `Generated from prompt: ${input.prompt.slice(0, 60)}`,
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'summary', label: 'Summary', type: 'richtext' },
        { key: 'ctaLabel', label: 'CTA Label', type: 'text' }
      ]
    };
  }

  async generateContent(input: AiGenerateContentInput): Promise<unknown> {
    const typeName = input.contentTypeName ?? 'Page';
    return {
      fields: {
        title: `${typeName} - Generated`,
        summary: `<p>Generated from prompt: ${input.prompt.slice(0, 80)}</p>`,
        ctaLabel: 'Learn more'
      },
      composition: {
        areas: [{ name: 'main', components: ['hero_generated', 'rich_generated', 'teasers_generated'] }]
      },
      components: {
        hero_generated: {
          type: 'Hero',
          title: `${typeName} Hero`,
          subtitle: `Prompt hash seed ${input.prompt.length}`
        },
        rich_generated: {
          type: 'RichText',
          html: `<p>${input.prompt.slice(0, 120)}</p>`
        },
        teasers_generated: {
          type: 'TeaserGrid',
          items: [
            { title: 'Generated Teaser 1', href: '/generated-1' },
            { title: 'Generated Teaser 2', href: '/generated-2' }
          ]
        }
      },
      metadata: {
        source: 'mock-ai'
      }
    };
  }

  async generateVariants(input: AiGenerateVariantsInput): Promise<unknown> {
    return {
      variants: [
        {
          key: 'default',
          priority: 10,
          rule: { op: 'eq', field: 'country', value: 'US' },
          trafficAllocation: 60
        },
        {
          key: 'explore',
          priority: 5,
          rule: { op: 'contains', field: 'segments', value: 'explorer' },
          trafficAllocation: 40
        }
      ],
      notes: `Generated from prompt: ${input.prompt.slice(0, 60)}`
    };
  }

  async translate(input: AiTranslateInput): Promise<unknown> {
    const suffix = `[${input.targetMarket}/${input.targetLocale}]`;
    const translatedFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input.source.fields)) {
      translatedFields[key] = typeof value === 'string' ? `${value} ${suffix}` : value;
    }

    return {
      fields: translatedFields,
      composition: input.source.composition,
      components: input.source.components,
      metadata: {
        ...input.source.metadata,
        translation: {
          market: input.targetMarket,
          locale: input.targetLocale,
          provider: 'mock-ai'
        }
      }
    };
  }
}

export class OpenAICompatibleProviderStub implements AIProvider {
  constructor(private readonly apiKey?: string | null) {}

  private ensureEnabled(): void {
    if (!this.apiKey) {
      throw new Error('OpenAICompatibleProviderStub disabled: missing API key');
    }
  }

  async generateContentType(_input: AiGenerateTypeInput): Promise<unknown> {
    this.ensureEnabled();
    throw new Error('OpenAICompatibleProviderStub is structural only in this build');
  }

  async generateContent(_input: AiGenerateContentInput): Promise<unknown> {
    this.ensureEnabled();
    throw new Error('OpenAICompatibleProviderStub is structural only in this build');
  }

  async generateVariants(_input: AiGenerateVariantsInput): Promise<unknown> {
    this.ensureEnabled();
    throw new Error('OpenAICompatibleProviderStub is structural only in this build');
  }

  async translate(_input: AiTranslateInput): Promise<unknown> {
    this.ensureEnabled();
    throw new Error('OpenAICompatibleProviderStub is structural only in this build');
  }
}
