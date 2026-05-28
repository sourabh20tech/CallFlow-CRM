import { type NextRequest, NextResponse } from "next/server";
import {
  CRM_OFF_ADMIN_ALLOWED_ROUTES,
  MAINTENANCE_PATH,
} from "@/lib/system/constants";
import {
  isAuthRoute,
  isProtectedRoute,
  PROTECTED_PREFIX,
} from "@/lib/auth/roles";
import type { UserRole } from "@/types/auth";

function isMaintenancePath(pathname: string): boolean {
  return pathname === MAINTENANCE_PATH || pathname.startsWith(`${MAINTENANCE_PATH}/`);
}

function isAdminAllowedWhenCrmOff(pathname: string): boolean {
  return CRM_OFF_ADMIN_ALLOWED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

/**
 * Enforces CRM maintenance mode at the edge.
 * - CRM ON: no redirect
 * - CRM OFF + admin: dashboard access (settings + overview)
 * - CRM OFF + agent / unauthenticated protected: maintenance page
 */
export function applyCrmMaintenanceGuard(params: {
  request: NextRequest;
  pathname: string;
  role: UserRole | null;
  crmEnabled: boolean;
}): NextResponse | null {
  const { request, pathname, role, crmEnabled } = params;

  if (crmEnabled) {
    return null;
  }

  if (isMaintenancePath(pathname) || isApiPath(pathname)) {
    return null;
  }

  // Admins retain access (full CRM control while maintenance is active for agents)
  if (role === "admin") {
    if (isProtectedRoute(pathname) && !isAdminAllowedWhenCrmOff(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/settings";
      url.searchParams.set("notice", "maintenance-active");
      return NextResponse.redirect(url);
    }
    return null;
  }

  // Agents on protected routes → maintenance
  if (role === "agent" && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = MAINTENANCE_PATH;
    return NextResponse.redirect(url);
  }

  // Authenticated non-admin on dashboard prefix
  if (role === "agent") {
    const url = request.nextUrl.clone();
    url.pathname = MAINTENANCE_PATH;
    return NextResponse.redirect(url);
  }

  // Block agent registration when CRM is off
  if (pathname === "/register") {
    const url = request.nextUrl.clone();
    url.pathname = MAINTENANCE_PATH;
    return NextResponse.redirect(url);
  }

  // Unauthenticated users hitting protected CRM routes
  if (!role && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    url.searchParams.set("maintenance", "1");
    return NextResponse.redirect(url);
  }

  // Auth routes stay reachable so admins can sign in
  if (isAuthRoute(pathname)) {
    return null;
  }

  // Any other dashboard-adjacent path for agents
  if (pathname.startsWith(PROTECTED_PREFIX)) {
    const url = request.nextUrl.clone();
    url.pathname = MAINTENANCE_PATH;
    return NextResponse.redirect(url);
  }

  return null;
}
