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

export interface AnalyticsFundRow {
  id: string;
  lead_id: string;
  agent_id: string;
  amount: number;
  created_at: string;
}

export interface AnalyticsRawData {
  dashboardStats: DashboardStatsRow | null;
  leads: AnalyticsLeadRow[];
  calls: AnalyticsCallRow[];
  followups: AnalyticsFollowupRow[];
  agents: AnalyticsAgentRow[];
  funds: AnalyticsFundRow[];
}

export class AnalyticsDbService extends BaseDbService {
  async fetchRaw(range: ReportDateRange, client?: TypedSupabaseClient, agentId?: string): Promise<AnalyticsRawData> {
    const supabase = await this.db(client);
    const from = range.from;
    const to = range.to;
    const today = new Date().toISOString().slice(0, 10);

    // Resolve profile_id for fund filtering (lead_funds.agent_id stores profile_id)
    // MUST use admin client to bypass RLS on agents table
    let fundProfileId: string | undefined;
    if (agentId) {
      const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
      const adminClient = isAdminClientConfigured() ? createAdminSupabaseClient() : supabase;
      const { data: agentRow } = await (adminClient as any)
        .from("agents")
        .select("profile_id")
        .eq("id", agentId)
        .maybeSingle();
      fundProfileId = (agentRow as any)?.profile_id ?? undefined;
      // CRITICAL: If we couldn't resolve profile_id, use a dummy ID to ensure zero results
      // Never fall through to admin (unfiltered) mode
      if (!fundProfileId) fundProfileId = "no-match-" + agentId;
    }

    const [dashboardStats, leads, calls, followups, agents, funds] = await Promise.all([
      agentId ? Promise.resolve(null) : this.refreshDashboardStats(supabase, today),
      this.fetchLeads(supabase, from, to, agentId),
      this.fetchCalls(supabase, from, to, agentId),
      this.fetchFollowups(supabase, from, to, agentId),
      agentId ? Promise.resolve([]) : this.fetchAgents(supabase),
      this.fetchFunds(supabase, from, to, fundProfileId),
    ]);

    return { dashboardStats, leads, calls, followups, agents, funds };
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
    agentId?: string,
  ): Promise<AnalyticsLeadRow[]> {
    let query = supabase
      .from("leads")
      .select("id, status, created_at, converted_at, assigned_agent_id, tier")
      .is("deleted_at", null)
      .gte("created_at", from)
      .lte("created_at", to);

    if (agentId) {
      query = query.eq("assigned_agent_id", agentId);
    }

    const data = await handleQueryOrThrow(query.limit(2000));
    return (data ?? []) as AnalyticsLeadRow[];
  }

  private async fetchCalls(
    supabase: TypedSupabaseClient,
    from: string,
    to: string,
    agentId?: string,
  ): Promise<AnalyticsCallRow[]> {
    let query = supabase
      .from("call_logs")
      .select("id, status, started_at, agent_id, duration_seconds, direction")
      .is("deleted_at", null)
      .gte("started_at", from)
      .lte("started_at", to);

    if (agentId) {
      query = query.eq("agent_id", agentId);
    }

    const data = await handleQueryOrThrow(query.limit(2000));
    return (data ?? []) as AnalyticsCallRow[];
  }

  private async fetchFollowups(
    supabase: TypedSupabaseClient,
    from: string,
    to: string,
    agentId?: string,
  ): Promise<AnalyticsFollowupRow[]> {
    // Fetch ALL pending/in_progress follow-ups (regardless of date) + completed within range
    // This ensures overdue follow-ups from before the range are still counted
    let pendingQuery = supabase
      .from(TABLES.FOLLOW_UPS)
      .select("id, status, due_at, assigned_agent_id, completed_at")
      .is("deleted_at", null)
      .in("status", ["pending", "in_progress"]);

    if (agentId) {
      pendingQuery = pendingQuery.eq("assigned_agent_id", agentId);
    }

    let completedQuery = supabase
      .from(TABLES.FOLLOW_UPS)
      .select("id, status, due_at, assigned_agent_id, completed_at")
      .is("deleted_at", null)
      .in("status", ["completed", "cancelled"])
      .gte("due_at", from)
      .lte("due_at", to);

    if (agentId) {
      completedQuery = completedQuery.eq("assigned_agent_id", agentId);
    }

    const [pendingData, completedData] = await Promise.all([
      handleQueryOrThrow(pendingQuery.limit(2000)),
      handleQueryOrThrow(completedQuery.limit(2000)),
    ]);

    return [
      ...((pendingData ?? []) as AnalyticsFollowupRow[]),
      ...((completedData ?? []) as AnalyticsFollowupRow[]),
    ];
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

  private async fetchFunds(
    supabase: TypedSupabaseClient,
    from: string,
    to: string,
    profileId?: string,
  ): Promise<AnalyticsFundRow[]> {
    try {
      const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
      const client = isAdminClientConfigured() ? createAdminSupabaseClient() : supabase;

      let query = (client as any)
        .from("lead_funds")
        .select("id, lead_id, agent_id, amount, created_at")
        .gte("created_at", from)
        .lte("created_at", to);

      if (profileId) {
        // Agent: filter by their profile_id (stored as agent_id in lead_funds)
        query = query.eq("agent_id", profileId);
      } else {
        // Admin: only include funds from non-deleted leads
        const { data: activeLeads } = await (client as any)
          .from("leads")
          .select("id")
          .is("deleted_at", null);
        const activeIds = ((activeLeads ?? []) as { id: string }[]).map((l) => l.id);
        if (activeIds.length === 0) return [];
        query = query.in("lead_id", activeIds);
      }

      const { data, error } = await query.limit(2000);
      if (error) return [];
      return (data ?? []) as AnalyticsFundRow[];
    } catch {
      return [];
    }
  }
}

export const analyticsDbService = new AnalyticsDbService("browser");
export const analyticsDbServiceServer = new AnalyticsDbService("server");
