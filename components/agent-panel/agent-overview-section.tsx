"use client";

import { MyLeadsSection } from "@/components/agent-panel/my-leads-section";
import { TodayCallsSection } from "@/components/agent-panel/today-calls-section";
import { PendingFollowupsSection } from "@/components/agent-panel/pending-followups-section";
import type { AgentPanelBundle, AgentPanelLead } from "@/types/agent-panel";
import type { Call } from "@/types/call";
import type { Followup } from "@/types/followup";
import { buildAgentLeadLookup } from "@/lib/agent-panel/lead-lookup";

interface AgentOverviewSectionProps {
  data: AgentPanelBundle;
  onLeadsChange: (leads: AgentPanelLead[]) => void;
  onCallsChange: (calls: Call[]) => void;
  onFollowupsChange: (followups: Followup[]) => void;
  onRefresh: () => void;
}

export function AgentOverviewSection({
  data,
  onLeadsChange,
  onCallsChange,
  onFollowupsChange,
  onRefresh,
}: AgentOverviewSectionProps) {
  const leadLookup = buildAgentLeadLookup([...data.myLeads, ...data.convertedLeads]);

  return (
    <div className="space-y-[var(--ds-stack-gap)]">
      <div className="grid gap-[var(--ds-stack-gap)] lg:grid-cols-2">
        <MyLeadsSection
          leads={data.myLeads.slice(0, 5)}
          showToolbar={false}
          onLeadsChange={onLeadsChange}
          onRefresh={onRefresh}
        />
        <TodayCallsSection
          calls={data.todayCalls.slice(0, 4)}
          onCallsChange={onCallsChange}
          compact
        />
      </div>
      <PendingFollowupsSection
        followups={data.pendingFollowups.slice(0, 4)}
        leadLookup={leadLookup}
        onFollowupsChange={onFollowupsChange}
        onRefresh={onRefresh}
      />
    </div>
  );
}
