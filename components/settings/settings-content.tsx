"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { GlassCard } from "@/components/design-system/glass-card";
import { CrmSystemControl } from "@/components/settings/crm-system-control";
import { AdminAnnouncementCard } from "@/components/settings/admin-announcement-card";
import { DataManagementSection } from "@/components/settings/data-management/data-management-section";
import { LeadStatusesSettings } from "@/components/settings/lead-statuses-settings";

export function SettingsContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("notice") === "maintenance-active") {
      toast.info("Maintenance mode is active", {
        description: "Agents are blocked. Use System Control below to restore access.",
      });
    }
  }, [searchParams]);

  return (
    <div className="grid gap-[var(--ds-stack-gap)]">
      <CrmSystemControl />
      <AdminAnnouncementCard />

      <GlassCard variant="default" padding="md">
        <LeadStatusesSettings />
      </GlassCard>

      <DataManagementSection />

      <div className="grid gap-[var(--ds-stack-gap)]">
        <GlassCard variant="default" padding="md">
          <h3 className="ds-h3">Role-based access</h3>
          <ul className="ds-body mt-3 list-inside list-disc space-y-2 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Admin access:</span> full control of
              dashboard operations, agents, settings, and system control.
            </li>
            <li>
              <span className="font-medium text-foreground">Agent access:</span> calls, leads, and
              reports with maintenance-mode restrictions applied automatically.
            </li>
            <li>
              <span className="font-medium text-foreground">System governance:</span> role checks
              are enforced at route and API layers for secure access control.
            </li>
            <li>
              <span className="font-medium text-foreground">Realtime reliability:</span> system
              status updates sync through Supabase to keep admin and agent views consistent.
            </li>
          </ul>
          <p className="ds-caption mt-4 border-t border-border/50 pt-3 text-right">
            Copyright © 2026 CallFlow CRM
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
