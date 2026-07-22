import { canAccessRoute, isAdminOnlyRoute } from "@/lib/auth/roles";
import type { UserRole } from "@/types/auth";

/** Default landing path after sign-in for each CRM role. */
export function defaultDashboardPathForRole(role: UserRole): string {
  return "/dashboard";
}

/**
 * Validates a post-login redirect target for the resolved role.
 * Falls back to the role default when missing, external, or forbidden.
 */
export function resolvePostLoginPath(
  redirectTo: string | null | undefined,
  role: UserRole,
): string {
  const fallback = defaultDashboardPathForRole(role);

  if (!redirectTo || !redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return fallback;
  }

  if (isAdminOnlyRoute(redirectTo) && !canAccessRoute(redirectTo, role)) {
    return fallback;
  }

  return redirectTo;
}
