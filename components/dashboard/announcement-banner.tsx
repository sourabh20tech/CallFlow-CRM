"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import type { AdminAnnouncement } from "@/types/system";

/**
 * Displays a single active announcement banner.
 * Shows for both Admin and Agent. Only the latest announcement is shown.
 * If data is passed as prop, uses it. Otherwise fetches from API.
 */
export function AnnouncementBanner({ data }: { data?: AdminAnnouncement | null }) {
  const [announcement, setAnnouncement] = useState<AdminAnnouncement | null>(data ?? null);

  useEffect(() => {
    if (data !== undefined) {
      setAnnouncement(data ?? null);
      return;
    }

    // Fetch if no data prop provided
    fetch("/api/system/announcement", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: AdminAnnouncement) => {
        if (json.title || json.message) setAnnouncement(json);
      })
      .catch(() => {});
  }, [data]);

  if (!announcement || (!announcement.title && !announcement.message)) {
    return null;
  }

  return (
    <GlassCard variant="default" padding="sm" className="border-primary/20">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <Megaphone className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          {announcement.title && (
            <p className="text-sm font-semibold">{announcement.title}</p>
          )}
          {announcement.message && (
            <p className="mt-0.5 text-sm text-muted-foreground">{announcement.message}</p>
          )}
          {announcement.updatedAt && (
            <p className="mt-1.5 text-[11px] text-muted-foreground/60">
              {new Date(announcement.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
