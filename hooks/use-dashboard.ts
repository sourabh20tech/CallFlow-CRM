"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export function useDashboard(options: UseDashboardOptions = {}) {
  const { refreshInterval } = options;
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    // Prevent duplicate concurrent fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      setError(null);
      const res = await fetch("/api/dashboard/admin", { cache: "no-store" });
      const body = (await res.json()) as AdminDashboardData & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Failed to load dashboard");
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!refreshInterval) return;
    const id = setInterval(() => void refresh(), refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval, refresh]);

  return { data, isLoading, error, refresh };
}
