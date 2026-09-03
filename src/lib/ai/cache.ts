import "server-only";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_CACHE_ENTRIES = 200;

const cacheStore = new Map<string, CacheEntry<unknown>>();

export function getCachedAiResponse<T>(key: string): T | undefined {
  const entry = cacheStore.get(key);
  if (!entry) return undefined;

  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return undefined;
  }

  return entry.value as T;
}

export function setCachedAiResponse<T>(
  key: string,
  value: T,
  ttlMs = DEFAULT_TTL_MS,
): void {
  // Evict oldest entry if capacity reached
  if (cacheStore.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cacheStore.keys().next().value;
    if (oldestKey) cacheStore.delete(oldestKey);
  }

  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function _resetAiCache(): void {
  cacheStore.clear();
}
