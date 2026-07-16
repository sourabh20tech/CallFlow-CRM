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
 * Enterprise Dashboard Shell — Mobile-First Scroll Architecture
 *
 * MOBILE: Body scrolls naturally (no fixed container)
 *   - Header: sticky top-0
 *   - Main: natural document flow, scrolls with page
 *   - No overflow:hidden on any parent
 *
 * DESKTOP: Fixed viewport layout
 *   - Outer: h-dvh, overflow-hidden
 *   - Sidebar: fixed height, internal nav scroll
 *   - Main: flex-1, overflow-y-auto (single scroll)
 */
export const DashboardShell = memo(function DashboardShell({ children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  useFollowupReminderToasts(true);

  return (
    <div className="flex min-h-[100dvh] bg-transparent md:h-[100dvh] md:overflow-hidden">
      <FollowupReminderListener />
      <AgentInactivityGuard />
      <RoutePrefetcher />

      {/* Sidebar: desktop only */}
      <Sidebar />

      {/* Mobile drawer */}
      {mobileOpen && <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />}

      {/* Right panel */}
      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col md:h-[100dvh]">
        {/* Header: sticky on mobile, fixed within flex on desktop */}
        <TopNavbar onMobileMenuOpen={() => setMobileOpen(true)} />

        {/* Main content: natural scroll on mobile, overflow-y-auto on desktop */}
        <main
          className={cn(
            "flex-1",
            "px-[var(--ds-page-padding-x)] py-[var(--ds-page-padding-y)]",
            "pb-[max(var(--ds-page-padding-y),env(safe-area-inset-bottom))]",
            "md:overflow-y-auto md:overflow-x-hidden",
          )}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className={cn(pageContainer, pageSection, "ds-animate-in")}>{children}</div>
        </main>
      </div>
    </div>
  );
});
