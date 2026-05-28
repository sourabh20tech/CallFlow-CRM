/** Stable logical key for singleton settings row (non-UUID safe). */
export const SYSTEM_SETTINGS_KEY = "global";

export const MAINTENANCE_PATH = "/maintenance";

/** Dashboard routes admins may use while CRM is in maintenance mode */
export const CRM_OFF_ADMIN_ALLOWED_ROUTES = [
  "/dashboard",
  "/dashboard/settings",
] as const;

export const DEMO_CRM_STORAGE_KEY = "callcenter_crm_system_status";
