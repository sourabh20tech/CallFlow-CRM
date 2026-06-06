import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { isNotFoundError, toDbError } from "@/lib/db/errors";
import { followupsService } from "@/services/followups.service";
import { updateFollowupSchema } from "@/utils/validators";

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

/** Verify agent owns this follow-up; returns error response if not. */
async function assertAgentOwnership(
  followupId: string,
  profileId: string,
): Promise<NextResponse | null> {
  const followup = await followupsService.getById(followupId);
  if (!followup) {
    return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
  }
  const agentId = await resolveAgentId(profileId);
  if (followup.assignedAgentId !== agentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;
  const followup = await followupsService.getById(id);

  if (!followup) {
    return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
  }

  // Enforce agent data isolation
  if (auth.user.role === "agent") {
    const agentId = await resolveAgentId(auth.user.id);
    if (followup.assignedAgentId !== agentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(followup);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  // Enforce agent data isolation
  if (auth.user.role === "agent") {
    const forbidden = await assertAgentOwnership(id, auth.user.id);
    if (forbidden) return forbidden;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateFollowupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const payload = {
      ...parsed.data,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : undefined,
    };
    const followup = await followupsService.update(id, payload);
    return NextResponse.json(followup);
  } catch (error) {
    const message = toDbError(error, "Failed to update follow-up").message;
    console.error("[api/followups/:id] PATCH failed:", error);
    return NextResponse.json({ error: message }, { status: isNotFoundError(error) ? 404 : 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  // Enforce agent data isolation
  if (auth.user.role === "agent") {
    const forbidden = await assertAgentOwnership(id, auth.user.id);
    if (forbidden) return forbidden;
  }

  try {
    await followupsService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = toDbError(error, "Failed to delete follow-up").message;
    console.error("[api/followups/:id] DELETE failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
