import { FollowupsManagement } from "@/components/followups";
import { getDialLeads } from "@/lib/calls/dial-leads";
import { agentsService } from "@/services/agents.service";
import { followupsService } from "@/services/followups.service";
import type { Followup, FollowupStats, AgentFollowupSummary } from "@/types/followup";

export const metadata = {
  title: "Follow-Up Management",
  description: "Schedule, track pending tasks, and review completed follow-ups",
};

export default async function FollowUpsPage() {
  const dialLeads = await getDialLeads();
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
    const [pendingFollowups, summaryStats, allForReminders, summaries] = await Promise.all([
      followupsService.list({ view: "pending" }),
      followupsService.getStats(),
      followupsService.list({ view: "all" }),
      followupsService.getAgentSummaries(),
    ]);
    followups = pendingFollowups;
    stats = summaryStats;
    reminders = followupsService.getReminders(allForReminders);
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
