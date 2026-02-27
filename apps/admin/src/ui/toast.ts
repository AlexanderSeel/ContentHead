import type { ToastMessage } from 'primereact/toast';

export type ToastFeatureTag = string | undefined;

export type ToastEvent = {
  message: ToastMessage;
  featureTag?: string | undefined;
  timestamp: string;
};

type ToastDispatcher = (message: ToastMessage) => void;
type ToastListener = (event: ToastEvent) => void;

let dispatcher: ToastDispatcher | null = null;
const listeners = new Set<ToastListener>();

export function registerToastDispatcher(next: ToastDispatcher | null): void {
  dispatcher = next;
}

export function subscribeToastEvents(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function showToast(message: ToastMessage, featureTag?: string): void {
  dispatcher?.(message);
  const event: ToastEvent = {
    message,
    featureTag,
    timestamp: new Date().toISOString()
  };
  listeners.forEach((listener) => listener(event));
}

export function showError(input: {
  summary: string;
  detail?: string;
  life?: number;
  featureTag?: string;
}): void {
  showToast(
    {
      severity: 'error',
      summary: input.summary,
      detail: input.detail,
      life: input.life
    },
    input.featureTag
  );
}

export function showWarn(input: {
  summary: string;
  detail?: string;
  life?: number;
  featureTag?: string;
}): void {
  showToast(
    {
      severity: 'warn',
      summary: input.summary,
      detail: input.detail,
      life: input.life
    },
    input.featureTag
  );
}

export function showInfo(input: {
  summary: string;
  detail?: string;
  life?: number;
  featureTag?: string;
}): void {
  showToast(
    {
      severity: 'info',
      summary: input.summary,
      detail: input.detail,
      life: input.life
    },
    input.featureTag
  );
}
