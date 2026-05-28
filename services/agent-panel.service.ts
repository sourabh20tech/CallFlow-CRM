import { resolveAgentIdForUser } from "@/lib/agents/resolve-current-agent";
import { getDialLeads } from "@/lib/calls/dial-leads";
import { requireSupabaseConfigured } from "@/lib/supabase/config";
import { agentsService } from "@/services/agents.service";
import { callsService } from "@/services/calls.service";
import { followupsService } from "@/services/followups.service";
import { leadsDbServiceServer } from "@/services/db/leads.service";
import { leadsService } from "@/services/leads.service";
import { notesDbServiceServer } from "@/services/db/notes.service";
import { systemSettingsDbServiceServer } from "@/services/db/system-settings.service";
import type {
  AgentPanelBundle,
  AgentPanelLead,
  AgentPanelStats,
} from "@/types/agent-panel";
import type { Lead } from "@/types/lead";
import type { User } from "@/types/auth";

async function withNoteCounts(leads: Lead[]): Promise<AgentPanelLead[]> {
  if (!leads.length) return [];

  return Promise.all(
    leads.map(async (lead) => {
      try {
        const notes = await notesDbServiceServer.listByLead(lead.id);
        return { ...lead, noteCount: notes.length };
      } catch {
        return { ...lead, noteCount: 0 };
      }
    }),
  );
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

    const myLeads = await safe(
      "assigned leads",
      async () => {
        const result = await leadsDbServiceServer.list(
          { assignedAgentId: agentId },
          { page: 1, pageSize: 100 },
        );
        return result.data;
      },
      [] as Lead[],
    );

    const myLeadsWithNotes = await withNoteCounts(myLeads);
    const convertedLeads = myLeadsWithNotes.filter((l) => l.status === "converted");
    const activeLeads = myLeadsWithNotes.filter(
      (l) => !["converted", "not_interested", "closed"].includes(l.status),
    );

    const todayCalls = await safe(
      "today calls",
      () => callsService.listAll({ agentId, todayOnly: true }),
      [],
    );

    const allFollowups = await safe(
      "follow-ups",
      () => followupsService.list({ agentId, view: "all" }),
      [],
    );
    const pendingFollowups = allFollowups.filter(
      (f) => f.status === "pending" || f.status === "in_progress",
    );

    const activeCalls = todayCalls.filter(
      (c) => c.status === "callback" || c.status === "connected" || c.status === "interested",
    );

    const stats: AgentPanelStats = {
      assignedLeads: activeLeads.length,
      callsToday: todayCalls.length,
      pendingFollowups: pendingFollowups.length,
      convertedLeads: convertedLeads.length,
      activeCalls: activeCalls.length,
    };

    const announcement = await safe("admin announcement", () =>
      systemSettingsDbServiceServer.getAnnouncement(), { title: "", message: "", updatedAt: null });

    const assignedDial = activeLeads.map((l) => ({
      id: l.id,
      name: l.fullName,
      phone: l.phone,
      company: l.company,
    }));
    const allDial = await safe("dial leads", () => getDialLeads(), []);
    const dialIds = new Set(assignedDial.map((d) => d.id));
    const dialLeads = [
      ...assignedDial,
      ...allDial.filter((d) => !dialIds.has(d.id)),
    ].slice(0, 12);

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
