"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/design-system/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminAnnouncement } from "@/types/system";

const EMPTY_ANNOUNCEMENT: AdminAnnouncement = {
  title: "",
  message: "",
  updatedAt: null,
};

export function AdminAnnouncementCard() {
  const [announcement, setAnnouncement] = useState<AdminAnnouncement>(EMPTY_ANNOUNCEMENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAnnouncement() {
      try {
        const res = await fetch("/api/system/announcement", { cache: "no-store" });
        const json = (await res.json()) as AdminAnnouncement & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed to load announcement");
        if (!cancelled) {
          setAnnouncement({
            title: json.title ?? "",
            message: json.message ?? "",
            updatedAt: json.updatedAt ?? null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load announcement");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadAnnouncement();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveAnnouncement = async (next: AdminAnnouncement) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/system/announcement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next.title.trim(), message: next.message.trim() }),
      });
      const json = (await res.json()) as AdminAnnouncement & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to save announcement");
      setAnnouncement({
        title: json.title ?? "",
        message: json.message ?? "",
        updatedAt: json.updatedAt ?? null,
      });
      toast.success("Announcement saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save announcement");
    } finally {
      setIsSaving(false);
    }
  };

  const clearAnnouncement = async () => {
    await saveAnnouncement({ ...EMPTY_ANNOUNCEMENT });
  };

  return (
    <GlassCard variant="default" padding="md">
      <div className="mb-4 flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-primary" />
        <h3 className="ds-h3">Admin Announcement</h3>
      </div>
      <p className="ds-caption mb-4 text-muted-foreground">
        Post a simple team message for all agents on their dashboard.
      </p>

      <div className="space-y-3">
        <Input
          placeholder="Announcement Title"
          value={announcement.title}
          onChange={(e) => setAnnouncement((prev) => ({ ...prev, title: e.target.value }))}
          disabled={isLoading || isSaving}
          maxLength={120}
        />
        <textarea
          placeholder="Announcement Message"
          value={announcement.message}
          onChange={(e) => setAnnouncement((prev) => ({ ...prev, message: e.target.value }))}
          disabled={isLoading || isSaving}
          maxLength={500}
          rows={4}
          className="w-full rounded-xl border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/60 px-3 py-2 text-sm text-foreground shadow-[var(--ds-shadow-sm)] outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => void saveAnnouncement(announcement)}
            disabled={isLoading || isSaving}
          >
            {isSaving ? "Saving..." : "Save Announcement"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void clearAnnouncement()}
            disabled={isLoading || isSaving}
          >
            Clear Announcement
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
