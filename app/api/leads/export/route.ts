import { NextResponse } from "next/server";
import { requireLeadsAdminApi } from "@/lib/api/require-leads-admin";
import { leadsService } from "@/services/leads.service";
import type { LeadListFilters } from "@/types/lead";

export async function GET(request: Request) {
  const auth = await requireLeadsAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const filters: LeadListFilters = {
    status: (searchParams.get("status") as LeadListFilters["status"]) ?? "all",
    force: (searchParams.get("force") as LeadListFilters["force"]) ?? "all",
    assignedAgentId:
      (searchParams.get("assignedAgentId") as LeadListFilters["assignedAgentId"]) ?? "all",
    search: searchParams.get("search") ?? undefined,
  };

  if (filters.status === "all") delete filters.status;
  if (filters.force === "all") delete filters.force;
  if (filters.assignedAgentId === "all") delete filters.assignedAgentId;

  try {
    const leads = await leadsService.listAll(filters);

    const XLSX = await import("xlsx");
    const rows = leads.map((lead) => ({
      Name: lead.fullName,
      Email: lead.email ?? "",
      Phone: lead.phone ?? "",
      Company: lead.company ?? "",
      Force: lead.force,
      Status: lead.status,
      Agent: lead.assignedAgentName ?? "",
      "Next follow-up": lead.nextFollowUpAt ?? "",
      Created: lead.createdAt,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Leads");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="leads-export-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
