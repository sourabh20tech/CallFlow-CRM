"use client";

import { CalendarCheck, CalendarClock, CheckCircle2, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/design-system/stat-card";
import type { FollowupStats } from "@/types/followup";

interface FollowupStatsCardsProps {
  stats: FollowupStats;
}

export function FollowupStatsCards({ stats }: FollowupStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Pending"
        value={stats.pending + stats.inProgress}
        icon={CalendarClock}
        description={`${stats.inProgress} in progress`}
      />
      <StatCard
        title="Due today"
        value={stats.dueToday}
        icon={CalendarCheck}
        description="Scheduled for today"
      />
      <StatCard
        title="Overdue"
        value={stats.overdue}
        icon={AlertTriangle}
        description="Needs immediate action"
      />
      <StatCard
        title="Completed"
        value={stats.completed}
        icon={CheckCircle2}
        description="Closed follow-ups"
      />
    </div>
  );
}
