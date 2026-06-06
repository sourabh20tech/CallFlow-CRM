import "server-only";
import { analyticsDbServiceServer } from "@/services/db/analytics.service";
import { buildReportsBundleFromRaw } from "@/lib/reports/aggregations";
import { createClient } from "@/lib/supabase/server";
import { requireSupabaseConfigured } from "@/lib/supabase/config";
import type {
  AdminDashboardStats,
  AgentPerformanceDataPoint,
  DailyCallsDataPoint,
  DashboardActivity,
  DashboardLeadRow,
  LeadConversionDataPoint,
} from "@/types/dashboard";
import type { ReportDateRange } from "@/types/reports";

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  dailyCalls: DailyCallsDataPoint[];
  leadConversion: LeadConversionDataPoint[];
  agentPerformance: AgentPerformanceDataPoint[];
  activities: DashboardActivity[];
  leads: DashboardLeadRow[];
  updatedAt: string;
}

export class DashboardService {
  private emptyData(): AdminDashboardData {
    return {
      stats: {
        totalLeads: 0,
        convertedLeads: 0,
        pendingFollowUps: 0,
        totalCalls: 0,
        activeAgents: 0,
        conversionRate: 0,
        trends: {
          totalLeads: 0,
          convertedLeads: 0,
          pendingFollowUps: 0,
          totalCalls: 0,
          activeAgents: 0,
        },
      },
      dailyCalls: [],
      leadConversion: [],
      agentPerformance: [],
      activities: [],
      leads: [],
      updatedAt: new Date().toISOString(),
    };
  }

  private lastNDaysRange(days: number): ReportDateRange {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - Math.max(0, days - 1));
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      preset: "7d",
    };
  }

  private mapStats(bundle: ReturnType<typeof buildReportsBundleFromRaw>): AdminDashboardStats {
    return {
      totalLeads: bundle.kpis.totalLeads ?? 0,
      convertedLeads: bundle.kpis.convertedLeads ?? 0,
      pendingFollowUps: bundle.kpis.pendingFollowups ?? 0,
      totalCalls: bundle.kpis.totalCalls ?? 0,
      activeAgents: bundle.kpis.activeAgents ?? 0,
      conversionRate: bundle.kpis.conversionRate ?? 0,
      trends: {
        totalLeads: 0,
        convertedLeads: 0,
        pendingFollowUps: 0,
        totalCalls: 0,
        activeAgents: 0,
      },
    };
  }

  async getAdminDashboard(): Promise<AdminDashboardData> {
    requireSupabaseConfigured("admin dashboard");

    const range = this.lastNDaysRange(7);
    const supabase = await createClient();

    // Run analytics and recent items in parallel for faster load
    const [raw, { data: leadsRows }, { data: callRows }, { data: followRows }] =
      await Promise.all([
        analyticsDbServiceServer.fetchRaw(range),
        supabase
          .from("leads")
          .select("id, full_name, company, email, tier, status, last_contacted_at, created_at")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("call_logs")
          .select("id, status, started_at")
          .is("deleted_at", null)
          .order("started_at", { ascending: false })
          .limit(5),
        supabase
          .from("follow_ups")
          .select("id, title, due_at, status, created_at")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    const bundle = buildReportsBundleFromRaw(range, raw);

    const leads: DashboardLeadRow[] = (leadsRows ?? []).map((row) => ({
      id: row.id,
      name: row.full_name,
      company: row.company ?? undefined,
      email: row.email ?? "—",
      tier: (row.tier as DashboardLeadRow["tier"]) ?? "standard",
      status: row.status as DashboardLeadRow["status"],
      lastContactAt: row.last_contacted_at ?? row.created_at,
    }));

    const activities: DashboardActivity[] = [
      ...(leadsRows ?? []).slice(0, 4).map((row) => ({
        id: `lead-${row.id}`,
        type: "lead" as const,
        title: "Lead updated",
        description: row.full_name,
        timestamp: row.created_at,
      })),
      ...(callRows ?? []).slice(0, 4).map((row) => ({
        id: `call-${row.id}`,
        type: "call" as const,
        title: "Call logged",
        description: `Status: ${row.status}`,
        timestamp: row.started_at,
      })),
      ...(followRows ?? []).slice(0, 4).map((row) => ({
        id: `followup-${row.id}`,
        type: "follow-up" as const,
        title: "Follow-up task",
        description: row.title ?? `Status: ${row.status}`,
        timestamp: row.created_at ?? row.due_at,
      })),
    ]
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
      .slice(0, 10);

    return {
      stats: this.mapStats(bundle),
      dailyCalls: bundle.daily as DailyCallsDataPoint[],
      leadConversion: bundle.leadConversion as LeadConversionDataPoint[],
      agentPerformance: bundle.agentPerformance as AgentPerformanceDataPoint[],
      activities,
      leads,
      updatedAt: bundle.generatedAt,
    };
  }
}

export const dashboardService = new DashboardService();
