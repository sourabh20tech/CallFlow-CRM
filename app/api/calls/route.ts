import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { toDbError } from "@/lib/db/errors";
import { callsService } from "@/services/calls.service";
import { logCallSchema } from "@/utils/validators";
import type { CallFilters } from "@/types/call";

function parseFilters(searchParams: URLSearchParams): CallFilters {
  const filters: CallFilters = {
    status: (searchParams.get("status") as CallFilters["status"]) ?? "all",
    direction: (searchParams.get("direction") as CallFilters["direction"]) ?? "all",
    search: searchParams.get("search") ?? undefined,
    agentId: searchParams.get("agentId") ?? undefined,
    leadId: searchParams.get("leadId") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  };

  if (!filters.status || filters.status === "all") delete filters.status;
  if (!filters.direction || filters.direction === "all") delete filters.direction;
  if (!filters.search) delete filters.search;
  if (!filters.agentId || filters.agentId === "all") delete filters.agentId;
  if (!filters.leadId || filters.leadId === "all") delete filters.leadId;
  if (!filters.dateFrom) delete filters.dateFrom;
  if (!filters.dateTo) delete filters.dateTo;

  return filters;
}

export async function GET(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const filters = parseFilters(searchParams);

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? "20") || 20),
  );

  try {
    if (auth.user.role === "agent") {
      const agentId = await resolveAgentId(auth.user.id);
      if (agentId) filters.agentId = agentId;
    }

    const [result, stats, agents] = await Promise.all([
      callsService.list(filters, { page, pageSize }),
      callsService.getStats(filters),
      auth.user.role === "admin" ? loadAgentRoster() : Promise.resolve([]),
    ]);

    return NextResponse.json({
      calls: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      stats,
      agents,
    });
  } catch (error) {
    const message = toDbError(error, "Failed to load calls").message;
    console.error("[api/calls] GET failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = logCallSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const agentId =
      auth.user.role === "admin" && parsed.data.agentId
        ? parsed.data.agentId
        : auth.user.role === "agent"
          ? await resolveAgentId(auth.user.id)
          : parsed.data.agentId;

    const call = await callsService.create({
      leadId: parsed.data.leadId,
      direction: parsed.data.direction,
      status: parsed.data.status,
      durationSeconds: parsed.data.durationSeconds,
      summary: parsed.data.summary,
      agentId: agentId ?? undefined,
    });
    return NextResponse.json(call, { status: 201 });
  } catch (error) {
    const message = toDbError(error, "Failed to log call").message;
    console.error("[api/calls] POST failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function resolveAgentId(profileId: string): Promise<string | undefined> {
  const { isSupabaseConfigured } = await import("@/lib/supabase/config");
  if (!isSupabaseConfigured()) {
    return "agent-1";
  }
  const { agentsDbServiceServer } = await import("@/services/db/agents.service");
  const agents = await agentsDbServiceServer.list(true);
  const match = agents.find((a) => a.profileId === profileId);
  return match?.id;
}

async function loadAgentRoster(): Promise<{ id: string; name: string }[]> {
  const { isSupabaseConfigured } = await import("@/lib/supabase/config");
  if (!isSupabaseConfigured()) {
    return [
      { id: "agent-1", name: "Alex Morgan" },
      { id: "agent-2", name: "Jordan Lee" },
    ];
  }
  const { agentsDbServiceServer } = await import("@/services/db/agents.service");
  const agents = await agentsDbServiceServer.list(true);
  return agents.map((a) => ({ id: a.id, name: a.name }));
}
