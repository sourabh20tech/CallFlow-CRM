import { NextResponse } from "next/server";
import { requireAgentsAdminApi } from "@/lib/api/require-agents-admin";
import { isAgentEmailExistsError } from "@/lib/agents/errors";
import { agentsService } from "@/services/agents.service";
import { createAgentSchema } from "@/utils/validators";

export async function GET() {
  const auth = await requireAgentsAdminApi();
  if (auth.error) return auth.error;

  try {
    const agents = await agentsService.getAll(true);
    return NextResponse.json(agents, {
      headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=60" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load agents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAgentsAdminApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const agent = await agentsService.create(parsed.data);
    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create agent";
    const status = isAgentEmailExistsError(error) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
