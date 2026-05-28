"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportReportsToExcel } from "@/lib/reports/export-excel";
import { exportReportsToPdf } from "@/lib/reports/export-pdf";
import type { ReportsBundle } from "@/types/reports";

interface ReportsExportButtonProps {
  data: ReportsBundle | null;
  variant?: "default" | "outline" | "premium";
  size?: "sm" | "default";
  format?: "excel" | "pdf";
}

export function ReportsExportButton({
  data,
  variant = "outline",
  size = "sm",
  format = "excel",
}: ReportsExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!data) {
      toast.error("No report data to export");
      return;
    }
    setExporting(true);
    try {
      if (format === "pdf") {
        await exportReportsToPdf(data);
        toast.success("Report exported to PDF");
      } else {
        await exportReportsToExcel(data);
        toast.success("Report exported to Excel");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className="gap-1.5"
      disabled={exporting || !data}
      onClick={() => void handleExport()}
    >
      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {format === "pdf" ? "Export PDF" : "Export Excel"}
    </Button>
  );
}
