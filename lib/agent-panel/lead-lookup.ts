import type { AgentPanelLead } from "@/types/agent-panel";

export function buildAgentLeadLookup(leads: AgentPanelLead[]): Map<string, AgentPanelLead> {
  return new Map(leads.map((lead) => [lead.id, lead]));
}

export function filterAgentLeads(leads: AgentPanelLead[], query: string): AgentPanelLead[] {
  const q = query.trim().toLowerCase();
  if (!q) return leads;
  return leads.filter((lead) => {
    const haystack = [
      lead.fullName,
      lead.email,
      lead.phone,
      lead.status,
      lead.source,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
