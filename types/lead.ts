import type { LeadStatus, LeadTier } from "@/types/database";

export type { LeadStatus, LeadTier };

export interface Lead {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  tier: LeadTier;
  status: LeadStatus;
  source?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  createdBy?: string;
  convertedAt?: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  tier?: LeadTier;
  status?: LeadStatus;
  source?: string;
  assignedAgentId?: string;
  nextFollowUpAt?: string;
}

export interface UpdateLeadInput {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  company?: string;
  tier?: LeadTier;
  status?: LeadStatus;
  source?: string;
  assignedAgentId?: string | null;
  convertedAt?: string | null;
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
}

export interface LeadListFilters {
  status?: LeadStatus | "all";
  tier?: LeadTier | "all";
  assignedAgentId?: string | "all" | "unassigned";
  search?: string;
}

export interface LeadRosterAgent {
  id: string;
  name: string;
}
