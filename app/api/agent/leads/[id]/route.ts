import { NextResponse } from "next/server";
import { requireAgentContextApi } from "@/lib/api/require-agent-context";
import { logActivity } from "@/lib/activity/log-activity";
import { agentPanelService } from "@/services/agent-panel.service";
import { leadsService } from "@/services/leads.service";
import { updateLeadStatusSchema } from "@/utils/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAgentContextApi();
  if (ctx.error) return ctx.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateLeadStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await agentPanelService.assertLeadOwnedByAgent(id, ctx.agentId);

    // Fetch current lead to capture old status for audit
    const existingLead = await leadsService.getById(id);
    const oldStatus = existingLead?.status ?? "unknown";

    const lead = await leadsService.updateStatus(id, parsed.data.status);

    logActivity({
      userId: ctx.user.id,
      userName: ctx.user.fullName ?? "Agent",
      role: "agent",
      actionType: "lead_status_changed",
      actionDescription: `Changed lead "${lead.fullName}" status: ${oldStatus} → ${parsed.data.status}`,
      entityType: "lead",
      entityId: lead.id,
      metadata: { oldStatus, newStatus: parsed.data.status },
    });

    return NextResponse.json(lead);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update lead";
    const status = message.includes("not found") ? 404 : message.includes("access") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
