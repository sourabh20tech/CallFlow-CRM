"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toast } from "sonner";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Auth guard — renders children immediately if cached user exists.
 * Only redirects to login if auth is confirmed missing.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated, user, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const syncAttemptedRef = useRef(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "forbidden") {
      toast.error("You do not have permission to access that page.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    if (!isSupabaseConfigured()) return;

    if (!syncAttemptedRef.current) {
      syncAttemptedRef.current = true;
      void refreshUser();
      return;
    }

    // Auth confirmed missing — redirect to login
    const params = new URLSearchParams({ redirectTo: pathname });
    router.replace(`/login?${params.toString()}`);
  }, [isLoading, isAuthenticated, pathname, router, refreshUser]);

  // Show children immediately if we have a user (even from cache)
  // This eliminates blank page on reload
  if (user) {
    return <>{children}</>;
  }

  // No cached user and still loading — show minimal spinner (not skeleton)
  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return null;
}
