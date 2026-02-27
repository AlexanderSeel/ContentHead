const REDACTED_VALUE = '[REDACTED]';
const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_MAX_STRING_LENGTH = 80;

const SENSITIVE_KEY_TOKENS = [
  'authorization',
  'token',
  'apikey',
  'api_key',
  'api-key',
  'password',
  'cookie',
  'secret',
  'clientsecret',
  'client_secret',
  'client-secret'
] as const;

const JWT_LIKE_REGEX = /\b([A-Za-z0-9_-]{8,})\.([A-Za-z0-9_-]{8,})\.([A-Za-z0-9_-]{8,})\b/g;
const BEARER_TOKEN_REGEX = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const INLINE_SECRET_REGEX =
  /\b(authorization|token|api[_-]?key|password|cookie|secret|client[_-]?secret)\b\s*[:=]\s*([^\s,;]+)/gi;

export type RedactionOptions = {
  maxDepth?: number;
  maxStringLength?: number;
};

export function isSensitiveKey(key: string): boolean {
  const normalized = key.trim().toLowerCase().replace(/\s+/g, '');
  return SENSITIVE_KEY_TOKENS.some((token) => normalized.includes(token));
}

export function redactString(value: string, maxLength = DEFAULT_MAX_STRING_LENGTH): string {
  const maskedJwt = value.replace(JWT_LIKE_REGEX, (_match, first, _middle, last) => `${first}.***.${last}`);
  const maskedBearer = maskedJwt.replace(BEARER_TOKEN_REGEX, 'Bearer [REDACTED]');
  const maskedInline = maskedBearer.replace(INLINE_SECRET_REGEX, (_match, key) => `${key}: [REDACTED]`);

  if (maskedInline.length <= maxLength) {
    return maskedInline;
  }

  const headLength = Math.max(0, maxLength - 18);
  const head = maskedInline.slice(0, headLength);
  return `${head}...[truncated:${maskedInline.length}]`;
}

export function redactValue(value: unknown, keyHint = '', options: RedactionOptions = {}): unknown {
  const maxDepth = Number.isFinite(options.maxDepth) ? Number(options.maxDepth) : DEFAULT_MAX_DEPTH;
  const maxStringLength = Number.isFinite(options.maxStringLength)
    ? Number(options.maxStringLength)
    : DEFAULT_MAX_STRING_LENGTH;
  return redactInternal(value, keyHint, maxDepth, maxStringLength, new WeakSet<object>());
}

function redactInternal(
  value: unknown,
  keyHint: string,
  depthRemaining: number,
  maxStringLength: number,
  seen: WeakSet<object>
): unknown {
  if (isSensitiveKey(keyHint)) {
    return REDACTED_VALUE;
  }

  if (value == null) {
    return value;
  }

  if (typeof value === 'string') {
    return redactString(value, maxStringLength);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'bigint') {
    return redactString(String(value), maxStringLength);
  }

  if (typeof value === 'function') {
    return '[Function]';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message, maxStringLength),
      stack: value.stack ? redactString(value.stack, maxStringLength) : undefined
    };
  }

  if (Array.isArray(value)) {
    if (depthRemaining <= 0) {
      return '[Array]';
    }
    return value.map((entry) => redactInternal(entry, '', depthRemaining - 1, maxStringLength, seen));
  }

  if (typeof value === 'object') {
    if (depthRemaining <= 0) {
      return '[Object]';
    }

    if (seen.has(value as object)) {
      return '[Circular]';
    }
    seen.add(value as object);

    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(source)) {
      result[key] = redactInternal(nested, key, depthRemaining - 1, maxStringLength, seen);
    }
    return result;
  }

  return redactString(String(value), maxStringLength);
}

export function safeJson(value: unknown): string {
  try {
    const sanitized = redactValue(value);
    if (typeof sanitized === 'string') {
      return sanitized;
    }
    return JSON.stringify(sanitized);
  } catch {
    return '[Unserializable]';
  }
}
