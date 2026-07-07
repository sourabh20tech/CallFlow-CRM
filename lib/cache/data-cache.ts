"use client";

/**
 * Smart client-side data cache with TTL, background refresh, and invalidation.
 * Prevents duplicate API calls across components and page navigations.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>; // In-flight request dedup
}

const cache = new Map<string, CacheEntry<any>>();
const listeners = new Map<string, Set<() => void>>();

const DEFAULT_TTL = 60_000; // 1 minute

export interface CacheOptions {
  /** Time-to-live in ms. Default: 60s */
  ttl?: number;
  /** If true, return stale data immediately and refresh in background */
  staleWhileRevalidate?: boolean;
}

/**
 * Fetch data with intelligent caching.
 * - Deduplicates concurrent requests for the same key
 * - Returns cached data if within TTL
 * - Supports stale-while-revalidate pattern
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> {
  const { ttl = DEFAULT_TTL, staleWhileRevalidate = true } = options;
  const entry = cache.get(key);
  const now = Date.now();

  // If we have cached data within TTL, return it
  if (entry && now - entry.timestamp < ttl) {
    return entry.data;
  }

  // If stale data exists and staleWhileRevalidate is true, return stale + refresh background
  if (entry && staleWhileRevalidate) {
    // Trigger background refresh without blocking
    void refreshInBackground(key, fetcher);
    return entry.data;
  }

  // No cache or expired without SWR — fetch fresh
  return fetchAndCache(key, fetcher);
}

/**
 * Get cached data synchronously (returns null if not cached)
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  return entry ? entry.data : null;
}

/**
 * Prefetch data in the background without blocking
 */
export function prefetch<T>(key: string, fetcher: () => Promise<T>, ttl = DEFAULT_TTL): void {
  const entry = cache.get(key);
  const now = Date.now();

  // Skip if cache is fresh
  if (entry && now - entry.timestamp < ttl) return;

  // Skip if already fetching
  if (entry?.promise) return;

  void fetchAndCache(key, fetcher);
}

/**
 * Invalidate a specific cache key or all keys matching a prefix
 */
export function invalidateCache(keyOrPrefix: string): void {
  if (cache.has(keyOrPrefix)) {
    cache.delete(keyOrPrefix);
    notifyListeners(keyOrPrefix);
  } else {
    // Prefix invalidation
    for (const key of cache.keys()) {
      if (key.startsWith(keyOrPrefix)) {
        cache.delete(key);
        notifyListeners(key);
      }
    }
  }
}

/**
 * Subscribe to cache changes for a key
 */
export function onCacheUpdate(key: string, listener: () => void): () => void {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(listener);
  return () => {
    listeners.get(key)?.delete(listener);
  };
}

/**
 * Set cache entry directly (useful for optimistic updates)
 */
export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
  notifyListeners(key);
}

// ─── Internal ────────────────────────────────────────────────────────────────

async function fetchAndCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  // Deduplicate: if already fetching for this key, return same promise
  const existing = cache.get(key);
  if (existing?.promise) {
    return existing.promise;
  }

  const promise = fetcher();

  // Store the in-flight promise for dedup
  cache.set(key, { data: existing?.data, timestamp: existing?.timestamp ?? 0, promise });

  try {
    const data = await promise;
    cache.set(key, { data, timestamp: Date.now() });
    notifyListeners(key);
    return data;
  } catch (error) {
    // On error, keep stale data if available
    if (existing?.data) {
      cache.set(key, { data: existing.data, timestamp: existing.timestamp });
    } else {
      cache.delete(key);
    }
    throw error;
  }
}

async function refreshInBackground<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
  const existing = cache.get(key);
  if (existing?.promise) return; // Already refreshing

  try {
    await fetchAndCache(key, fetcher);
  } catch {
    // Silent — stale data is already returned
  }
}

function notifyListeners(key: string): void {
  const set = listeners.get(key);
  if (set) {
    for (const listener of set) {
      listener();
    }
  }
}
