import type { Profile, UserRole } from "@/types/auth";

/** Normalizes DB enum / string values to CRM roles. */
export function normalizeCrmRole(value: unknown): UserRole | null {
  if (value === "admin" || value === "Admin" || value === "ADMIN") {
    return "admin";
  }
  if (value === "agent" || value === "Agent" || value === "AGENT") {
    return "agent";
  }
  return null;
}

export function roleFromAuthMetadata(
  userMetadata?: Record<string, unknown>,
  appMetadata?: Record<string, unknown>,
): UserRole | null {
  return (
    normalizeCrmRole(userMetadata?.role) ??
    normalizeCrmRole(appMetadata?.role) ??
    normalizeCrmRole(userMetadata?.user_role)
  );
}

/**
 * CRM role: profiles table is source of truth when a row exists.
 */
export function resolveCrmRole(
  profile: Profile | null | undefined,
  authUser?: {
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  },
): UserRole | null {
  if (profile) {
    return normalizeCrmRole(profile.role) ?? "agent";
  }

  if (!authUser) {
    return null;
  }

  return roleFromAuthMetadata(authUser.user_metadata, authUser.app_metadata);
}
