import { normalizeCrmRole } from "@/lib/auth/crm-role";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/types/auth";

function mapRpcRow(row: Record<string, unknown> | null): Profile | null {
  if (!row || typeof row.id !== "string") {
    return null;
  }

  const role = normalizeCrmRole(row.role) ?? "agent";

  return {
    id: row.id,
    email: typeof row.email === "string" ? row.email : "",
    full_name: typeof row.full_name === "string" ? row.full_name : null,
    role,
    avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
    created_at: typeof row.created_at === "string" ? row.created_at : undefined,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

/**
 * Creates or returns the current user's profile via Postgres RPC (SECURITY DEFINER).
 * Works with the user's session — does not require the service role key.
 */
export async function ensureProfileViaRpc(
  supabase: SupabaseClient,
  preferredRole?: UserRole,
): Promise<Profile | null> {
  const { data, error } = await supabase.rpc("ensure_current_user_profile", {
    requested_role: preferredRole ?? null,
  });

  if (error) {
    if (
      error.message.includes("Could not find the function") ||
      error.message.includes("schema cache")
    ) {
      console.warn(
        "[auth] ensure_current_user_profile RPC missing — run database/migrations/005_profiles_ensure_rpc.sql",
      );
    } else {
      console.error("[auth] ensure_current_user_profile RPC:", error.message);
    }
    return null;
  }

  return mapRpcRow(data as Record<string, unknown> | null);
}
