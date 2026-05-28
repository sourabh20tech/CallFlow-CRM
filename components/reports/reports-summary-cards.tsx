"use client";

import { ReportsKpiRow } from "@/components/reports/reports-kpi-row";
import type { ReportsKpiSummary } from "@/types/reports";
import { cn } from "@/lib/utils";

interface ReportsSummaryCardsProps {
  kpis: ReportsKpiSummary;
  className?: string;
  dataSource?: "supabase" | "demo";
}

/** KPI summary row for the analytics dashboard */
export function ReportsSummaryCards({ kpis, className, dataSource }: ReportsSummaryCardsProps) {
  return (
    <section aria-label="Report summary" className={cn(className)}>
      {dataSource === "demo" && (
        <p className="mb-2 text-xs text-muted-foreground">
          Showing demo analytics — configure Supabase for live data.
        </p>
      )}
      <ReportsKpiRow kpis={kpis} />
    </section>
  );
}
