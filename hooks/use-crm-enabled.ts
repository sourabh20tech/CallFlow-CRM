"use client";

import { useSystemStatus } from "@/hooks/use-system-status";

/**
 * Lightweight hook for CRM availability checks in forms and guards.
 */
export function useCrmEnabled() {
  const { crmEnabled, isMaintenanceMode, isLoading, status } = useSystemStatus();

  return {
    crmEnabled,
    isMaintenanceMode,
    isLoading,
    maintenanceTitle: status.maintenanceTitle,
    maintenanceMessage: status.maintenanceMessage,
  };
}
