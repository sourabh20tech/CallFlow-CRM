"use client";

import { ReportsExportButton } from "@/components/reports/reports-export-button";
import type { ReportsBundle } from "@/types/reports";

interface ReportsExportActionsProps {
  data: ReportsBundle | null;
}

/** Export controls for the reports bundle */
export function ReportsExportActions({ data }: ReportsExportActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <ReportsExportButton data={data} variant="premium" size="sm" format="excel" />
      <ReportsExportButton data={data} variant="outline" size="sm" format="pdf" />
    </div>
  );
}
