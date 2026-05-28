"use client";

import { BarChart3 } from "lucide-react";
import { DailyCallsChart } from "@/components/charts/dashboard/daily-calls-chart";
import { LeadConversionChart } from "@/components/charts/dashboard/lead-conversion-chart";
import { AgentPerformanceChart } from "@/components/charts/dashboard/agent-performance-chart";
import type {
  AgentPerformanceDataPoint,
  DailyCallsDataPoint,
  LeadConversionDataPoint,
} from "@/types/dashboard";

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
