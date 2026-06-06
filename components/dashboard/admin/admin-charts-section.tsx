"use client";

import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";
import type {
  AgentPerformanceDataPoint,
  DailyCallsDataPoint,
  LeadConversionDataPoint,
} from "@/types/dashboard";

const DailyCallsChart = dynamic(
  () => import("@/components/charts/dashboard/daily-calls-chart").then((m) => m.DailyCallsChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const LeadConversionChart = dynamic(
  () => import("@/components/charts/dashboard/lead-conversion-chart").then((m) => m.LeadConversionChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const AgentPerformanceChart = dynamic(
  () => import("@/components/charts/dashboard/agent-performance-chart").then((m) => m.AgentPerformanceChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return (
    <div className="h-[280px] animate-pulse rounded-xl border border-border/40 bg-muted/20" />
  );
}

interface AdminChartsSectionProps {
  dailyCalls: DailyCallsDataPoint[];
  leadConversion: LeadConversionDataPoint[];
  agentPerformance: AgentPerformanceDataPoint[];
  /** Changes on refresh to re-trigger chart animations */
  chartKey?: string;
}

export function AdminChartsSection({
  dailyCalls,
  leadConversion,
  agentPerformance,
  chartKey,
}: AdminChartsSectionProps) {
  const suffix = chartKey ? `-${chartKey}` : "";

  return (
    <section aria-label="Analytics charts" className="space-y-[var(--ds-stack-gap)]">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/25 to-indigo-500/20 ring-1 ring-violet-500/20">
          <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Analytics</h2>
          <p className="text-xs text-muted-foreground">Calls, conversion, and team performance</p>
        </div>
      </div>

      <div className="grid gap-[var(--ds-stack-gap)] lg:grid-cols-2">
        <div className="reports-chart-animate" style={{ animationDelay: "0ms" }}>
          <DailyCallsChart data={dailyCalls} gradientId={`admin-daily${suffix}`} />
        </div>
        <div className="reports-chart-animate" style={{ animationDelay: "80ms" }}>
          <LeadConversionChart data={leadConversion} />
        </div>
      </div>

      <div className="reports-chart-animate" style={{ animationDelay: "160ms" }}>
        <AgentPerformanceChart key={`agent${suffix}`} data={agentPerformance} />
      </div>
    </section>
  );
}
