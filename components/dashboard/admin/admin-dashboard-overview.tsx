"use client";

import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { AdminKpiRow, AdminKpiSummary } from "@/components/dashboard/admin/admin-kpi-row";
import { AdminChartsSection } from "@/components/dashboard/admin/admin-charts-section";
import { AdminActivitySection } from "@/components/dashboard/admin/admin-activity-section";
import { AdminLatestLeadsSection } from "@/components/dashboard/admin/admin-latest-leads-section";
import { AdminDashboardSkeleton } from "@/components/dashboard/admin/admin-dashboard-skeleton";
import { useDashboard } from "@/hooks/use-dashboard";
import { useIsClient } from "@/hooks/use-is-client";
import { pageSection } from "@/lib/design-system/styles";
import { Button } from "@/components/ui/button";

const REFRESH_INTERVAL = undefined as number | undefined;

export function AdminDashboardOverview() {
  const { data, isLoading, error, refresh } = useDashboard({
    refreshInterval: REFRESH_INTERVAL,
  });
  const isClient = useIsClient();

  if (isLoading || !data) {
    return <AdminDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => void refresh()}>Retry</Button>
      </div>
    );
  }

  const chartKey = data.updatedAt.slice(0, 19);

  return (
    <div className={pageSection}>
      <PageHeader
        title="Admin Dashboard"
        description="Real-time overview of leads, calls, follow-ups, and agent performance"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isClient && (
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

      <AdminKpiRow stats={data.stats} />
      <AdminKpiSummary stats={data.stats} />

      <AdminChartsSection
        dailyCalls={data.dailyCalls}
        leadConversion={data.leadConversion}
        agentPerformance={data.agentPerformance}
        chartKey={chartKey}
      />

      <AdminActivitySection activities={data.activities} />

      <AdminLatestLeadsSection leads={data.leads} />
    </div>
  );
}
