"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getNavItemsForRole } from "@/constants/navigation";
import { useAuth } from "@/hooks/use-auth";
import { prefetch } from "@/lib/cache/data-cache";

/**
 * Prefetch all dashboard routes AND critical API data on idle.
 * Routes: JS bundles + RSC payloads cached for instant navigation.
 * Data: Sources, statuses, dashboard stats pre-warmed in cache.
 */
export function RoutePrefetcher() {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    if (!role) return;

    const navItems = getNavItemsForRole(role);
    const routes = navItems.map((item) => item.href);

    const prefetchAll = () => {
      // Prefetch route bundles
      for (const route of routes) {
        router.prefetch(route);
      }

      // Prefetch critical API data into cache
      prefetch("ref:lead-sources", () => fetch("/api/lead-sources").then(r => r.json()).then(d => d.sources ?? []), 180_000);
      prefetch("ref:lead-statuses", () => fetch("/api/lead-statuses").then(r => r.json()).then(d => d.statuses ?? []), 180_000);

      if (role === "admin") {
        prefetch("dashboard:admin", () => fetch("/api/dashboard/admin").then(r => r.json()), 20_000);
      } else {
        prefetch("agent:panel", () => fetch("/api/agent/panel").then(r => r.json()), 15_000);
      }
    };

    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(prefetchAll, { timeout: 3000 });
      return () => cancelIdleCallback(id);
    } else {
      const timer = setTimeout(prefetchAll, 1500);
      return () => clearTimeout(timer);
    }
  }, [role, router]);

  return null;
}
