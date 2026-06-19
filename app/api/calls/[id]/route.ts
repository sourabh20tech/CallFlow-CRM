import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { callsService } from "@/services/calls.service";
import { updateCallSchema } from "@/utils/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function resolveAgentId(profileId: string): Promise<string | undefined> {
  const { isSupabaseConfigured } = await import("@/lib/supabase/config");
  if (!isSupabaseConfigured()) return "agent-1";

  const { agentsDbServiceServer } = await import("@/services/db/agents.service");
  const agents = await agentsDbServiceServer.list(true);
  return agents.find((a) => a.profileId === profileId)?.id;
}

async function assertCallAccess(
  user: { id: string; role: string },
  callId: string,
): Promise<{ call: Awaited<ReturnType<typeof callsService.getById>>; error?: NextResponse }> {
  const call = await callsService.getById(callId);
  if (!call) {
    return { call: undefined, error: NextResponse.json({ error: "Call not found" }, { status: 404 }) };
  }

  if (user.role === "admin") {
    return { call };
  }

  const agentId = await resolveAgentId(user.id);
  if (!agentId || call.agentId !== agentId) {
    return { call, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { call };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;
  const access = await assertCallAccess(auth.user, id);
  if (access.error) return access.error;

  let notes = await callsService.getNotes(id);

  // For agents, filter notes to only show their own + shared notes
  if (auth.user.role === "agent") {
    notes = notes.filter(
      (note) => note.authorId === auth.user.id || note.visibility === "shared",
    );
  }

  return NextResponse.json({ call: access.call, notes });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateCallSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const access = await assertCallAccess(auth.user, id);
    if (access.error) return access.error;

    const call =
      parsed.data.status && Object.keys(parsed.data).length === 1
        ? await callsService.updateStatus(id, parsed.data.status)
        : await callsService.update(id, {
            status: parsed.data.status,
            durationSeconds: parsed.data.durationSeconds,
            summary: parsed.data.summary,
            direction: parsed.data.direction,
          });
    return NextResponse.json(call);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update call";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const access = await assertCallAccess(auth.user, id);
    if (access.error) return access.error;

    await callsService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete call";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
