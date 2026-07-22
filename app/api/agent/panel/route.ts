import { NextResponse } from "next/server";
import { requireAgentContextApi } from "@/lib/api/require-agent-context";
import { agentPanelService } from "@/services/agent-panel.service";

export async function GET() {
  const ctx = await requireAgentContextApi();
  if (ctx.error) return ctx.error;

  try {
    // Pass pre-resolved agentId to avoid duplicate query
    const panel = await agentPanelService.getPanel(ctx.user, ctx.agentId);
    return NextResponse.json(panel, {
      headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=60" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load agent panel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
