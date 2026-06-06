import {
  CALL_LOG_BASE_SELECT,
  CALL_LOG_LIST_SELECT,
} from "@/lib/db/api-helpers";
import { DbError, formatPostgrestErrorMessage, isPostgrestError } from "@/lib/db/errors";
import type { CallFilters } from "@/types/call";
import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";
import type { PostgrestError } from "@supabase/supabase-js";

export { CALL_LOG_LIST_SELECT, CALL_LOG_BASE_SELECT };

/** List query after `.from('call_logs').select(..., { count: 'exact' })`. */
export function createCallLogsListQuery(
  client: TypedSupabaseClient,
  select: string = CALL_LOG_LIST_SELECT,
) {
  return client.from("call_logs").select(select, { count: "exact" });
}

/** Head count query for stats (no order/range). */
export function createCallLogsCountQuery(client: TypedSupabaseClient) {
  return client.from("call_logs").select("id", { count: "exact", head: true });
}

export type CallLogsListQuery = ReturnType<typeof createCallLogsListQuery>;
export type CallLogsCountQuery = ReturnType<typeof createCallLogsCountQuery>;

export type CallLogsFilterableQuery = CallLogsListQuery | CallLogsCountQuery;

export interface CallLogSearchContext {
  term: string | null;
  leadIds: string[] | null;
}

export const EMPTY_CALL_STATS = {
  total: 0,
  connected: 0,
  callback: 0,
  interested: 0,
  noAnswer: 0,
} as const;

/** Strip wildcards; returns null when empty. */
export function sanitizeCallLogSearchTerm(raw?: string): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const safe = trimmed.replace(/[%_]/g, "");
  return safe.length > 0 ? safe : null;
}

/** PostgREST `in` filter for UUID primary keys. */
export function formatUuidInList(ids: string[]): string {
  return ids.map((id) => `"${id}"`).join(",");
}

/**
 * Supabase PostgREST builders are thenable — never `await` them except to execute.
 * Use this guard before `.order()` / `.range()`.
 */
export function assertCallLogsListBuilder(
  query: unknown,
  step: string,
): asserts query is CallLogsListQuery {
  if (
    query === null ||
    typeof query !== "object" ||
    typeof (query as CallLogsListQuery).order !== "function" ||
    typeof (query as CallLogsListQuery).range !== "function"
  ) {
    throw new Error(
      `[call_logs] Query builder corrupted after "${step}". Do not await filter helpers — only await execution.`,
    );
  }
}

/** Apply shared filters synchronously; preserves the builder instance chain. */
export function applyCallLogFilters<T extends CallLogsFilterableQuery>(
  query: T,
  filters: CallFilters | undefined,
  search: CallLogSearchContext,
): T {
  let q = query.is("deleted_at", null);

  const status = filters?.status;
  if (status && status !== "all") {
    q = q.eq("status", status);
  }

  const direction = filters?.direction;
  if (direction && direction !== "all") {
    q = q.eq("direction", direction);
  }

  if (filters?.agentId) {
    q = q.eq("agent_id", filters.agentId);
  }
  if (filters?.leadId) {
    q = q.eq("lead_id", filters.leadId);
  }
  if (filters?.dateFrom) {
    q = q.gte("started_at", filters.dateFrom);
  }
  if (filters?.dateTo) {
    q = q.lte("started_at", filters.dateTo);
  }
  if (filters?.todayOnly) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    q = q.gte("started_at", start.toISOString()).lte("started_at", end.toISOString());
  }

  const term = search.term;
  if (term) {
    const leadIds = search.leadIds;
    if (leadIds && leadIds.length > 0) {
      q = q.or(`summary.ilike.%${term}%,status.ilike.%${term}%,lead_id.in.(${formatUuidInList(leadIds)})`);
    } else {
      q = q.or(`summary.ilike.%${term}%,status.ilike.%${term}%`);
    }
  }

  return q as T;
}

/** True when a list query should retry without embedded relations. */
export function shouldRetryCallLogsListWithoutEmbeds(error: unknown): boolean {
  if (!(error instanceof DbError) && !isPostgrestError(error)) {
    return false;
  }

  const message = (
    error instanceof DbError ? error.message : formatPostgrestErrorMessage(error)
  ).toLowerCase();

  const code = (error instanceof DbError ? error.code : error.code ?? "").toUpperCase();

  return (
    code === "PGRST200" ||
    code === "PGRST201" ||
    code === "42703" ||
    code === "42P01" ||
    message.includes("relationship") ||
    message.includes("could not find") ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

export function throwPostgrestError(error: PostgrestError, context: string): never {
  const message = error.message?.trim()
    ? error.message
    : `${context}: ${formatPostgrestErrorMessage(error)}`;
  throw new DbError(message, error.code ?? "DB_ERROR", error.details ?? undefined, error.hint ?? undefined);
}
