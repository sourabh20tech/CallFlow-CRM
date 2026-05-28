import { NextResponse } from "next/server";
import { requireAgentsAdminApi } from "@/lib/api/require-agents-admin";
import { isAgentEmailExistsError } from "@/lib/agents/errors";
import { agentsService } from "@/services/agents.service";
import { updateAgentSchema } from "@/utils/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAgentsAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;
  const agent = await agentsService.getById(id);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json(agent);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAgentsAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const agent = await agentsService.update(id, parsed.data);
    return NextResponse.json(agent);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update agent";
    const status = isAgentEmailExistsError(error) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAgentsAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    await agentsService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete agent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
