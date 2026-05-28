import { formatLeadStatus } from "@/lib/leads/constants";
import type { Lead } from "@/types/lead";

export async function exportLeadsToExcel(
  leads: Lead[],
  filename = "call-center-leads.xlsx",
): Promise<void> {
  const XLSX = await import("xlsx");

  const rows = leads.map((lead) => ({
    Name: lead.fullName,
    Email: lead.email ?? "",
    Phone: lead.phone ?? "",
    Company: lead.company ?? "",
    Tier: lead.tier,
    Status: formatLeadStatus(lead.status),
    Source: lead.source ?? "",
    Agent: lead.assignedAgentName ?? "",
    "Next follow-up": lead.nextFollowUpAt
      ? new Date(lead.nextFollowUpAt).toLocaleString()
      : "",
    "Last contacted": lead.lastContactedAt
      ? new Date(lead.lastContactedAt).toLocaleString()
      : "",
    Converted: lead.convertedAt ? new Date(lead.convertedAt).toLocaleString() : "",
    Created: new Date(lead.createdAt).toLocaleString(),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      ["Call Center CRM — Leads Export"],
      ["Generated", new Date().toLocaleString()],
      ["Total records", leads.length],
      [],
      ...rows.length
        ? []
        : [["No leads matched the current filters."]],
    ]),
    "Info",
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Leads");

  XLSX.writeFile(wb, filename);
}
