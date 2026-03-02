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

export type AiGenerateTextInput = {
  prompt: string;
  maxChars?: number | null | undefined;
};

export type AiGenerateImageInput = {
  prompt: string;
  size?: string | null | undefined;
  mimeType?: string | null | undefined;
  filenameHint?: string | null | undefined;
};

export type AiGeneratedImage = {
  data: Buffer;
  mimeType: string;
  filenameHint: string;
};

export type AIProvider = {
  generateContentType(input: AiGenerateTypeInput): Promise<unknown>;
  generateContent(input: AiGenerateContentInput): Promise<unknown>;
  generateVariants(input: AiGenerateVariantsInput): Promise<unknown>;
  translate(input: AiTranslateInput): Promise<unknown>;
  generateText(input: AiGenerateTextInput): Promise<string>;
  generateImage(input: AiGenerateImageInput): Promise<AiGeneratedImage>;
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

  async generateText(input: AiGenerateTextInput): Promise<string> {
    const prompt = input.prompt.trim();
    const base = prompt ? `Generated: ${prompt}` : 'Generated text.';
    const limit = typeof input.maxChars === 'number' && input.maxChars > 0 ? Math.floor(input.maxChars) : null;
    if (limit && base.length > limit) {
      return base.slice(0, limit).trimEnd();
    }
    return base;
  }

  async generateImage(input: AiGenerateImageInput): Promise<AiGeneratedImage> {
    const prompt = input.prompt.trim() || 'AI image';
    const escaped = escapeXml(prompt.slice(0, 120));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient></defs><rect width="1536" height="1024" fill="url(#g)"/><circle cx="1180" cy="280" r="220" fill="#38bdf8" fill-opacity="0.22"/><circle cx="1090" cy="710" r="280" fill="#38bdf8" fill-opacity="0.12"/><text x="120" y="220" font-size="64" font-family="Segoe UI, Arial" fill="#e2e8f0">AI Generated</text><foreignObject x="120" y="270" width="1180" height="560"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Segoe UI,Arial,sans-serif;font-size:40px;line-height:1.25;color:#e2e8f0;">${escaped}</div></foreignObject></svg>`;
    return {
      data: Buffer.from(svg, 'utf8'),
      mimeType: 'image/svg+xml',
      filenameHint: sanitizeFilename(input.filenameHint?.trim() || prompt, 'ai-generated-image.svg')
    };
  }
}

export class OpenAICompatibleProvider extends MockAIProvider {
  constructor(
    private readonly config: {
      apiKey: string;
      baseUrl: string;
      model: string;
      textModel?: string | null | undefined;
      imageModel?: string | null | undefined;
      imageFallbackToMock?: boolean | null | undefined;
    }
  ) {
    super();
  }

  private endpoint(path: string): string {
    return `${this.config.baseUrl.replace(/\/+$/, '')}${path}`;
  }

  private static isRetriableStatus(status: number): boolean {
    return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async post(path: string, payload: Record<string, unknown>): Promise<unknown> {
    const attempts = 3;
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const response = await fetch(this.endpoint(path), {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const body = await response.text().catch(() => '');
          const error = new Error(`OpenAI-compatible request failed (${response.status}): ${body.slice(0, 900)}`);
          if (attempt < attempts && OpenAICompatibleProvider.isRetriableStatus(response.status)) {
            const delayMs = 250 * 2 ** (attempt - 1);
            await OpenAICompatibleProvider.sleep(delayMs);
            lastError = error;
            continue;
          }
          throw error;
        }
        return response.json();
      } catch (error) {
        const wrapped = error instanceof Error ? error : new Error(String(error));
        // Network-level failures can be transient as well (fetch timeout/reset).
        if (attempt < attempts) {
          const msg = wrapped.message.toLowerCase();
          const looksNetworkTransient =
            msg.includes('network') ||
            msg.includes('timed out') ||
            msg.includes('timeout') ||
            msg.includes('econnreset') ||
            msg.includes('socket');
          if (looksNetworkTransient) {
            const delayMs = 250 * 2 ** (attempt - 1);
            await OpenAICompatibleProvider.sleep(delayMs);
            lastError = wrapped;
            continue;
          }
        }
        throw wrapped;
      }
    }
    throw lastError ?? new Error('OpenAI-compatible request failed');
  }

