"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cachedFetch, invalidateCache, onCacheUpdate, type CacheOptions } from "@/lib/cache/data-cache";

interface UseCachedFetchOptions<T> extends CacheOptions {
  /** If provided, skip fetching and use this value */
  initialData?: T;
  /** If false, don't auto-fetch on mount */
  enabled?: boolean;
}

interface UseCachedFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Hook for fetching data with intelligent caching.
 * - Deduplicates concurrent requests
 * - Returns cached data instantly on repeat visits
 * - Supports background revalidation
 */
export function useCachedFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: UseCachedFetchOptions<T> = {},
): UseCachedFetchResult<T> {
  const { initialData, enabled = true, ttl, staleWhileRevalidate } = options;
  const [data, setData] = useState<T | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(!initialData && enabled);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    try {
      setError(null);
      const result = await cachedFetch<T>(cacheKey, fetcher, { ttl, staleWhileRevalidate });
      if (mountedRef.current) {
        setData(result);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [cacheKey, fetcher, enabled, ttl, staleWhileRevalidate]);

  // Fetch on mount
  useEffect(() => {
    mountedRef.current = true;
    if (initialData || !enabled) {
      setIsLoading(false);
      return;
    }
    void fetchData();
    return () => { mountedRef.current = false; };
  }, [fetchData, initialData, enabled]);

  // Listen for cache updates (from other components or background refresh)
  useEffect(() => {
    return onCacheUpdate(cacheKey, () => {
      // Re-read from cache
      void fetchData();
    });
  }, [cacheKey, fetchData]);

  const refresh = useCallback(async () => {
    invalidateCache(cacheKey);
    setIsLoading(true);
    await fetchData();
  }, [cacheKey, fetchData]);

  const invalidate = useCallback(() => {
    invalidateCache(cacheKey);
  }, [cacheKey]);

  return { data, isLoading, error, refresh, invalidate };
}
