import { BaseDbService } from "@/services/db/base.service";
import {
  AGENT_LIST_SELECT,
  handleQueryOrThrow,
  requireRow,
  stripUndefined,
} from "@/lib/db/api-helpers";
import {
  createAdminSupabaseClient,
  isAdminClientConfigured,
} from "@/lib/supabase/admin";
import { mapAgentRow, mapAgentToUpdate } from "@/lib/db/mappers";
import type { AgentWithProfile } from "@/types/database";
import type { Agent } from "@/types/agent";
import type { AgentStatus, AgentUpdate } from "@/types/database";
import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";

export class AgentsDbService extends BaseDbService {
  async list(includeInactive = true, client?: TypedSupabaseClient): Promise<Agent[]> {
    const supabase = await this.db(client);

    let query = supabase
      .from("agents")
      .select(AGENT_LIST_SELECT)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const data = await handleQueryOrThrow(query);
    const rows = (data ?? []) as AgentWithProfile[];

    // Fetch active work sessions to determine live online/offline status
    const { data: activeSessions } = await supabase
      .from("work_sessions")
      .select("user_id, last_heartbeat")
      .eq("is_active", true);

    const onlineUserIds = new Set<string>();
    const HEARTBEAT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    for (const session of (activeSessions ?? []) as { user_id: string; last_heartbeat: string | null }[]) {
      const lastBeat = session.last_heartbeat ? new Date(session.last_heartbeat).getTime() : 0;
      if (now - lastBeat < HEARTBEAT_TIMEOUT_MS) {
        onlineUserIds.add(session.user_id);
      }
    }

    // Batch lead count: ONE query instead of N (eliminates N+1 problem)
    const agentIds = rows.map((r) => r.id);
    const leadCounts = new Map<string, number>();

    if (agentIds.length > 0) {
      const { data: countRows } = await supabase
        .from("leads")
        .select("assigned_agent_id")
        .in("assigned_agent_id", agentIds)
        .is("deleted_at", null);

      for (const row of (countRows ?? []) as { assigned_agent_id: string }[]) {
        if (row.assigned_agent_id) {
          leadCounts.set(row.assigned_agent_id, (leadCounts.get(row.assigned_agent_id) ?? 0) + 1);
        }
      }
    }

    const withCounts = rows.map((row) => {
      const count = leadCounts.get(row.id) ?? 0;
      const agent = mapAgentRow(row, { assignedLeadsCount: count });
      if (agent.profileId && onlineUserIds.has(agent.profileId)) {
        agent.status = "available";
      } else {
        agent.status = "offline";
      }
      return agent;
    });
    return withCounts;
  }

  async getById(id: string, client?: TypedSupabaseClient): Promise<Agent> {
    const supabase = await this.db(client);

    const data = await handleQueryOrThrow(
      supabase
        .from("agents")
        .select(AGENT_LIST_SELECT)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle(),
    );

    const row = requireRow(data as AgentWithProfile | null, "Agent", id);
    const count = await this.getAssignedLeadCount(id, supabase);
    const agent = mapAgentRow(row, { assignedLeadsCount: count });

    // Check live presence from work_sessions
    if (agent.profileId) {
      const { data: session } = await supabase
        .from("work_sessions")
        .select("last_heartbeat")
        .eq("user_id", agent.profileId)
        .eq("is_active", true)
        .maybeSingle();

      const HEARTBEAT_TIMEOUT_MS = 5 * 60 * 1000;
      const lastBeat = (session as any)?.last_heartbeat
        ? new Date((session as any).last_heartbeat).getTime()
        : 0;

      agent.status = (Date.now() - lastBeat < HEARTBEAT_TIMEOUT_MS) ? "available" : "offline";
    }

    return agent;
  }

  async getByProfileId(profileId: string, client?: TypedSupabaseClient): Promise<Agent | null> {
    const supabase = await this.db(client);

    const data = await handleQueryOrThrow(
      supabase
        .from("agents")
        .select(AGENT_LIST_SELECT)
        .eq("profile_id", profileId)
        .maybeSingle(),
    );

    if (!data) return null;
    const row = data as AgentWithProfile;
    const count = await this.getAssignedLeadCount(row.id, supabase);
    return mapAgentRow(row, { assignedLeadsCount: count });
  }

  async listAvailable(client?: TypedSupabaseClient): Promise<Agent[]> {
    const supabase = await this.db(client);

    const data = await handleQueryOrThrow(
      supabase
        .from("agents")
        .select(AGENT_LIST_SELECT)
        .eq("is_active", true)
        .eq("status", "available"),
    );

    return ((data ?? []) as AgentWithProfile[]).map((row) => mapAgentRow(row));
  }

  async getAssignedLeadCount(
    agentId: string,
    client?: TypedSupabaseClient,
  ): Promise<number> {
    const supabase = client ?? (await this.db());
    const { count, error } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("assigned_agent_id", agentId)
      .is("deleted_at", null);

    if (error) return 0;
    return count ?? 0;
  }

  async updateStatus(
    id: string,
    status: AgentStatus,
    client?: TypedSupabaseClient,
  ): Promise<Agent> {
    return this.update(id, { status }, client);
  }

  async setActive(
    id: string,
    isActive: boolean,
    client?: TypedSupabaseClient,
  ): Promise<Agent> {
    return this.update(id, { is_active: isActive }, client);
  }

  async update(id: string, patch: AgentUpdate, client?: TypedSupabaseClient): Promise<Agent> {
    const supabase = await this.db(client);

    const data = await handleQueryOrThrow(
      supabase
        .from("agents")
        .update(stripUndefined(patch))
        .eq("id", id)
        .select(AGENT_LIST_SELECT)
        .single(),
    );

    const row = data as AgentWithProfile;
    const count = await this.getAssignedLeadCount(id, supabase);
    return mapAgentRow(row, { assignedLeadsCount: count });
  }

  async updateFromInput(
    id: string,
    input: import("@/types/agent").UpdateAgentInput,
    client?: TypedSupabaseClient,
  ): Promise<Agent> {
    const supabase = await this.db(client);
    const agentPatch = stripUndefined(mapAgentToUpdate(input));

    if (input.fullName || input.email || input.phone) {
      const agent = await this.getById(id, supabase);
      if (agent.profileId) {
        const profilePatch = stripUndefined({
          full_name: input.fullName,
          email: input.email,
          phone: input.phone,
        });
        if (isAdminClientConfigured()) {
          const admin = createAdminSupabaseClient();
          await handleQueryOrThrow(
            admin.from("profiles").update(profilePatch).eq("id", agent.profileId),
          );
        } else {
          await handleQueryOrThrow(
            supabase.from("profiles").update(profilePatch).eq("id", agent.profileId),
          );
        }
      }
    }

    return this.update(id, agentPatch, supabase);
  }

  async softDelete(id: string, client?: TypedSupabaseClient): Promise<void> {
    const supabase = await this.db(client);
    await handleQueryOrThrow(
      supabase
        .from("agents")
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          status: "offline",
        })
        .eq("id", id)
        .is("deleted_at", null),
    );
  }

  /** @deprecated Use softDelete — UI must never hard-delete agents. */
  async delete(id: string, client?: TypedSupabaseClient): Promise<void> {
    return this.softDelete(id, client);
  }
}

export const agentsDbService = new AgentsDbService("browser");
export const agentsDbServiceServer = new AgentsDbService("server");
