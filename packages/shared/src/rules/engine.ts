export type RuleContext = {
  userId?: string | null;
  sessionId?: string | null;
  segments?: string[];
  country?: string | null;
  device?: string | null;
  referrer?: string | null;
  query?: Record<string, string | number | boolean | null | undefined>;
};

export type Comparator = 'eq' | 'neq' | 'in' | 'contains' | 'gt' | 'lt' | 'regex';

export type ComparatorRule = {
  op: Comparator;
  field: string;
  value: unknown;
};

export type LogicalRule = {
  all?: Rule[];
  any?: Rule[];
  not?: Rule;
};

export type Rule = ComparatorRule | LogicalRule;

function getFieldValue(context: RuleContext, field: string): unknown {
  if (field.startsWith('query.')) {
    const queryKey = field.slice('query.'.length);
    return context.query?.[queryKey];
  }

  switch (field) {
    case 'userId':
      return context.userId;
    case 'sessionId':
      return context.sessionId;
    case 'segments':
      return context.segments ?? [];
    case 'country':
      return context.country;
    case 'device':
      return context.device;
    case 'referrer':
      return context.referrer;
    default:
      return undefined;
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function compare(rule: ComparatorRule, actual: unknown): boolean {
  switch (rule.op) {
    case 'eq':
      return actual === rule.value;
    case 'neq':
      return actual !== rule.value;
    case 'in': {
      if (!Array.isArray(rule.value)) {
        return false;
      }
      return rule.value.includes(actual);
    }
    case 'contains': {
      if (Array.isArray(actual)) {
        return actual.includes(rule.value);
      }
      if (typeof actual === 'string' && typeof rule.value === 'string') {
        return actual.includes(rule.value);
      }
      return false;
    }
    case 'gt': {
      const left = toNumber(actual);
      const right = toNumber(rule.value);
      return left !== null && right !== null ? left > right : false;
    }
    case 'lt': {
      const left = toNumber(actual);
      const right = toNumber(rule.value);
      return left !== null && right !== null ? left < right : false;
    }
    case 'regex': {
      if (typeof rule.value !== 'string') {
        return false;
      }
      const input = actual == null ? '' : String(actual);
      try {
        return new RegExp(rule.value).test(input);
      } catch {
        return false;
      }
    }
    default:
      return false;
  }
}

function isComparatorRule(rule: Rule): rule is ComparatorRule {
  return typeof (rule as ComparatorRule).op === 'string' && typeof (rule as ComparatorRule).field === 'string';
}

export function evaluateRule(rule: Rule, context: RuleContext): boolean {
  if (isComparatorRule(rule)) {
    return compare(rule, getFieldValue(context, rule.field));
  }

  if (rule.all) {
    return rule.all.every((entry) => evaluateRule(entry, context));
  }

  if (rule.any) {
    return rule.any.some((entry) => evaluateRule(entry, context));
  }

  if (rule.not) {
    return !evaluateRule(rule.not, context);
  }

  return true;
}

export function hashDeterministic(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function chooseTrafficBucket(
  seed: string,
  allocations: Array<{ key: string; weight: number }>
): string | null {
  const active = allocations.filter((entry) => entry.weight > 0);
  const total = active.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) {
    return null;
  }

  const bucket = hashDeterministic(seed) % total;
  let cursor = 0;
  for (const entry of active) {
    cursor += entry.weight;
    if (bucket < cursor) {
      return entry.key;
    }
  }

  return active[active.length - 1]?.key ?? null;
}
