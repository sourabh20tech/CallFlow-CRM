import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { isNotFoundError, toDbError } from "@/lib/db/errors";
import { followupsService } from "@/services/followups.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function resolveAgentId(profileId: string): Promise<string | undefined> {
  const { isSupabaseConfigured } = await import("@/lib/supabase/config");
  if (!isSupabaseConfigured()) return "agent-1";
  const { agentsDbServiceServer } = await import("@/services/db/agents.service");
  const agents = await agentsDbServiceServer.list(true);
  const match = agents.find((a) => a.profileId === profileId);
  return match?.id;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  // Enforce agent data isolation
  if (auth.user.role === "agent") {
    const followup = await followupsService.getById(id);
    if (!followup) {
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
    }
    const agentId = await resolveAgentId(auth.user.id);
    if (followup.assignedAgentId !== agentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const followup = await followupsService.complete(id);
    return NextResponse.json(followup);
  } catch (error) {
    const message = toDbError(error, "Failed to complete follow-up").message;
    console.error("[api/followups/:id/complete] POST failed:", error);
    return NextResponse.json({ error: message }, { status: isNotFoundError(error) ? 404 : 500 });
  }
}
