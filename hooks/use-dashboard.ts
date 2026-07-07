"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cachedFetch, invalidateCache } from "@/lib/cache/data-cache";
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
const CACHE_TTL = 20_000; // 20s — dashboard data stays fresh briefly

async function fetchDashboard(): Promise<AdminDashboardData> {
  const res = await fetch("/api/dashboard/admin", { cache: "no-store" });
  const body = (await res.json()) as AdminDashboardData & { error?: string };
  if (!res.ok) throw new Error(body.error ?? "Failed to load dashboard");
  return body;
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const { refreshInterval } = options;
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
