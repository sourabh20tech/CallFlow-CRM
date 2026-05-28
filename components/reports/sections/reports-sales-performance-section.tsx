"use client";

import { SalesAnalyticsChart } from "@/components/reports/charts/sales-analytics-chart";
import { PerformanceAnalyticsChart } from "@/components/reports/charts/performance-analytics-chart";
import type { PerformanceAnalyticsPoint, SalesAnalyticsPoint } from "@/types/reports";

interface ReportsSalesPerformanceSectionProps {
  sales: SalesAnalyticsPoint[];
  performance: PerformanceAnalyticsPoint[];
  chartKey: string;
  variant: "sales" | "performance" | "both";
}

export function ReportsSalesPerformanceSection({
  sales,
  performance,
  chartKey,
  variant,
}: ReportsSalesPerformanceSectionProps) {
  if (variant === "sales") {
    return (
      <section aria-label="Sales graph">
        <SalesAnalyticsChart data={sales} chartKey={`sales-tab-${chartKey}`} />
      </section>
    );
  }

  if (variant === "performance") {
    return (
      <section aria-label="Performance graph">
        <PerformanceAnalyticsChart data={performance} chartKey={`perf-tab-${chartKey}`} />
      </section>
    );
  }

  return (
    <section
      aria-label="Sales and performance graphs"
      className="grid gap-[var(--ds-stack-gap)] lg:grid-cols-2"
    >
      <SalesAnalyticsChart data={sales} chartKey={`sales-${chartKey}`} />
      <PerformanceAnalyticsChart data={performance} chartKey={`perf-${chartKey}`} />
    </section>
  );
}
