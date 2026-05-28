import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { requireLeadsAdminApi } from "@/lib/api/require-leads-admin";
import { agentPanelService } from "@/services/agent-panel.service";
import { leadsService } from "@/services/leads.service";
import { leadNoteSchema } from "@/utils/validators";

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

    const lead = await leadsService.getById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const notes = await leadsService.getNotes(id);
    return NextResponse.json({ notes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load notes";
    const status = message.includes("not found")
      ? 404
      : message.includes("access") || message.includes("permission")
        ? 403
        : 500;
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

  const parsed = leadNoteSchema.safeParse(body);
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

    const lead = await leadsService.getById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const note = await leadsService.addNote(id, parsed.data.content);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add note";
    const status = message.includes("not found")
      ? 404
      : message.includes("access") || message.includes("permission")
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
