import { useSyncExternalStore } from 'react';

import { formatErrorMessage } from './graphqlErrorUi';
import { redactString, redactValue, safeJson } from './issueRedaction';

const STORAGE_KEY = 'contenthead.admin.issueCollector.v1';
const DEFAULT_MAX_ENTRIES = 200;
const DEFAULT_PERSIST_LIMIT = 100;
const DEFAULT_DEDUPE_WINDOW_MS = 5_000;

export type IssueLevel = 'error' | 'warn';
export type IssueSource = 'console' | 'toast' | 'graphql' | 'runtime';

export type IssueGraphqlError = {
  message: string;
  path?: string | undefined;
  code?: string | undefined;
};

export type IssueGraphqlPayload = {
  operationName: string;
  variables: unknown;
  endpoint: string;
  errors: IssueGraphqlError[];
  status?: number | undefined;
  durationMs: number;
};

export type IssueContextValues = {
  siteId?: number | null | undefined;
  market?: string | null | undefined;
  locale?: string | null | undefined;
};

export type IssueEntry = {
  id: string;
  ts: string;
  level: IssueLevel;
  source: IssueSource;
  title: string;
  details: string;
  stack?: string | undefined;
  route: string;
  userSummary?: string | undefined;
  rolesSummary?: string | undefined;
  featureTag?: string | undefined;
  buildInfo?: string | undefined;
  context: IssueContextValues;
  graphql?: IssueGraphqlPayload | undefined;
  count: number;
};

export type IssueCollectorState = {
  enabled: boolean;
  paused: boolean;
  maxEntries: number;
  entries: IssueEntry[];
};

export type IssueCollectorContextSnapshot = {
  route?: string | undefined;
  username?: string | null | undefined;
  userId?: string | number | null | undefined;
  rolesSummary?: string | null | undefined;
  siteId?: number | null | undefined;
  market?: string | null | undefined;
  locale?: string | null | undefined;
  featureTag?: string | null | undefined;
  buildInfo?: string | null | undefined;
};

type Listener = () => void;
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type PersistedIssueCollectorState = {
  paused?: boolean;
  maxEntries?: number;
  entries?: IssueEntry[];
};

export type IssueCollectorOptions = {
  enabled?: boolean;
  storage?: StorageLike | null;
  maxEntries?: number;
  persistLimit?: number;
  dedupeWindowMs?: number;
  now?: () => number;
};

export type AddIssueInput = {
  level: IssueLevel;
  source: IssueSource;
  title: string;
  details?: string | undefined;
  stack?: string | undefined;
  featureTag?: string | undefined;
  graphql?: IssueGraphqlPayload | undefined;
};

export type AddGraphqlFailureInput = {
  operationName: string;
  variables: unknown;
  endpoint: string;
  error: unknown;
  durationMs: number;
};

export type AddToastInput = {
  level: IssueLevel;
  title: string;
  details?: string | undefined;
  featureTag?: string | undefined;
};

