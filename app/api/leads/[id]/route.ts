import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { requireLeadsAdminApi } from "@/lib/api/require-leads-admin";
import { logActivity } from "@/lib/activity/log-activity";
import { agentPanelService } from "@/services/agent-panel.service";
import { leadsService } from "@/services/leads.service";
import { updateLeadSchema } from "@/utils/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const lead = await leadsService.getById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (auth.user.role === "agent") {
      const ctx = await import("@/lib/api/require-agent-context").then((m) =>
        m.requireAgentContextApi(),
      );
      if (ctx.error) return ctx.error;
      await agentPanelService.assertLeadOwnedByAgent(id, ctx.agentId);
    }

    const notes = await leadsService.getNotes(
      id,
      auth.user.role === "agent",
      auth.user.role === "agent" ? auth.user.id : undefined,
    );
    return NextResponse.json({ lead, notes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load lead";
    const status = message.includes("access") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
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

  const parsed = updateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { nextFollowUpAt, assignedAgentId, email, phone, ...rest } = parsed.data;

  try {
    // Fetch current lead to capture old status for audit
    const existingLead = await leadsService.getById(id);
    const oldStatus = existingLead?.status;

    const lead = await leadsService.update(id, {
      ...rest,
      email: email === "" ? null : email,
      phone: phone === "" ? null : phone,
      assignedAgentId:
        assignedAgentId === null ? null : (assignedAgentId ?? undefined),
      nextFollowUpAt:
        nextFollowUpAt === null
          ? null
          : nextFollowUpAt
            ? new Date(nextFollowUpAt).toISOString()
            : undefined,
    });

    // Log status change specifically if status was changed
    if (rest.status && oldStatus && rest.status !== oldStatus) {
      logActivity({
        userId: auth.user.id,
        userName: auth.user.fullName ?? "Admin",
        role: auth.user.role as "admin" | "agent",
        actionType: "lead_status_changed",
        actionDescription: `Changed lead "${lead.fullName}" status: ${oldStatus} → ${rest.status}`,
        entityType: "lead",
        entityId: lead.id,
        metadata: { oldStatus, newStatus: rest.status },
      });
    } else {
      logActivity({
        userId: auth.user.id,
        userName: auth.user.fullName ?? "Admin",
        role: auth.user.role as "admin" | "agent",
        actionType: "lead_updated",
        actionDescription: `Updated lead "${lead.fullName}"`,
        entityType: "lead",
        entityId: lead.id,
        metadata: rest,
      });
    }

    return NextResponse.json(lead);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update lead";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireLeadsAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    await leadsService.delete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete lead";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
