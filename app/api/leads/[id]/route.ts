import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { requireLeadsAdminApi } from "@/lib/api/require-leads-admin";
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

    const notes = await leadsService.getNotes(id);
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
