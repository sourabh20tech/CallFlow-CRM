"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Redirects unauthenticated users to login with return URL.
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading, user, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const authed = isSupabaseConfigured() ? isAuthenticated : false;

    if (!authed) {
      const params = new URLSearchParams({ redirectTo: pathname });
      router.replace(`/login?${params.toString()}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  return { user, role, isLoading, isAuthenticated };
}
