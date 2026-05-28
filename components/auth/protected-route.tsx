"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { RoleGuard } from "@/components/auth/role-guard";
import type { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Restrict to specific role(s). Omit for any authenticated user. */
  roles?: UserRole | UserRole[];
  redirectTo?: string;
}

/**
 * Client-side route protection: session + optional role check.
 * Use on dashboard segments; edge protection is in `proxy.ts` / `lib/supabase/middleware.ts`.
 */
export function ProtectedRoute({ children, roles, redirectTo }: ProtectedRouteProps) {
  return (
    <AuthGuard>
      {roles ? (
        <RoleGuard allowed={roles} redirectTo={redirectTo}>
          {children}
        </RoleGuard>
      ) : (
        children
      )}
    </AuthGuard>
  );
}
