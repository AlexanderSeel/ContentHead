import { describe, expect, it } from 'vitest';

import { IssueCollectorStore } from './issueCollector';

class MemoryStorage {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe('IssueCollectorStore', () => {
  it('deduplicates repeated events within the window', () => {
    const storage = new MemoryStorage();
    let now = 1_700_000_000_000;
    const store = new IssueCollectorStore({
      enabled: true,
      storage,
      now: () => now,
      dedupeWindowMs: 5_000
    });

    store.setContextSnapshot({ route: '/content/pages?draft=1' });
    store.add({ source: 'console', level: 'error', title: 'Boom', details: 'Boom happened' });

    now += 1_000;
    store.add({ source: 'console', level: 'error', title: 'Boom', details: 'Boom happened' });

    const state = store.snapshot();
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0]?.count).toBe(2);

    now += 6_000;
    store.add({ source: 'console', level: 'error', title: 'Boom', details: 'Boom happened' });

    expect(store.snapshot().entries).toHaveLength(2);
    expect(store.snapshot().entries[0]?.count).toBe(1);
  });

  it('enforces ring buffer max entries', () => {
    const store = new IssueCollectorStore({
      enabled: true,
      storage: new MemoryStorage(),
      maxEntries: 3
    });
    store.setContextSnapshot({ route: '/dev/diagnostics' });

    store.add({ source: 'runtime', level: 'error', title: 'one' });
    store.add({ source: 'runtime', level: 'error', title: 'two' });
    store.add({ source: 'runtime', level: 'error', title: 'three' });
    store.add({ source: 'runtime', level: 'error', title: 'four' });

    const entries = store.snapshot().entries;
    expect(entries).toHaveLength(3);
    expect(entries.map((entry) => entry.title)).toEqual(['four', 'three', 'two']);
  });

  it('persists and restores recent entries', () => {
    const storage = new MemoryStorage();
    const storeA = new IssueCollectorStore({
      enabled: true,
      storage,
      persistLimit: 2,
      maxEntries: 5
    });
    storeA.setContextSnapshot({ route: '/content/routes' });

    storeA.add({ source: 'toast', level: 'warn', title: 'A' });
    storeA.add({ source: 'toast', level: 'warn', title: 'B' });
    storeA.add({ source: 'toast', level: 'warn', title: 'C' });

    const storeB = new IssueCollectorStore({
      enabled: true,
      storage,
      maxEntries: 5
    });

    expect(storeB.snapshot().entries).toHaveLength(2);
    expect(storeB.snapshot().entries.map((entry) => entry.title)).toEqual(['C', 'B']);
  });

  it('captures graphql failures with redacted variables', () => {
    const store = new IssueCollectorStore({
      enabled: true,
      storage: new MemoryStorage()
    });
    store.setContextSnapshot({ route: '/security/users', siteId: 1, market: 'US', locale: 'en-US' });

    store.addGraphqlFailure({
      operationName: 'ListInternalUsers',
      variables: {
        password: 'secret-password',
        nested: { clientSecret: 'super-secret' }
      },
      endpoint: 'http://localhost:4000/graphql',
      durationMs: 38,
      error: {
        response: {
          status: 403,
          errors: [{ message: 'Forbidden', path: ['listInternalUsers'], extensions: { code: 'FORBIDDEN' } }]
        }
      }
    });

    const entry = store.snapshot().entries[0];
    expect(entry?.source).toBe('graphql');
    expect(entry?.graphql?.operationName).toBe('ListInternalUsers');
    expect(entry?.graphql?.status).toBe(403);
    expect(entry?.graphql?.variables).toEqual({
      password: '[REDACTED]',
      nested: { clientSecret: '[REDACTED]' }
    });
  });
});
