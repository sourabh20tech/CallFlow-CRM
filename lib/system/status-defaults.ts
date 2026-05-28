import type { SystemStatus } from "@/types/system";

export const DEFAULT_MAINTENANCE_TITLE = "Scheduled maintenance";
export const DEFAULT_MAINTENANCE_MESSAGE =
  "Our CRM is temporarily unavailable while we perform scheduled maintenance. Please check back soon.";

export const DEFAULT_SYSTEM_STATUS: SystemStatus = {
  crmEnabled: true,
  maintenanceTitle: DEFAULT_MAINTENANCE_TITLE,
  maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE,
  updatedAt: null,
};

type SystemSettingsLike = {
  crm_enabled?: boolean | null;
  maintenance_mode?: boolean | null;
  maintenance_title?: string | null;
  maintenance_message?: string | null;
  updated_at?: string | null;
};

export function mapSystemSettingsToStatus(
  row: SystemSettingsLike | null | undefined,
): SystemStatus {
  if (!row) return { ...DEFAULT_SYSTEM_STATUS };

  const crmEnabled =
    typeof row.crm_enabled === "boolean"
      ? row.crm_enabled
      : typeof row.maintenance_mode === "boolean"
        ? !row.maintenance_mode
        : true;

  return {
    crmEnabled,
    maintenanceTitle: row.maintenance_title?.trim() || DEFAULT_MAINTENANCE_TITLE,
    maintenanceMessage: row.maintenance_message?.trim() || DEFAULT_MAINTENANCE_MESSAGE,
    updatedAt: row.updated_at ?? null,
  };
}
