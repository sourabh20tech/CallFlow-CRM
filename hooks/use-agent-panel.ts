"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cachedFetch, invalidateCache } from "@/lib/cache/data-cache";
import type { AgentPanelBundle } from "@/types/agent-panel";

interface UseAgentPanelOptions {
  initialData?: AgentPanelBundle;
}

const CACHE_KEY = "agent:panel";
const CACHE_TTL = 15_000; // 15s

async function fetchPanel(): Promise<AgentPanelBundle> {
  const res = await fetch("/api/agent/panel");
  const json = (await res.json()) as AgentPanelBundle & { error?: string };
  if (!res.ok) throw new Error(json.error ?? "Failed to load workspace");
  return json;
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
      invalidateCache(CACHE_KEY);
      const result = await cachedFetch(CACHE_KEY, fetchPanel, { ttl: CACHE_TTL });
      setData(result);
      return result;
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
    let cancelled = false;
    (async () => {
      try {
        const result = await cachedFetch(CACHE_KEY, fetchPanel, {
          ttl: CACHE_TTL,
          staleWhileRevalidate: true,
        });
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load workspace");
        }
      } finally {
        if (!cancelled) setIsRefreshing(false);
      }
    })();
    return () => { cancelled = true; };
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
