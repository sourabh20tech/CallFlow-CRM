"use client";

import { BarChart3 } from "lucide-react";
import { DailyReportChart } from "@/components/reports/charts/daily-report-chart";
import { ConversionReportChart } from "@/components/reports/charts/conversion-report-chart";
import { AgentReportChart } from "@/components/reports/charts/agent-report-chart";
import { SalesAnalyticsChart } from "@/components/reports/charts/sales-analytics-chart";
import { PerformanceAnalyticsChart } from "@/components/reports/charts/performance-analytics-chart";
import { HourlyVolumeChart } from "@/components/reports/charts/hourly-volume-chart";
import type { ReportsBundle } from "@/types/reports";

interface ReportsOverviewSectionProps {
  data: ReportsBundle;
  chartKey: string;
}

export function ReportsOverviewSection({ data, chartKey }: ReportsOverviewSectionProps) {
  return (
    <section aria-label="Analytics overview" className="space-y-[var(--ds-stack-gap)]">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/25 to-indigo-500/20 ring-1 ring-violet-500/20">
          <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Analytics overview</h2>
          <p className="text-xs text-muted-foreground">All key metrics for the selected period</p>
        </div>
      </div>

      <div className="grid gap-[var(--ds-stack-gap)] lg:grid-cols-2">
        <DailyReportChart data={data.daily} chartKey={`daily-${chartKey}`} />
        <ConversionReportChart data={data.leadConversion} chartKey={`conv-${chartKey}`} />
      </div>
      <AgentReportChart data={data.agentPerformance} chartKey={`agent-${chartKey}`} />
      <div className="grid gap-[var(--ds-stack-gap)] lg:grid-cols-2">
        <SalesAnalyticsChart data={data.sales} chartKey={`sales-${chartKey}`} />
        <PerformanceAnalyticsChart data={data.performance} chartKey={`perf-${chartKey}`} />
      </div>
      <HourlyVolumeChart data={data.hourlyVolume} chartKey={`hour-${chartKey}`} />
    </section>
  );
}
