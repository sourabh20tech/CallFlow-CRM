import { requireSupabaseConfigured } from "@/lib/supabase/config";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { agentsAdminService } from "@/services/agents-admin.service";
import { agentsDbServiceServer } from "@/services/db/agents.service";
import { leadsDbServiceServer } from "@/services/db/leads.service";
import type {
  Agent,
  AgentPerformanceSummary,
  CreateAgentInput,
  ResetAgentPasswordInput,
  UpdateAgentInput,
} from "@/types/agent";
import type { Lead } from "@/types/lead";

export class AgentsService {
  async getAll(includeInactive = true): Promise<Agent[]> {
    requireSupabaseConfigured("agent listing");
    return agentsDbServiceServer.list(includeInactive);
  }

  async getAvailable(): Promise<Agent[]> {
    requireSupabaseConfigured("available agent listing");
    return agentsDbServiceServer.listAvailable();
  }

  async getById(id: string): Promise<Agent | undefined> {
    requireSupabaseConfigured("agent details");
    try {
      return await agentsDbServiceServer.getById(id);
    } catch {
      return undefined;
    }
  }

  async create(input: CreateAgentInput): Promise<Agent> {
    requireSupabaseConfigured("agent creation");
    if (isAdminClientConfigured()) {
      return agentsAdminService.createAgent(input);
    }
    throw new Error("Configure SUPABASE_SERVICE_ROLE_KEY to create agents.");
  }

  async update(id: string, input: UpdateAgentInput): Promise<Agent> {
    requireSupabaseConfigured("agent update");
    const previous =
      input.isActive !== undefined || input.email
        ? await agentsDbServiceServer.getById(id)
        : null;

    const updated = await agentsDbServiceServer.updateFromInput(id, input);

    if (updated.profileId && isAdminClientConfigured()) {
      if (input.email && input.email !== previous?.email) {
        await agentsAdminService.updateAgentAuthEmail(updated.profileId, input.email);
      }
      if (input.isActive !== undefined && input.isActive !== previous?.isActive) {
        await agentsAdminService.setAgentAuthEnabled(updated.profileId, input.isActive);
      }
    }

    return updated;
  }

  async setActive(id: string, isActive: boolean): Promise<Agent> {
    return this.update(id, { isActive });
  }

  async delete(id: string): Promise<void> {
    requireSupabaseConfigured("agent deletion");
    const agent = await agentsDbServiceServer.getById(id);

    // Check for active assigned leads
    const { leadsDbServiceServer } = await import("@/services/db/leads.service");
    const activeLeads = await leadsDbServiceServer.list(
      { assignedAgentId: id },
      { page: 1, pageSize: 1 },
    );
    if (activeLeads.total > 0) {
      throw new Error(
        `This agent still has ${activeLeads.total} active lead${activeLeads.total !== 1 ? "s" : ""}. Please reassign or close all active leads before deleting.`,
      );
    }

    // Step 1: Delete from Supabase Auth (if profile exists)
    if (agent.profileId && isAdminClientConfigured()) {
      try {
        await agentsAdminService.deleteAgentAuth(agent.profileId);
      } catch {
        // Auth user might already be deleted — continue
      }

      // Step 2: Delete profile record
      try {
        await agentsAdminService.deleteProfile(agent.profileId);
      } catch {
        // Profile might already be gone — continue
      }
    }

    // Step 3: Soft-delete the agent record
    await agentsDbServiceServer.softDelete(id);
  }

  async resetPassword(id: string, input: ResetAgentPasswordInput): Promise<void> {
    const agent = await this.getById(id);
    if (!agent?.profileId) {
      throw new Error("Agent not found");
    }

    requireSupabaseConfigured("agent password reset");
    await agentsAdminService.resetPassword(agent.profileId, input.password);
  }

  async getAssignedLeads(agentId: string, limit = 20): Promise<Lead[]> {
    requireSupabaseConfigured("assigned lead listing");
    const result = await leadsDbServiceServer.list(
      { assignedAgentId: agentId },
      { page: 1, pageSize: limit },
    );
    return result.data;
  }

  async getPerformanceSummary(agentId: string): Promise<AgentPerformanceSummary> {
    const agent = await this.getById(agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    const leads = await this.getAssignedLeads(agentId, 100);
    const converted = leads.filter((l) => l.status === "converted").length;
    const conversionRate =
      leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0;

    return {
      callsHandled: agent.callsHandled,
      avgHandleTime: agent.avgHandleTime,
      satisfaction: agent.satisfaction,
      assignedLeads: agent.assignedLeadsCount ?? leads.length,
      conversionRate,
    };
  }
}

export const agentsService = new AgentsService();
