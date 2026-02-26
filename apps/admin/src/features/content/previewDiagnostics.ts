import { useSyncExternalStore } from 'react';

const PREVIEW_DIAGNOSTICS_LIMIT = 20;
const REDACT_KEYS = ['token', 'authorization', 'secret', 'password', 'apikey', 'api_key', 'auth'];

type Listener = () => void;

export type PreviewDiagnosticsDirection = 'from_preview' | 'to_preview' | 'save';

export type PreviewDiagnosticsEntry = {
  timestamp: string;
  direction: PreviewDiagnosticsDirection;
  event: string;
  payload: unknown;
  ok?: boolean;
};

let buffer: PreviewDiagnosticsEntry[] = [];
const listeners = new Set<Listener>();

function redact(value: unknown, keyHint = ''): unknown {
  const key = keyHint.toLowerCase();
  if (REDACT_KEYS.some((entry) => key.includes(entry))) {
    return '[REDACTED]';
  }
  if (Array.isArray(value)) {
    return value.map((entry) => redact(entry));
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [nestedKey, nestedValue] of Object.entries(record)) {
      output[nestedKey] = redact(nestedValue, nestedKey);
    }
    return output;
  }
  return value;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): PreviewDiagnosticsEntry[] {
  return buffer;
}

export function usePreviewDiagnostics(): PreviewDiagnosticsEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function recordPreviewDiagnostics(input: {
  direction: PreviewDiagnosticsDirection;
  event: string;
  payload?: unknown;
  ok?: boolean;
}) {
  const entry: PreviewDiagnosticsEntry = {
    timestamp: new Date().toISOString(),
    direction: input.direction,
    event: input.event,
    payload: redact(input.payload ?? null),
    ...(typeof input.ok === 'boolean' ? { ok: input.ok } : {})
  };
  buffer = [entry, ...buffer].slice(0, PREVIEW_DIAGNOSTICS_LIMIT);
  listeners.forEach((listener) => listener());
}
