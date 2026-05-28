import { BaseDbService } from "@/services/db/base.service";
import {
  FOLLOWUP_BASE_SELECT,
  FOLLOWUP_LIST_SELECT,
  getCurrentAgentId,
  handleListQueryOrThrow,
  handleQueryOrThrow,
  requireCurrentUserId,
  requireRow,
  stripUndefined,
} from "@/lib/db/api-helpers";
import { DbError, toDbError } from "@/lib/db/errors";
import { mapFollowupRow } from "@/lib/db/mappers";
import { TABLES } from "@/lib/db/table-names";
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationParams,
} from "@/lib/db/pagination";
import {
  ACTIVE_STATUSES,
  isFollowupDueToday,
  isFollowupOverdue,
} from "@/lib/followups/constants";
import type { FollowupWithRelations } from "@/types/database";
import type {
  AgentFollowupSummary,
  CreateFollowupInput,
  Followup,
  FollowupFilters,
  FollowupStats,
  UpdateFollowupInput,
} from "@/types/followup";
import type { FollowupStatus } from "@/types/database";
import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";

export class FollowupsDbService extends BaseDbService {
  private shouldRetryWithoutEmbeds(error: unknown): boolean {
    const msg = error instanceof Error ? error.message.toLowerCase() : "";
    return (
      msg.includes("relationship") ||
      msg.includes("schema cache") ||
      msg.includes("does not exist") ||
      msg.includes("could not find") ||
      msg.includes("pgrst200") ||
      msg.includes("pgrst201")
    );
  }

  private async listWithSelect(
    select: string,
    filters: FollowupFilters | undefined,
    pagination: PaginationParams | undefined,
    client: TypedSupabaseClient,
  ): Promise<PaginatedResult<Followup>> {
    const { page, pageSize, from, to } = normalizePagination(pagination);
    let query = this.applyFilters(
      client.from(TABLES.FOLLOW_UPS).select(select, { count: "exact" }),
      filters,
    ).order("due_at", { ascending: true });

    if (pagination) {
      query = query.range(from, to);
    }

    const { data, count } = await handleListQueryOrThrow(query);
    let rows = (data ?? []) as FollowupWithRelations[];

    if (filters?.search?.trim()) {
      const q = filters.search.toLowerCase();
      rows = rows.filter((r) => {
        const title = r.title.toLowerCase();
        const lead = r.leads?.full_name?.toLowerCase() ?? "";
        const agent = r.agents?.profiles?.full_name?.toLowerCase() ?? "";
        const desc = r.description?.toLowerCase() ?? "";
        return title.includes(q) || lead.includes(q) || agent.includes(q) || desc.includes(q);
      });
    }

    const mapped = rows.map((row) => mapFollowupRow(row));
    const total = pagination ? (count ?? mapped.length) : mapped.length;

    return buildPaginatedResult(mapped, total, page, pageSize);
  }

  private applyFilters(
    query: ReturnType<TypedSupabaseClient["from"]>,
    filters?: FollowupFilters,
  ) {
    let q = query.is("deleted_at", null);

    if (filters?.view === "calendar" || filters?.view === "all") {
      // no status filter
    } else if (filters?.view === "pending" || filters?.status === "active") {
      q = q.in("status", ACTIVE_STATUSES);
    } else if (filters?.view === "completed") {
      q = q.eq("status", "completed");
    } else if (filters?.status && filters.status !== "all") {
      q = q.eq("status", filters.status);
    }

    if (filters?.agentId) q = q.eq("assigned_agent_id", filters.agentId);
    if (filters?.leadId) q = q.eq("lead_id", filters.leadId);
    if (filters?.priority && filters.priority !== "all") {
      q = q.eq("priority", filters.priority);
    }
    if (filters?.from) q = q.gte("due_at", filters.from);
    if (filters?.to) q = q.lte("due_at", filters.to);

    return q;
  }

  async list(
    filters?: FollowupFilters,
    pagination?: PaginationParams,
    client?: TypedSupabaseClient,
  ): Promise<PaginatedResult<Followup>> {
    const supabase = await this.db(client);
    try {
      return await this.listWithSelect(FOLLOWUP_LIST_SELECT, filters, pagination, supabase);
    } catch (error) {
      if (!this.shouldRetryWithoutEmbeds(error)) {
        throw toDbError(error, "Failed to load follow-ups");
      }
      return this.listWithSelect(FOLLOWUP_BASE_SELECT, filters, pagination, supabase);
    }
  }

  async listAll(filters?: FollowupFilters, client?: TypedSupabaseClient): Promise<Followup[]> {
    const { data } = await this.list(filters, { page: 1, pageSize: 500 }, client);
    return data;
  }

  async listPending(client?: TypedSupabaseClient): Promise<Followup[]> {
    return this.listAll({ view: "pending" }, client);
  }

  async listCompleted(client?: TypedSupabaseClient): Promise<Followup[]> {
    return this.listAll({ view: "completed" }, client);
  }

  async listByLead(leadId: string, client?: TypedSupabaseClient): Promise<Followup[]> {
    return this.listAll({ leadId, view: "all" }, client);
  }

