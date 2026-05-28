import "server-only";

import { BaseDbService } from "@/services/db/base.service";
import { handleListQueryOrThrow, handleQueryOrThrow } from "@/lib/db/api-helpers";
import { TABLES } from "@/lib/db/table-names";
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationParams,
} from "@/lib/db/pagination";
import {
  createAdminSupabaseClient,
  isAdminClientConfigured,
} from "@/lib/supabase/admin";
import type {
  DataManagementActionResult,
  DataManagementResource,
  TrashEntity,
  TrashItem,
} from "@/types/data-management";
import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";

const TRASH_SELECT = {
  leads: "id, full_name, deleted_at",
  call_logs: "id, created_at, deleted_at, lead_id",
  follow_ups: "id, title, deleted_at",
  agents: "id, deleted_at, profile:profiles(full_name, email)",
} as const;

function softDeleteTimestamp(): string {
  return new Date().toISOString();
}

function cutoffIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export class DataManagementDbService extends BaseDbService {
  private async adminOrServer(client?: TypedSupabaseClient): Promise<TypedSupabaseClient> {
    if (isAdminClientConfigured()) {
      return createAdminSupabaseClient() as unknown as TypedSupabaseClient;
    }
    return this.db(client);
  }

  async deleteLead(id: string, client?: TypedSupabaseClient): Promise<DataManagementActionResult> {
    const supabase = await this.db(client);
    const { data } = await handleListQueryOrThrow(
      supabase
        .from("leads")
        .update({ deleted_at: softDeleteTimestamp() })
        .eq("id", id)
        .is("deleted_at", null)
        .select("id"),
    );
    return { success: true, affectedCount: data?.length ?? 0 };
  }

  async bulkDeleteLeads(
    ids: string[],
    client?: TypedSupabaseClient,
  ): Promise<DataManagementActionResult> {
    const supabase = await this.db(client);
    const { data } = await handleListQueryOrThrow(
      supabase
        .from("leads")
        .update({ deleted_at: softDeleteTimestamp() })
        .in("id", ids)
        .is("deleted_at", null)
        .select("id"),
    );
    return { success: true, affectedCount: data?.length ?? 0 };
  }

  async restoreLead(id: string, client?: TypedSupabaseClient): Promise<DataManagementActionResult> {
    return this.restoreEntity("leads", id, client);
  }

  async deleteCallLog(
    id: string,
    client?: TypedSupabaseClient,
  ): Promise<DataManagementActionResult> {
    const supabase = await this.db(client);
    const { data } = await handleListQueryOrThrow(
      supabase
        .from(TABLES.CALL_LOGS)
        .update({ deleted_at: softDeleteTimestamp() })
        .eq("id", id)
        .is("deleted_at", null)
        .select("id"),
    );
    return { success: true, affectedCount: data?.length ?? 0 };
  }

  async deleteOldCallLogs(
    olderThanDays: number,
    client?: TypedSupabaseClient,
  ): Promise<DataManagementActionResult> {
    const supabase = await this.db(client);
    const { data } = await handleListQueryOrThrow(
      supabase
        .from(TABLES.CALL_LOGS)
        .update({ deleted_at: softDeleteTimestamp() })
        .lt("created_at", cutoffIso(olderThanDays))
        .is("deleted_at", null)
        .select("id"),
    );
    return { success: true, affectedCount: data?.length ?? 0 };
  }

  async bulkCleanupCallLogs(
    olderThanDays: number,
    client?: TypedSupabaseClient,
  ): Promise<DataManagementActionResult> {
    return this.deleteOldCallLogs(olderThanDays, client);
  }

  async deleteFollowUp(
    id: string,
    client?: TypedSupabaseClient,
  ): Promise<DataManagementActionResult> {
    const supabase = await this.db(client);
    const { data } = await handleListQueryOrThrow(
      supabase
        .from(TABLES.FOLLOW_UPS)
        .update({ deleted_at: softDeleteTimestamp() })
        .eq("id", id)
        .is("deleted_at", null)
        .select("id"),
    );
    return { success: true, affectedCount: data?.length ?? 0 };
  }

  async deleteCompletedFollowUps(
    client?: TypedSupabaseClient,
  ): Promise<DataManagementActionResult> {
    const supabase = await this.db(client);
    const { data } = await handleListQueryOrThrow(
      supabase
        .from(TABLES.FOLLOW_UPS)
        .update({ deleted_at: softDeleteTimestamp() })
        .eq("status", "completed")
        .is("deleted_at", null)
        .select("id"),
    );
    return { success: true, affectedCount: data?.length ?? 0 };
  }

  async deactivateAgent(
    id: string,
    client?: TypedSupabaseClient,
  ): Promise<DataManagementActionResult> {
    const supabase = await this.db(client);
    const { data } = await handleListQueryOrThrow(
      supabase
        .from("agents")
        .update({ is_active: false, status: "offline" })
        .eq("id", id)
        .is("deleted_at", null)
        .select("id"),
    );
    return { success: true, affectedCount: data?.length ?? 0 };
  }

  async softDeleteAgent(
    id: string,
    client?: TypedSupabaseClient,
  ): Promise<DataManagementActionResult> {
    const supabase = await this.db(client);
    const { data } = await handleListQueryOrThrow(
      supabase
        .from("agents")
        .update({
          deleted_at: softDeleteTimestamp(),
          is_active: false,
          status: "offline",
        })
        .eq("id", id)
        .is("deleted_at", null)
        .select("id"),
    );
    return { success: true, affectedCount: data?.length ?? 0 };
  }

  async restoreEntity(
    entity: TrashEntity,
    id: string,
    client?: TypedSupabaseClient,
  ): Promise<DataManagementActionResult> {
    const supabase = await this.db(client);
    const table = this.tableForEntity(entity);
    const { data } = await handleListQueryOrThrow(
      supabase
        .from(table)
        .update({ deleted_at: null })
        .eq("id", id)
        .not("deleted_at", "is", null)
        .select("id"),
    );
    return { success: true, affectedCount: data?.length ?? 0 };
  }

  async permanentDelete(
    entity: TrashEntity,
    id: string,
  ): Promise<DataManagementActionResult> {
    const supabase = await this.adminOrServer();
    const table = this.tableForEntity(entity);

    const { data: row } = await supabase
      .from(table)
      .select("id, deleted_at")
      .eq("id", id)
      .maybeSingle();

    if (!row?.deleted_at) {
      throw new Error("Record must be in trash before permanent deletion.");
    }

    await handleQueryOrThrow(supabase.from(table).delete().eq("id", id));

    return { success: true, affectedCount: 1 };
  }

  async listTrash(
    resource: DataManagementResource,
    pagination?: PaginationParams,
    client?: TypedSupabaseClient,
  ): Promise<PaginatedResult<TrashItem>> {
    const supabase = await this.db(client);
    const { page, pageSize, from, to } = normalizePagination(pagination);
    const table = this.tableForEntity(resource);
    const select = TRASH_SELECT[resource];

    const { data, count } = await handleListQueryOrThrow(
      supabase
        .from(table)
        .select(select, { count: "exact" })
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .range(from, to),
    );

    const items = this.mapTrashRows(resource, data ?? []);
    return buildPaginatedResult(items, count, page, pageSize);
  }

  private tableForEntity(entity: TrashEntity): "leads" | "call_logs" | "follow_ups" | "agents" {
    switch (entity) {
      case "leads":
        return "leads";
      case "call_logs":
        return TABLES.CALL_LOGS;
      case "follow_ups":
        return TABLES.FOLLOW_UPS;
      case "agents":
        return "agents";
      default:
        return entity;
    }
  }

  private mapTrashRows(resource: DataManagementResource, rows: unknown[]): TrashItem[] {
    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      const deletedAt = String(r.deleted_at ?? "");
      const id = String(r.id);

      switch (resource) {
        case "leads":
          return {
            id,
            resource,
            label: String(r.full_name ?? "Lead"),
            deletedAt,
          };
        case "call_logs":
          return {
            id,
            resource,
            label: `Call log ${id.slice(0, 8)}…`,
            deletedAt,
            meta: r.lead_id ? `Lead ${String(r.lead_id).slice(0, 8)}…` : undefined,
          };
        case "follow_ups":
          return {
            id,
            resource,
            label: String(r.title ?? "Follow-up"),
            deletedAt,
          };
        case "agents": {
          const profile = r.profile as { full_name?: string; email?: string } | null;
          const name = profile?.full_name ?? profile?.email ?? "Agent";
          return {
            id,
            resource,
            label: name,
            deletedAt,
          };
        }
        default:
          return { id, resource, label: id, deletedAt };
      }
    });
  }
}

export const dataManagementDbService = new DataManagementDbService("server");
