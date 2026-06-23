"use client";

import { DailyReportChart } from "@/components/reports/charts/daily-report-chart";
import type { ReportsBundle } from "@/types/reports";

interface ReportsDailySectionProps {
  data: ReportsBundle;
  chartKey: string;
}

export function ReportsDailySection({ data, chartKey }: ReportsDailySectionProps) {
  return (
    <section aria-label="Daily reports" className="space-y-[var(--ds-stack-gap)]">
      <DailyReportChart data={data.daily} chartKey={`daily-tab-${chartKey}`} />
    </section>
  );
}
