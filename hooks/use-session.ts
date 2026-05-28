"use client";

import { useAuth } from "@/hooks/use-auth";

/**
 * Read-only session snapshot from auth context.
 */
export function useSession() {
  const { session, user, isAuthenticated, isLoading, isDemo } = useAuth();

  return {
    session,
    user,
    isAuthenticated,
    isLoading,
    isDemo,
    accessToken: session?.accessToken ?? null,
    expiresAt: session?.expiresAt ?? null,
  };
}
