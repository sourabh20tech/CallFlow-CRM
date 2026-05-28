import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthUserLike } from "@/lib/auth/auth-user";
import { ensureProfileViaRpc } from "@/lib/auth/ensure-profile-rpc";
import { profileToUser, resolveUserFromAuth } from "@/lib/auth/profile";
import type { User, UserRole } from "@/types/auth";

export interface ResolveSessionUserOptions {
  preferredRole?: UserRole;
  /** Call ensure_current_user_profile RPC when profile row is missing */
  allowProvision?: boolean;
}

/**
 * Resolves CRM user from Supabase session: profiles table first, then metadata, then RPC provision.
 */
export async function resolveSessionUser(
  supabase: SupabaseClient,
  authUser: AuthUserLike,
  options?: ResolveSessionUserOptions,
): Promise<User | null> {
  const allowProvision = options?.allowProvision !== false;

  let user = await resolveUserFromAuth(supabase, authUser);
  if (user) {
    return user;
  }

  if (!allowProvision) {
    return null;
  }

  const profile = await ensureProfileViaRpc(supabase, options?.preferredRole);
  if (profile) {
    return profileToUser(profile);
  }

  return resolveUserFromAuth(supabase, authUser);
}
