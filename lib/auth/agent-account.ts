import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types/auth";

export const INACTIVE_AGENT_LOGIN_MESSAGE =
  "This agent account is inactive. Contact your administrator to reactivate it.";

export interface AgentAccountStatus {
  exists: boolean;
  isActive: boolean;
}

/** Reads `agents.is_active` for the auth profile (RLS: agents may read own row). */
export async function fetchAgentAccountStatus(
  supabase: SupabaseClient,
  profileId: string,
): Promise<AgentAccountStatus> {
  const { data, error } = await supabase
    .from("agents")
    .select("is_active")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !data) {
    return { exists: false, isActive: true };
  }

  return { exists: true, isActive: data.is_active !== false };
}

export async function assertAgentCanAuthenticate(
  supabase: SupabaseClient,
  profileId: string,
  role: UserRole,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (role !== "agent") {
    return { ok: true };
  }

  const { exists, isActive } = await fetchAgentAccountStatus(supabase, profileId);
  if (exists && !isActive) {
    return { ok: false, message: INACTIVE_AGENT_LOGIN_MESSAGE };
  }

  return { ok: true };
}
