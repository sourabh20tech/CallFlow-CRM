"use client";

import { memo, useState } from "react";
import dynamic from "next/dynamic";
import { FollowupReminderListener } from "@/components/followups/followup-reminder-listener";
import { AgentInactivityGuard } from "@/components/auth/agent-inactivity-guard";
import { Sidebar } from "@/components/layouts/sidebar";
import { TopNavbar } from "@/components/layouts/top-navbar";
import { pageContainer, pageSection } from "@/lib/design-system/styles";
import { cn } from "@/lib/utils";

// Lazy-load mobile nav — only needed on mobile tap
const MobileNav = dynamic(
  () => import("@/components/layouts/mobile-nav").then((m) => m.MobileNav),
  { ssr: false },
);

interface DashboardShellProps {
  children: React.ReactNode;
}

export const DashboardShell = memo(function DashboardShell({ children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] bg-transparent">
      <FollowupReminderListener />
      <AgentInactivityGuard />
      <Sidebar />
      {mobileOpen && <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />}

      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
        <TopNavbar onMobileMenuOpen={() => setMobileOpen(true)} />

        <main
          className={cn(
            "flex-1 overflow-x-hidden",
            "px-[var(--ds-page-padding-x)] py-[var(--ds-page-padding-y)]",
            "pb-[max(var(--ds-page-padding-y),env(safe-area-inset-bottom))]",
          )}
        >
          <div className={cn(pageContainer, pageSection, "ds-animate-in")}>{children}</div>
        </main>
      </div>
    </div>
  );
});
