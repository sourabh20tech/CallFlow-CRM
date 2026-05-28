"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resolvePostLoginPath } from "@/lib/auth/post-login-path";
import { useAuth } from "@/hooks/use-auth";
import { SessionLoading } from "@/components/auth/session-loading";

const BOOTSTRAP_UI_MAX_MS = 1_500;

interface RedirectIfAuthenticatedProps {
  children: React.ReactNode;
}

/** On login pages — redirect to dashboard when CRM user is resolved. */
export function RedirectIfAuthenticated({ children }: RedirectIfAuthenticatedProps) {
  const { isAuthenticated, isLoading, refreshUser, role } = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const hasRedirectedRef = useRef(false);
  const [showForm, setShowForm] = useState(false);
  const retriedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowForm(true), BOOTSTRAP_UI_MAX_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !role || hasRedirectedRef.current) {
      return;
    }

    hasRedirectedRef.current = true;
    const destination = resolvePostLoginPath(redirectTo, role);
    window.location.assign(destination);
  }, [isLoading, isAuthenticated, role, redirectTo]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "profile" && !retriedRef.current && !isLoading) {
      retriedRef.current = true;
      void refreshUser();
    }
  }, [searchParams, isLoading, refreshUser]);

  if (isAuthenticated) {
    return <SessionLoading variant="minimal" />;
  }

  if (isLoading && !showForm) {
    return <SessionLoading variant="minimal" />;
  }

  return <>{children}</>;
}
