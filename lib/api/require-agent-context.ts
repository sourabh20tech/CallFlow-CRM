import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { agentPanelService } from "@/services/agent-panel.service";
import type { User } from "@/types/auth";

type AgentContextResult =
  | { user: User; agentId: string; error?: never }
  | { user?: never; agentId?: never; error: NextResponse };

export async function requireAgentContextApi(): Promise<AgentContextResult> {
  const auth = await requireAuthApi();
  if (auth.error) return { error: auth.error };

  try {
    const agentId = await agentPanelService.getAgentIdForUser(auth.user);
    return { user: auth.user, agentId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent profile not found";
    return { error: NextResponse.json({ error: message }, { status: 403 }) };
  }
}
