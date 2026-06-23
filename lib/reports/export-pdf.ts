import type { ReportsBundle } from "@/types/reports";
import { formatRangeLabel } from "@/lib/reports/date-range";
import { formatCurrency } from "@/utils/format";

export async function exportReportsToPdf(data: ReportsBundle, filename?: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 48;

  const addHeading = (text: string) => {
    if (y > pageHeight - 100) {
      doc.addPage();
      y = 48;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(text, 40, y);
    y += 18;
  };

  const addLine = (label: string, value: string | number) => {
    if (y > pageHeight - 70) {
      doc.addPage();
      y = 48;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`${label}: ${value}`, 48, y);
    y += 14;
  };

  const addDivider = () => {
    doc.setDrawColor(220);
    doc.line(40, y, pageWidth - 40, y);
    y += 14;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CallFlow CRM - Reports Export", 40, y);
  y += 22;

  addLine("Date range", formatRangeLabel(data.range));
  addLine("Generated", new Date(data.generatedAt).toLocaleString());
  addDivider();

  addHeading("KPIs");
  addLine("Total calls", data.kpis.totalCalls);
  addLine("Answered rate (%)", data.kpis.answeredRate);
  addLine("Conversion rate (%)", data.kpis.conversionRate);
  addLine("Total Fund", formatCurrency(data.kpis.totalFund));
  addLine("Fund change (%)", data.kpis.fundChange);
  addLine("Avg handle time (sec)", data.kpis.avgHandleTime);
  addLine("Active agents", data.kpis.activeAgents);
  addDivider();

  addHeading("Daily Report");
  data.daily.slice(0, 20).forEach((row) => {
    addLine(
      row.day,
      `Calls ${row.calls}, Answered ${row.answered}, Rate ${
        row.calls ? Math.round((row.answered / row.calls) * 100) : 0
      }%`,
    );
  });
  addDivider();

  addHeading("Lead Conversion");
  data.leadConversion.slice(0, 20).forEach((row) => {
    addLine(
      row.month,
      `Leads ${row.leads}, Converted ${row.converted}, Rate ${
        row.leads ? Math.round((row.converted / row.leads) * 100) : 0
      }%`,
    );
  });

  const name =
    filename ?? `crm-reports-${new Date(data.range.from).toISOString().slice(0, 10)}.pdf`;
  doc.save(name);
}
