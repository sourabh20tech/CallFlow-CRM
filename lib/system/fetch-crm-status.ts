import type { SupabaseClient } from "@supabase/supabase-js";
import { SYSTEM_SETTINGS_KEY } from "@/lib/system/constants";
import { DEFAULT_SYSTEM_STATUS, mapSystemSettingsToStatus } from "@/lib/system/status-defaults";
import type { SystemStatus } from "@/types/system";
import type { Database } from "@/types/database";

type SettingsClient = SupabaseClient<Database>;

export async function fetchCrmSystemStatus(
  supabase: SettingsClient,
): Promise<SystemStatus> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .eq("setting_key", SYSTEM_SETTINGS_KEY)
    .limit(1)
    .maybeSingle();

  if (!error && data) {
    return mapSystemSettingsToStatus(data);
  }

  // Backward-compatible fallback for older schemas without setting_key.
  const { data: fallback, error: fallbackError } = await supabase
    .from("system_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallbackError || !fallback) {
    return DEFAULT_SYSTEM_STATUS;
  }
  return mapSystemSettingsToStatus(fallback);
}
