"use client";

import { Users } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import type { AgentFollowupSummary } from "@/types/followup";
import { cn } from "@/lib/utils";

interface AgentFollowupTrackerProps {
  agents: AgentFollowupSummary[];
  selectedAgentId?: string;
  onSelectAgent: (agentId: string | undefined) => void;
}

export function AgentFollowupTracker({
  agents,
  selectedAgentId,
  onSelectAgent,
}: AgentFollowupTrackerProps) {
  if (!agents.length) return null;

  return (
    <GlassCard variant="subtle" padding="md" className="ds-animate-in">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Agent workload</h3>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => onSelectAgent(undefined)}
          className={cn(
            "shrink-0 rounded-xl border px-3 py-2 text-left text-xs transition-all",
            !selectedAgentId
              ? "border-primary/40 bg-primary/10"
              : "border-border/50 hover:bg-muted/40",
          )}
        >
          <span className="font-medium">All agents</span>
        </button>
        {agents.map((a) => (
          <button
            key={a.agentId}
            type="button"
            onClick={() => onSelectAgent(a.agentId === "unassigned" ? undefined : a.agentId)}
            className={cn(
              "shrink-0 min-w-[140px] rounded-xl border px-3 py-2 text-left transition-all",
              selectedAgentId === a.agentId
                ? "border-primary/40 bg-primary/10"
                : "border-border/50 hover:bg-muted/40",
            )}
          >
            <p className="truncate text-sm font-medium">{a.agentName}</p>
            <div className="mt-1 flex gap-2 text-[0.6875rem] text-muted-foreground">
              <span>{a.pending} pending</span>
              {a.overdue > 0 && (
                <span className="text-amber-600 dark:text-amber-400">{a.overdue} overdue</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}
