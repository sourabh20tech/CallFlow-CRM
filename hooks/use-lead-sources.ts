"use client";

import { useEffect, useState } from "react";

interface LeadSource {
  id: string;
  label: string;
  value: string;
}

const FALLBACK: LeadSource[] = [
  { id: "src-1", label: "Standard", value: "standard" },
  { id: "src-2", label: "Premium", value: "premium" },
  { id: "src-3", label: "Enterprise", value: "enterprise" },
];

let cached: LeadSource[] | null = null;

export function useLeadSources() {
  const [sources, setSources] = useState<LeadSource[]>(cached ?? FALLBACK);
  const [isLoading, setIsLoading] = useState(!cached);

  useEffect(() => {
    if (cached) {
      setSources(cached);
      setIsLoading(false);
      return;
    }

    fetch("/api/lead-sources")
      .then((res) => res.json())
      .then((data) => {
        const list = data.sources ?? FALLBACK;
        cached = list;
        setSources(list);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const invalidate = () => { cached = null; };

  return { sources, isLoading, invalidate, setSources };
}
