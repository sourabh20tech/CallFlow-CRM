import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthUserLike, ProvisionProfileOptions } from "@/lib/auth/auth-user";
import { ensureProfileForAuthUser } from "@/lib/auth/ensure-profile.server";
import { ensureProfileViaRpc } from "@/lib/auth/ensure-profile-rpc";
import { fetchProfile, profileToUser } from "@/lib/auth/profile";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import type { Profile, User } from "@/types/auth";

export type { AuthUserLike, ProvisionProfileOptions };

/**
 * Ensures a profiles row exists: existing row → RPC (session) → service role fallback.
 */
export async function provisionProfileForAuthUser(
  supabase: SupabaseClient,
  authUser: AuthUserLike,
  options?: ProvisionProfileOptions,
): Promise<Profile | null> {
  const existing = await fetchProfile(supabase, authUser.id);
  if (existing) {
    return existing;
  }

  const viaRpc = await ensureProfileViaRpc(supabase, options?.preferredRole);
  if (viaRpc) {
    return viaRpc;
  }

  if (isAdminClientConfigured()) {
    return ensureProfileForAuthUser(authUser, options);
  }

  return null;
}

export async function provisionCrmUser(
  supabase: SupabaseClient,
  authUser: AuthUserLike,
  options?: ProvisionProfileOptions,
): Promise<User | null> {
  const profile = await provisionProfileForAuthUser(supabase, authUser, options);
  return profile ? profileToUser(profile) : null;
}
