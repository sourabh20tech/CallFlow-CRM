import type { PostgrestError } from "@supabase/supabase-js";
import { DbError, NotFoundError } from "@/lib/db/errors";
import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";

export type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: DbError };

export async function handleQuery<T>(
  promise: PromiseLike<{ data: T; error: PostgrestError | null }>,
): Promise<ApiResult<T>> {
  const { data, error } = await promise;
  if (error) {
    return { data: null, error: DbError.fromPostgrest(error) };
  }
  return { data, error: null };
}

export async function handleQueryOrThrow<T>(
  promise: PromiseLike<{ data: T; error: PostgrestError | null }>,
): Promise<T> {
  const result = await handleQuery(promise);
  if (result.error) throw result.error;
  return result.data;
}

export async function handleListQueryOrThrow<T>(
  promise: PromiseLike<{
    data: T;
    error: PostgrestError | null;
    count: number | null;
  }>,
): Promise<{ data: T; count: number }> {
  const { data, error, count } = await promise;
  if (error) throw DbError.fromPostgrest(error);
  return { data, count: count ?? 0 };
}

export function requireRow<T>(row: T | null, resource: string, id?: string): T {
  if (row === null) {
    throw new NotFoundError(resource, id);
  }
  return row;
}

export async function getCurrentUserId(
  supabase: TypedSupabaseClient,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function requireCurrentUserId(
  supabase: TypedSupabaseClient,
): Promise<string> {
  const id = await getCurrentUserId(supabase);
  if (!id) {
    throw new DbError("Not authenticated", "UNAUTHORIZED");
  }
  return id;
}

export async function getCurrentAgentId(
  supabase: TypedSupabaseClient,
): Promise<string | null> {
  const userId = await getCurrentUserId(supabase);
  if (!userId) return null;

  const { data, error } = await supabase
    .from("agents")
    .select("id")
    .eq("profile_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    const { data: fallback } = await supabase
      .from("agents")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();
    return fallback?.id ?? null;
  }

  return data?.id ?? null;
}

/** Standard list select fragments */
export const LEAD_LIST_SELECT = `
  *,
  agents (
    id,
    profile_id,
    profiles ( full_name, email )
  )
` as const;

export const AGENT_LIST_SELECT = `
  *,
  profiles ( email, full_name, avatar_url, phone )
` as const;

/** Full row + lead/agent names for call management UI. */
export const CALL_LOG_LIST_SELECT = `
  *,
  leads!call_logs_lead_id_fkey ( id, full_name, phone, email ),
  agents!call_logs_agent_id_fkey (
    id,
    profiles!agents_profile_id_fkey ( full_name )
  )
` as const;

/** Fallback when embed relations are unavailable (schema/RLS); mapper supplies defaults. */
export const CALL_LOG_BASE_SELECT = `*` as const;

export const FOLLOWUP_LIST_SELECT = `
  *,
  leads ( id, full_name ),
  agents (
    id,
    profiles ( full_name )
  )
` as const;

export const FOLLOWUP_BASE_SELECT = `*` as const;

export const NOTE_LIST_SELECT = `
  *,
  profiles ( full_name, email, avatar_url )
` as const;

export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
