import { BaseDbService } from "@/services/db/base.service";
import {
  CALL_LOG_BASE_SELECT,
  CALL_LOG_LIST_SELECT,
  getCurrentAgentId,
  handleListQueryOrThrow,
  handleQueryOrThrow,
  requireCurrentUserId,
  requireRow,
  stripUndefined,
} from "@/lib/db/api-helpers";
import {
  applyCallLogFilters,
  assertCallLogsListBuilder,
  createCallLogsCountQuery,
  createCallLogsListQuery,
  EMPTY_CALL_STATS,
  sanitizeCallLogSearchTerm,
  shouldRetryCallLogsListWithoutEmbeds,
  throwPostgrestError,
  type CallLogSearchContext,
} from "@/lib/db/call-logs-query";
import { DbError, toDbError } from "@/lib/db/errors";
import { mapCallLogRow, mapCallToInsert, mapCallToUpdate } from "@/lib/db/mappers";
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationParams,
} from "@/lib/db/pagination";
import type { CallLogWithRelations } from "@/types/database";
import type {
  Call,
  CallFilters,
  CallStats,
  CreateCallInput,
  UpdateCallInput,
} from "@/types/call";
import type { CallStatus } from "@/types/database";
import { TABLES } from "@/lib/db/table-names";
import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";
import type { PostgrestError } from "@supabase/supabase-js";

export class CallLogsDbService extends BaseDbService {
  private async resolveSearchLeadIds(
    term: string,
    supabase: TypedSupabaseClient,
  ): Promise<string[]> {
    const { data, error } = await supabase
      .from("leads")
      .select("id")
      .is("deleted_at", null)
      .or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(100);

    if (error) {
      console.warn("[call_logs] Lead search for call filter failed:", error.message || error.code);
      return [];
    }

    return (data ?? []).map((row) => row.id);
  }

  private async buildSearchContext(
    filters: CallFilters | undefined,
    supabase: TypedSupabaseClient,
  ): Promise<CallLogSearchContext> {
    const term = sanitizeCallLogSearchTerm(filters?.search);
    if (!term) {
      return { term: null, leadIds: null };
    }
    const leadIds = await this.resolveSearchLeadIds(term, supabase);
    return { term, leadIds };
  }

  private async executeListQuery(
    supabase: TypedSupabaseClient,
    filters: CallFilters | undefined,
    search: CallLogSearchContext,
    from: number,
    to: number,
    select: string,
  ) {
    let query = createCallLogsListQuery(supabase, select);
    query = applyCallLogFilters(query, filters, search);
    assertCallLogsListBuilder(query, "applyCallLogFilters");
    query = query.order("started_at", { ascending: false }).range(from, to);
    return handleListQueryOrThrow(query);
  }

  async list(
    filters?: CallFilters,
    pagination?: PaginationParams,
    client?: TypedSupabaseClient,
  ): Promise<PaginatedResult<Call>> {
    const supabase = await this.db(client);
    const { page, pageSize, from, to } = normalizePagination(pagination);
    const search = await this.buildSearchContext(filters, supabase);

    try {
      const { data, count } = await this.executeListQuery(
        supabase,
        filters,
        search,
        from,
        to,
        CALL_LOG_LIST_SELECT,
      );
      const rows = (data ?? []) as unknown as CallLogWithRelations[];
      const calls = await this.mapRowsWithNoteCounts(rows, supabase);
      return buildPaginatedResult(calls, count, page, pageSize);
    } catch (firstError) {
      if (!shouldRetryCallLogsListWithoutEmbeds(firstError)) {
        throw toDbError(firstError, "Failed to load call logs");
      }

      console.warn(
        "[call_logs] Embedded select failed; retrying base select:",
        firstError instanceof Error ? firstError.message : firstError,
      );

      const { data, count } = await this.executeListQuery(
        supabase,
        filters,
        search,
        from,
        to,
        CALL_LOG_BASE_SELECT,
      );
      const rows = (data ?? []) as unknown as CallLogWithRelations[];
      const calls = await this.mapRowsWithNoteCounts(rows, supabase);
      return buildPaginatedResult(calls, count, page, pageSize);
    }
  }

