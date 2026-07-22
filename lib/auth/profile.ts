import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeCrmRole, roleFromAuthMetadata } from "@/lib/auth/crm-role";
import { ensureProfileViaRpc } from "@/lib/auth/ensure-profile-rpc";
import type { Profile, User, UserRole } from "@/types/auth";

export { normalizeCrmRole, resolveCrmRole, roleFromAuthMetadata } from "@/lib/auth/crm-role";

export function parseUserRole(value: unknown): UserRole | null {
  return normalizeCrmRole(value);
}

export function profileToUser(profile: Profile): User {
  const role = normalizeCrmRole(profile.role) ?? "agent";

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name ?? undefined,
    avatarUrl: profile.avatar_url ?? undefined,
    role,
  };
}

export function metadataToUser(
  authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  },
  role: UserRole,
): User {
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    fullName: (authUser.user_metadata?.full_name as string) ?? undefined,
    avatarUrl: (authUser.user_metadata?.avatar_url as string) ?? undefined,
    role: normalizeCrmRole(role) ?? "agent",
  };
}

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, avatar_url, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      if (error.code === "PGRST205" || error.message.includes("Could not find the table")) {
        console.warn(
          "[auth] profiles table missing — run CRM schema SQL in Supabase SQL Editor",
        );
      } else if (error.code === "PGRST202" || error.message.includes("Could not find the function")) {
        console.warn(
          "[auth] database functions missing (is_admin/is_agent) — run full CRM schema SQL in Supabase",
        );
      } else {
        console.warn("[auth] fetchProfile:", error.message, error.code);
      }
    }
    return null;
  }

  if (!data) {
    return null;
  }

  const role = normalizeCrmRole(data.role);
  if (!role) {
    console.error("[auth] fetchProfile: invalid role value", data.role);
    return { ...data, role: "agent" } as Profile;
  }

  return { ...data, role } as Profile;
}

export async function resolveUserFromAuth(
  supabase: SupabaseClient,
  authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  },
): Promise<User | null> {
  // Try profile DB first (source of truth for name, avatar etc.)
  const profile = await fetchProfile(supabase, authUser.id);
  if (profile) {
    return profileToUser(profile);
  }

  // Fallback: use JWT metadata if profile not found
  const metaRole = roleFromAuthMetadata(authUser.user_metadata, authUser.app_metadata);
  if (metaRole && authUser.email) {
    return metadataToUser(authUser, metaRole);
  }

  // Last resort: provision profile via RPC
  const viaRpc = await ensureProfileViaRpc(supabase);
  if (viaRpc) {
    return profileToUser(viaRpc);
  }

  return null;
}
