export const DEFAULT_URL_PATTERN = '/{market}/{locale}';

type ParsedPart = {
  kind: 'literal' | 'token';
  value: string;
};

export type UrlPatternValidation = {
  valid: boolean;
  error?: string;
};

export type ResolvedPathParts = {
  marketCode: string;
  localeCode: string;
  slug: string;
};

function normalizePattern(input: string | null | undefined): string {
  const value = (input ?? '').trim();
  if (!value) {
    return DEFAULT_URL_PATTERN;
  }
  return value.startsWith('/') ? value : `/${value}`;
}

function parseSegment(segment: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  const tokenRegex = /\{(market|locale)\}/g;
  let cursor = 0;
  let match = tokenRegex.exec(segment);
  while (match) {
    const start = match.index;
    if (start > cursor) {
      parts.push({ kind: 'literal', value: segment.slice(cursor, start) });
    }
    parts.push({ kind: 'token', value: match[1]! });
    cursor = start + match[0].length;
    match = tokenRegex.exec(segment);
  }
  if (cursor < segment.length) {
    parts.push({ kind: 'literal', value: segment.slice(cursor) });
  }
  return parts;
}

export function validateUrlPattern(input: string | null | undefined): UrlPatternValidation {
  const pattern = normalizePattern(input);
  if (!pattern.includes('{market}') || !pattern.includes('{locale}')) {
    return { valid: false, error: 'Pattern must include {market} and {locale}.' };
  }
  return { valid: true };
}

export function buildLocalizedPath(
  inputPattern: string | null | undefined,
  marketCode: string,
  localeCode: string,
  slug: string
): string {
  const pattern = normalizePattern(inputPattern);
  const prefix = pattern.replaceAll('{market}', marketCode).replaceAll('{locale}', localeCode);
  const cleanedSlug = slug.replace(/^\/+/, '');
  if (!cleanedSlug) {
    return prefix;
  }
  return `${prefix.replace(/\/+$/, '')}/${cleanedSlug}`;
}

export function parseLocalizedPath(
  inputPattern: string | null | undefined,
  pathSegments: string[]
): ResolvedPathParts | null {
  const pattern = normalizePattern(inputPattern);
  const patternSegments = pattern
    .split('/')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const values: Record<string, string> = {};
  let consumed = 0;

  for (const segmentPattern of patternSegments) {
    const current = pathSegments[consumed];
    if (!current) {
      return null;
    }
    const parts = parseSegment(segmentPattern);
    let index = 0;
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i]!;
      if (part.kind === 'literal') {
        if (!current.startsWith(part.value, index)) {
          return null;
        }
        index += part.value.length;
        continue;
      }

      const nextLiteral = parts.slice(i + 1).find((entry) => entry.kind === 'literal')?.value ?? null;
      if (nextLiteral) {
        const nextIndex = current.indexOf(nextLiteral, index);
        if (nextIndex < 0) {
          return null;
        }
        values[part.value] = current.slice(index, nextIndex);
        index = nextIndex;
      } else {
        values[part.value] = current.slice(index);
        index = current.length;
      }
    }

    if (index !== current.length) {
      return null;
    }
    consumed += 1;
  }

  const marketCode = values.market;
  const localeCode = values.locale;
  if (!marketCode || !localeCode) {
    return null;
  }

  return {
    marketCode,
    localeCode,
    slug: pathSegments.slice(consumed).join('/')
  };
}
