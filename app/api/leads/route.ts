import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { requireLeadsAdminApi } from "@/lib/api/require-leads-admin";
import { leadsService } from "@/services/leads.service";
import { createLeadSchema } from "@/utils/validators";
import type { LeadListFilters } from "@/types/lead";

export async function GET(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const filters: LeadListFilters = {
    status: (searchParams.get("status") as LeadListFilters["status"]) ?? "all",
    tier: (searchParams.get("tier") as LeadListFilters["tier"]) ?? "all",
    assignedAgentId:
      (searchParams.get("assignedAgentId") as LeadListFilters["assignedAgentId"]) ?? "all",
    search: searchParams.get("search") ?? undefined,
  };

  if (filters.status === "all") delete filters.status;
  if (filters.tier === "all") delete filters.tier;
  if (filters.assignedAgentId === "all") delete filters.assignedAgentId;
  if (!filters.search) delete filters.search;

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? "20") || 20),
  );

  try {
    const agentId = auth.user.role === "agent" ? await resolveAgentId(auth.user.id) : undefined;
    const [result, agents] = await Promise.all([
      leadsService.list(filters, { agentId, page, pageSize }),
      leadsService.getRosterAgents(),
    ]);

    return NextResponse.json({
      leads: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      agents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireLeadsAdminApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { nextFollowUpAt, assignedAgentId, email, phone, ...rest } = parsed.data;

  try {
    const lead = await leadsService.create({
      ...rest,
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      assignedAgentId: assignedAgentId ?? undefined,
      nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : undefined,
    });
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create lead";
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
