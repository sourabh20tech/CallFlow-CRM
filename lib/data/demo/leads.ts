import { getDemoAgentById } from "@/lib/data/demo/agents";
import type { Lead, LeadListFilters, LeadStatus, UpdateLeadInput } from "@/types/lead";
import type { Note } from "@/types/note";

let demoLeads: Lead[] = [
  {
    id: "lead-1",
    fullName: "Sarah Johnson",
    email: "sarah.j@acme.com",
    phone: "+1 (555) 123-4567",
    company: "Acme Corp",
    force: "enterprise",
    status: "follow_up",
    assignedAgentId: "agent-1",
    assignedAgentName: "Alex Rivera",
    nextFollowUpAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-2",
    fullName: "Michael Chen",
    email: "m.chen@techflow.io",
    phone: "+1 (555) 234-5678",
    company: "TechFlow",
    force: "premium",
    status: "interested",
    assignedAgentId: "agent-1",
    assignedAgentName: "Alex Rivera",
    nextFollowUpAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-3",
    fullName: "Emily Davis",
    email: "emily@startup.co",
    phone: "+1 (555) 345-6789",
    force: "standard",
    status: "new",
    assignedAgentId: "agent-2",
    assignedAgentName: "Jordan Lee",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-4",
    fullName: "Robert Wilson",
    email: "robert@global.io",
    phone: "+1 (555) 456-7890",
    company: "Global Systems",
    force: "premium",
    status: "converted",
    assignedAgentId: "agent-1",
    assignedAgentName: "Alex Rivera",
    convertedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-5",
    fullName: "Lisa Anderson",
    email: "lisa@northwind.io",
    phone: "+1 (555) 567-8901",
    company: "Northwind",
    force: "enterprise",
    status: "interested",
    assignedAgentId: "agent-1",
    assignedAgentName: "Alex Rivera",
    nextFollowUpAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-6",
    fullName: "David Park",
    email: "david@innovate.io",
    phone: "+1 (555) 678-9012",
    company: "Innovate Labs",
    force: "standard",
    status: "not_interested",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const demoNotesByLead: Record<string, Note[]> = {
  "lead-1": [
    {
      id: "ln-1",
      leadId: "lead-1",
      authorId: "demo-agent",
      authorName: "Demo Agent",
      content: "Interested in enterprise force — send pricing deck.",
      isPinned: true, noteType: "public" as const, visibility: "shared" as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
  ],
};

function resolveAgentName(agentId?: string): string | undefined {
  if (!agentId) return undefined;
  return getDemoAgentById(agentId)?.name;
}

function matchesFilters(lead: Lead, filters?: LeadListFilters): boolean {
  if (!filters) return true;
  if (filters.status && filters.status !== "all" && lead.status !== filters.status) {
    return false;
  }
  if (filters.force && filters.force !== "all" && lead.force !== filters.force) {
    return false;
  }
  if (filters.assignedAgentId === "unassigned" && lead.assignedAgentId) {
    return false;
  }
  if (
    filters.assignedAgentId &&
    filters.assignedAgentId !== "all" &&
    filters.assignedAgentId !== "unassigned" &&
    lead.assignedAgentId !== filters.assignedAgentId
  ) {
    return false;
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const hay = [lead.fullName, lead.email, lead.phone, lead.company]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function listDemoLeads(filters?: LeadListFilters): Lead[] {
  return demoLeads
    .filter((l) => matchesFilters(l, filters))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getDemoLeadsByAgent(agentId: string): Lead[] {
  return demoLeads.filter((l) => l.assignedAgentId === agentId);
}

export function getDemoLeadCount(agentId: string): number {
  return getDemoLeadsByAgent(agentId).length;
}

export function getDemoLeadById(id: string): Lead | undefined {
  return demoLeads.find((l) => l.id === id);
}

export function createDemoLead(
  input: import("@/types/lead").CreateLeadInput,
): Lead {
  const id = `lead-${Date.now()}`;
  const lead: Lead = {
    id,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    company: input.company,
    force: input.force ?? "standard",
    status: input.status ?? "new",
    source: input.source,
    assignedAgentId: input.assignedAgentId,
    assignedAgentName: resolveAgentName(input.assignedAgentId),
    nextFollowUpAt: input.nextFollowUpAt,
    convertedAt: input.status === "converted" ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  demoLeads = [lead, ...demoLeads];
  return lead;
}

export function updateDemoLead(id: string, input: UpdateLeadInput): Lead | undefined {
  const index = demoLeads.findIndex((l) => l.id === id);
  if (index === -1) return undefined;

  const current = demoLeads[index]!;
  const status = input.status ?? current.status;
  const assignedAgentId =
    input.assignedAgentId === null
      ? undefined
      : input.assignedAgentId !== undefined
        ? input.assignedAgentId
        : current.assignedAgentId;

  const updated: Lead = {
    ...current,
    fullName: input.fullName ?? current.fullName,
    email: input.email === null ? undefined : (input.email ?? current.email),
    phone: input.phone === null ? undefined : (input.phone ?? current.phone),
    company: input.company ?? current.company,
    force: input.force ?? current.force,
    source: input.source ?? current.source,
    status,
    assignedAgentId,
    assignedAgentName: resolveAgentName(assignedAgentId),
    lastContactedAt:
      input.lastContactedAt === null
        ? undefined
        : (input.lastContactedAt ?? current.lastContactedAt),
    nextFollowUpAt:
      input.nextFollowUpAt === null
        ? undefined
        : (input.nextFollowUpAt ?? current.nextFollowUpAt),
    convertedAt:
      input.convertedAt === null
        ? undefined
        : input.convertedAt !== undefined
          ? input.convertedAt
          : status === "converted" && !current.convertedAt
            ? new Date().toISOString()
            : current.convertedAt,
    updatedAt: new Date().toISOString(),
  };

  demoLeads = [...demoLeads.slice(0, index), updated, ...demoLeads.slice(index + 1)];
  return updated;
}

export function deleteDemoLead(id: string): boolean {
  const before = demoLeads.length;
  demoLeads = demoLeads.filter((l) => l.id !== id);
  delete demoNotesByLead[id];
  return demoLeads.length < before;
}

export function updateDemoLeadStatus(id: string, status: LeadStatus): Lead | undefined {
  return updateDemoLead(id, { status });
}

export function getDemoLeadNotes(leadId: string): Note[] {
  return demoNotesByLead[leadId] ?? [];
}

export function addDemoLeadNote(
  leadId: string,
  content: string,
  authorName = "You",
): Note {
  const note: Note = {
    id: `ln-${Date.now()}`,
    leadId,
    authorId: "demo-agent",
    authorName,
    content,
    isPinned: false, noteType: "public" as const, visibility: "private" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  demoNotesByLead[leadId] = [note, ...(demoNotesByLead[leadId] ?? [])];
  return note;
}

export function countDemoLeadNotes(leadId: string): number {
  return demoNotesByLead[leadId]?.length ?? 0;
}
