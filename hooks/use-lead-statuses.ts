"use client";

import { useCallback, useEffect, useState } from "react";
import type { LeadStatusConfig } from "@/types/lead-status-config";

let cached: LeadStatusConfig[] | null = null;

export function useLeadStatuses() {
  const [statuses, setStatuses] = useState<LeadStatusConfig[]>(cached ?? []);
  const [isLoading, setIsLoading] = useState(!cached);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/lead-statuses");
      const data = await res.json();
      const list = data.statuses ?? [];
      cached = list;
      setStatuses(list);
    } catch {
      // keep current
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cached) {
      setStatuses(cached);
      setIsLoading(false);
      return;
    }
    void load();
  }, [load]);

  const invalidate = useCallback(() => {
    cached = null;
  }, []);

  const refresh = useCallback(async () => {
    cached = null;
    await load();
  }, [load]);

  return { statuses, isLoading, invalidate, refresh, setStatuses };
}
