"use client";

import { useState } from "react";
import Link from "next/link";
import { PhoneOff, Phone } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/design-system/glass-card";
import { StatusChip } from "@/components/design-system/status-chip";
import { AgentPanelSectionHeader } from "@/components/agent-panel/agent-panel-section-header";
import { AgentPanelEmptyState } from "@/components/agent-panel/agent-panel-empty-state";
import { CallQuickActions } from "@/components/calls/call-quick-actions";
import { WhatsAppChatButton } from "@/components/shared/whatsapp-chat-button";
import { CALL_STATUS_VARIANT, formatCallStatus } from "@/lib/calls/constants";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import type { Call, CallStatus } from "@/types/call";

interface TodayCallsSectionProps {
  calls: Call[];
  onCallsChange: (calls: Call[]) => void;
  compact?: boolean;
}

export function TodayCallsSection({ calls, onCallsChange, compact }: TodayCallsSectionProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (callId: string, status: CallStatus) => {
    setUpdatingId(callId);
    try {
      const res = await fetch(`/api/calls/${callId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      onCallsChange(calls.map((c) => (c.id === callId ? (data as Call) : c)));
      toast.success(`Call → ${formatCallStatus(status)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update call");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section id="calls" className="scroll-mt-24">
      <GlassCard variant="default" padding="none" className="overflow-hidden">
        <AgentPanelSectionHeader
          title="Today&apos;s Calls"
          description={`${calls.length} call${calls.length === 1 ? "" : "s"} logged today — update disposition inline`}
          actions={
            compact ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/workspace#calls">View all</Link>
              </Button>
            ) : undefined
          }
        />

        {calls.length ? (
          <ul className="space-y-3 p-4 sm:space-y-4 sm:p-6">
            {calls.map((call) => (
              <li
                key={call.id}
                className="rounded-xl border border-border/40 bg-muted/20 p-4 transition-colors hover:bg-muted/30"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{call.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {call.direction} ·{" "}
                      {new Date(call.startedAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {call.duration > 0
                        ? ` · ${Math.floor(call.duration / 60)}m ${call.duration % 60}s`
                        : ""}
                    </p>
                    {call.leadPhone && (
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {call.leadPhone}
                        </span>
                        <WhatsAppChatButton
                          phone={call.leadPhone}
                          message={WHATSAPP_TEMPLATES.followupToday}
                          label={`WhatsApp ${call.customerName}`}
                        />
                      </div>
                    )}
                  </div>
                  <StatusChip
                    label={formatCallStatus(call.status)}
                    variant={CALL_STATUS_VARIANT[call.status]}
                    size="sm"
                  />
                </div>
                <CallQuickActions
                  currentStatus={call.status}
                  onStatusChange={(status) => void handleStatusChange(call.id, status)}
                  disabled={updatingId === call.id}
                  compact
                />
              </li>
            ))}
          </ul>
        ) : (
          <AgentPanelEmptyState
            icon={PhoneOff}
            title="No calls logged today"
            description="Use Quick Dial on the overview tab to start outreach and log dispositions here."
            actionLabel="Open Quick Dial"
            onAction={() => {
              window.location.hash = "";
              const el = document.querySelector("[data-quick-dial]");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        )}
      </GlassCard>
    </section>
  );
}
