import { CallsManagement } from "@/components/calls";
import { EMPTY_CALL_STATS } from "@/lib/db/call-logs-query";
import { getDialLeads } from "@/lib/calls/dial-leads";
import { buildPaginatedResult, DEFAULT_PAGE_SIZE } from "@/lib/db/pagination";
import { callsService } from "@/services/calls.service";
import { getServerUser } from "@/lib/auth/session.server";
import type { CallStats } from "@/types/call";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Call Management",
  description: "Dial, log calls, notes, and call history",
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

export default async function CallsPage() {
  const user = await getServerUser();
  const agentId = user?.role === "agent" ? await resolveAgentIdForServer(user.id) : undefined;
  const dialLeads = await getDialLeads(agentId);

  let initialCalls: Awaited<ReturnType<typeof callsService.list>>["data"] = [];
  let initialTotal = 0;
  let initialPage = 1;
  let initialTotalPages = 1;
  let initialStats: CallStats = { ...EMPTY_CALL_STATS };
  let loadError: string | undefined;

  try {
    const filters = agentId ? { agentId } : undefined;
    const [result, stats] = await Promise.all([
      callsService.list(filters, { page: 1, pageSize: DEFAULT_PAGE_SIZE }),
      callsService.getStats(filters),
    ]);
    initialCalls = result.data;
    initialTotal = result.total;
    initialPage = result.page;
    initialTotalPages = result.totalPages;
    initialStats = stats;
  } catch (error) {
    console.error("[calls/page] Failed to load call logs:", error);
    loadError =
      error instanceof Error && error.message.trim()
        ? error.message
        : "Call logs could not be loaded. Run migration 006_call_logs_stabilize.sql in Supabase, then refresh.";
    const empty = buildPaginatedResult([], 0, 1, DEFAULT_PAGE_SIZE);
    initialCalls = empty.data;
    initialTotal = empty.total;
    initialPage = empty.page;
    initialTotalPages = empty.totalPages;
  }

  return (
    <CallsManagement
      initialCalls={initialCalls}
      initialTotal={initialTotal}
      initialPage={initialPage}
      initialTotalPages={initialTotalPages}
      initialStats={initialStats}
      dialLeads={dialLeads}
      initialLoadError={loadError}
    />
  );
}
