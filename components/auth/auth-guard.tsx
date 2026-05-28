"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SessionLoading } from "@/components/auth/session-loading";
import { toast } from "sonner";

const AUTH_GUARD_MAX_MS = 6_000;

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [timedOut, setTimedOut] = useState(false);
  const syncAttemptedRef = useRef(false);
  const supabaseOn = isSupabaseConfigured();
  const authed = supabaseOn ? isAuthenticated : false;

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "forbidden") {
      toast.error("You do not have permission to access that page.");
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), AUTH_GUARD_MAX_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;

    if (!isSupabaseConfigured()) return;

    if (!syncAttemptedRef.current) {
      syncAttemptedRef.current = true;
      void refreshUser();
      return;
    }

    const params = new URLSearchParams({ redirectTo: pathname });
    router.replace(`/login?${params.toString()}`);
  }, [isLoading, isAuthenticated, pathname, router, refreshUser]);

  useEffect(() => {
    if (authed || isLoading || !isSupabaseConfigured()) return;
    if (!syncAttemptedRef.current || !timedOut) return;

    const params = new URLSearchParams({ redirectTo: pathname });
    router.replace(`/login?${params.toString()}`);
  }, [authed, isLoading, timedOut, pathname, router]);

  if (!authed) {
    return <SessionLoading />;
  }

  return <>{children}</>;
}
