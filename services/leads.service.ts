import { requireSupabaseConfigured } from "@/lib/supabase/config";
import { leadsDbServiceServer, type LeadFilters } from "@/services/db/leads.service";
import { notesDbServiceServer } from "@/services/db/notes.service";
import type {
  CreateLeadInput,
  Lead,
  LeadListFilters,
  LeadRosterAgent,
  LeadStatus,
  UpdateLeadInput,
} from "@/types/lead";
import type { Note } from "@/types/note";
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
} from "@/lib/db/pagination";
import type { Followup } from "@/types/followup";

function toDbFilters(filters?: LeadListFilters, agentId?: string): LeadFilters | undefined {
  if (!filters && !agentId) return undefined;

  const db: LeadFilters = {};
  if (agentId) db.assignedAgentId = agentId;
  if (filters?.status && filters.status !== "all") db.status = filters.status;
  if (filters?.tier && filters.tier !== "all") db.tier = filters.tier;
  if (filters?.assignedAgentId === "unassigned") db.unassignedOnly = true;
  else if (filters?.assignedAgentId && filters.assignedAgentId !== "all") {
    db.assignedAgentId = filters.assignedAgentId;
  }
  if (filters?.search?.trim()) db.search = filters.search.trim();
  return db;
}

export class LeadsService {
  async list(
    filters?: LeadListFilters,
    options?: { agentId?: string; page?: number; pageSize?: number },
  ): Promise<PaginatedResult<Lead>> {
    requireSupabaseConfigured("lead listing");
    return leadsDbServiceServer.list(toDbFilters(filters, options?.agentId), {
      page: options?.page,
      pageSize: options?.pageSize ?? 100,
    });
  }

  async listAll(filters?: LeadListFilters, agentId?: string): Promise<Lead[]> {
    const result = await this.list(filters, { agentId, pageSize: 500 });
    return result.data;
  }

  async getById(id: string): Promise<Lead | undefined> {
    requireSupabaseConfigured("lead details");
    try {
      return await leadsDbServiceServer.getById(id);
    } catch {
      return undefined;
    }
  }

  async create(input: CreateLeadInput): Promise<Lead> {
    requireSupabaseConfigured("lead creation");
    return leadsDbServiceServer.create(input);
  }

  async update(id: string, input: UpdateLeadInput): Promise<Lead> {
    const payload =
      input.status === "converted" && input.convertedAt === undefined
        ? { ...input, convertedAt: new Date().toISOString() }
        : input;
    requireSupabaseConfigured("lead update");
    return leadsDbServiceServer.update(id, payload);
  }

  async delete(id: string): Promise<void> {
    requireSupabaseConfigured("lead deletion");
    return leadsDbServiceServer.delete(id);
  }

  async assign(leadId: string, agentId: string | null): Promise<Lead> {
    requireSupabaseConfigured("lead assignment");
    return leadsDbServiceServer.assign(leadId, agentId);
  }

  async updateStatus(id: string, status: LeadStatus): Promise<Lead> {
    return this.update(id, { status });
  }

  async getNotes(leadId: string, excludeInternal = false): Promise<Note[]> {
    if (!leadId?.trim()) return [];

    requireSupabaseConfigured("lead notes");
    const lead = await this.getById(leadId);
    if (!lead) return [];

    try {
      return await notesDbServiceServer.listByLead(leadId, undefined, excludeInternal);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[leads] getNotes failed:", error);
      }
      return [];
    }
  }

  async addNote(leadId: string, content: string, noteType: "public" | "internal" = "public"): Promise<Note> {
    const trimmed = content.trim();
    if (!leadId?.trim()) {
      throw new Error("Lead not found");
    }
    if (!trimmed) {
      throw new Error("Note content is required");
    }

    requireSupabaseConfigured("lead note creation");
    const lead = await this.getById(leadId);
    if (!lead) {
      throw new Error("Lead not found");
    }
    return notesDbServiceServer.create({ leadId, content: trimmed, noteType });
  }

  async getRosterAgents(): Promise<LeadRosterAgent[]> {
    requireSupabaseConfigured("agent roster");
    const { agentsDbServiceServer } = await import("@/services/db/agents.service");
    const agents = await agentsDbServiceServer.list(true);
    return agents.map((a) => ({ id: a.id, name: a.name }));
  }

  async listFollowupsByLead(leadId: string): Promise<Followup[]> {
    requireSupabaseConfigured("lead follow-up listing");
    const { followupsDbServiceServer } = await import("@/services/db/followups.service");
    return followupsDbServiceServer.listByLead(leadId);
  }
}

export const leadsService = new LeadsService();
