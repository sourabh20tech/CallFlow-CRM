import { BaseDbService } from "@/services/db/base.service";
import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";
import type { ActivityLog, ActivityLogFilters, LogActivityInput } from "@/types/activity-log";
import { buildPaginatedResult, normalizePagination, type PaginatedResult, type PaginationParams } from "@/lib/db/pagination";

interface ActivityLogRow {
  id: string;
  user_id: string;
  user_name: string;
  role: string;
  action_type: string;
  action_description: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function mapRow(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    role: row.role as "admin" | "agent",
    actionType: row.action_type as ActivityLog["actionType"],
    actionDescription: row.action_description,
    entityType: (row.entity_type as ActivityLog["entityType"]) ?? undefined,
    entityId: row.entity_id ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  };
}

export class ActivityLogsDbService extends BaseDbService {
  async log(input: LogActivityInput, client?: TypedSupabaseClient): Promise<void> {
    const supabase = await this.db(client);

    await (supabase as any)
      .from("activity_logs")
      .insert({
        user_id: input.userId,
        user_name: input.userName,
        role: input.role,
        action_type: input.actionType,
        action_description: input.actionDescription,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        metadata: input.metadata ?? {},
      });
  }

  async list(
    filters?: ActivityLogFilters,
    pagination?: PaginationParams,
    client?: TypedSupabaseClient,
  ): Promise<PaginatedResult<ActivityLog>> {
    const supabase = await this.db(client);
    const { page, pageSize, from, to } = normalizePagination(pagination);

    let query = (supabase as any)
      .from("activity_logs")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters?.userId) query = query.eq("user_id", filters.userId);
    if (filters?.role) query = query.eq("role", filters.role);
    if (filters?.actionType) query = query.eq("action_type", filters.actionType);
    if (filters?.entityType) query = query.eq("entity_type", filters.entityType);
    if (filters?.entityId) query = query.eq("entity_id", filters.entityId);
    if (filters?.from) query = query.gte("created_at", filters.from);
    if (filters?.to) query = query.lte("created_at", filters.to);
    if (filters?.search) {
      const term = filters.search.replace(/[%_]/g, "");
      query = query.or(`action_description.ilike.%${term}%,user_name.ilike.%${term}%`);
    }

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const rows = ((data ?? []) as ActivityLogRow[]).map(mapRow);
    return buildPaginatedResult(rows, count ?? rows.length, page, pageSize);
  }

  async listByEntity(
    entityType: string,
    entityId: string,
    client?: TypedSupabaseClient,
  ): Promise<ActivityLog[]> {
    const supabase = await this.db(client);

    const { data, error } = await (supabase as any)
      .from("activity_logs")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return [];
    return ((data ?? []) as ActivityLogRow[]).map(mapRow);
  }

  async getRecent(limit = 10, userId?: string, client?: TypedSupabaseClient): Promise<ActivityLog[]> {
    const supabase = await this.db(client);

    let query = (supabase as any)
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) return [];
    return ((data ?? []) as ActivityLogRow[]).map(mapRow);
  }

  /** Critical action types that cannot be deleted (audit records) */
  private static PROTECTED_ACTIONS = new Set([
    "login",
    "logout",
    "lead_assigned",
    "lead_status_changed",
    "agent_created",
    "agent_deactivated",
  ]);

  /** Soft-delete a single activity log */
  async softDelete(id: string, userId: string, isAdmin: boolean, client?: TypedSupabaseClient): Promise<void> {
    const supabase = await this.db(client);

    // Fetch the log to verify ownership and type
    const { data: row, error: fetchError } = await (supabase as any)
      .from("activity_logs")
      .select("id, user_id, action_type")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError || !row) throw new Error("Activity log not found");

    // Check if it's a protected action
    if (ActivityLogsDbService.PROTECTED_ACTIONS.has(row.action_type)) {
      throw new Error("Cannot delete audit records (login, logout, assignments, conversions)");
    }

    // Agent can only delete own logs
    if (!isAdmin && row.user_id !== userId) {
      throw new Error("You can only delete your own activity logs");
    }

    const { error } = await (supabase as any)
      .from("activity_logs")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  /** Bulk soft-delete by IDs (admin only) */
  async bulkSoftDelete(ids: string[], client?: TypedSupabaseClient): Promise<number> {
    const supabase = await this.db(client);

    // Only delete non-protected logs
    const { data: rows } = await (supabase as any)
      .from("activity_logs")
      .select("id, action_type")
      .in("id", ids)
      .is("deleted_at", null);

    const deletableIds = ((rows ?? []) as { id: string; action_type: string }[])
      .filter((r) => !ActivityLogsDbService.PROTECTED_ACTIONS.has(r.action_type))
      .map((r) => r.id);

    if (deletableIds.length === 0) return 0;

    const { error } = await (supabase as any)
      .from("activity_logs")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", deletableIds);

    if (error) throw new Error(error.message);
    return deletableIds.length;
  }

  /** Bulk soft-delete by date (admin only) — delete non-critical logs older than given date */
  async softDeleteOlderThan(beforeDate: string, client?: TypedSupabaseClient): Promise<number> {
    const supabase = await this.db(client);

    const protectedList = Array.from(ActivityLogsDbService.PROTECTED_ACTIONS);

    const { count, error } = await (supabase as any)
      .from("activity_logs")
      .update({ deleted_at: new Date().toISOString() })
      .lt("created_at", beforeDate)
      .is("deleted_at", null)
      .not("action_type", "in", `(${protectedList.join(",")})`)
      .select("id", { count: "exact", head: true });

    if (error) throw new Error(error.message);
    return count ?? 0;
  }
}

export const activityLogsDbService = new ActivityLogsDbService("browser");
export const activityLogsDbServiceServer = new ActivityLogsDbService("server");
