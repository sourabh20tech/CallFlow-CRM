import { NextResponse } from "next/server";
import { requireLeadsAdminApi } from "@/lib/api/require-leads-admin";
import { logActivity } from "@/lib/activity/log-activity";
import { leadsService } from "@/services/leads.service";
import { assignLeadSchema } from "@/utils/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireLeadsAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = assignLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    // Get lead before reassignment to log old agent
    const existingLead = await leadsService.getById(id);
    const oldAgentId = existingLead?.assignedAgentId;

    const lead = await leadsService.assign(id, parsed.data.assignedAgentId);

    logActivity({
      userId: auth.user.id,
      userName: auth.user.fullName ?? "Admin",
      role: "admin",
      actionType: "lead_assigned",
      actionDescription: `Reassigned lead "${lead.fullName}" to ${lead.assignedAgentName ?? "unassigned"}`,
      entityType: "lead",
      entityId: lead.id,
      metadata: { oldAgentId, newAgentId: parsed.data.assignedAgentId },
    });

    return NextResponse.json(lead);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign lead";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
