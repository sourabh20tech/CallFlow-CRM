"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentPanelBundle } from "@/types/agent-panel";

interface UseAgentPanelOptions {
  initialData?: AgentPanelBundle;
}

export function useAgentPanel(options: UseAgentPanelOptions = {}) {
  const { initialData } = options;
  const [data, setData] = useState<AgentPanelBundle | null>(initialData ?? null);
  const [isRefreshing, setIsRefreshing] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const refresh = useCallback(async (): Promise<AgentPanelBundle | null> => {
    if (fetchingRef.current) return data;
    fetchingRef.current = true;
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/panel");
      const json = (await res.json()) as AgentPanelBundle & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load workspace");
      setData(json);
      return json;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load workspace";
      setError(message);
      return null;
    } finally {
      setIsRefreshing(false);
      fetchingRef.current = false;
    }
  }, [data]);

  const patchData = useCallback((updater: (current: AgentPanelBundle) => AgentPanelBundle) => {
    setData((current) => (current ? updater(current) : current));
  }, []);

  useEffect(() => {
    if (initialData) return;
    void refresh();
  }, [initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = !data && isRefreshing;

  return {
    data,
    setData,
    patchData,
    refresh,
    isRefreshing,
    isLoading,
    error,
  };
}
