import type { FollowupPriority, FollowupStatus } from "@/types/database";

export type { FollowupPriority, FollowupStatus };
export type FollowupsApiSegment = "followups";
export type FollowupsRouteSegment = "follow-ups";
export type FollowupsTableName = "follow_ups";

export interface Followup {
  id: string;
  leadId: string;
  leadName?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  title: string;
  description?: string;
  dueAt: string;
  status: FollowupStatus;
  priority: FollowupPriority;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFollowupInput {
  leadId: string;
  title: string;
  description?: string;
  dueAt: string;
  assignedAgentId?: string;
  priority?: FollowupPriority;
  status?: FollowupStatus;
}

export interface UpdateFollowupInput extends Partial<CreateFollowupInput> {
  completedAt?: string | null;
  status?: FollowupStatus;
}

export type FollowupView = "pending" | "completed" | "all" | "calendar";

export interface FollowupFilters {
  view?: FollowupView;
  status?: FollowupStatus | "active" | "all";
  agentId?: string;
  leadId?: string;
  priority?: FollowupPriority | "all";
  search?: string;
  from?: string;
  to?: string;
}

export interface FollowupListResult {
  followups: Followup[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FollowupStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  dueToday: number;
  inProgress: number;
}

export interface AgentFollowupSummary {
  agentId: string;
  agentName: string;
  pending: number;
  overdue: number;
  completed: number;
}
