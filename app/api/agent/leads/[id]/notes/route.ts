import { NextResponse } from "next/server";
import { requireAgentContextApi } from "@/lib/api/require-agent-context";
import { agentPanelService } from "@/services/agent-panel.service";
import { leadsService } from "@/services/leads.service";
import { leadNoteSchema } from "@/utils/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const ctx = await requireAgentContextApi();
  if (ctx.error) return ctx.error;

  const { id } = await params;

  try {
    await agentPanelService.assertLeadOwnedByAgent(id, ctx.agentId);
    const lead = await leadsService.getById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const notes = await leadsService.getNotes(id, true); // exclude internal notes from agents
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
  const ctx = await requireAgentContextApi();
  if (ctx.error) return ctx.error;

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
    await agentPanelService.assertLeadOwnedByAgent(id, ctx.agentId);
    const lead = await leadsService.getById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Agents can only create public notes
    const note = await leadsService.addNote(id, parsed.data.content, "public");
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
