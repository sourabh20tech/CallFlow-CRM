import type { LeadStatus, LeadForce } from "@/types/database";

export type { LeadStatus, LeadForce };
/** @deprecated Use LeadForce instead */
export type LeadTier = LeadForce;

export interface Lead {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  force: LeadForce;
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
  force?: LeadForce;
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
  force?: LeadForce;
  status?: LeadStatus;
  source?: string;
  assignedAgentId?: string | null;
  convertedAt?: string | null;
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
}

export interface LeadListFilters {
  status?: LeadStatus | "all";
  force?: LeadForce | "all";
  assignedAgentId?: string | "all" | "unassigned";
  search?: string;
}

export interface LeadRosterAgent {
  id: string;
  name: string;
}
