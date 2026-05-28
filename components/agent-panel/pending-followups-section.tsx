"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/design-system/glass-card";
import { StatusChip } from "@/components/design-system/status-chip";
import { AgentPanelSectionHeader } from "@/components/agent-panel/agent-panel-section-header";
import { AgentPanelEmptyState } from "@/components/agent-panel/agent-panel-empty-state";
import { LeadQuickCallButton } from "@/components/agent-panel/lead-quick-call-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AgentPanelLead } from "@/types/agent-panel";
import type { Followup } from "@/types/followup";

const priorityVariant: Record<Followup["priority"], "default" | "secondary" | "destructive"> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
};

interface PendingFollowupsSectionProps {
  followups: Followup[];
  onFollowupsChange: (followups: Followup[]) => void;
  leadLookup?: Map<string, AgentPanelLead>;
  onRefresh?: () => void;
}

export function PendingFollowupsSection({
  followups,
  onFollowupsChange,
  leadLookup,
  onRefresh,
}: PendingFollowupsSectionProps) {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [nowMs] = useState(() => Date.now());

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    try {
      const res = await fetch(`/api/followups/${id}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to complete");
      onFollowupsChange(followups.filter((f) => f.id !== id));
      onRefresh?.();
      toast.success("Follow-up completed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not complete");
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <section id="followups" className="scroll-mt-24">
      <GlassCard variant="default" padding="none" className="overflow-hidden">
        <AgentPanelSectionHeader
          title="Pending Follow-Ups"
          description={`${followups.length} task${followups.length === 1 ? "" : "s"} need your attention`}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/follow-ups">Open calendar</Link>
            </Button>
          }
        />

        {followups.length ? (
          <ul className="space-y-3 p-4 sm:p-6">
            {followups.map((fu) => {
              const overdue = new Date(fu.dueAt).getTime() < nowMs;
              const lead = leadLookup?.get(fu.leadId);
              return (
                <li
                  key={fu.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/40 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{fu.title}</p>
                      <Badge variant={priorityVariant[fu.priority]} className="capitalize">
                        {fu.priority}
                      </Badge>
                      {overdue && (
                        <StatusChip label="Overdue" variant="error" size="sm" pulse />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{fu.leadName ?? lead?.fullName ?? "Lead"}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Due{" "}
                      {new Date(fu.dueAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {lead && (
                      <LeadQuickCallButton
                        leadId={lead.id}
                        leadName={lead.fullName}
                        phone={lead.phone}
                        onCallInitiated={onRefresh}
                        variant="outline"
                      />
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={completingId === fu.id}
                      onClick={() => void handleComplete(fu.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Complete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <AgentPanelEmptyState
            icon={CalendarClock}
            title="All caught up"
            description="No pending follow-ups right now. New tasks will show up here when scheduled."
          />
        )}
      </GlassCard>
    </section>
  );
}
