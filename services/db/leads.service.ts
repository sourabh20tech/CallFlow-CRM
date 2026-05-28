import { BaseDbService } from "@/services/db/base.service";
import {
  handleListQueryOrThrow,
  handleQueryOrThrow,
  LEAD_LIST_SELECT,
  requireCurrentUserId,
  requireRow,
} from "@/lib/db/api-helpers";
import { mapLeadRow, mapLeadToInsert, mapLeadToUpdate } from "@/lib/db/mappers";
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationParams,
} from "@/lib/db/pagination";
import type { LeadWithAgent } from "@/types/database";
import type { CreateLeadInput, Lead, UpdateLeadInput } from "@/types/lead";
import type { LeadStatus } from "@/types/database";
import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";

export interface LeadFilters {
  status?: LeadStatus;
  tier?: import("@/types/database").LeadTier;
  assignedAgentId?: string;
  unassignedOnly?: boolean;
  search?: string;
}

export class LeadsDbService extends BaseDbService {
  async list(
    filters?: LeadFilters,
    pagination?: PaginationParams,
    client?: TypedSupabaseClient,
  ): Promise<PaginatedResult<Lead>> {
    const supabase = await this.db(client);
    const { page, pageSize, from, to } = normalizePagination(pagination);

    let query = supabase
      .from("leads")
      .select(LEAD_LIST_SELECT, { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.tier) query = query.eq("tier", filters.tier);
    if (filters?.unassignedOnly) {
      query = query.is("assigned_agent_id", null);
    } else if (filters?.assignedAgentId) {
      query = query.eq("assigned_agent_id", filters.assignedAgentId);
    }
    if (filters?.search) {
      const term = filters.search.replace(/[%_]/g, "");
      query = query.or(
        `full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,company.ilike.%${term}%`,
      );
    }

    const { data, count } = await handleListQueryOrThrow(query);
    const rows = data as LeadWithAgent[];
    return buildPaginatedResult(
      rows.map(mapLeadRow),
      count ?? rows.length,
      page,
      pageSize,
    );
  }

  async getById(id: string, client?: TypedSupabaseClient): Promise<Lead> {
    const supabase = await this.db(client);
    const data = await handleQueryOrThrow(
      supabase
        .from("leads")
        .select(LEAD_LIST_SELECT)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle(),
    );
    return mapLeadRow(requireRow(data as LeadWithAgent | null, "Lead", id));
  }

  async create(input: CreateLeadInput, client?: TypedSupabaseClient): Promise<Lead> {
    const supabase = await this.db(client);
    const userId = await requireCurrentUserId(supabase);

    const data = await handleQueryOrThrow(
      supabase
        .from("leads")
        .insert(mapLeadToInsert(input, userId))
        .select(LEAD_LIST_SELECT)
        .single(),
    );

    return mapLeadRow(data as LeadWithAgent);
  }

  async update(
    id: string,
    input: UpdateLeadInput,
    client?: TypedSupabaseClient,
  ): Promise<Lead> {
    const supabase = await this.db(client);

    const data = await handleQueryOrThrow(
      supabase
        .from("leads")
        .update(mapLeadToUpdate(input))
        .eq("id", id)
        .select(LEAD_LIST_SELECT)
        .single(),
    );

    return mapLeadRow(data as LeadWithAgent);
  }

  async delete(id: string, client?: TypedSupabaseClient): Promise<void> {
    const supabase = await this.db(client);
    await handleQueryOrThrow(
      supabase
        .from("leads")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .is("deleted_at", null),
    );
  }

  async assign(
    leadId: string,
    agentId: string | null,
    client?: TypedSupabaseClient,
  ): Promise<Lead> {
    return this.update(leadId, { assignedAgentId: agentId ?? undefined }, client);
  }
}

export const leadsDbService = new LeadsDbService("browser");
export const leadsDbServiceServer = new LeadsDbService("server");
