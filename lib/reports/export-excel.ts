import type { ReportsBundle } from "@/types/reports";
import { formatRangeLabel } from "@/lib/reports/date-range";
import { formatCurrency } from "@/utils/format";

export async function exportReportsToExcel(
  data: ReportsBundle,
  filename?: string,
): Promise<void> {
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  const summaryRows = [
    ["Call Center CRM — Analytics Export"],
    ["Date range", formatRangeLabel(data.range)],
    ["Generated", new Date(data.generatedAt).toLocaleString()],
    [],
    ["KPI", "Value"],
    ["Total calls", data.kpis.totalCalls],
    ["Answered rate (%)", data.kpis.answeredRate],
    ["Conversion rate (%)", data.kpis.conversionRate],
    ["Total Fund", formatCurrency(data.kpis.totalFund)],
    ["Fund change (%)", data.kpis.fundChange],
    ["Avg handle time (sec)", data.kpis.avgHandleTime],
    ["Active agents", data.kpis.activeAgents],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), "Summary");

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      data.daily.map((r) => ({
        Period: r.day,
        "Total calls": r.calls,
        Answered: r.answered,
        "Answer rate %": r.calls ? Math.round((r.answered / r.calls) * 100) : 0,
      })),
    ),
    "Daily Report",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      data.leadConversion.map((r) => ({
        Period: r.month,
        Leads: r.leads,
        Converted: r.converted,
        "Conversion %": r.leads ? Math.round((r.converted / r.leads) * 100) : 0,
      })),
    ),
    "Lead Conversion",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      data.agentPerformance.map((r) => ({
        Agent: r.name,
        Calls: r.calls,
        Conversions: r.conversions,
      })),
    ),
    "Agent Performance",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      data.performance.map((r) => ({
        Period: r.period,
        "Handle time (sec)": r.handleTime,
        "Resolution %": r.resolutionRate,
        "FCR %": r.firstCallResolution,
      })),
    ),
    "Performance",
  );

  const name =
    filename ??
    `crm-reports-${new Date(data.range.from).toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, name);
}
