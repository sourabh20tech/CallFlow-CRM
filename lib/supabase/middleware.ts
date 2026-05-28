import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";
import { fetchAgentAccountStatus } from "@/lib/auth/agent-account";
import { resolveAuthenticatedUserRole } from "@/lib/auth/resolve-user-role";
import { defaultDashboardPathForRole } from "@/lib/auth/post-login-path";
import {
  canAccessRoute,
  isAdminOnlyRoute,
  isAuthRoute,
  isProtectedRoute,
} from "@/lib/auth/roles";
import { applyCrmMaintenanceGuard } from "@/lib/system/crm-guard";
import { fetchCrmSystemStatus } from "@/lib/system/fetch-crm-status";
import type { UserRole } from "@/types/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  let role: UserRole | null = null;
  if (user) {
    role = await resolveAuthenticatedUserRole(supabase, user);
  }

  // Unauthenticated → block protected routes
  if (!user && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated on login/register → dashboard only when CRM role is resolved
  if (user && isAuthRoute(pathname)) {
    if (!role) {
      return supabaseResponse;
    }

    const url = request.nextUrl.clone();
    url.pathname = defaultDashboardPathForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Session exists but CRM profile/role could not be resolved — avoid dashboard ↔ login loop
  if (user && !role && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "profile");
    if (pathname !== "/login") {
      url.searchParams.set("redirectTo", pathname);
    }
    return NextResponse.redirect(url);
  }

  // Inactive agents cannot access protected routes
  if (user && role === "agent") {
    const agentAccount = await fetchAgentAccountStatus(supabase, user.id);
    if (agentAccount.exists && !agentAccount.isActive && isProtectedRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "inactive");
      return NextResponse.redirect(url);
    }
  }

  // Admin-only routes require profiles.role = admin
  if (user && isProtectedRoute(pathname) && isAdminOnlyRoute(pathname)) {
    if (!canAccessRoute(pathname, role)) {
      const url = request.nextUrl.clone();
      url.pathname = role === "agent" ? "/dashboard/workspace" : "/dashboard";
      url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }
  }

  const systemStatus = await fetchCrmSystemStatus(supabase);
  const maintenanceRedirect = applyCrmMaintenanceGuard({
    request,
    pathname,
    role,
    crmEnabled: systemStatus.crmEnabled,
  });

  if (maintenanceRedirect) {
    return maintenanceRedirect;
  }

  if (role) {
    supabaseResponse.headers.set("x-user-role", role);
  }

  supabaseResponse.headers.set(
    "x-crm-enabled",
    systemStatus.crmEnabled ? "1" : "0",
  );

  return supabaseResponse;
}
