import { BaseDbService } from "@/services/db/base.service";
import { handleQueryOrThrow } from "@/lib/db/api-helpers";
import { TABLES } from "@/lib/db/table-names";
import type { ReportDateRange } from "@/types/reports";
import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";
import type { LeadTier } from "@/types/database";

export interface DashboardStatsRow {
  id: string;
  stat_date: string;
  total_leads: number;
  converted_leads: number;
  pending_followups: number;
  total_calls: number;
  active_agents: number;
  conversion_rate: number;
  metrics: Record<string, unknown>;
  updated_at: string;
}

export interface AnalyticsLeadRow {
  id: string;
  status: string;
  created_at: string;
  converted_at: string | null;
  assigned_agent_id: string | null;
  tier?: LeadTier;
}

export interface AnalyticsCallRow {
  id: string;
  status: string;
  started_at: string;
  agent_id: string | null;
  duration_seconds: number;
  direction: string;
}

export interface AnalyticsFollowupRow {
  id: string;
  status: string;
  due_at: string;
  assigned_agent_id: string | null;
  completed_at: string | null;
}

export interface AnalyticsAgentRow {
  id: string;
  full_name: string;
  satisfaction_score: number | null;
  avg_handle_time_seconds: number;
  calls_handled: number;
}

export interface AnalyticsRawData {
  dashboardStats: DashboardStatsRow | null;
  leads: AnalyticsLeadRow[];
  calls: AnalyticsCallRow[];
  followups: AnalyticsFollowupRow[];
  agents: AnalyticsAgentRow[];
}

export class AnalyticsDbService extends BaseDbService {
  async fetchRaw(range: ReportDateRange, client?: TypedSupabaseClient): Promise<AnalyticsRawData> {
    const supabase = await this.db(client);
    const from = range.from;
    const to = range.to;
    const today = new Date().toISOString().slice(0, 10);

    const [dashboardStats, leads, calls, followups, agents] = await Promise.all([
      this.refreshDashboardStats(supabase, today),
      this.fetchLeads(supabase, from, to),
      this.fetchCalls(supabase, from, to),
      this.fetchFollowups(supabase, from, to),
      this.fetchAgents(supabase),
    ]);

    return { dashboardStats, leads, calls, followups, agents };
  }

  async fetchLiveStats(client?: TypedSupabaseClient): Promise<DashboardStatsRow | null> {
    const supabase = await this.db(client);
    const today = new Date().toISOString().slice(0, 10);
    return this.refreshDashboardStats(supabase, today);
  }

  private async refreshDashboardStats(
    supabase: TypedSupabaseClient,
    statDate: string,
  ): Promise<DashboardStatsRow | null> {
    try {
      const row = await handleQueryOrThrow(
        supabase.rpc("refresh_dashboard_stats", { p_stat_date: statDate }),
      );
      return row as DashboardStatsRow;
    } catch {
      const { data } = await supabase
        .from("dashboard_stats")
        .select(
          "id, stat_date, total_leads, converted_leads, pending_followups, total_calls, active_agents, conversion_rate, metrics, updated_at",
        )
        .eq("scope", "global")
        .is("agent_id", null)
        .eq("stat_date", statDate)
        .maybeSingle();

      return (data as DashboardStatsRow | null) ?? null;
    }
  }

  private async fetchLeads(
    supabase: TypedSupabaseClient,
    from: string,
    to: string,
  ): Promise<AnalyticsLeadRow[]> {
    const data = await handleQueryOrThrow(
      supabase
        .from("leads")
        .select("id, status, created_at, converted_at, assigned_agent_id, tier")
        .is("deleted_at", null)
        .gte("created_at", from)
        .lte("created_at", to)
        .limit(5000),
    );
    return (data ?? []) as AnalyticsLeadRow[];
  }

  private async fetchCalls(
    supabase: TypedSupabaseClient,
    from: string,
    to: string,
  ): Promise<AnalyticsCallRow[]> {
    const data = await handleQueryOrThrow(
      supabase
        .from("call_logs")
        .select("id, status, started_at, agent_id, duration_seconds, direction")
        .is("deleted_at", null)
        .gte("started_at", from)
        .lte("started_at", to)
        .limit(5000),
    );
    return (data ?? []) as AnalyticsCallRow[];
  }

  private async fetchFollowups(
    supabase: TypedSupabaseClient,
    from: string,
    to: string,
  ): Promise<AnalyticsFollowupRow[]> {
    const data = await handleQueryOrThrow(
      supabase
        .from(TABLES.FOLLOW_UPS)
        .select("id, status, due_at, assigned_agent_id, completed_at")
        .is("deleted_at", null)
        .gte("due_at", from)
        .lte("due_at", to)
        .limit(5000),
    );
    return (data ?? []) as AnalyticsFollowupRow[];
  }

  private async fetchAgents(supabase: TypedSupabaseClient): Promise<AnalyticsAgentRow[]> {
    const data = await handleQueryOrThrow(
      supabase
        .from("agents")
        .select(
          "id, satisfaction_score, avg_handle_time_seconds, calls_handled, profiles ( full_name )",
        )
        .eq("is_active", true)
        .is("deleted_at", null)
        .limit(200),
    );

    return ((data ?? []) as Array<{
      id: string;
      satisfaction_score: number | null;
      avg_handle_time_seconds: number;
      calls_handled: number;
      profiles: { full_name: string | null } | null;
    }>).map((row) => ({
      id: row.id,
      full_name: row.profiles?.full_name?.trim() || "Agent",
      satisfaction_score: row.satisfaction_score,
      avg_handle_time_seconds: row.avg_handle_time_seconds,
      calls_handled: row.calls_handled,
    }));
  }
}

export const analyticsDbService = new AnalyticsDbService("browser");
export const analyticsDbServiceServer = new AnalyticsDbService("server");
