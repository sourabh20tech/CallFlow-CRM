import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthUserLike } from "@/lib/auth/auth-user";
import {
  normalizeCrmRole,
  resolveCrmRole,
  roleFromAuthMetadata,
} from "@/lib/auth/crm-role";
import { ensureProfileViaRpc } from "@/lib/auth/ensure-profile-rpc";
import { fetchProfile } from "@/lib/auth/profile";
import type { UserRole } from "@/types/auth";

/**
 * Resolves CRM role for an authenticated Supabase user.
 * Falls back to SECURITY DEFINER RPCs when RLS blocks direct profile reads.
 */
export async function resolveAuthenticatedUserRole(
  supabase: SupabaseClient,
  authUser: AuthUserLike,
): Promise<UserRole | null> {
  const profile = await fetchProfile(supabase, authUser.id);
  const fromProfile = resolveCrmRole(profile, authUser);
  if (fromProfile) {
    return fromProfile;
  }

  const viaRpc = await ensureProfileViaRpc(supabase);
  const fromRpc = viaRpc ? normalizeCrmRole(viaRpc.role) : null;
  if (fromRpc) {
    return fromRpc;
  }

  const fromMetadata = roleFromAuthMetadata(
    authUser.user_metadata,
    authUser.app_metadata,
  );
  if (fromMetadata) {
    return fromMetadata;
  }

  try {
    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
    if (!adminError && isAdmin === true) {
      return "admin";
    }

    const { data: isAgent, error: agentError } = await supabase.rpc("is_agent");
    if (!agentError && isAgent === true) {
      return "agent";
    }
  } catch {
    /* RPC may be unavailable before migrations are applied */
  }

  return null;
}
