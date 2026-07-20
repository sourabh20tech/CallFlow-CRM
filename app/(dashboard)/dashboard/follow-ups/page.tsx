import { FollowupsManagement } from "@/components/followups";
import { getDialLeads } from "@/lib/calls/dial-leads";
import { getServerUser } from "@/lib/auth/session.server";
import { agentsService } from "@/services/agents.service";
import { followupsService } from "@/services/followups.service";
import type { Followup, FollowupStats, AgentFollowupSummary } from "@/types/followup";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Follow-Up Management",
  description: "Schedule, track pending tasks, and review completed follow-ups",
};

async function resolveAgentIdForServer(profileId: string): Promise<string | undefined> {
  try {
    const { agentsDbServiceServer } = await import("@/services/db/agents.service");
    const agents = await agentsDbServiceServer.list(true);
    return agents.find((a) => a.profileId === profileId)?.id;
  } catch {
    return undefined;
  }
}

export default async function FollowUpsPage() {
  const user = await getServerUser();
  const agentId = user?.role === "agent" ? await resolveAgentIdForServer(user.id) : undefined;
  const dialLeads = await getDialLeads(agentId);
  const agents = await agentsService.getAll(false);
  const rosterAgents = agents.map((a) => ({ id: a.id, name: a.name }));

  let followups: Followup[] = [];
  let stats: FollowupStats = {
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0,
  };
  let reminders = { overdue: [] as Followup[], dueToday: [] as Followup[], upcoming: [] as Followup[] };
  let agentSummaries: AgentFollowupSummary[] = [];
  let initialLoadError: string | undefined;

  try {
    // Scope follow-ups to agent if applicable
    const listFilters = agentId ? { view: "all" as const, agentId } : { view: "all" as const };

    const [allFollowups, summaries] = await Promise.all([
      followupsService.list(listFilters),
      user?.role === "admin" ? followupsService.getAgentSummaries() : Promise.resolve([]),
    ]);

    followups = allFollowups.filter(
      (f) => f.status === "pending" || f.status === "in_progress",
    );
    const { followupsDbServiceServer } = await import("@/services/db/followups.service");
    stats = followupsDbServiceServer.computeStats(allFollowups);
    reminders = followupsService.getReminders(allFollowups);
    agentSummaries = summaries;
  } catch (error) {
    initialLoadError =
      error instanceof Error && error.message.trim()
        ? error.message
        : "Failed to load follow-ups. Please apply DB stabilization migration and refresh.";
  }

  return (
    <FollowupsManagement
      initialFollowups={followups}
      initialStats={stats}
      initialReminders={reminders}
      initialAgents={agentSummaries}
      dialLeads={dialLeads}
      rosterAgents={rosterAgents}
      initialLoadError={initialLoadError}
    />
  );
}
