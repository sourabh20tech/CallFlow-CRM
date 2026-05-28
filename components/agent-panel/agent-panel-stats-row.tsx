"use client";

import { CalendarClock, Phone, PhoneCall, Trophy, UserPlus } from "lucide-react";
import { StatCard } from "@/components/design-system/stat-card";
import { statsGrid } from "@/lib/design-system/styles";
import type { AgentPanelStats } from "@/types/agent-panel";

interface AgentPanelStatsRowProps {
  stats: AgentPanelStats;
}

export function AgentPanelStatsRow({ stats }: AgentPanelStatsRowProps) {
  return (
    <div className={statsGrid}>
      <StatCard title="My Leads" value={stats.assignedLeads} icon={UserPlus} />
      <StatCard title="Calls Today" value={stats.callsToday} icon={Phone} />
      <StatCard
        title="Active Calls"
        value={stats.activeCalls}
        icon={PhoneCall}
        description="Needs disposition"
      />
      <StatCard title="Pending Follow-Ups" value={stats.pendingFollowups} icon={CalendarClock} />
      <StatCard title="Converted" value={stats.convertedLeads} icon={Trophy} />
    </div>
  );
}
