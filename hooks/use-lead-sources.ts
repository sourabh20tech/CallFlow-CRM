"use client";

import { useCallback, useEffect, useState } from "react";
import { cachedFetch, invalidateCache } from "@/lib/cache/data-cache";

export interface LeadSource {
  id: string;
  label: string;
  value: string;
  isSystem?: boolean;
}

const FALLBACK: LeadSource[] = [
  { id: "src-1", label: "Standard", value: "standard", isSystem: true },
  { id: "src-2", label: "Premium", value: "premium", isSystem: true },
];

const CACHE_KEY = "ref:lead-sources";
const CACHE_TTL = 180_000; // 3 minutes — sources rarely change

async function fetchSources(): Promise<LeadSource[]> {
  const res = await fetch("/api/lead-sources");
  const data = await res.json();
  return data.sources ?? FALLBACK;
}

export function useLeadSources() {
  const [sources, setSources] = useState<LeadSource[]>(FALLBACK);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await cachedFetch(CACHE_KEY, fetchSources, {
        ttl: CACHE_TTL,
        staleWhileRevalidate: true,
      });
      setSources(result);
    } catch {
      // keep fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const invalidate = useCallback(() => {
    invalidateCache(CACHE_KEY);
  }, []);

  const refresh = useCallback(async () => {
    invalidateCache(CACHE_KEY);
    setIsLoading(true);
    await load();
  }, [load]);

  return { sources, isLoading, invalidate, setSources, refresh };
}
