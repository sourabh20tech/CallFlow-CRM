"use client";

import { AgentReportChart } from "@/components/reports/charts/agent-report-chart";
import type { AgentPerformanceDataPoint } from "@/types/dashboard";

interface ReportsAgentsSectionProps {
  data: AgentPerformanceDataPoint[];
  chartKey: string;
}

export function ReportsAgentsSection({ data, chartKey }: ReportsAgentsSectionProps) {
  return (
    <section aria-label="Agent performance report">
      <AgentReportChart data={data} chartKey={`agent-tab-${chartKey}`} />
    </section>
  );
}
