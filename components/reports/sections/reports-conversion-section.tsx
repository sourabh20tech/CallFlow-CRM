"use client";

import { ConversionReportChart } from "@/components/reports/charts/conversion-report-chart";
import type { LeadConversionDataPoint } from "@/types/dashboard";

interface ReportsConversionSectionProps {
  data: LeadConversionDataPoint[];
  chartKey: string;
}

export function ReportsConversionSection({ data, chartKey }: ReportsConversionSectionProps) {
  return (
    <section aria-label="Lead conversion report">
      <ConversionReportChart data={data} chartKey={`conv-tab-${chartKey}`} />
    </section>
  );
}
