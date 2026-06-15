"use client";

import { RecentActivities } from "@/components/dashboard/recent-activities";
import type { DashboardActivity } from "@/types/dashboard";

interface AdminActivitySectionProps {
  activities: DashboardActivity[];
}

export function AdminActivitySection({ activities }: AdminActivitySectionProps) {
  return (
    <section aria-label="Recent activity" className="reports-chart-animate" style={{ animationDelay: "200ms" }}>
      <RecentActivities activities={activities} />
    </section>
  );
}
