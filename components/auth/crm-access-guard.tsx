"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCrmEnabled } from "@/hooks/use-crm-enabled";
import { MAINTENANCE_PATH } from "@/lib/system/constants";

/**
 * Client-side fallback when CRM is toggled off while an agent session is active.
 */
export function CrmAccessGuard({ children }: { children: React.ReactNode }) {
  const { isAgent, isAdmin, isLoading: authLoading } = useAuth();
  const { isMaintenanceMode, isLoading: statusLoading } = useCrmEnabled();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading || statusLoading) return;
    if (!isMaintenanceMode) return;
    if (isAdmin) return;
    if (isAgent && pathname !== MAINTENANCE_PATH) {
      router.replace(MAINTENANCE_PATH);
    }
  }, [authLoading, statusLoading, isMaintenanceMode, isAdmin, isAgent, pathname, router]);

  return <>{children}</>;
}
