"use client";

import { RecentActivities } from "@/components/dashboard/recent-activities";
import { QuickActions } from "@/components/dashboard/quick-actions";
import type { DashboardActivity } from "@/types/dashboard";

interface AdminActivitySectionProps {
  activities: DashboardActivity[];
}

export function AdminActivitySection({ activities }: AdminActivitySectionProps) {
  return (
    <section aria-label="Recent activity" className="grid gap-[var(--ds-stack-gap)] lg:grid-cols-3">
      <div className="reports-chart-animate lg:col-span-2" style={{ animationDelay: "200ms" }}>
        <RecentActivities activities={activities} />
      </div>
      <div className="reports-chart-animate" style={{ animationDelay: "280ms" }}>
        <QuickActions />
      </div>
    </section>
  );
}
