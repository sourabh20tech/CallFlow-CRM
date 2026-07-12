import { resolveAgentIdForUser } from "@/lib/agents/resolve-current-agent";
import { requireSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { agentsService } from "@/services/agents.service";
import { callsService } from "@/services/calls.service";
import { followupsService } from "@/services/followups.service";
import { leadsDbServiceServer } from "@/services/db/leads.service";
import { leadsService } from "@/services/leads.service";
import { systemSettingsDbServiceServer } from "@/services/db/system-settings.service";
import type {
  AgentPanelBundle,
  AgentPanelLead,
  AgentPanelStats,
} from "@/types/agent-panel";
import type { Lead } from "@/types/lead";
import type { User } from "@/types/auth";

/** Batch note count resolution — single query instead of N+1 */
async function withNoteCounts(leads: Lead[]): Promise<AgentPanelLead[]> {
  if (!leads.length) return [];

  try {
    const supabase = await createClient();
    const leadIds = leads.map((l) => l.id);

    const { data: noteRows, error } = await supabase
      .from("lead_notes")
      .select("lead_id")
      .in("lead_id", leadIds)
      .is("deleted_at", null);

    if (error) {
      return leads.map((lead) => ({ ...lead, noteCount: 0 }));
    }

    const counts: Record<string, number> = {};
    for (const row of noteRows ?? []) {
      if (row.lead_id) {
        counts[row.lead_id] = (counts[row.lead_id] ?? 0) + 1;
      }
    }

    return leads.map((lead) => ({ ...lead, noteCount: counts[lead.id] ?? 0 }));
  } catch {
    return leads.map((lead) => ({ ...lead, noteCount: 0 }));
  }
}

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[agent-panel] ${label}:`, error);
    }
    return fallback;
  }
}

export class AgentPanelService {
  async getAgentIdForUser(user: User): Promise<string> {
    return resolveAgentIdForUser(user.id);
  }

  async getPanel(user: User): Promise<AgentPanelBundle> {
    requireSupabaseConfigured("agent workspace");
    const agentId = await this.getAgentIdForUser(user);

    const agent = await safe(
      "agent profile",
      () => agentsService.getById(agentId),
      null,
    );
    const agentName = agent?.name ?? user.fullName ?? "Agent";

    // Run independent queries IN PARALLEL (not sequentially)
    const [myLeadsResult, todayCalls, allFollowups, announcement] = await Promise.all([
      safe(
        "assigned leads",
        () => leadsDbServiceServer.list(
          { assignedAgentId: agentId },
          { page: 1, pageSize: 100 },
        ),
        { data: [] as Lead[], total: 0, page: 1, pageSize: 100, totalPages: 1 },
      ),
      safe(
        "today calls",
        () => callsService.listAll({ agentId, todayOnly: true }),
        [],
      ),
      safe(
        "follow-ups",
        () => followupsService.list({ agentId, view: "all" }),
        [],
      ),
      safe(
        "admin announcement",
        () => systemSettingsDbServiceServer.getAnnouncement(),
        { title: "", message: "", updatedAt: null },
      ),
    ]);

    const myLeads = myLeadsResult.data;
    const totalAssignedLeads = myLeadsResult.total;

    const myLeadsWithNotes = await withNoteCounts(myLeads);
    const convertedLeads = myLeadsWithNotes.filter((l) => l.status === "converted");
    const activeLeads = myLeadsWithNotes.filter(
      (l) => l.status !== "converted",
    );

    const pendingFollowups = allFollowups.filter(
      (f) => f.status === "pending" || f.status === "in_progress",
    );

    const activeCalls = todayCalls.filter(
      (c) => c.status === "callback" || c.status === "connected" || c.status === "interested",
    );

    const stats: AgentPanelStats = {
      assignedLeads: totalAssignedLeads,
      callsToday: todayCalls.length,
      pendingFollowups: pendingFollowups.length,
      convertedLeads: convertedLeads.length,
      activeCalls: activeCalls.length,
    };

    const assignedDial = activeLeads.map((l) => ({
      id: l.id,
      name: l.fullName,
      phone: l.phone,
      company: l.company,
    }));
    // Agent should only see their own assigned leads for dialing
    const dialLeads = assignedDial.slice(0, 12);

    return {
      agentId,
      agentName,
      stats,
      announcement,
      myLeads: activeLeads,
      convertedLeads,
      todayCalls,
      pendingFollowups,
      dialLeads,
      generatedAt: new Date().toISOString(),
    };
  }

  async assertLeadOwnedByAgent(leadId: string, agentId: string): Promise<Lead> {
    const lead = await leadsService.getById(leadId);
    if (!lead) throw new Error("Lead not found");
    if (lead.assignedAgentId !== agentId) {
      throw new Error("You do not have access to this lead");
    }
    return lead;
  }
}

export const agentPanelService = new AgentPanelService();
