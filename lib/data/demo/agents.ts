import { mockAgents } from "@/lib/data/mock";
import type { Agent, CreateAgentInput, UpdateAgentInput } from "@/types/agent";

let demoAgents: Agent[] = mockAgents.map((a) => ({ ...a, isActive: true, profileId: `profile-${a.id}` }));

export function getDemoAgents(): Agent[] {
  return [...demoAgents];
}

export function getDemoAgentById(id: string): Agent | undefined {
  return demoAgents.find((a) => a.id === id);
}

export function createDemoAgent(input: CreateAgentInput): Agent {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (demoAgents.some((a) => a.email.toLowerCase() === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const id = `agent-${Date.now()}`;
  const agent: Agent = {
    id,
    profileId: `profile-${id}`,
    name: input.fullName,
    email: input.email,
    phone: input.phone,
    status: input.status ?? "offline",
    department: input.department ?? "General",
    callsHandled: 0,
    avgHandleTime: 0,
    satisfaction: 0,
    isActive: input.isActive ?? true,
    assignedLeadsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  demoAgents = [agent, ...demoAgents];
  return agent;
}

export function updateDemoAgent(id: string, input: UpdateAgentInput): Agent | undefined {
  const index = demoAgents.findIndex((a) => a.id === id);
  if (index === -1) return undefined;

  const current = demoAgents[index]!;
  const updated: Agent = {
    ...current,
    name: input.fullName ?? current.name,
    email: input.email ?? current.email,
    phone: input.phone ?? current.phone,
    department: input.department ?? current.department,
    status: input.status ?? current.status,
    isActive: input.isActive ?? current.isActive,
    callsHandled: input.callsHandled ?? current.callsHandled,
    avgHandleTime: input.avgHandleTime ?? current.avgHandleTime,
    satisfaction: input.satisfaction ?? current.satisfaction,
    updatedAt: new Date().toISOString(),
  };
  demoAgents = [...demoAgents.slice(0, index), updated, ...demoAgents.slice(index + 1)];
  return updated;
}

export function deleteDemoAgent(id: string): boolean {
  const before = demoAgents.length;
  demoAgents = demoAgents.filter((a) => a.id !== id);
  return demoAgents.length < before;
}
