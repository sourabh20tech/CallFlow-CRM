import { DEMO_CRM_STORAGE_KEY } from "@/lib/system/constants";
import type { SystemStatus } from "@/types/system";

const DEFAULT_DEMO_STATUS: SystemStatus = {
  crmEnabled: true,
  maintenanceTitle: "Scheduled maintenance",
  maintenanceMessage:
    "Our CRM is temporarily unavailable while we perform scheduled maintenance. Please check back soon.",
  updatedAt: null,
};

export function loadDemoSystemStatus(): SystemStatus {
  if (typeof window === "undefined") return DEFAULT_DEMO_STATUS;
  try {
    const raw = localStorage.getItem(DEMO_CRM_STORAGE_KEY);
    if (!raw) return DEFAULT_DEMO_STATUS;
    const parsed = JSON.parse(raw) as Partial<SystemStatus>;
    return {
      ...DEFAULT_DEMO_STATUS,
      ...parsed,
      crmEnabled: parsed.crmEnabled ?? true,
    };
  } catch {
    return DEFAULT_DEMO_STATUS;
  }
}

export function saveDemoSystemStatus(status: SystemStatus): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_CRM_STORAGE_KEY, JSON.stringify(status));
}
