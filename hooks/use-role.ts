"use client";

import { useAuth } from "@/hooks/use-auth";
import { canAccessRoute } from "@/lib/auth/roles";
import type { UserRole } from "@/types/auth";

export function useRole() {
  const { role, isAdmin, isAgent, user, isLoading } = useAuth();

  const hasRole = (required: UserRole | UserRole[]) => {
    if (!role) return false;
    const roles = Array.isArray(required) ? required : [required];
    return roles.includes(role);
  };

  const canAccess = (pathname: string) => canAccessRoute(pathname, role);

  return {
    role,
    isAdmin,
    isAgent,
    user,
    isLoading,
    hasRole,
    canAccess,
  };
}
