"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/design-system/glass-card";
import { StatusChip } from "@/components/design-system/status-chip";
import { formatRelativeTime } from "@/utils/format";
import type { Followup } from "@/types/followup";
import { cn } from "@/lib/utils";

interface LeadFollowupsPanelProps {
  leadId: string;
  className?: string;
  sectionId?: string;
}

export function LeadFollowupsPanel({
  leadId,
  className,
  sectionId = "lead-detail-followups",
}: LeadFollowupsPanelProps) {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  const loadFollowups = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/followups`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load follow-ups");
      setFollowups(data.followups as Followup[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load follow-ups");
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void loadFollowups();
  }, [loadFollowups]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueAt) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          dueAt: new Date(dueAt).toISOString(),
          priority: "medium",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule");
      setFollowups((prev) => [...prev, data as Followup].sort(
        (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
      ));
      setTitle("");
      setDueAt("");
      setShowForm(false);
      toast.success("Follow-up scheduled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async (followupId: string) => {
    try {
      const res = await fetch(`/api/followups/${followupId}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to complete");
      setFollowups((prev) =>
        prev.map((f) => (f.id === followupId ? (data as Followup) : f)),
      );
      toast.success("Follow-up completed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not complete");
    }
  };

  const pending = followups.filter(
    (f) => f.status === "pending" || f.status === "in_progress",
  );

  return (
    <div id={sectionId} className={cn("scroll-mt-4 space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Follow-ups
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowForm((v) => !v)}
        >
          <CalendarPlus className="h-4 w-4" />
          Schedule
        </Button>
      </div>

      {showForm && (
        <form onSubmit={(e) => void handleSchedule(e)} className="space-y-2 rounded-xl border border-border/50 bg-muted/20 p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Follow-up title"
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            required
          />
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            required
          />
          <Button type="submit" size="sm" disabled={isSaving || !title.trim() || !dueAt}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading follow-ups…
        </div>
      ) : pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending follow-ups for this lead.</p>
      ) : (
        <ul className="space-y-2">
          {pending.map((f) => (
            <li key={f.id}>
              <GlassCard padding="sm" className="text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{f.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Due {formatRelativeTime(f.dueAt)}
                    </p>
                  </div>
                  <StatusChip label={f.priority} variant="neutral" size="sm" showDot={false} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 gap-1.5 text-primary"
                  onClick={() => void handleComplete(f.id)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark complete
                </Button>
              </GlassCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
