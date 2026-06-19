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

export function useLeadSources() {
  const [sources, setSources] = useState<LeadSource[]>(cached ?? FALLBACK);
  const [isLoading, setIsLoading] = useState(!cached);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/lead-sources");
      const data = await res.json();
      const list = data.sources ?? FALLBACK;
      cached = list;
      setSources(list);
    } catch {
      // keep fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cached) {
      setSources(cached);
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

  return { sources, isLoading, invalidate, setSources, refresh };
}
