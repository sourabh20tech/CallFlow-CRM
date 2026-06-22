import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { toDbError } from "@/lib/db/errors";
import { followupsService } from "@/services/followups.service";
import { scheduleFollowupSchema } from "@/utils/validators";
import type { FollowupFilters, FollowupView } from "@/types/followup";

async function resolveAgentId(profileId: string): Promise<string | undefined> {
  const { isSupabaseConfigured } = await import("@/lib/supabase/config");
  if (!isSupabaseConfigured()) return "agent-1";
  const { agentsDbServiceServer } = await import("@/services/db/agents.service");
  const agents = await agentsDbServiceServer.list(true);
  const match = agents.find((a) => a.profileId === profileId);
  return match?.id;
}

export async function GET(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const view = (searchParams.get("view") as FollowupView) ?? "pending";
  const filters: FollowupFilters = {
    view,
    agentId: searchParams.get("agentId") ?? undefined,
    leadId: searchParams.get("leadId") ?? undefined,
    priority: (searchParams.get("priority") as FollowupFilters["priority"]) ?? "all",
    search: searchParams.get("search") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    status: (searchParams.get("status") as FollowupFilters["status"]) ?? undefined,
  };

  if (filters.priority === "all") delete filters.priority;
  if (!filters.agentId) delete filters.agentId;
  if (!filters.leadId) delete filters.leadId;
  if (!filters.search) delete filters.search;
  if (!filters.from) delete filters.from;
  if (!filters.to) delete filters.to;
  if (!filters.status || filters.status === "all") delete filters.status;

  // Enforce agent data isolation: agents can only see their own follow-ups
  if (auth.user.role === "agent") {
    const agentId = await resolveAgentId(auth.user.id);
    if (!agentId) {
      return NextResponse.json({ followups: [], total: 0, page: 1, pageSize: 50, totalPages: 1, stats: { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0, dueToday: 0 }, reminders: { overdue: [], dueToday: [], upcoming: [] }, agents: [] });
    }
    filters.agentId = agentId;
  }

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? "50") || 50),
  );
  const usePagination = searchParams.has("page") || searchParams.has("pageSize");

  try {
    const listResult = usePagination
      ? await followupsService.listPaginated(filters, { page, pageSize })
      : {
          followups: await followupsService.list(filters),
          total: 0,
          page: 1,
          pageSize: 50,
          totalPages: 1,
        };

    // For agents, scope stats and reminders to their own data
    const statsFilters = auth.user.role === "agent" ? { ...filters, view: "all" as const } : { view: "all" as const };
    const stats = await followupsService.getStats(statsFilters);
    const remindersData = await followupsService.list(
      auth.user.role === "agent" ? { agentId: filters.agentId, view: "all" } : { view: "all" },
    );
    const reminders = followupsService.getReminders(remindersData);
    const agents = auth.user.role === "admin"
      ? await followupsService.getAgentSummaries()
      : [];

    return NextResponse.json({
      followups: listResult.followups,
      total: usePagination ? listResult.total : listResult.followups.length,
      page: listResult.page,
      pageSize: listResult.pageSize,
      totalPages: listResult.totalPages,
      stats,
      reminders,
      agents,
    });
  } catch (error) {
    const message = toDbError(error, "Failed to load follow-ups").message;
    console.error("[api/followups] GET failed:", error);
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

  const parsed = scheduleFollowupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    // Agent can only create follow-ups for their own assigned leads
    if (auth.user.role === "agent" && parsed.data.leadId) {
      const agentId = await resolveAgentId(auth.user.id);
      if (!agentId) {
        return NextResponse.json({ error: "Agent profile not found" }, { status: 403 });
      }
      const { agentPanelService } = await import("@/services/agent-panel.service");
      try {
        await agentPanelService.assertLeadOwnedByAgent(parsed.data.leadId, agentId);
      } catch {
        return NextResponse.json({ error: "You do not have access to this lead" }, { status: 403 });
      }
    }

    const dueAt = new Date(parsed.data.dueAt).toISOString();
    const followup = await followupsService.create({
      ...parsed.data,
      dueAt,
    });
    return NextResponse.json(followup, { status: 201 });
  } catch (error) {
    const message = toDbError(error, "Failed to schedule follow-up").message;
    console.error("[api/followups] POST failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
