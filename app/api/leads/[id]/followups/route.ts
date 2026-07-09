import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { requireLeadsAdminApi } from "@/lib/api/require-leads-admin";
import { agentPanelService } from "@/services/agent-panel.service";
import { followupsService } from "@/services/followups.service";
import { leadsService } from "@/services/leads.service";
import { scheduleFollowupSchema } from "@/utils/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function assertLeadAccess(leadId: string, role: string, agentId?: string) {
  if (role === "admin") return;
  if (!agentId) throw new Error("Agent context required");
  await agentPanelService.assertLeadOwnedByAgent(leadId, agentId);
}

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    if (auth.user.role === "agent") {
      const ctx = await import("@/lib/api/require-agent-context").then((m) =>
        m.requireAgentContextApi(),
      );
      if (ctx.error) return ctx.error;
      await assertLeadAccess(id, auth.user.role, ctx.agentId);
    }

    const followups = await leadsService.listFollowupsByLead(id);
    return NextResponse.json({ followups });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load follow-ups";
    const status = message.includes("access") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = scheduleFollowupSchema.safeParse({ ...(body as object), leadId: id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    if (auth.user.role === "agent") {
      const ctx = await import("@/lib/api/require-agent-context").then((m) =>
        m.requireAgentContextApi(),
      );
      if (ctx.error) return ctx.error;
      await assertLeadAccess(id, auth.user.role, ctx.agentId);
    } else {
      const admin = await requireLeadsAdminApi();
      if (admin.error) return admin.error;
    }

    const followup = await followupsService.create({
      leadId: id,
      title: parsed.data.title,
      description: parsed.data.description,
      dueAt: new Date(parsed.data.dueAt).toISOString(),
      assignedAgentId: parsed.data.assignedAgentId,
      priority: parsed.data.priority,
    });

    // Auto-update lead's next_follow_up_at
    try {
      await leadsService.update(id, { nextFollowUpAt: new Date(parsed.data.dueAt).toISOString() });
    } catch {
      // Non-critical
    }

    return NextResponse.json(followup, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to schedule follow-up";
    const status = message.includes("access") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
