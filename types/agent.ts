import type { AgentStatus as DbAgentStatus } from "@/types/database";

export type AgentStatus = DbAgentStatus;

export interface Agent {
  id: string;
  profileId?: string;
  name: string;
  email: string;
  phone?: string;
  status: AgentStatus;
  department: string;
  callsHandled: number;
  avgHandleTime: number;
  satisfaction: number;
  isActive: boolean;
  avatarUrl?: string;
  assignedLeadsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentPerformanceSummary {
  callsHandled: number;
  avgHandleTime: number;
  satisfaction: number;
  assignedLeads: number;
  conversionRate: number;
}

export interface CreateAgentInput {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  department?: string;
  status?: AgentStatus;
  /** Account can sign in when true (default true). */
  isActive?: boolean;
}

export interface UpdateAgentInput {
  fullName?: string;
  email?: string;
  phone?: string;
  department?: string;
  status?: AgentStatus;
  isActive?: boolean;
  callsHandled?: number;
  avgHandleTime?: number;
  satisfaction?: number;
}

export interface ResetAgentPasswordInput {
  password: string;
}
