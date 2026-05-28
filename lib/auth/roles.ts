import type { UserRole } from "@/types/auth";

/** Routes only accessible by admin role */
export const ADMIN_ONLY_ROUTES = [
  "/dashboard/agents",
  "/dashboard/settings",
] as const;

export const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

export const PROTECTED_PREFIX = "/dashboard";

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isProtectedRoute(pathname: string): boolean {
  return pathname === PROTECTED_PREFIX || pathname.startsWith(`${PROTECTED_PREFIX}/`);
}

export function isAdminOnlyRoute(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isAdminRole(role: UserRole | null | undefined): role is "admin" {
  return role === "admin";
}

export function canAccessRoute(pathname: string, role: UserRole | null): boolean {
  if (!isAdminOnlyRoute(pathname)) return true;
  return isAdminRole(role);
}

export function roleLabel(role: UserRole): string {
  return role === "admin" ? "Administrator" : "Agent";
}
