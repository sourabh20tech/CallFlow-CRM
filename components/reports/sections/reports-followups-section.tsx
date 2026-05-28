"use client";

import { memo } from "react";
import { AlertTriangle, CheckCircle2, ListTodo, Loader2, Clock } from "lucide-react";
import { FollowupAnalyticsChart } from "@/components/reports/charts/followup-analytics-chart";
import { StatCard } from "@/components/design-system/stat-card";
import { statsGrid } from "@/lib/design-system/styles";
import type { FollowupAnalyticsSummary } from "@/types/reports";

interface ReportsFollowupsSectionProps {
  followups: FollowupAnalyticsSummary;
  chartKey: string;
}

function ReportsFollowupsSectionInner({
  followups,
  chartKey,
}: ReportsFollowupsSectionProps) {
  return (
    <section aria-label="Follow-up analytics" className="space-y-[var(--ds-stack-gap)]">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/25 to-blue-500/20 ring-1 ring-sky-500/20">
          <ListTodo className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Follow-up analytics</h2>
          <p className="text-xs text-muted-foreground">Pending, overdue, and completed tasks</p>
        </div>
      </div>

      <div className={statsGrid}>
        <StatCard
          title="Pending"
          value={followups.pending}
          description="Awaiting action"
          icon={Clock}
        />
        <StatCard
          title="In progress"
          value={followups.inProgress}
          description="Being worked"
          icon={Loader2}
        />
        <StatCard
          title="Overdue"
          value={followups.overdue}
          description="Past due date"
          icon={AlertTriangle}
        />
        <StatCard
          title="Completed"
          value={followups.completed}
          description="Closed in period"
          icon={CheckCircle2}
        />
      </div>

      <FollowupAnalyticsChart data={followups.byStatus} chartKey={`fu-${chartKey}`} />
    </section>
  );
}

export const ReportsFollowupsSection = memo(ReportsFollowupsSectionInner);
