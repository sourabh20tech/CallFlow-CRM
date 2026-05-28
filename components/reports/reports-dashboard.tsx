"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/design-system/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ReportsFilterSection } from "@/components/reports/reports-filter-section";
import { ReportsSummaryCards } from "@/components/reports/reports-summary-cards";
import { ReportsExportActions } from "@/components/reports/reports-export-actions";
import { ReportsDashboardSkeleton } from "@/components/reports/reports-dashboard-skeleton";
import { ReportsOverviewSection } from "@/components/reports/sections/reports-overview-section";
import { ReportsDailySection } from "@/components/reports/sections/reports-daily-section";
import { ReportsConversionSection } from "@/components/reports/sections/reports-conversion-section";
import { ReportsAgentsSection } from "@/components/reports/sections/reports-agents-section";
import { ReportsSalesPerformanceSection } from "@/components/reports/sections/reports-sales-performance-section";
import { ReportsFollowupsSection } from "@/components/reports/sections/reports-followups-section";
import { toDatetimeLocalValue } from "@/lib/followups/datetime";
import type {
  LiveDashboardStats,
  ReportDatePreset,
  ReportPeriod,
  ReportsBundle,
} from "@/types/reports";
import { pageSection } from "@/lib/design-system/styles";

const LIVE_STATS_INTERVAL_MS = 60_000;

interface ReportsDashboardProps {
  initialData: ReportsBundle;
}

export function ReportsDashboard({ initialData }: ReportsDashboardProps) {
  const [data, setData] = useState(initialData);
  const [preset, setPreset] = useState<ReportDatePreset>(initialData.range.preset ?? "7d");
  const [customFrom, setCustomFrom] = useState(() =>
    toDatetimeLocalValue(initialData.range.from).slice(0, 10),
  );
  const [customTo, setCustomTo] = useState(() =>
    toDatetimeLocalValue(initialData.range.to).slice(0, 10),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [activePeriod, setActivePeriod] = useState<ReportPeriod | null>(null);
  const [liveStats, setLiveStats] = useState<LiveDashboardStats | null>(null);
  const skipNextFetch = useRef(true);
  const filterKey = `${preset}-${activePeriod ?? ""}-${customFrom}-${customTo}`;

  const chartKey = `${filterKey}-${data.range.from}-${data.range.to}`;

  const refresh = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      try {
        const params = new URLSearchParams();
        if (activePeriod) {
          params.set("period", activePeriod);
        } else {
          params.set("preset", preset);
          if (preset === "custom") {
            params.set("from", customFrom);
            params.set("to", customTo);
          }
        }
        const res = await fetch(`/api/reports?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load reports");
        const next = (await res.json()) as ReportsBundle;
        setData(next);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Refresh failed");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [preset, customFrom, customTo, activePeriod],
  );

  const fetchLiveStats = useCallback(async () => {
    try {
      const res = await fetch("/api/reports/stats");
      if (!res.ok) return;
      const body = (await res.json()) as { stats: LiveDashboardStats | null };
      if (body.stats) setLiveStats(body.stats);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const t = setTimeout(() => void refresh(true), 400);
    return () => clearTimeout(t);
  }, [filterKey, refresh]);

  useEffect(() => {
    void fetchLiveStats();
    const id = setInterval(() => void fetchLiveStats(), LIVE_STATS_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchLiveStats]);

  const displayKpis = liveStats
    ? {
        ...data.kpis,
        totalLeads: liveStats.totalLeads,
        convertedLeads: liveStats.convertedLeads,
        pendingFollowups: liveStats.pendingFollowups,
        totalCalls: liveStats.totalCalls,
        activeAgents: liveStats.activeAgents,
        conversionRate: liveStats.conversionRate,
      }
    : data.kpis;

  if (isLoading) {
    return <ReportsDashboardSkeleton />;
  }

  return (
    <div className={pageSection}>
      <PageHeader
        title="Reports & Analytics"
        description="Daily reports, lead conversion, agent performance, sales and performance graphs"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void refresh(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
            <ReportsExportActions data={data} />
          </div>
        }
      />

      <ReportsFilterSection
        preset={preset}
        range={data.range}
        customFrom={customFrom}
        customTo={customTo}
        activePeriod={activePeriod}
        onPresetChange={setPreset}
        onPeriodChange={setActivePeriod}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      <ReportsSummaryCards kpis={displayKpis} dataSource={data.source} />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="ds-animate-in space-y-[var(--ds-stack-gap)]"
      >
        <TabsList className="ds-glass flex h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="daily" className="text-xs sm:text-sm">
            Daily
          </TabsTrigger>
          <TabsTrigger value="conversion" className="text-xs sm:text-sm">
            Conversion
          </TabsTrigger>
          <TabsTrigger value="agents" className="text-xs sm:text-sm">
            Agents
          </TabsTrigger>
          <TabsTrigger value="followups" className="text-xs sm:text-sm">
            Follow-ups
          </TabsTrigger>
          <TabsTrigger value="sales" className="text-xs sm:text-sm">
            Sales
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm">
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <ReportsOverviewSection data={data} chartKey={chartKey} />
        </TabsContent>

        <TabsContent value="daily" className="mt-0">
          <ReportsDailySection data={data} chartKey={chartKey} />
        </TabsContent>

        <TabsContent value="conversion" className="mt-0">
          <ReportsConversionSection data={data.leadConversion} chartKey={chartKey} />
        </TabsContent>

        <TabsContent value="agents" className="mt-0">
          <ReportsAgentsSection data={data.agentPerformance} chartKey={chartKey} />
        </TabsContent>

        <TabsContent value="followups" className="mt-0">
          <ReportsFollowupsSection followups={data.followups} chartKey={chartKey} />
        </TabsContent>

        <TabsContent value="sales" className="mt-0">
          <ReportsSalesPerformanceSection
            sales={data.sales}
            performance={data.performance}
            chartKey={chartKey}
            variant="sales"
          />
        </TabsContent>

        <TabsContent value="performance" className="mt-0">
          <ReportsSalesPerformanceSection
            sales={data.sales}
            performance={data.performance}
            chartKey={chartKey}
            variant="performance"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
