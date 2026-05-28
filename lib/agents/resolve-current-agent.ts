import { ensureAgentRowForProfile } from "@/lib/agents/ensure-agent-row.server";
import { getCurrentAgentId } from "@/lib/db/api-helpers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Maps demo auth profile ids to demo agent rows */
export const DEMO_PROFILE_TO_AGENT: Record<string, string> = {
  "demo-agent": "agent-1",
};

const DEFAULT_DEMO_AGENT_ID = "agent-1";

export async function resolveAgentIdForUser(userId: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    return DEMO_PROFILE_TO_AGENT[userId] ?? DEFAULT_DEMO_AGENT_ID;
  }

  const supabase = await createClient();
  let agentId = await getCurrentAgentId(supabase);

  if (!agentId) {
    agentId = await ensureAgentRowForProfile(userId);
  }

  if (!agentId) {
    agentId = await getCurrentAgentId(supabase);
  }

  if (!agentId) {
    throw new Error("No agent profile linked to this account");
  }

  return agentId;
}
