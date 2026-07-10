"use client";

import { memo, useState } from "react";
import dynamic from "next/dynamic";
import { FollowupReminderListener } from "@/components/followups/followup-reminder-listener";
import { AgentInactivityGuard } from "@/components/auth/agent-inactivity-guard";
import { Sidebar } from "@/components/layouts/sidebar";
import { TopNavbar } from "@/components/layouts/top-navbar";
import { RoutePrefetcher } from "@/components/layouts/route-prefetcher";
import { useFollowupReminderToasts } from "@/hooks/use-followup-reminder-toasts";
import { pageContainer, pageSection } from "@/lib/design-system/styles";
import { cn } from "@/lib/utils";

const MobileNav = dynamic(
  () => import("@/components/layouts/mobile-nav").then((m) => m.MobileNav),
  { ssr: false },
);

interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * Enterprise Dashboard Shell
 * 
 * Scroll Architecture:
 * - Outer container: flex row, h-[100dvh], NO scroll
 * - Sidebar: fixed height, internal scroll for nav items
 * - Right panel: flex column, h-[100dvh]
 *   - TopNavbar: sticky, never scrolls
 *   - Main: flex-1, THIS is the ONLY scroll container
 * 
 * This ensures:
 * - Single scroll source (main content area)
 * - Header always visible
 * - Sidebar always visible (desktop)
 * - No nested scroll conflicts
 * - Natural mobile scroll behavior
 */
export const DashboardShell = memo(function DashboardShell({ children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  useFollowupReminderToasts(true);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-transparent">
      <FollowupReminderListener />
      <AgentInactivityGuard />
      <RoutePrefetcher />

      {/* Sidebar: desktop only, fixed height with internal scroll */}
      <Sidebar />

      {/* Mobile drawer */}
      {mobileOpen && <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />}

      {/* Right panel: header + scrollable main */}
      <div className="flex h-[100dvh] min-w-0 flex-1 flex-col">
        {/* Sticky header - never scrolls */}
        <TopNavbar onMobileMenuOpen={() => setMobileOpen(true)} />

        {/* SINGLE scroll container for the entire app */}
        <main
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden",
            "px-[var(--ds-page-padding-x)] py-[var(--ds-page-padding-y)]",
            "pb-[max(var(--ds-page-padding-y),env(safe-area-inset-bottom))]",
            "-webkit-overflow-scrolling-touch",
          )}
        >
          <div className={cn(pageContainer, pageSection, "ds-animate-in")}>{children}</div>
        </main>
      </div>
    </div>
  );
});