  async getById(id: string, client?: TypedSupabaseClient): Promise<Followup> {
    const supabase = await this.db(client);
    try {
      const data = await handleQueryOrThrow(
        supabase
          .from(TABLES.FOLLOW_UPS)
          .select(FOLLOWUP_LIST_SELECT)
          .eq("id", id)
          .is("deleted_at", null)
          .maybeSingle(),
      );
      return mapFollowupRow(requireRow(data as FollowupWithRelations | null, "Follow-up", id));
    } catch (error) {
      if (!this.shouldRetryWithoutEmbeds(error)) {
        throw toDbError(error, "Failed to load follow-up");
      }
      const data = await handleQueryOrThrow(
        supabase
          .from(TABLES.FOLLOW_UPS)
          .select(FOLLOWUP_BASE_SELECT)
          .eq("id", id)
          .is("deleted_at", null)
          .maybeSingle(),
      );
      return mapFollowupRow(requireRow(data as FollowupWithRelations | null, "Follow-up", id));
    }
  }

  async create(input: CreateFollowupInput, client?: TypedSupabaseClient): Promise<Followup> {
    const supabase = await this.db(client);
    const userId = await requireCurrentUserId(supabase);
    const agentId = input.assignedAgentId ?? (await getCurrentAgentId(supabase));

    const payload = {
      lead_id: input.leadId,
      title: input.title,
      description: input.description ?? null,
      due_at: input.dueAt,
      assigned_agent_id: agentId,
      priority: input.priority ?? "medium",
      status: input.status ?? "pending",
      created_by: userId,
    };
    try {
      const data = await handleQueryOrThrow(
        supabase
          .from(TABLES.FOLLOW_UPS)
          .insert(payload)
          .select(FOLLOWUP_LIST_SELECT)
          .single(),
      );
      return mapFollowupRow(data as FollowupWithRelations);
    } catch (error) {
      if (!this.shouldRetryWithoutEmbeds(error)) {
        throw toDbError(error, "Failed to create follow-up");
      }
      const data = await handleQueryOrThrow(
        supabase
          .from(TABLES.FOLLOW_UPS)
          .insert(payload)
          .select(FOLLOWUP_BASE_SELECT)
          .single(),
      );
      return mapFollowupRow(data as FollowupWithRelations);
    }
  }

  async update(
    id: string,
    input: UpdateFollowupInput,
    client?: TypedSupabaseClient,
  ): Promise<Followup> {
    const supabase = await this.db(client);

    const patch = stripUndefined({
      lead_id: input.leadId,
      title: input.title,
      description: input.description,
      due_at: input.dueAt,
      assigned_agent_id: input.assignedAgentId,
      priority: input.priority,
      status: input.status,
      completed_at: input.completedAt,
    });

    const ensureUpdatedRow = (row: FollowupWithRelations | null): FollowupWithRelations => {
      if (row) return row;
      throw new DbError(
        "Follow-up not found or you do not have permission to update it",
        "NOT_FOUND",
      );
    };

    try {
      const data = await handleQueryOrThrow(
        supabase
          .from(TABLES.FOLLOW_UPS)
          .update(patch)
          .eq("id", id)
          .is("deleted_at", null)
          .select(FOLLOWUP_LIST_SELECT)
          .maybeSingle(),
      );
      return mapFollowupRow(ensureUpdatedRow(data as FollowupWithRelations | null));
    } catch (error) {
      if (!this.shouldRetryWithoutEmbeds(error)) {
        throw toDbError(error, "Failed to update follow-up");
      }
      const data = await handleQueryOrThrow(
        supabase
          .from(TABLES.FOLLOW_UPS)
          .update(patch)
          .eq("id", id)
          .is("deleted_at", null)
          .select(FOLLOWUP_BASE_SELECT)
          .maybeSingle(),
      );
      return mapFollowupRow(ensureUpdatedRow(data as FollowupWithRelations | null));
    }
  }

  async complete(id: string, client?: TypedSupabaseClient): Promise<Followup> {
    return this.update(
      id,
      { status: "completed" as FollowupStatus, completedAt: new Date().toISOString() },
      client,
    );
  }

  async delete(id: string, client?: TypedSupabaseClient): Promise<void> {
    const supabase = await this.db(client);
    await handleQueryOrThrow(
      supabase
        .from(TABLES.FOLLOW_UPS)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .is("deleted_at", null),
    );
  }

  computeStats(followups: Followup[]): FollowupStats {
    return {
      total: followups.length,
      pending: followups.filter((f) => f.status === "pending").length,
      inProgress: followups.filter((f) => f.status === "in_progress").length,
      completed: followups.filter((f) => f.status === "completed").length,
      overdue: followups.filter((f) => isFollowupOverdue(f)).length,
      dueToday: followups.filter((f) => isFollowupDueToday(f)).length,
    };
  }

  computeAgentSummaries(followups: Followup[]): AgentFollowupSummary[] {
    const map = new Map<string, AgentFollowupSummary>();

    for (const f of followups) {
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
}

export const followupsDbService = new FollowupsDbService("browser");
export const followupsDbServiceServer = new FollowupsDbService("server");
