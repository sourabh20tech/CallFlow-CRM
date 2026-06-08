"use client";

import { useEffect, useState } from "react";
import type { LeadStatusConfig } from "@/types/lead-status-config";

let cached: LeadStatusConfig[] | null = null;

export function useLeadStatuses() {
  const [statuses, setStatuses] = useState<LeadStatusConfig[]>(cached ?? []);
  const [isLoading, setIsLoading] = useState(!cached);

  useEffect(() => {
    if (cached) {
      setStatuses(cached);
      setIsLoading(false);
      return;
    }

    fetch("/api/lead-statuses")
      .then((res) => res.json())
      .then((data) => {
        const list = data.statuses ?? [];
        cached = list;
        setStatuses(list);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return { statuses, isLoading };
}
