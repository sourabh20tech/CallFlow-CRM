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
    ["Total revenue", formatCurrency(data.kpis.totalRevenue)],
    ["Revenue change (%)", data.kpis.revenueChange],
    ["Avg handle time (sec)", data.kpis.avgHandleTime],
    ["Avg satisfaction", data.kpis.avgSatisfaction],
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
        "CSAT (/5)": r.satisfaction,
      })),
    ),
    "Agent Performance",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      data.sales.map((r) => ({
        Period: r.period,
        Revenue: formatCurrency(r.revenue),
        Deals: r.deals,
        Pipeline: formatCurrency(r.pipeline),
        "Avg deal size": formatCurrency(r.avgDealSize),
      })),
    ),
    "Sales Analytics",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      data.performance.map((r) => ({
        Period: r.period,
        "CSAT (/5)": r.satisfaction,
        "Handle time (sec)": r.handleTime,
        "Resolution %": r.resolutionRate,
        "FCR %": r.firstCallResolution,
      })),
    ),
    "Performance",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      data.hourlyVolume.map((r) => ({
        Hour: r.hour,
        Inbound: r.inbound,
        Outbound: r.outbound,
        Total: r.inbound + r.outbound,
      })),
    ),
    "Hourly Volume",
  );

  const name =
    filename ??
    `crm-reports-${new Date(data.range.from).toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, name);
}