  private async get(path: string): Promise<unknown> {
    const attempts = 3;
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const response = await fetch(this.endpoint(path), {
          method: 'GET',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${this.config.apiKey}`
          }
        });
        if (!response.ok) {
          const body = await response.text().catch(() => '');
          const error = new Error(`OpenAI-compatible request failed (${response.status}): ${body.slice(0, 900)}`);
          if (attempt < attempts && OpenAICompatibleProvider.isRetriableStatus(response.status)) {
            const delayMs = 250 * 2 ** (attempt - 1);
            await OpenAICompatibleProvider.sleep(delayMs);
            lastError = error;
            continue;
          }
          throw error;
        }
        return response.json();
      } catch (error) {
        const wrapped = error instanceof Error ? error : new Error(String(error));
        if (attempt < attempts) {
          const msg = wrapped.message.toLowerCase();
          const looksNetworkTransient =
            msg.includes('network') ||
            msg.includes('timed out') ||
            msg.includes('timeout') ||
            msg.includes('econnreset') ||
            msg.includes('socket');
          if (looksNetworkTransient) {
            const delayMs = 250 * 2 ** (attempt - 1);
            await OpenAICompatibleProvider.sleep(delayMs);
            lastError = wrapped;
            continue;
          }
        }
        throw wrapped;
      }
    }
    throw lastError ?? new Error('OpenAI-compatible request failed');
  }

  async generateText(input: AiGenerateTextInput): Promise<string> {
    const model = this.config.textModel?.trim() || this.config.model;
    const maxChars = typeof input.maxChars === 'number' && input.maxChars > 0 ? Math.floor(input.maxChars) : null;
    const maxTokens = maxChars ? Math.max(32, Math.min(1024, Math.ceil(maxChars / 3))) : 512;
    const buildPayload = (useCompletionTokens: boolean, includeTemperature: boolean): Record<string, unknown> => ({
      model,
      ...(includeTemperature ? { temperature: 0.7 } : {}),
      ...(useCompletionTokens ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens }),
      messages: [
        { role: 'system', content: 'Return plain text only. Do not wrap in JSON or markdown.' },
        { role: 'user', content: input.prompt }
      ]
    });

    const parseResult = (raw: unknown) =>
      raw as {
        choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
      };
    const isUnsupportedParam = (message: string, param: 'max_completion_tokens' | 'max_tokens'): boolean =>
      message.toLowerCase().includes(param) &&
      (message.toLowerCase().includes('unsupported parameter') ||
        message.toLowerCase().includes('unknown parameter') ||
        message.toLowerCase().includes('not supported'));
    const isUnsupportedTemperature = (message: string): boolean =>
      message.toLowerCase().includes('temperature') &&
      (message.toLowerCase().includes('unsupported') ||
        message.toLowerCase().includes('does not support') ||
        message.toLowerCase().includes('only the default'));

    let result: {
      choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
    };
    let includeTemperature = true;
    let useCompletionTokens = true;
    try {
      result = parseResult(await this.post('/chat/completions', buildPayload(useCompletionTokens, includeTemperature)));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isUnsupportedTemperature(message)) {
        includeTemperature = false;
      } else if (isUnsupportedParam(message, 'max_completion_tokens')) {
        useCompletionTokens = false;
      } else {
        throw error;
      }
      try {
        result = parseResult(await this.post('/chat/completions', buildPayload(useCompletionTokens, includeTemperature)));
      } catch (secondError) {
        const secondMessage = secondError instanceof Error ? secondError.message : String(secondError);
        if (includeTemperature && isUnsupportedTemperature(secondMessage)) {
          includeTemperature = false;
          result = parseResult(await this.post('/chat/completions', buildPayload(useCompletionTokens, includeTemperature)));
        } else if (useCompletionTokens && isUnsupportedParam(secondMessage, 'max_completion_tokens')) {
          useCompletionTokens = false;
          result = parseResult(await this.post('/chat/completions', buildPayload(useCompletionTokens, includeTemperature)));
        } else {
          throw secondError;
        }
      }
    }

    const rawContent = result.choices?.[0]?.message?.content;
    let text = '';
    if (typeof rawContent === 'string') {
      text = rawContent;
    } else if (Array.isArray(rawContent)) {
      text = rawContent
        .map((entry) => (entry && entry.type === 'text' ? entry.text ?? '' : ''))
        .join(' ')
        .trim();
    }
    if (!text) {
      return super.generateText(input);
    }
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (maxChars && normalized.length > maxChars) {
      return normalized.slice(0, maxChars).trimEnd();
    }
    return normalized;
  }

  async generateImage(input: AiGenerateImageInput): Promise<AiGeneratedImage> {
    const model = this.config.imageModel?.trim() || this.config.model;
    const fallbackToMock = this.config.imageFallbackToMock !== false;
    const fallback = async (reason: unknown): Promise<AiGeneratedImage> => {
      const message = reason instanceof Error ? reason.message : String(reason);
      const requestIdMatch = message.match(/\breq_[a-zA-Z0-9]+\b/);
      const requestId = requestIdMatch?.[0] ?? '';
      const idText = requestId ? ` requestId=${requestId}` : '';
      console.warn(
        `[ai] OpenAI-compatible image generation failed for model=${model}; using mock fallback.${idText} ${message.slice(0, 500)}`
      );
      return await super.generateImage(input);
    };
    const tryResponsesBackground = async (): Promise<AiGeneratedImage | null> => {
      const payload: Record<string, unknown> = {
        model,
        background: true,
        input: input.prompt,
        tools: [{ type: 'image_generation', size: input.size?.trim() || '1024x1024' }]
      };
      const started = (await this.post('/responses', payload)) as {
        id?: string;
        status?: string;
        output?: unknown;
        error?: unknown;
      };
      const taskId = started.id?.trim();
      if (!taskId) {
        return null;
      }
      let status = (started.status ?? '').trim().toLowerCase();
      let current = started;
      console.info(`[ai] image task started taskId=${taskId} status=${status || 'unknown'}`);
      const terminal = new Set(['completed', 'failed', 'cancelled']);
      const startedAt = Date.now();
      const pollTimeoutMs = 240_000;
      while (!terminal.has(status)) {
        if (Date.now() - startedAt > pollTimeoutMs) {
          throw new Error(`OpenAI image task ${taskId} timed out after ${Math.round(pollTimeoutMs / 1000)}s`);
        }
        await OpenAICompatibleProvider.sleep(2000);
        current = (await this.get(`/responses/${encodeURIComponent(taskId)}`)) as {
          id?: string;
          status?: string;
          output?: unknown;
          error?: unknown;
        };
        status = (current.status ?? '').trim().toLowerCase();
        console.info(`[ai] image task status taskId=${taskId} status=${status || 'unknown'}`);
      }
      if (status !== 'completed') {
        const detail = safeJson(current.error ?? current);
        throw new Error(`OpenAI image task ${taskId} ended with status=${status}: ${detail}`);
      }
      const b64 = extractBase64Image(current);
      if (b64) {
        const data = Buffer.from(b64, 'base64');
        const mimeType = normalizeImageMimeType(input.mimeType, sniffImageMimeType(data));
        return {
          data,
          mimeType,
          filenameHint: sanitizeFilename(input.filenameHint?.trim() || input.prompt, defaultFilenameForMime(mimeType))
        };
      }
      const url = extractImageUrl(current);
      if (url) {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const data = Buffer.from(arrayBuffer);
          const mimeType = normalizeImageMimeType(input.mimeType, response.headers.get('content-type') || sniffImageMimeType(data));
          return {
            data,
            mimeType,
            filenameHint: sanitizeFilename(input.filenameHint?.trim() || input.prompt, defaultFilenameForMime(mimeType))
          };
        }
      }
      throw new Error(`OpenAI image task ${taskId} completed without image output`);
    };
    // OpenAI docs: response_format is only for DALL-E models; GPT image models return b64_json by default.
    const supportsResponseFormat = /dall-e/i.test(model);
    const buildPayload = (includeResponseFormat: boolean): Record<string, unknown> => ({
      model,
      prompt: input.prompt,
      size: input.size?.trim() || '1024x1024',
      ...(includeResponseFormat && supportsResponseFormat ? { response_format: 'b64_json' } : {})
    });

    const isImagesOnlyModel = /gpt-image|dall-e/i.test(model);
    const canTryResponses = !isImagesOnlyModel && (/api\.openai\.com/i.test(this.config.baseUrl) || /gpt/i.test(model));
    if (canTryResponses) {
      try {
        const generated = await tryResponsesBackground();
        if (generated) {
          return generated;
        }
      } catch (error) {
        if (!fallbackToMock) {
          throw error;
        }
        console.warn(`[ai] background image task failed, falling back to images endpoint: ${String(error)}`);
      }
    }

    let result: { data?: Array<{ b64_json?: string; url?: string }> } | null = null;
    if (supportsResponseFormat) {
      try {
        result = (await this.post('/images/generations', buildPayload(true))) as {
          data?: Array<{ b64_json?: string; url?: string }>;
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const unsupportedResponseFormat =
          message.toLowerCase().includes('unknown parameter') && message.toLowerCase().includes('response_format');
        if (!unsupportedResponseFormat) {
          if (fallbackToMock) {
            return await fallback(error);
          }
          throw error;
        }
        try {
          result = (await this.post('/images/generations', buildPayload(false))) as {
            data?: Array<{ b64_json?: string; url?: string }>;
          };
        } catch (secondError) {
          if (fallbackToMock) {
            return await fallback(secondError);
          }
          throw secondError;
        }
      }
    } else {
      try {
        result = (await this.post('/images/generations', buildPayload(false))) as {
          data?: Array<{ b64_json?: string; url?: string }>;
        };
      } catch (error) {
        if (fallbackToMock) {
          return await fallback(error);
        }
        throw error;
      }
    }

    const first = result.data?.[0];
    if (first?.b64_json) {
      const data = Buffer.from(first.b64_json, 'base64');
      const mimeType = normalizeImageMimeType(input.mimeType, sniffImageMimeType(data));
      return {
        data,
        mimeType,
        filenameHint: sanitizeFilename(input.filenameHint?.trim() || input.prompt, defaultFilenameForMime(mimeType))
      };
    }

    if (first?.url) {
      const response = await fetch(first.url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const data = Buffer.from(arrayBuffer);
        const mimeType = normalizeImageMimeType(input.mimeType, response.headers.get('content-type') || sniffImageMimeType(data));
        return {
          data,
          mimeType,
          filenameHint: sanitizeFilename(input.filenameHint?.trim() || input.prompt, defaultFilenameForMime(mimeType))
        };
      }
    }

    if (fallbackToMock) {
      return await fallback('OpenAI-compatible image response did not include usable b64_json or url data');
    }
    throw new Error('OpenAI-compatible image response did not include b64_json or url data');
  }
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function walkUnknown(value: unknown, visit: (node: unknown) => string | null): string | null {
  const direct = visit(value);
  if (direct) {
    return direct;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const nested = walkUnknown(entry, visit);
      if (nested) {
        return nested;
      }
    }
    return null;
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  for (const entry of Object.values(value as Record<string, unknown>)) {
    const nested = walkUnknown(entry, visit);
    if (nested) {
      return nested;
    }
  }
  return null;
}

function looksBase64(value: string): boolean {
  if (!value || value.length < 64) {
    return false;
  }
  return /^[A-Za-z0-9+/=\s]+$/.test(value);
}

function extractBase64Image(payload: unknown): string | null {
  return walkUnknown(payload, (node) => {
    if (!node || typeof node !== 'object') {
      return null;
    }
    const record = node as Record<string, unknown>;
    const candidates = [
      record.b64_json,
      record.image_base64,
      record.base64,
      record.result
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (looksBase64(trimmed)) {
          return trimmed;
        }
      }
    }
    return null;
  });
}

function extractImageUrl(payload: unknown): string | null {
  return walkUnknown(payload, (node) => {
    if (!node || typeof node !== 'object') {
      return null;
    }
    const record = node as Record<string, unknown>;
    const value = record.url;
    if (typeof value === 'string' && /^https?:\/\//i.test(value.trim())) {
      return value.trim();
    }
    return null;
  });
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sanitizeFilename(value: string, fallback: string): string {
  const safe = value
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+/, '')
    .replace(/[-_.]+$/, '');
  if (!safe) {
    return fallback;
  }
  return safe;
}

function sniffImageMimeType(data: Buffer): string {
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (data.length >= 3 && data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return 'image/jpeg';
  }
  if (data.length >= 12 && data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  const head = data.subarray(0, 128).toString('utf8').toLowerCase();
  if (head.includes('<svg')) {
    return 'image/svg+xml';
  }
  return 'application/octet-stream';
}

function normalizeImageMimeType(requested: string | null | undefined, detected: string | null | undefined): string {
  const req = requested?.trim().toLowerCase();
  if (req?.startsWith('image/')) {
    return req;
  }
  const det = detected?.trim().toLowerCase();
  if (det?.startsWith('image/')) {
    return det;
  }
  return 'image/png';
}

function defaultFilenameForMime(mimeType: string): string {
  if (mimeType === 'image/jpeg') {
    return 'ai-generated-image.jpg';
  }
  if (mimeType === 'image/webp') {
    return 'ai-generated-image.webp';
  }
  if (mimeType === 'image/svg+xml') {
    return 'ai-generated-image.svg';
  }
  return 'ai-generated-image.png';
}