export function parseBooleanFlag(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export function isIssueCollectorEnabled(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  return (
    parseBooleanFlag(import.meta.env.VITE_ENABLE_ISSUE_COLLECTOR) ||
    parseBooleanFlag(import.meta.env.VITE_ISSUE_COLLECTOR_ENABLED)
  );
}

export function deriveFeatureTag(pathname: string): string {
  const trimmed = pathname.trim();
  if (trimmed.length === 0 || trimmed === '/') {
    return 'dashboard';
  }

  const parts = trimmed.split('?')[0]?.split('/').filter(Boolean) ?? [];
  if (parts.length === 0) {
    return 'dashboard';
  }
  if (parts.length === 1) {
    return parts[0] ?? 'unknown';
  }
  return `${parts[0]}/${parts[1]}`;
}

export function formatIssuesAsJson(entries: IssueEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export function formatIssuesAsMarkdown(entries: IssueEntry[]): string {
  if (entries.length === 0) {
    return 'No issues captured.';
  }

  return entries
    .map((entry, index) => {
      const actual = entry.details || entry.title;
      const consoleLines = buildConsoleBlock(entry);
      return [
        `### Issue ${index + 1} - ${entry.title}`,
        `**Area/Panel:** ${entry.featureTag ?? entry.route}`,
        `**URL:** ${entry.route}`,
        `**User:** ${entry.userSummary ?? 'anonymous'}`,
        '**Expected:** ',
        `**Actual:** ${actual}`,
        '',
        '**Repro Steps:** (blank placeholders)',
        '1.',
        '2.',
        '3.',
        '',
        '**Console/Runtime:**',
        '```text',
        consoleLines.join('\n'),
        '```'
      ].join('\n');
    })
    .join('\n\n');
}

function buildConsoleBlock(entry: IssueEntry): string[] {
  const lines: string[] = [
    `timestamp=${entry.ts}`,
    `level=${entry.level}`,
    `source=${entry.source}`,
    `count=${entry.count}`
  ];

  if (entry.details) {
    lines.push(`details=${entry.details}`);
  }
  if (entry.stack) {
    lines.push(`stack=${entry.stack}`);
  }
  if (entry.graphql) {
    lines.push(`graphql.operation=${entry.graphql.operationName}`);
    lines.push(`graphql.endpoint=${entry.graphql.endpoint}`);
    lines.push(`graphql.status=${entry.graphql.status ?? 'n/a'}`);
    lines.push(`graphql.durationMs=${entry.graphql.durationMs}`);
    lines.push(`graphql.variables=${safeJson(entry.graphql.variables)}`);
    if (entry.graphql.errors.length > 0) {
      lines.push(`graphql.errors=${safeJson(entry.graphql.errors)}`);
    }
  }

  if (entry.rolesSummary) {
    lines.push(`roles=${entry.rolesSummary}`);
  }
  if (entry.buildInfo) {
    lines.push(`build=${entry.buildInfo}`);
  }
  if (entry.context.siteId != null) {
    lines.push(`siteId=${entry.context.siteId}`);
  }
  if (entry.context.market) {
    lines.push(`market=${entry.context.market}`);
  }
  if (entry.context.locale) {
    lines.push(`locale=${entry.context.locale}`);
  }

  return lines;
}

function canUseBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function defaultStorage(): StorageLike | null {
  if (!canUseBrowserStorage()) {
    return null;
  }
  return window.localStorage;
}

function nowIso(nowProvider: () => number): string {
  return new Date(nowProvider()).toISOString();
}

function pickBuildInfo(): string {
  const explicit =
    import.meta.env.VITE_BUILD_SHA ??
    import.meta.env.VITE_COMMIT_SHA ??
    import.meta.env.VITE_APP_VERSION;
  if (typeof explicit === 'string' && explicit.trim().length > 0) {
    return explicit.trim();
  }
  return import.meta.env.DEV ? 'local-dev' : 'unknown';
}

function normalizeRoute(route?: string): string {
  if (route && route.trim().length > 0) {
    return route;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.pathname}${window.location.search}`;
  }
  return 'unknown';
}

function normalizeTitle(raw: string, fallback: string): string {
  const line = raw.split('\n')[0]?.trim();
  if (!line) {
    return fallback;
  }
  return redactString(line, 120);
}

function toUserSummary(snapshot: IssueCollectorContextSnapshot): string | undefined {
  const username = snapshot.username?.trim();
  const userId = snapshot.userId == null ? '' : String(snapshot.userId).trim();
  if (username && userId) {
    return `${username} (#${userId})`;
  }
  if (username) {
    return username;
  }
  if (userId) {
    return `#${userId}`;
  }
  return undefined;
}

function parsePath(path: unknown): string | undefined {
  if (Array.isArray(path)) {
    const text = path.map((entry) => String(entry)).join('.');
    return text || undefined;
  }
  if (typeof path === 'string' && path.trim().length > 0) {
    return path;
  }
  return undefined;
}

function deriveOperationNameFromQuery(query: unknown): string | undefined {
  if (typeof query === 'string') {
    const match = query.match(/\b(query|mutation|subscription)\s+([A-Za-z0-9_]+)/);
    return match?.[2];
  }

  if (query && typeof query === 'object') {
    const definitions = (query as { definitions?: unknown[] }).definitions;
    if (!Array.isArray(definitions)) {
      return undefined;
    }
    for (const definition of definitions) {
      const operation =
        definition &&
        typeof definition === 'object' &&
        (definition as { kind?: string }).kind === 'OperationDefinition'
          ? (definition as { name?: { value?: string } }).name?.value
          : undefined;
      if (operation && operation.trim().length > 0) {
        return operation;
      }
    }
  }

  return undefined;
}

function parseGraphqlFailure(input: AddGraphqlFailureInput): {
  operationName: string;
  details: string;
  errors: IssueGraphqlError[];
  status?: number | undefined;
  stack?: string | undefined;
} {
  const fallbackMessage = redactString(formatErrorMessage(input.error));
  const payload = input.error as
    | {
        response?: { status?: number; errors?: unknown[] };
        request?: { query?: unknown; document?: unknown };
      }
    | undefined;
  const response = payload?.response;
  const rawErrors = Array.isArray(response?.errors) ? response?.errors ?? [] : [];
  const errors: IssueGraphqlError[] = rawErrors.map((entry) => {
    const message =
      entry && typeof entry === 'object' && typeof (entry as { message?: unknown }).message === 'string'
        ? redactString(String((entry as { message?: string }).message))
        : fallbackMessage;
    const path =
      entry && typeof entry === 'object'
        ? parsePath((entry as { path?: unknown }).path)
        : undefined;
    const code =
      entry &&
      typeof entry === 'object' &&
      (entry as { extensions?: { code?: unknown } }).extensions?.code != null
        ? redactString(String((entry as { extensions?: { code?: unknown } }).extensions?.code))
        : undefined;
    return { message, path, code };
  });

  const derivedOperation =
    deriveOperationNameFromQuery(payload?.request?.query) ??
    deriveOperationNameFromQuery(payload?.request?.document) ??
    input.operationName;
  const stack = input.error instanceof Error && input.error.stack ? redactString(input.error.stack) : undefined;
  return {
    operationName: derivedOperation || input.operationName || 'unknown',
    details: errors[0]?.message ?? fallbackMessage,
    errors,
    status: typeof response?.status === 'number' ? response.status : undefined,
    stack
  };
}

export class IssueCollectorStore {
  private readonly listeners = new Set<Listener>();
  private readonly storage: StorageLike | null;
  private readonly now: () => number;
  private readonly persistLimit: number;
  private readonly dedupeWindowMs: number;
  private readonly enabled: boolean;
  private entries: IssueEntry[] = [];
  private paused = false;
  private maxEntries: number;
  private contextSnapshot: IssueCollectorContextSnapshot = {};
  private state: IssueCollectorState;

  constructor(options: IssueCollectorOptions = {}) {
    this.enabled = options.enabled ?? isIssueCollectorEnabled();
    this.storage = options.storage === undefined ? defaultStorage() : options.storage;
    this.now = options.now ?? (() => Date.now());
    this.persistLimit = Math.max(1, Math.floor(options.persistLimit ?? DEFAULT_PERSIST_LIMIT));
    this.dedupeWindowMs = Math.max(500, Math.floor(options.dedupeWindowMs ?? DEFAULT_DEDUPE_WINDOW_MS));
    this.maxEntries = Math.max(1, Math.floor(options.maxEntries ?? DEFAULT_MAX_ENTRIES));
    this.state = {
      enabled: this.enabled,
      paused: this.paused,
      maxEntries: this.maxEntries,
      entries: this.entries
    };

    this.loadPersistedState();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  snapshot = (): IssueCollectorState => this.state;

  isEnabled(): boolean {
    return this.enabled;
  }

  setContextSnapshot(next: IssueCollectorContextSnapshot): void {
    this.contextSnapshot = {
      ...this.contextSnapshot,
      ...next
    };
  }

  clear(): void {
    this.entries = [];
    this.flush();
  }

  setPaused(value: boolean): void {
    if (this.paused === value) {
      return;
    }
    this.paused = value;
    this.flush();
  }

  setMaxEntries(value: number): void {
    const normalized = Math.max(1, Math.min(1000, Math.floor(value || DEFAULT_MAX_ENTRIES)));
    if (normalized === this.maxEntries) {
      return;
    }
    this.maxEntries = normalized;
    if (this.entries.length > normalized) {
      this.entries = this.entries.slice(0, normalized);
    }
    this.flush();
  }

  addToast(input: AddToastInput): void {
    this.add({
      source: 'toast',
      level: input.level,
      title: input.title,
      details: input.details,
      stack: undefined,
      featureTag: input.featureTag
    });
  }

  addGraphqlFailure(input: AddGraphqlFailureInput): void {
    const parsed = parseGraphqlFailure(input);
    const durationMs = Math.max(0, Math.round(input.durationMs));
    const graphql: IssueGraphqlPayload = {
      operationName: parsed.operationName,
      variables: redactValue(input.variables),
      endpoint: redactString(input.endpoint),
      errors: parsed.errors,
      status: parsed.status,
      durationMs
    };

    this.add({
      source: 'graphql',
      level: 'error',
      title: `${parsed.operationName} failed`,
      details: parsed.details,
      stack: parsed.stack,
      graphql
    });
  }

  add(input: AddIssueInput): void {
    if (!this.enabled || this.paused) {
      return;
    }

    const timestamp = nowIso(this.now);
    const route = normalizeRoute(this.contextSnapshot.route);
    const userSummary = toUserSummary(this.contextSnapshot);
    const pathname = route.split('?')[0] ?? route;
    const entry: IssueEntry = {
      id: createIssueId(this.now),
      ts: timestamp,
      level: input.level,
      source: input.source,
      title: normalizeTitle(redactString(input.title), input.source),
      details: redactString(input.details ?? input.title),
      stack: input.stack ? redactString(input.stack) : undefined,
      route,
      userSummary,
      rolesSummary: this.contextSnapshot.rolesSummary
        ? redactString(this.contextSnapshot.rolesSummary, 120)
        : undefined,
      featureTag:
        input.featureTag && input.featureTag.trim().length > 0
          ? redactString(input.featureTag, 120)
          : this.contextSnapshot.featureTag && this.contextSnapshot.featureTag.trim().length > 0
            ? this.contextSnapshot.featureTag
            : deriveFeatureTag(pathname),
      buildInfo:
        this.contextSnapshot.buildInfo && this.contextSnapshot.buildInfo.trim().length > 0
          ? redactString(this.contextSnapshot.buildInfo, 120)
          : pickBuildInfo(),
      context: {
        siteId: this.contextSnapshot.siteId ?? undefined,
        market: this.contextSnapshot.market ? redactString(this.contextSnapshot.market, 40) : undefined,
        locale: this.contextSnapshot.locale ? redactString(this.contextSnapshot.locale, 40) : undefined
      },
      graphql: input.graphql
        ? {
            ...input.graphql,
            operationName: redactString(input.graphql.operationName, 120),
            endpoint: redactString(input.graphql.endpoint, 120),
            variables: redactValue(input.graphql.variables),
            errors: input.graphql.errors.map((entry) => ({
              message: redactString(entry.message),
              path: entry.path ? redactString(entry.path) : undefined,
              code: entry.code ? redactString(entry.code) : undefined
            }))
          }
        : undefined,
      count: 1
    };

    this.appendWithDedupe(entry);
    this.flush();
  }

  captureConsole(level: IssueLevel, args: unknown[]): void {
    if (!this.enabled || this.paused) {
      return;
    }
    let stack: string | undefined;
    const parts = args.map((arg) => {
      if (arg instanceof Error) {
        if (!stack && arg.stack) {
          stack = arg.stack;
        }
        return arg.message || arg.name;
      }
      if (typeof arg === 'string') {
        return arg;
      }
      return safeJson(arg);
    });

    const details = parts.join(' ').trim() || (level === 'error' ? 'Console error' : 'Console warning');
    this.add({
      source: 'console',
      level,
      title: details,
      details,
      stack
    });
  }

  captureWindowError(event: ErrorEvent): void {
    const locationText =
      event.filename && Number.isFinite(event.lineno) && Number.isFinite(event.colno)
        ? `${event.filename}:${event.lineno}:${event.colno}`
        : '';
    const message = event.message?.trim() || 'Unhandled runtime error';
    const details = locationText ? `${message} (${locationText})` : message;
    this.add({
      source: 'runtime',
      level: 'error',
      title: message,
      details,
      stack: event.error instanceof Error ? event.error.stack : undefined
    });
  }

  captureUnhandledRejection(event: PromiseRejectionEvent): void {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : formatErrorMessage(reason);
    const details = typeof reason === 'string' ? reason : safeJson(reason);
    this.add({
      source: 'runtime',
      level: 'error',
      title: message || 'Unhandled promise rejection',
      details,
      stack: reason instanceof Error ? reason.stack : undefined
    });
  }

  exportMarkdown(entries: IssueEntry[] = this.entries): string {
    return formatIssuesAsMarkdown(entries);
  }

  exportJson(entries: IssueEntry[] = this.entries): string {
    return formatIssuesAsJson(entries);
  }

  private appendWithDedupe(entry: IssueEntry): void {
    const key = dedupeKeyFor(entry);
    const nowMs = Date.parse(entry.ts);
    let existingIndex = -1;

    for (let index = 0; index < this.entries.length; index += 1) {
      const candidate = this.entries[index];
      if (!candidate) {
        continue;
      }
      const age = nowMs - Date.parse(candidate.ts);
      if (age > this.dedupeWindowMs) {
        break;
      }
      if (dedupeKeyFor(candidate) === key) {
        existingIndex = index;
        break;
      }
    }

    if (existingIndex >= 0) {
      const existing = this.entries[existingIndex];
      if (!existing) {
        return;
      }
      const merged: IssueEntry = {
        ...existing,
        ts: entry.ts,
        count: existing.count + 1,
        details: entry.details || existing.details,
        stack: entry.stack || existing.stack,
        graphql: entry.graphql ?? existing.graphql,
        route: entry.route || existing.route,
        userSummary: entry.userSummary || existing.userSummary,
        featureTag: entry.featureTag || existing.featureTag,
        buildInfo: entry.buildInfo || existing.buildInfo,
        context: entry.context
      };
      this.entries.splice(existingIndex, 1);
      this.entries.unshift(merged);
      return;
    }

    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }
  }

  private flush(): void {
    this.persist();
    this.state = {
      enabled: this.enabled,
      paused: this.paused,
      maxEntries: this.maxEntries,
      entries: [...this.entries]
    };
    this.listeners.forEach((listener) => listener());
  }

  private persist(): void {
    if (!this.storage) {
      return;
    }
    try {
      const payload: PersistedIssueCollectorState = {
        paused: this.paused,
        maxEntries: this.maxEntries,
        entries: this.entries.slice(0, this.persistLimit)
      };
      this.storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore persistence failures.
    }
  }

  private loadPersistedState(): void {
    if (!this.storage) {
      return;
    }
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as PersistedIssueCollectorState;
      const persistedMax =
        typeof parsed.maxEntries === 'number' && Number.isFinite(parsed.maxEntries)
          ? Math.max(1, Math.min(1000, Math.floor(parsed.maxEntries)))
          : this.maxEntries;
      this.maxEntries = persistedMax;
      this.paused = parsed.paused === true;
      const persistedEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
      this.entries = persistedEntries
        .filter((entry): entry is IssueEntry => Boolean(entry && typeof entry === 'object'))
        .slice(0, this.maxEntries)
        .map((entry) => sanitizePersistedEntry(entry, this.now));
      this.state = {
        enabled: this.enabled,
        paused: this.paused,
        maxEntries: this.maxEntries,
        entries: [...this.entries]
      };
    } catch {
      this.storage.removeItem(STORAGE_KEY);
    }
  }
}

function sanitizePersistedEntry(entry: IssueEntry, nowProvider: () => number): IssueEntry {
  return {
    ...entry,
    id: typeof entry.id === 'string' ? entry.id : createIssueId(nowProvider),
    ts:
      typeof entry.ts === 'string' && Number.isFinite(Date.parse(entry.ts))
        ? entry.ts
        : nowIso(nowProvider),
    level: entry.level === 'warn' ? 'warn' : 'error',
    source: isKnownSource(entry.source) ? entry.source : 'runtime',
    title: redactString(entry.title ?? 'Issue'),
    details: redactString(entry.details ?? entry.title ?? 'Issue'),
    stack: entry.stack ? redactString(entry.stack) : undefined,
    route: normalizeRoute(entry.route),
    userSummary: entry.userSummary ? redactString(entry.userSummary, 120) : undefined,
    rolesSummary: entry.rolesSummary ? redactString(entry.rolesSummary, 120) : undefined,
    featureTag: entry.featureTag ? redactString(entry.featureTag, 120) : undefined,
    buildInfo: entry.buildInfo ? redactString(entry.buildInfo, 120) : undefined,
    context: {
      siteId: entry.context?.siteId ?? undefined,
      market: entry.context?.market ? redactString(entry.context.market, 40) : undefined,
      locale: entry.context?.locale ? redactString(entry.context.locale, 40) : undefined
    },
    graphql: entry.graphql
      ? {
          operationName: redactString(entry.graphql.operationName, 120),
          variables: redactValue(entry.graphql.variables),
          endpoint: redactString(entry.graphql.endpoint, 120),
          errors: Array.isArray(entry.graphql.errors)
            ? entry.graphql.errors.map((error) => ({
                message: redactString(error.message ?? 'GraphQL error'),
                path: error.path ? redactString(error.path) : undefined,
                code: error.code ? redactString(error.code) : undefined
              }))
            : [],
          status: typeof entry.graphql.status === 'number' ? entry.graphql.status : undefined,
          durationMs:
            typeof entry.graphql.durationMs === 'number' && Number.isFinite(entry.graphql.durationMs)
              ? Math.max(0, Math.round(entry.graphql.durationMs))
              : 0
        }
      : undefined,
    count:
      typeof entry.count === 'number' && Number.isFinite(entry.count) && entry.count > 0
        ? Math.floor(entry.count)
        : 1
  };
}

function isKnownSource(source: unknown): source is IssueSource {
  return source === 'console' || source === 'toast' || source === 'graphql' || source === 'runtime';
}

function dedupeKeyFor(entry: IssueEntry): string {
  const op = entry.graphql?.operationName ?? '';
  return `${entry.source}|${entry.level}|${entry.title}|${op}|${entry.route}`;
}

function createIssueId(nowProvider: () => number): string {
  const stamp = nowProvider().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `iss_${stamp}_${random}`;
}

export const issueCollector = new IssueCollectorStore();

export function useIssueCollectorState(): IssueCollectorState {
  return useSyncExternalStore(issueCollector.subscribe.bind(issueCollector), issueCollector.snapshot, issueCollector.snapshot);
}

let consoleHooksInstalled = false;
let runtimeHooksInstalled = false;
let originalConsoleError: ((...data: unknown[]) => void) | null = null;
let originalConsoleWarn: ((...data: unknown[]) => void) | null = null;

export function installIssueCollectorGlobalHooks(store: IssueCollectorStore = issueCollector): void {
  if (!store.isEnabled()) {
    return;
  }

  if (!consoleHooksInstalled) {
    originalConsoleError = console.error.bind(console);
    originalConsoleWarn = console.warn.bind(console);
    console.error = (...args: unknown[]) => {
      store.captureConsole('error', args);
      originalConsoleError?.(...args);
    };
    console.warn = (...args: unknown[]) => {
      store.captureConsole('warn', args);
      originalConsoleWarn?.(...args);
    };
    consoleHooksInstalled = true;
  }

  if (!runtimeHooksInstalled && typeof window !== 'undefined') {
    window.addEventListener('error', (event) => store.captureWindowError(event));
    window.addEventListener('unhandledrejection', (event) => store.captureUnhandledRejection(event));
    runtimeHooksInstalled = true;
  }
}
