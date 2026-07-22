"use client";

import dynamic from "next/dynamic";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { AdminKpiRow, AdminKpiSummary } from "@/components/dashboard/admin/admin-kpi-row";
import { AnnouncementBanner } from "@/components/dashboard/announcement-banner";
import { useDashboard } from "@/hooks/use-dashboard";
import { useIsClient } from "@/hooks/use-is-client";
import { pageSection } from "@/lib/design-system/styles";
import { Button } from "@/components/ui/button";

// Lazy-load heavy sections — charts and activity load after KPIs render
const AdminChartsSection = dynamic(
  () => import("@/components/dashboard/admin/admin-charts-section").then((m) => m.AdminChartsSection),
  { ssr: false },
);
const AdminActivitySection = dynamic(
  () => import("@/components/dashboard/admin/admin-activity-section").then((m) => m.AdminActivitySection),
  { ssr: false },
);
const AdminLatestLeadsSection = dynamic(
  () => import("@/components/dashboard/admin/admin-latest-leads-section").then((m) => m.AdminLatestLeadsSection),
  { ssr: false },
);
const FollowupCenterWidget = dynamic(
  () => import("@/components/dashboard/followup-center-widget").then((m) => m.FollowupCenterWidget),
  { ssr: false },
);

const REFRESH_INTERVAL = undefined as number | undefined;

export function AdminDashboardOverview() {
  const { data, isLoading, error, refresh } = useDashboard({
    refreshInterval: REFRESH_INTERVAL,
  });
  const isClient = useIsClient();

  // Show dashboard shell immediately — even while data loads
  // KPIs show 0 briefly then animate to real values
  const stats = data?.stats ?? {
    totalLeads: 0, convertedLeads: 0, pendingFollowUps: 0,
    totalCalls: 0, activeAgents: 0, conversionRate: 0,
    trends: { totalLeads: 0, convertedLeads: 0, pendingFollowUps: 0, totalCalls: 0, activeAgents: 0 },
  };

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => void refresh()}>Retry</Button>
      </div>
    );
  }

  const chartKey = data?.updatedAt?.slice(0, 19) ?? "loading";

  return (
    <div className={pageSection}>
      <PageHeader
        title="Admin Dashboard"
        description="Real-time overview of leads, calls, follow-ups, and agent performance"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isClient && data && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Updated {new Date(data.updatedAt).toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void refresh()}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        }
      />

      <AdminKpiRow stats={stats} />
      <AdminKpiSummary stats={stats} />

      <AnnouncementBanner />

      {data && (
        <>
          <AdminChartsSection
            dailyCalls={data.dailyCalls}
            agentPerformance={data.agentPerformance}
            chartKey={chartKey}
          />

          <AdminActivitySection activities={data.activities} />

          <div className="grid gap-[var(--ds-stack-gap)] lg:grid-cols-2">
            <FollowupCenterWidget />
            <AdminLatestLeadsSection leads={data.leads} />
          </div>
        </>
      )}
    </div>
  );
}
