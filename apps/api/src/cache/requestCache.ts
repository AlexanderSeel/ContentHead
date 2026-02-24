export type CacheKey = string;

type Entry<T> = {
  expiresAt: number;
  value: T;
};

class RequestCache {
  private readonly store = new Map<CacheKey, Entry<unknown>>();

  getOrSet<T>(key: CacheKey, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const existing = this.store.get(key) as Entry<T> | undefined;
    if (existing && existing.expiresAt > now) {
      return Promise.resolve(existing.value);
    }

    return loader().then((value) => {
      this.store.set(key, { value, expiresAt: now + ttlMs });
      return value;
    });
  }

  invalidate(prefix?: string): void {
    if (!prefix) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}

export const requestCache = new RequestCache();

export function cacheKey(scope: string, parts: Array<string | number | boolean | null | undefined>): CacheKey {
  return `${scope}:${parts.map((part) => String(part ?? '')).join('|')}`;
}
