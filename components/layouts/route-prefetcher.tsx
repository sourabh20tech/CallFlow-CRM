"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getNavItemsForRole } from "@/constants/navigation";
import { useAuth } from "@/hooks/use-auth";
import { prefetch } from "@/lib/cache/data-cache";

/**
 * Enterprise Route & Data Prefetcher
 * 
 * Strategy:
 * 1. Immediately after auth resolves: prefetch ALL route bundles (RSC payloads)
 * 2. On idle: prefetch reference data into memory cache
 * 3. Result: first click on ANY sidebar item loads from prefetch cache
 */
export function RoutePrefetcher() {
  const router = useRouter();
  const { role } = useAuth();
  const prefetchedRef = useRef(false);

  useEffect(() => {
    if (!role || prefetchedRef.current) return;
    prefetchedRef.current = true;

    const navItems = getNavItemsForRole(role);
    const routes = navItems.map((item) => item.href);

    // Phase 1: Prefetch ALL route bundles IMMEDIATELY (high priority)
    // This ensures RSC payload + JS is cached for every sidebar link
    for (const route of routes) {
      router.prefetch(route);
    }

    // Phase 2: Prefetch API data IMMEDIATELY (not on idle — we want instant dashboard)
    const prefetchData = () => {
      // Reference data (used by all pages)
      prefetch("ref:lead-sources", () => fetch("/api/lead-sources").then(r => r.json()).then(d => d.sources ?? []), 180_000);
      prefetch("ref:lead-statuses", () => fetch("/api/lead-statuses").then(r => r.json()).then(d => d.statuses ?? []), 180_000);

      // Page-specific data — prefetch dashboard data immediately
      if (role === "admin") {
        prefetch("dashboard:admin", () => fetch("/api/dashboard/admin").then(r => r.json()), 20_000);
      } else {
        prefetch("agent:panel", () => fetch("/api/agent/panel").then(r => r.json()), 15_000);
      }
    };

    // Start data prefetch after a tiny delay (let UI render first)
    setTimeout(prefetchData, 100);
  }, [role, router]);

  return null;
}
