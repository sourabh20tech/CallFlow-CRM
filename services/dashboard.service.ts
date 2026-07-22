import "server-only";
import { analyticsDbServiceServer } from "@/services/db/analytics.service";
import { buildReportsBundleFromRaw } from "@/lib/reports/aggregations";
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
      preset: "this_week",
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

    const raw = await analyticsDbServiceServer.fetchRaw(range);
    const bundle = buildReportsBundleFromRaw(range, raw);

    // Derive activities from raw data (no extra queries needed)
    const activities: DashboardActivity[] = [
      ...raw.leads.slice(0, 4).map((row) => ({
        id: `lead-${row.id}`,
        type: "lead" as const,
        title: "Lead updated",
        description: `Lead ${row.status}`,
        timestamp: row.created_at,
      })),
      ...raw.calls.slice(0, 4).map((row) => ({
        id: `call-${row.id}`,
        type: "call" as const,
        title: "Call logged",
        description: `Status: ${row.status}`,
        timestamp: row.started_at,
      })),
      ...raw.followups.slice(0, 4).map((row) => ({
        id: `followup-${row.id}`,
        type: "follow-up" as const,
        title: "Follow-up task",
        description: `Status: ${row.status}`,
        timestamp: row.due_at,
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
      leads: [],
      updatedAt: bundle.generatedAt,
    };
  }
}

export const dashboardService = new DashboardService();
