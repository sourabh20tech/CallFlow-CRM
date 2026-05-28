"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { SessionLoading } from "@/components/auth/session-loading";
import type { UserRole } from "@/types/auth";

interface RoleGuardProps {
  children: React.ReactNode;
  allowed: UserRole | UserRole[];
  redirectTo?: string;
}

export function RoleGuard({
  children,
  allowed,
  redirectTo = "/dashboard?error=forbidden",
}: RoleGuardProps) {
  const { role, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const refreshAttemptedRef = useRef(false);

  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];
  const permitted = Boolean(role && allowedRoles.includes(role));

  useEffect(() => {
    if (isLoading || permitted) return;

    if (!refreshAttemptedRef.current) {
      refreshAttemptedRef.current = true;
      void refreshUser();
      return;
    }

    router.replace(redirectTo);
  }, [permitted, isLoading, router, redirectTo, refreshUser]);

  if (isLoading || (!permitted && !refreshAttemptedRef.current)) {
    return <SessionLoading variant="minimal" />;
  }

  if (!permitted) {
    return <SessionLoading variant="minimal" />;
  }

  return <>{children}</>;
}
