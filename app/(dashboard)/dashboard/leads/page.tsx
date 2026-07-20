import { LeadsManagement } from "@/components/leads";
import { DEFAULT_PAGE_SIZE } from "@/lib/db/pagination";
import { getServerUser } from "@/lib/auth/session.server";
import { leadsService } from "@/services/leads.service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
import type { Lead, LeadRosterAgent } from "@/types/lead";

export const metadata = {
  title: "Leads",
  description: "Manage prospects, assignments, and pipeline",
};

export default async function LeadsPage() {
  // Server-side prefetch for instant page load (no client waterfall)
  let initialLeads: Lead[] = [];
  let initialAgents: LeadRosterAgent[] = [];
  let initialTotal = 0;
  let initialTotalPages = 1;

  if (isSupabaseConfigured()) {
    try {
      const user = await getServerUser();
      const agentId = user?.role === "agent" ? await resolveAgentId(user.id) : undefined;
      const [result, agents] = await Promise.all([
        leadsService.list(undefined, { agentId, page: 1, pageSize: DEFAULT_PAGE_SIZE }),
        leadsService.getRosterAgents(),
      ]);
      initialLeads = result.data;
      initialTotal = result.total;
      initialTotalPages = result.totalPages;
      initialAgents = agents;
    } catch {
      // Fall back to client-side fetch
    }
  }

  return (
    <LeadsManagement
      initialLeads={initialLeads}
      initialAgents={initialAgents}
      initialTotal={initialTotal}
      initialTotalPages={initialTotalPages}
    />
  );
}

async function resolveAgentId(profileId: string): Promise<string | undefined> {
  const { agentsDbServiceServer } = await import("@/services/db/agents.service");
  const agents = await agentsDbServiceServer.list(true);
  const match = agents.find((a) => a.profileId === profileId);
  return match?.id;
}
