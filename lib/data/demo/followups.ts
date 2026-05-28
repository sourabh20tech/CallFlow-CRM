import type {
  AgentFollowupSummary,
  CreateFollowupInput,
  Followup,
  FollowupFilters,
  FollowupStats,
  UpdateFollowupInput,
} from "@/types/followup";
import {
  ACTIVE_STATUSES,
  isFollowupDueToday,
  isFollowupOverdue,
} from "@/lib/followups/constants";

const now = Date.now();
const hour = 1000 * 60 * 60;

let demoFollowups: Followup[] = [
  {
    id: "fu-1",
    leadId: "lead-1",
    leadName: "Sarah Johnson",
    assignedAgentId: "agent-1",
    assignedAgentName: "Alex Morgan",
    title: "Enterprise pricing callback",
    description: "Discuss enterprise plan pricing and contract terms.",
    dueAt: new Date(now + hour * 2).toISOString(),
    status: "pending",
    priority: "high",
    createdAt: new Date(now - hour * 24).toISOString(),
    updatedAt: new Date(now - hour * 24).toISOString(),
  },
  {
    id: "fu-2",
    leadId: "lead-2",
    leadName: "Michael Chen",
    assignedAgentId: "agent-2",
    assignedAgentName: "Jordan Lee",
    title: "Send proposal follow-up",
    description: "Email proposal and schedule demo.",
    dueAt: new Date(now + hour * 5).toISOString(),
    status: "in_progress",
    priority: "medium",
    createdAt: new Date(now - hour * 12).toISOString(),
    updatedAt: new Date(now - hour * 2).toISOString(),
  },
  {
    id: "fu-3",
    leadId: "lead-3",
    leadName: "Emily Davis",
    assignedAgentId: "agent-1",
    assignedAgentName: "Alex Morgan",
    title: "Onboarding check-in",
    dueAt: new Date(now + hour * 26).toISOString(),
    status: "pending",
    priority: "low",
    createdAt: new Date(now - hour * 48).toISOString(),
    updatedAt: new Date(now - hour * 48).toISOString(),
  },
  {
    id: "fu-4",
    leadId: "lead-4",
    leadName: "Robert Wilson",
    assignedAgentId: "agent-3",
    assignedAgentName: "Taylor Brooks",
    title: "Contract renewal",
    dueAt: new Date(now - hour * 3).toISOString(),
    status: "pending",
    priority: "high",
    createdAt: new Date(now - hour * 72).toISOString(),
    updatedAt: new Date(now - hour * 72).toISOString(),
  },
  {
    id: "fu-5",
    leadId: "cust-1",
    leadName: "Sarah Johnson",
    assignedAgentId: "agent-1",
    assignedAgentName: "Alex Morgan",
    title: "Quarterly review",
    dueAt: new Date(now - hour * 48).toISOString(),
    status: "completed",
    priority: "medium",
    completedAt: new Date(now - hour * 40).toISOString(),
    createdAt: new Date(now - hour * 96).toISOString(),
    updatedAt: new Date(now - hour * 40).toISOString(),
  },
];

function matchesFilters(f: Followup, filters?: FollowupFilters): boolean {
  if (!filters) return true;

  if (filters.view === "calendar" || filters.view === "all") {
    // include all statuses
  } else if (filters.view === "pending") {
    if (!ACTIVE_STATUSES.includes(f.status)) return false;
  } else if (filters.view === "completed") {
    if (f.status !== "completed") return false;
  } else if (filters.status === "active") {
    if (!ACTIVE_STATUSES.includes(f.status)) return false;
  } else if (filters.status && filters.status !== "all" && f.status !== filters.status) {
    return false;
  }

  if (filters.agentId && f.assignedAgentId !== filters.agentId) return false;
  if (filters.priority && filters.priority !== "all" && f.priority !== filters.priority) {
    return false;
  }

  if (filters.from && new Date(f.dueAt) < new Date(filters.from)) return false;
  if (filters.to && new Date(f.dueAt) > new Date(filters.to)) return false;

  if (filters.search?.trim()) {
    const q = filters.search.toLowerCase();
    const hay = `${f.title} ${f.leadName} ${f.assignedAgentName} ${f.description}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

export function getDemoFollowups(filters?: FollowupFilters): Followup[] {
  return demoFollowups
    .filter((f) => matchesFilters(f, filters))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

export function getDemoFollowupById(id: string): Followup | undefined {
  return demoFollowups.find((f) => f.id === id);
}

export function createDemoFollowup(
  input: CreateFollowupInput,
  extras?: { leadName?: string; agentName?: string },
): Followup {
  const id = `fu-${Date.now()}`;
  const followup: Followup = {
    id,
    leadId: input.leadId,
    leadName: extras?.leadName,
    assignedAgentId: input.assignedAgentId,
    assignedAgentName: extras?.agentName,
    title: input.title,
    description: input.description,
    dueAt: input.dueAt,
    status: input.status ?? "pending",
    priority: input.priority ?? "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  demoFollowups = [followup, ...demoFollowups];
  return followup;
}

export function updateDemoFollowup(id: string, input: UpdateFollowupInput): Followup | undefined {
  const index = demoFollowups.findIndex((f) => f.id === id);
  if (index === -1) return undefined;
  const current = demoFollowups[index]!;
  const updated: Followup = {
    ...current,
    title: input.title ?? current.title,
    description: input.description ?? current.description,
    dueAt: input.dueAt ?? current.dueAt,
    assignedAgentId: input.assignedAgentId ?? current.assignedAgentId,
    priority: input.priority ?? current.priority,
    status: input.status ?? current.status,
    completedAt:
      input.completedAt === null
        ? undefined
        : (input.completedAt ?? current.completedAt),
    updatedAt: new Date().toISOString(),
  };
  demoFollowups = [...demoFollowups.slice(0, index), updated, ...demoFollowups.slice(index + 1)];
  return updated;
}

export function deleteDemoFollowup(id: string): boolean {
  const before = demoFollowups.length;
  demoFollowups = demoFollowups.filter((f) => f.id !== id);
  return demoFollowups.length < before;
}

export function computeDemoStats(list?: Followup[]): FollowupStats {
  const items = list ?? demoFollowups;
  return {
    total: items.length,
    pending: items.filter((f) => f.status === "pending").length,
    inProgress: items.filter((f) => f.status === "in_progress").length,
    completed: items.filter((f) => f.status === "completed").length,
    overdue: items.filter((f) => isFollowupOverdue(f)).length,
    dueToday: items.filter((f) => isFollowupDueToday(f)).length,
  };
}

export function computeDemoAgentSummaries(list?: Followup[]): AgentFollowupSummary[] {
  const items = list ?? demoFollowups.filter((f) => ACTIVE_STATUSES.includes(f.status) || f.status === "completed");
  const map = new Map<string, AgentFollowupSummary>();

  for (const f of items) {
    const agentId = f.assignedAgentId ?? "unassigned";
    const agentName = f.assignedAgentName ?? "Unassigned";
    const entry = map.get(agentId) ?? {
      agentId,
      agentName,
      pending: 0,
      overdue: 0,
      completed: 0,
    };
    if (f.status === "completed") entry.completed += 1;
    else if (ACTIVE_STATUSES.includes(f.status)) {
      entry.pending += 1;
      if (isFollowupOverdue(f)) entry.overdue += 1;
    }
    map.set(agentId, entry);
  }

  return Array.from(map.values()).sort((a, b) => b.pending - a.pending);
}
