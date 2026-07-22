"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cachedFetch, getCached, invalidateCache } from "@/lib/cache/data-cache";
import type {
  AdminDashboardStats,
  AgentPerformanceDataPoint,
  DailyCallsDataPoint,
  DashboardActivity,
  DashboardLeadRow,
  LeadConversionDataPoint,
} from "@/types/dashboard";

interface AdminDashboardData {
  stats: AdminDashboardStats;
  dailyCalls: DailyCallsDataPoint[];
  leadConversion: LeadConversionDataPoint[];
  agentPerformance: AgentPerformanceDataPoint[];
  activities: DashboardActivity[];
  leads: DashboardLeadRow[];
  updatedAt: string;
}

interface UseDashboardOptions {
  /** Poll interval in ms — set for real-time refresh (e.g. 30000) */
  refreshInterval?: number;
}

const CACHE_KEY = "dashboard:admin";
const CACHE_TTL = 60_000; // 60s — dashboard data cached for 1 minute

async function fetchDashboard(): Promise<AdminDashboardData> {
  const res = await fetch("/api/dashboard/admin");
  const body = (await res.json()) as AdminDashboardData & { error?: string };
  if (!res.ok) throw new Error(body.error ?? "Failed to load dashboard");
  return body;
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const { refreshInterval } = options;
  // Start with cached data if available — NO skeleton flash on revisit
  const cachedData = getCached<AdminDashboardData>(CACHE_KEY);
  const [data, setData] = useState<AdminDashboardData | null>(cachedData);
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      setError(null);
      invalidateCache(CACHE_KEY);
      const result = await cachedFetch(CACHE_KEY, fetchDashboard, { ttl: CACHE_TTL });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await cachedFetch(CACHE_KEY, fetchDashboard, {
          ttl: CACHE_TTL,
          staleWhileRevalidate: true,
        });
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!refreshInterval) return;
    const id = setInterval(() => void refresh(), refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval, refresh]);

  return { data, isLoading, error, refresh };
}
