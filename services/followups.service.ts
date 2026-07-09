import { requireSupabaseConfigured } from "@/lib/supabase/config";
import { toDbError } from "@/lib/db/errors";
import type { PaginatedResult, PaginationParams } from "@/lib/db/pagination";
import { followupsDbServiceServer } from "@/services/db/followups.service";
import type {
  AgentFollowupSummary,
  CreateFollowupInput,
  Followup,
  FollowupFilters,
  FollowupListResult,
  FollowupStats,
  UpdateFollowupInput,
} from "@/types/followup";

export class FollowupsService {
  async list(filters?: FollowupFilters): Promise<Followup[]> {
    requireSupabaseConfigured("follow-up listing");
    try {
      return await followupsDbServiceServer.listAll(filters);
    } catch (error) {
      throw toDbError(error, "Failed to load follow-ups");
    }
  }

  async listPaginated(
    filters?: FollowupFilters,
    pagination?: PaginationParams,
  ): Promise<FollowupListResult> {
    requireSupabaseConfigured("paginated follow-up listing");
    const result: PaginatedResult<Followup> = await followupsDbServiceServer
      .list(filters, pagination)
      .catch((error) => {
        throw toDbError(error, "Failed to load follow-ups");
      });

    return {
      followups: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  async getById(id: string): Promise<Followup | undefined> {
    requireSupabaseConfigured("follow-up details");
    try {
      return await followupsDbServiceServer.getById(id);
    } catch {
      return undefined;
    }
  }

  async create(input: CreateFollowupInput): Promise<Followup> {
    requireSupabaseConfigured("follow-up creation");
    return followupsDbServiceServer
      .create(input)
      .catch((error) => Promise.reject(toDbError(error, "Failed to create follow-up")));
  }

  async update(id: string, input: UpdateFollowupInput): Promise<Followup> {
    requireSupabaseConfigured("follow-up update");
    return followupsDbServiceServer
      .update(id, input)
      .catch((error) => Promise.reject(toDbError(error, "Failed to update follow-up")));
  }

  async complete(id: string): Promise<Followup> {
    requireSupabaseConfigured("follow-up completion");
    return followupsDbServiceServer
      .complete(id)
      .catch((error) => Promise.reject(toDbError(error, "Failed to complete follow-up")));
  }

  async delete(id: string): Promise<void> {
    requireSupabaseConfigured("follow-up deletion");
    return followupsDbServiceServer
      .delete(id)
      .catch((error) => Promise.reject(toDbError(error, "Failed to delete follow-up")));
  }

  async getStats(filters?: FollowupFilters): Promise<FollowupStats> {
    requireSupabaseConfigured("follow-up stats");
    const all = await this.list(filters?.view === "calendar" ? { ...filters, view: "all" } : filters);
    try {
      return followupsDbServiceServer.computeStats(all);
    } catch {
      return { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0, dueToday: 0 };
    }
  }

  async getAgentSummaries(): Promise<AgentFollowupSummary[]> {
    requireSupabaseConfigured("follow-up agent summaries");
    const all = await this.list({ view: "all" });
    return followupsDbServiceServer.computeAgentSummaries(all);
  }

  getReminders(followups: Followup[]): {
    overdue: Followup[];
    dueToday: Followup[];
    upcoming: Followup[];
  } {
    const active = followups.filter(
      (f) => f.status === "pending" || f.status === "in_progress",
    );
    const now = Date.now();
    const in24h = now + 24 * 60 * 60 * 1000;

    // Use IST calendar day for "dueToday"
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayStr = formatter.format(new Date());

    const overdue = active.filter((f) => new Date(f.dueAt).getTime() < now);
    const dueToday = active.filter((f) => {
      const dueStr = formatter.format(new Date(f.dueAt));
      return dueStr === todayStr && new Date(f.dueAt).getTime() >= now;
    });
    const upcoming = active.filter((f) => {
      const t = new Date(f.dueAt).getTime();
      return t >= now && t <= in24h && !dueToday.includes(f);
    });

    return { overdue, dueToday, upcoming };
  }
}

export const followupsService = new FollowupsService();
