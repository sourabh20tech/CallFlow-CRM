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

    // Auto-create bell notifications for due/overdue follow-ups (idempotent)
    if (reminders.overdue.length > 0 || reminders.dueToday.length > 0) {
      void createFollowupNotifications(auth.user.id, [...reminders.overdue, ...reminders.dueToday]);
    }

    return NextResponse.json({ ...reminders, total });
  } catch (error) {
    const message = toDbError(error, "Failed to load reminders").message;
    console.error("[api/followups/reminders] GET failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Create bell notifications for due follow-ups (skip if already created) */
async function createFollowupNotifications(userId: string, dueFollowups: import("@/types/followup").Followup[]) {
  try {
    const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();

    // Check which follow-ups already have notifications (prevent duplicates)
    const followupIds = dueFollowups.map((f) => f.id);
    const { data: existing } = await (supabase as any)
      .from("notifications")
      .select("title")
      .eq("recipient_id", userId)
      .like("title", "Follow-Up Due%")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const existingTitles = new Set((existing ?? []).map((n: any) => n.title));

    const newNotifications = dueFollowups
      .filter((f) => !existingTitles.has(`Follow-Up Due: ${f.title}`))
      .slice(0, 5) // Max 5 at a time to avoid spam
      .map((f) => ({
        recipient_id: userId,
        title: `Follow-Up Due: ${f.title}`,
        message: f.leadName ? `Lead: ${f.leadName} — ${new Date(f.dueAt).toLocaleString()}` : `Due: ${new Date(f.dueAt).toLocaleString()}`,
        priority: f.priority === "high" ? "urgent" : f.priority === "medium" ? "high" : "medium",
        is_read: false,
      }));

    if (newNotifications.length > 0) {
      await (supabase as any).from("notifications").insert(newNotifications);
    }
  } catch {
    // Non-critical — reminders still work via client-side toasts
  }
}
