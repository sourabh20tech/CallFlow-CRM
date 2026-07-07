"use client";

import { useCallback, useEffect, useState } from "react";
import { cachedFetch, invalidateCache } from "@/lib/cache/data-cache";
import type { LeadStatusConfig } from "@/types/lead-status-config";

const CACHE_KEY = "ref:lead-statuses";
const CACHE_TTL = 180_000; // 3 minutes — statuses rarely change

async function fetchStatuses(): Promise<LeadStatusConfig[]> {
  const res = await fetch("/api/lead-statuses");
  const data = await res.json();
  return data.statuses ?? [];
}

export function useLeadStatuses() {
  const [statuses, setStatuses] = useState<LeadStatusConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await cachedFetch(CACHE_KEY, fetchStatuses, {
        ttl: CACHE_TTL,
        staleWhileRevalidate: true,
      });
      setStatuses(result);
    } catch {
      // keep current
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

  return { statuses, isLoading, invalidate, refresh, setStatuses };
}
