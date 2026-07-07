"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getNavItemsForRole } from "@/constants/navigation";
import { useAuth } from "@/hooks/use-auth";

/**
 * Prefetch all dashboard routes on idle after initial load.
 * This makes navigation feel instant (< 200ms) because the JS bundles
 * and RSC payloads are already in the browser cache.
 */
export function RoutePrefetcher() {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    if (!role) return;

    const navItems = getNavItemsForRole(role);
    const routes = navItems.map((item) => item.href);

    // Use requestIdleCallback to prefetch without blocking main thread
    const prefetchRoutes = () => {
      for (const route of routes) {
        router.prefetch(route);
      }
    };

    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(prefetchRoutes, { timeout: 5000 });
      return () => cancelIdleCallback(id);
    } else {
      // Fallback: prefetch after 2s
      const timer = setTimeout(prefetchRoutes, 2000);
      return () => clearTimeout(timer);
    }
  }, [role, router]);

  return null;
}
