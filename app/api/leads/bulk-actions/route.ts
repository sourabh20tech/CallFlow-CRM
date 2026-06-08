import { NextResponse } from "next/server";
import { requireLeadsAdminApi } from "@/lib/api/require-leads-admin";
import { leadsService } from "@/services/leads.service";
import type { LeadStatus } from "@/types/lead";

interface BulkActionPayload {
  action: "assign" | "status" | "delete";
  leadIds: string[];
  agentId?: string;
  status?: LeadStatus;
}

export async function POST(request: Request) {
  const auth = await requireLeadsAdminApi();
  if (auth.error) return auth.error;

  let body: BulkActionPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, leadIds, agentId, status } = body;

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ error: "No leads selected" }, { status: 400 });
  }

  if (leadIds.length > 100) {
    return NextResponse.json({ error: "Maximum 100 leads per bulk action" }, { status: 400 });
  }

  let successCount = 0;
  let failCount = 0;

  for (const leadId of leadIds) {
    try {
      switch (action) {
        case "assign":
          await leadsService.assign(leadId, agentId ?? null);
          successCount++;
          break;
        case "status":
          if (status) {
            await leadsService.updateStatus(leadId, status);
            successCount++;
          }
          break;
        case "delete":
          await leadsService.delete(leadId);
          successCount++;
          break;
        default:
          failCount++;
      }
    } catch {
      failCount++;
    }
  }

  return NextResponse.json({ success: successCount, failed: failCount, total: leadIds.length });
}