  async listAll(filters?: CallFilters, client?: TypedSupabaseClient): Promise<Call[]> {
    const result = await this.list(filters, { page: 1, pageSize: 500 }, client);
    return result.data;
  }

  async listByLead(leadId: string, client?: TypedSupabaseClient): Promise<Call[]> {
    const supabase = await this.db(client);

    try {
      const data = await handleQueryOrThrow(
        supabase
          .from("call_logs")
          .select(CALL_LOG_LIST_SELECT)
          .eq("lead_id", leadId)
          .is("deleted_at", null)
          .order("started_at", { ascending: false }),
      );
      const rows = (data ?? []) as CallLogWithRelations[];
      return this.mapRowsWithNoteCounts(rows, supabase);
    } catch (error) {
      if (!shouldRetryCallLogsListWithoutEmbeds(error)) {
        throw toDbError(error, "Failed to load calls for lead");
      }

      const data = await handleQueryOrThrow(
        supabase
          .from("call_logs")
          .select(CALL_LOG_BASE_SELECT)
          .eq("lead_id", leadId)
          .is("deleted_at", null)
          .order("started_at", { ascending: false }),
      );
      const rows = (data ?? []) as CallLogWithRelations[];
      return this.mapRowsWithNoteCounts(rows, supabase);
    }
  }

  async listRecent(limit = 10, client?: TypedSupabaseClient): Promise<Call[]> {
    const result = await this.list(undefined, { page: 1, pageSize: limit }, client);
    return result.data;
  }

  async getById(id: string, client?: TypedSupabaseClient): Promise<Call> {
    const supabase = await this.db(client);

    let data: CallLogWithRelations | null = null;

    try {
      data = (await handleQueryOrThrow(
        supabase
          .from("call_logs")
          .select(CALL_LOG_LIST_SELECT)
          .eq("id", id)
          .is("deleted_at", null)
          .maybeSingle(),
      )) as CallLogWithRelations | null;
    } catch (error) {
      if (!shouldRetryCallLogsListWithoutEmbeds(error)) {
        throw toDbError(error, "Failed to load call");
      }

      data = (await handleQueryOrThrow(
        supabase
          .from("call_logs")
          .select(CALL_LOG_BASE_SELECT)
          .eq("id", id)
          .is("deleted_at", null)
          .maybeSingle(),
      )) as CallLogWithRelations | null;
    }

    const row = requireRow(data, "Call", id);
    const noteCount = await this.getNoteCount(id, supabase);
    return mapCallLogRow(row, { noteCount });
  }

