import { installIssueCollectorGlobalHooks, issueCollector } from './issueCollector';
import { subscribeToastEvents } from '../ui/toast';

let initialized = false;

export function initializeIssueCollector(): void {
  if (initialized || !issueCollector.isEnabled()) {
    return;
  }

  installIssueCollectorGlobalHooks(issueCollector);
  subscribeToastEvents((event) => {
    const severity = String(event.message.severity ?? '').toLowerCase();
    if (severity !== 'error' && severity !== 'warn' && severity !== 'warning') {
      return;
    }

    issueCollector.addToast({
      level: severity === 'error' ? 'error' : 'warn',
      title: toText(event.message.summary, 'Toast'),
      details: event.message.detail == null ? undefined : toText(event.message.detail),
      featureTag: event.featureTag
    });
  });

  initialized = true;
}

function toText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value == null) {
    return fallback;
  }
  return String(value);
}
