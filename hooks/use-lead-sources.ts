"use client";

import { useCallback, useEffect, useState } from "react";

export interface LeadSource {
  id: string;
  label: string;
  value: string;
  isSystem?: boolean;
}

const FALLBACK: LeadSource[] = [
  { id: "src-1", label: "Standard", value: "standard", isSystem: true },
  { id: "src-2", label: "Premium", value: "premium", isSystem: true },
  { id: "src-3", label: "Enterprise", value: "enterprise", isSystem: true },
];

let cached: LeadSource[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 120_000; // 2 minutes

export function useLeadSources() {
  const [sources, setSources] = useState<LeadSource[]>(cached ?? FALLBACK);
  const [isLoading, setIsLoading] = useState(!cached);

  const load = useCallback(async () => {
    // If cache is fresh, skip fetch
    if (cached && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      setSources(cached);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/lead-sources");
      const data = await res.json();
      const list = data.sources ?? FALLBACK;
      cached = list;
      cacheTimestamp = Date.now();
      setSources(list);
    } catch {
      // keep fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cached && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      setSources(cached);
      setIsLoading(false);
      return;
    }
    void load();
  }, [load]);

  const invalidate = useCallback(() => {
    cached = null;
    cacheTimestamp = 0;
  }, []);

  const refresh = useCallback(async () => {
    cached = null;
    cacheTimestamp = 0;
    await load();
  }, [load]);

  return { sources, isLoading, invalidate, setSources, refresh };
}
