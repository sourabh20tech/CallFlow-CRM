"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getNavItemsForRole } from "@/constants/navigation";
import { useAuth } from "@/hooks/use-auth";
import { prefetch } from "@/lib/cache/data-cache";

/**
 * Aggressive Route & Data Prefetcher
 * 
 * Prefetches ALL page data immediately after auth resolves.
 * Result: every sidebar click shows data instantly from cache.
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

    // Prefetch ALL route bundles
    for (const route of routes) {
      router.prefetch(route);
    }

    // Prefetch ALL page data immediately — no waiting
    // Reference data
    prefetch("ref:lead-sources", () => fetch("/api/lead-sources").then(r => r.json()).then(d => d.sources ?? []), 300_000);
    prefetch("ref:lead-statuses", () => fetch("/api/lead-statuses").then(r => r.json()).then(d => d.statuses ?? []), 300_000);

    // Dashboard
    if (role === "admin") {
      prefetch("dashboard:admin", () => fetch("/api/dashboard/admin").then(r => r.json()), 60_000);
    } else {
      prefetch("agent:panel", () => fetch("/api/agent/panel").then(r => r.json()), 60_000);
    }

    // Prefetch leads, calls, followups data after 500ms (let dashboard load first)
    setTimeout(() => {
      prefetch("leads:page1", () => fetch("/api/leads?page=1&pageSize=25").then(r => r.json()), 60_000);
      prefetch("calls:page1", () => fetch("/api/calls?page=1&pageSize=20").then(r => r.json()), 60_000);
      prefetch("followups:all", () => fetch("/api/followups?view=all").then(r => r.json()), 60_000);
      if (role === "admin") {
        prefetch("agents:list", () => fetch("/api/agents").then(r => r.json()), 60_000);
      }
    }, 500);
  }, [role, router]);

  return null;
}
