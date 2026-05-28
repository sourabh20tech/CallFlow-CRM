import "server-only";

import type { AuthUserLike, ProvisionProfileOptions } from "@/lib/auth/auth-user";
import { createAdminSupabaseClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import type { Profile, UserRole } from "@/types/auth";

export type { AuthUserLike } from "@/lib/auth/auth-user";

function parseUserRole(value: unknown, fallback: UserRole = "agent"): UserRole {
  return value === "admin" ? "admin" : fallback;
}

/**
 * Ensures a public.profiles row exists for the auth user (service role).
 * Required when users were created in the Auth dashboard without the DB trigger.
 */
export async function ensureProfileForAuthUser(
  authUser: AuthUserLike,
  options?: ProvisionProfileOptions,
): Promise<Profile | null> {
  if (!isAdminClientConfigured()) {
    return null;
  }

  const admin = createAdminSupabaseClient();

  const { data: existing, error: fetchError } = await admin
    .from("profiles")
    .select("id, email, full_name, role, avatar_url, created_at, updated_at")
    .eq("id", authUser.id)
    .maybeSingle();

  if (fetchError) {
    console.error("[auth] ensureProfile fetch:", fetchError.message);
  }

  if (existing) {
    return existing as Profile;
  }

  const email = authUser.email?.trim() ?? "";
  const fullName =
    (typeof authUser.user_metadata?.full_name === "string"
      ? authUser.user_metadata.full_name
      : null) ??
    email.split("@")[0] ??
    "User";

  const role = parseUserRole(
    options?.preferredRole ??
      authUser.user_metadata?.role ??
      authUser.app_metadata?.role ??
      authUser.user_metadata?.user_role,
  );

  const { data: inserted, error: insertError } = await admin
    .from("profiles")
    .upsert(
      {
        id: authUser.id,
        email,
        full_name: fullName,
        role,
      },
      { onConflict: "id" },
    )
    .select("id, email, full_name, role, avatar_url, created_at, updated_at")
    .single();

  if (insertError) {
    console.error("[auth] ensureProfile upsert:", insertError.message);
    return null;
  }

  return inserted as Profile;
}
