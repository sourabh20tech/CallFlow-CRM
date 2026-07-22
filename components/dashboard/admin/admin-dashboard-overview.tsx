"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { AdminKpiRow, AdminKpiSummary } from "@/components/dashboard/admin/admin-kpi-row";
import { AnnouncementBanner } from "@/components/dashboard/announcement-banner";
import { useDashboard } from "@/hooks/use-dashboard";
import { pageSection } from "@/lib/design-system/styles";
import { Button } from "@/components/ui/button";
import type { AdminDashboardStats } from "@/types/dashboard";

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

const EMPTY_STATS: AdminDashboardStats = {
  totalLeads: 0, convertedLeads: 0, pendingFollowUps: 0,
  totalCalls: 0, activeAgents: 0, conversionRate: 0,
  trends: { totalLeads: 0, convertedLeads: 0, pendingFollowUps: 0, totalCalls: 0, activeAgents: 0 },
};

/**
 * Two-phase dashboard loading:
 * Phase 1: Fast KPI stats from /api/dashboard/stats (~500ms) → cards appear
 * Phase 2: Full data from /api/dashboard/admin (2-3s) → charts + activity appear
 */
export function AdminDashboardOverview() {
  const { data, error, refresh } = useDashboard();
  const [fastStats, setFastStats] = useState<AdminDashboardStats | null>(null);
  const fastFetched = useRef(false);

  // Phase 1: Fetch lightweight stats immediately
  useEffect(() => {
    if (fastFetched.current || data) return; // Skip if full data already loaded
    fastFetched.current = true;
    fetch("/api/dashboard/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d && d.totalLeads !== undefined) {
          setFastStats({
            ...d,
            trends: { totalLeads: 0, convertedLeads: 0, pendingFollowUps: 0, totalCalls: 0, activeAgents: 0 },
          });
        }
      })
      .catch(() => {});
  }, [data]);

  // Use full data stats if available, else fast stats, else empty
  const stats = data?.stats ?? fastStats ?? EMPTY_STATS;
  const hasStats = Boolean(data?.stats || fastStats);

  if (error && !data && !fastStats) {
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
            {data && (
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

      {/* KPI cards — appear fast from /api/dashboard/stats */}
      <AdminKpiRow stats={stats} />
      {hasStats && <AdminKpiSummary stats={stats} />}

      <AnnouncementBanner />

      {/* Charts and activity — appear after full data loads */}
      {data ? (
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
      ) : hasStats ? (
        <div className="flex items-center justify-center py-8">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="ml-3 text-sm text-muted-foreground">Loading charts...</span>
        </div>
      ) : null}
    </div>
  );
}
