"use client";

import { useCallback, useEffect, useState } from "react";
import type { AgentPanelBundle } from "@/types/agent-panel";

interface UseAgentPanelOptions {
  initialData?: AgentPanelBundle;
}

export function useAgentPanel(options: UseAgentPanelOptions = {}) {
  const { initialData } = options;
  const [data, setData] = useState<AgentPanelBundle | null>(initialData ?? null);
  const [isRefreshing, setIsRefreshing] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<AgentPanelBundle | null> => {
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
    }
  }, []);

  const patchData = useCallback((updater: (current: AgentPanelBundle) => AgentPanelBundle) => {
    setData((current) => (current ? updater(current) : current));
  }, []);

  useEffect(() => {
    if (initialData) return;

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/agent/panel");
        const json = (await res.json()) as AgentPanelBundle & { error?: string };
        if (cancelled) return;
        if (!res.ok) throw new Error(json.error ?? "Failed to load workspace");
        setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load workspace");
        }
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [initialData]);

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