  async getStats(filters?: CallFilters, client?: TypedSupabaseClient): Promise<CallStats> {
    const supabase = await this.db(client);

    // Single query fetching only status column, then count in-memory
    try {
      let query = (supabase as any)
        .from("call_logs")
        .select("status")
        .is("deleted_at", null);

      if (filters?.agentId) query = query.eq("agent_id", filters.agentId);
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.direction) query = query.eq("direction", filters.direction);
      if (filters?.leadId) query = query.eq("lead_id", filters.leadId);
      if (filters?.dateFrom) query = query.gte("started_at", filters.dateFrom);
      if (filters?.dateTo) query = query.lte("started_at", filters.dateTo);

      const { data, error } = await query.limit(5000);
      if (error) throw error;

      const rows = (data ?? []) as { status: string }[];
      const total = rows.length;
      let connected = 0, callback = 0, interested = 0, noAnswer = 0;
      for (const r of rows) {
        if (r.status === "connected") connected++;
        else if (r.status === "callback") callback++;
        else if (r.status === "interested") interested++;
        else if (r.status === "no_answer") noAnswer++;
      }

      return { total, connected, callback, interested, noAnswer };
    } catch (error) {
      console.warn("[call_logs] getStats failed:", error);
      return { ...EMPTY_CALL_STATS };
    }
  }

  /** Safe stats for pages that must not crash on partial DB failures. */
  async getStatsSafe(
    filters?: CallFilters,
    client?: TypedSupabaseClient,
  ): Promise<CallStats> {
    try {
      return await this.getStats(filters, client);
    } catch (error) {
      console.warn("[call_logs] getStatsSafe fallback:", error);
      return { ...EMPTY_CALL_STATS };
    }
  }

  async getNoteCount(callId: string, client?: TypedSupabaseClient): Promise<number> {
    const supabase = client ?? (await this.db());

    const { count, error } = await supabase
      .from(TABLES.LEAD_NOTES)
      .select("id", { count: "exact", head: true })
      .eq("call_log_id", callId)
      .is("deleted_at", null);

    if (error) {
      console.warn("[call_logs] Note count query failed:", error.message || error.code);
      return 0;
    }

    return count ?? 0;
  }

  private async mapRowsWithNoteCounts(
    rows: CallLogWithRelations[],
    supabase: TypedSupabaseClient,
  ): Promise<Call[]> {
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const counts: Record<string, number> = {};

    const { data: noteRows, error } = await supabase
      .from(TABLES.LEAD_NOTES)
      .select("call_log_id")
      .in("call_log_id", ids)
      .is("deleted_at", null);

    if (error) {
      console.warn("[call_logs] Note count batch query failed:", error.message || error.code);
    } else {
      for (const n of noteRows ?? []) {
        if (n.call_log_id) {
          counts[n.call_log_id] = (counts[n.call_log_id] ?? 0) + 1;
        }
      }
    }

    return rows.map((row) => mapCallLogRow(row, { noteCount: counts[row.id] ?? 0 }));
  }

  async create(input: CreateCallInput, client?: TypedSupabaseClient): Promise<Call> {
    const supabase = await this.db(client);
    const userId = await requireCurrentUserId(supabase);
    const agentId = input.agentId ?? (await getCurrentAgentId(supabase));

    let data: CallLogWithRelations;

    try {
      data = (await handleQueryOrThrow(
        supabase
          .from("call_logs")
          .insert(mapCallToInsert(input, agentId, userId))
          .select(CALL_LOG_LIST_SELECT)
          .single(),
      )) as CallLogWithRelations;
    } catch (error) {
      if (!shouldRetryCallLogsListWithoutEmbeds(error)) {
        throw toDbError(error, "Failed to create call log");
      }

      data = (await handleQueryOrThrow(
        supabase
          .from("call_logs")
          .insert(mapCallToInsert(input, agentId, userId))
          .select(CALL_LOG_BASE_SELECT)
          .single(),
      )) as CallLogWithRelations;
    }

    await supabase
      .from("leads")
      .update({ last_contacted_at: new Date().toISOString() })
      .eq("id", input.leadId);

    return mapCallLogRow(data, { noteCount: 0 });
  }

  async update(id: string, input: UpdateCallInput, client?: TypedSupabaseClient): Promise<Call> {
    const supabase = await this.db(client);

    let data: CallLogWithRelations;

    try {
      data = (await handleQueryOrThrow(
        supabase
          .from("call_logs")
          .update(stripUndefined(mapCallToUpdate(input)))
          .eq("id", id)
          .is("deleted_at", null)
          .select(CALL_LOG_LIST_SELECT)
          .single(),
      )) as CallLogWithRelations;
    } catch (error) {
      if (!shouldRetryCallLogsListWithoutEmbeds(error)) {
        throw toDbError(error, "Failed to update call log");
      }

      data = (await handleQueryOrThrow(
        supabase
          .from("call_logs")
          .update(stripUndefined(mapCallToUpdate(input)))
          .eq("id", id)
          .is("deleted_at", null)
          .select(CALL_LOG_BASE_SELECT)
          .single(),
      )) as CallLogWithRelations;
    }

    const noteCount = await this.getNoteCount(id, supabase);
    return mapCallLogRow(data, { noteCount });
  }

  async updateStatus(
    id: string,
    status: CallStatus,
    client?: TypedSupabaseClient,
  ): Promise<Call> {
    const patch: UpdateCallInput = { status };
    if (status === "connected" || status === "interested") {
      patch.endedAt = new Date().toISOString();
    }
    return this.update(id, patch, client);
  }

  async softDelete(id: string, client?: TypedSupabaseClient): Promise<void> {
    const supabase = await this.db(client);
    await handleQueryOrThrow(
      supabase
        .from("call_logs")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .is("deleted_at", null),
    );
  }
}

export const callLogsDbService = new CallLogsDbService("browser");
export const callLogsDbServiceServer = new CallLogsDbService("server");
