import { useSyncExternalStore } from 'react';
import { formatErrorMessage } from './graphqlErrorUi';

const GRAPHQL_DIAGNOSTICS_LIMIT = 20;

const REDACTED_KEYS = ['password', 'token', 'secret', 'authorization', 'apikey', 'api_key'];

export type GraphqlFailureKind =
  | 'missing_permission'
  | 'invalid_market_locale'
  | 'schema_mismatch'
  | 'missing_arguments'
  | 'network_error'
  | 'unknown';

export type GraphqlFailure = {
  kind: GraphqlFailureKind;
  operationName: string;
  message: string;
  timestamp: string;
  variables: unknown;
  rawMessages: string[];
};

export type GraphqlResult<T> = { ok: true; data: T } | { ok: false; error: GraphqlFailure };

type DiagnosticsListener = () => void;
type GraphqlErrorNotifier = (failure: GraphqlFailure) => void;

let diagnosticsBuffer: GraphqlFailure[] = [];
const listeners = new Set<DiagnosticsListener>();
let notifier: GraphqlErrorNotifier | null = null;

export class AdminGraphqlError extends Error {
  constructor(public readonly failure: GraphqlFailure) {
    super(failure.message);
    this.name = 'AdminGraphqlError';
  }
}

export function setGraphqlErrorNotifier(next: GraphqlErrorNotifier | null) {
  notifier = next;
}

export function useGraphqlDiagnostics(): GraphqlFailure[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function createGraphqlFailure(input: {
  operationName: string;
  variables: unknown;
  error: unknown;
}): GraphqlFailure {
  const timestamp = new Date().toISOString();
  const variables = redactSecrets(input.variables);
  const normalized = normalizeError(input.error);
  const kind = classifyFailureKind(normalized.messages, normalized.codes);
  const message = toActionableMessage(kind, normalized.messages[0] ?? normalized.fallbackMessage);
  return {
    kind,
    operationName: input.operationName,
    message,
    timestamp,
    variables,
    rawMessages: normalized.messages
  };
}

export function reportGraphqlFailure(failure: GraphqlFailure) {
  diagnosticsBuffer = [failure, ...diagnosticsBuffer].slice(0, GRAPHQL_DIAGNOSTICS_LIMIT);
  listeners.forEach((listener) => listener());
  console.error('[admin-graphql-error]', {
    operationName: failure.operationName,
    kind: failure.kind,
    message: failure.message,
    rawMessages: failure.rawMessages,
    variables: failure.variables,
    timestamp: failure.timestamp
  });
  notifier?.(failure);
}

function subscribe(listener: DiagnosticsListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): GraphqlFailure[] {
  return diagnosticsBuffer;
}

function redactSecrets(value: unknown, keyHint = ''): unknown {
  const normalizedKey = keyHint.toLowerCase();
  if (REDACTED_KEYS.some((entry) => normalizedKey.includes(entry))) {
    return '[REDACTED]';
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactSecrets(entry));
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(record)) {
      next[key] = redactSecrets(nested, key);
    }
    return next;
  }

  return value;
}

function normalizeError(error: unknown): {
  messages: string[];
  codes: string[];
  fallbackMessage: string;
} {
  const fallbackMessage = formatErrorMessage(error);

  if (!error || typeof error !== 'object') {
    return { messages: [fallbackMessage], codes: [], fallbackMessage };
  }

  const response = (error as { response?: unknown }).response;
  const graphErrors = Array.isArray((response as { errors?: unknown[] } | undefined)?.errors)
    ? ((response as { errors: unknown[] }).errors ?? [])
    : [];

  if (graphErrors.length === 0) {
    return { messages: [fallbackMessage], codes: [], fallbackMessage };
  }

  const messages = graphErrors
    .map((entry) => (entry && typeof entry === 'object' ? (entry as { message?: string }).message : undefined))
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
  const codes = graphErrors
    .map((entry) =>
      entry && typeof entry === 'object'
        ? ((entry as { extensions?: { code?: string } }).extensions?.code ?? '')
        : ''
    )
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);

  return {
    messages: messages.length > 0 ? messages : [fallbackMessage],
    codes,
    fallbackMessage
  };
}

function classifyFailureKind(messages: string[], codes: string[]): GraphqlFailureKind {
  const text = `${messages.join(' ')} ${codes.join(' ')}`.toLowerCase();
  if (codes.includes('FORBIDDEN') || codes.includes('UNAUTHORIZED') || text.includes('forbidden') || text.includes('unauthorized')) {
    return 'missing_permission';
  }
  if (text.includes('market') || text.includes('locale')) {
    return 'invalid_market_locale';
  }
  if (text.includes('cannot return null for non-null field') || text.includes('non-null')) {
    return 'schema_mismatch';
  }
  if (text.includes('argument') || text.includes('variable') || text.includes('required')) {
    return 'missing_arguments';
  }
  if (text.includes('fetch') || text.includes('network') || text.includes('failed to fetch')) {
    return 'network_error';
  }
  return 'unknown';
}

function toActionableMessage(kind: GraphqlFailureKind, fallback: string): string {
  if (kind === 'missing_permission') {
    return 'Missing permission. Verify your role includes access to this operation.';
  }
  if (kind === 'invalid_market_locale') {
    return 'Invalid market/locale selection. Switch to an active market-locale combination for this site.';
  }
  if (kind === 'schema_mismatch') {
    return 'Schema mismatch. The API returned data incompatible with the expected GraphQL shape.';
  }
  if (kind === 'missing_arguments') {
    return 'Missing or invalid GraphQL arguments. Check required inputs for this operation.';
  }
  if (kind === 'network_error') {
    return 'Network error while contacting the API. Verify API availability and URL configuration.';
  }
  return fallback;
}
