"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { GlassCard } from "@/components/design-system/glass-card";
import { CrmSystemControl } from "@/components/settings/crm-system-control";
import { AdminAnnouncementCard } from "@/components/settings/admin-announcement-card";
import { SendAnnouncement } from "@/components/settings/send-announcement";

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
      <SendAnnouncement />
      <AdminAnnouncementCard />

      <GlassCard variant="default" padding="md">
        <p className="ds-caption text-center text-muted-foreground">
          Copyright © 2026 CallFlow CRM
        </p>
      </GlassCard>
    </div>
  );
}
