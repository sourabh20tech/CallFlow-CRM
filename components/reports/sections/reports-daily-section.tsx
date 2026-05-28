"use client";

import { DailyReportChart } from "@/components/reports/charts/daily-report-chart";
import { HourlyVolumeChart } from "@/components/reports/charts/hourly-volume-chart";
import type { ReportsBundle } from "@/types/reports";

interface ReportsDailySectionProps {
  data: ReportsBundle;
  chartKey: string;
}

export function ReportsDailySection({ data, chartKey }: ReportsDailySectionProps) {
  return (
    <section aria-label="Daily reports" className="space-y-[var(--ds-stack-gap)]">
      <DailyReportChart data={data.daily} chartKey={`daily-tab-${chartKey}`} />
      <HourlyVolumeChart data={data.hourlyVolume} chartKey={`hour-tab-${chartKey}`} />
    </section>
  );
}
