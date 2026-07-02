"use client";

import { useCallback, useEffect, useState } from "react";
import type { LeadStatusConfig } from "@/types/lead-status-config";

let cached: LeadStatusConfig[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 120_000; // 2 minutes

export function useLeadStatuses() {
  const [statuses, setStatuses] = useState<LeadStatusConfig[]>(cached ?? []);
  const [isLoading, setIsLoading] = useState(!cached);

  const load = useCallback(async () => {
    if (cached && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      setStatuses(cached);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/lead-statuses");
      const data = await res.json();
      const list = data.statuses ?? [];
      cached = list;
      cacheTimestamp = Date.now();
      setStatuses(list);
    } catch {
      // keep current
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cached && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      setStatuses(cached);
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

  return { statuses, isLoading, invalidate, refresh, setStatuses };
}
