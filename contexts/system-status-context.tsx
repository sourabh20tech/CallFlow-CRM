"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/typed-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { subscribeToTable } from "@/lib/db/realtime";
import type { SystemStatus, UpdateCrmStatusInput } from "@/types/system";

interface SystemStatusContextValue {
  status: SystemStatus;
  crmEnabled: boolean;
  isMaintenanceMode: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  setCrmEnabled: (input: UpdateCrmStatusInput) => Promise<SystemStatus>;
}

const defaultStatus: SystemStatus = {
  crmEnabled: true,
  maintenanceTitle: "Scheduled maintenance",
  maintenanceMessage:
    "Our CRM is temporarily unavailable while we perform scheduled maintenance. Please check back soon.",
  updatedAt: null,
};

const SystemStatusContext = createContext<SystemStatusContextValue | null>(null);

async function fetchStatusFromApi(): Promise<SystemStatus> {
  const res = await fetch("/api/system/status", { cache: "no-store" });
  if (!res.ok) return defaultStatus;
  return (await res.json()) as SystemStatus;
}

export function SystemStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SystemStatus>(defaultStatus);
  const [isLoading, setIsLoading] = useState(true);

  const applyStatus = useCallback((next: SystemStatus) => {
    setStatus(next);
  }, []);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      applyStatus(defaultStatus);
      return;
    }
    const next = await fetchStatusFromApi();
    applyStatus(next);
  }, [applyStatus]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      if (!isSupabaseConfigured()) {
        if (!cancelled) {
          applyStatus(defaultStatus);
          setIsLoading(false);
        }
        return;
      }

      try {
        const next = await fetchStatusFromApi();
        if (!cancelled) applyStatus(next);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [applyStatus]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createBrowserSupabaseClient();
    const channel = subscribeToTable(supabase, "system_settings", {
      event: "UPDATE",
      onPayload: () => {
        void refresh();
      },
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  const setCrmEnabled = useCallback(
    async (input: UpdateCrmStatusInput): Promise<SystemStatus> => {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase is required to update CRM status.");
      }

      const res = await fetch("/api/system/crm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to update CRM status");
      }

      const next = (await res.json()) as SystemStatus;
      applyStatus(next);
      return next;
    },
    [applyStatus],
  );

  const value = useMemo<SystemStatusContextValue>(
    () => ({
      status,
      crmEnabled: status.crmEnabled,
      isMaintenanceMode: !status.crmEnabled,
      isLoading,
      refresh,
      setCrmEnabled,
    }),
    [status, isLoading, refresh, setCrmEnabled],
  );

  return (
    <SystemStatusContext.Provider value={value}>{children}</SystemStatusContext.Provider>
  );
}

export function useSystemStatusContext(): SystemStatusContextValue {
  const ctx = useContext(SystemStatusContext);
  if (!ctx) {
    throw new Error("useSystemStatusContext must be used within SystemStatusProvider");
  }
  return ctx;
}
