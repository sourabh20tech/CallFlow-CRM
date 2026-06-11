import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { toDbError } from "@/lib/db/errors";
import { followupsService } from "@/services/followups.service";
import type { FollowupFilters } from "@/types/followup";

async function resolveAgentId(profileId: string): Promise<string | undefined> {
  const { isSupabaseConfigured } = await import("@/lib/supabase/config");
  if (!isSupabaseConfigured()) return "agent-1";
  const { agentsDbServiceServer } = await import("@/services/db/agents.service");
  const agents = await agentsDbServiceServer.list(true);
  const match = agents.find((a) => a.profileId === profileId);
  return match?.id;
}

/** Lightweight poll endpoint for due/overdue follow-up reminders. */
export async function GET() {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  try {
    // Scope reminders to agent's own follow-ups
    const filters: FollowupFilters = { view: "all" };
    if (auth.user.role === "agent") {
      const agentId = await resolveAgentId(auth.user.id);
      if (!agentId) {
        return NextResponse.json({ overdue: [], dueToday: [], upcoming: [], total: 0 });
      }
      filters.agentId = agentId;
    }

    const all = await followupsService.list(filters);
    const reminders = followupsService.getReminders(all);
    const total =
      reminders.overdue.length + reminders.dueToday.length + reminders.upcoming.length;

    return NextResponse.json({ ...reminders, total });
  } catch (error) {
    const message = toDbError(error, "Failed to load reminders").message;
    console.error("[api/followups/reminders] GET failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
