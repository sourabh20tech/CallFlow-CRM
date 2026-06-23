import { buildReportsBundleFromRaw } from "@/lib/reports/aggregations";
import { resolveDateRange } from "@/lib/reports/date-range";
import { resolveDateRangeFromPeriod, type ReportPeriod } from "@/lib/reports/period";
import { requireSupabaseConfigured } from "@/lib/supabase/config";
import { analyticsDbServiceServer } from "@/services/db/analytics.service";
import type { LiveDashboardStats, ReportDatePreset, ReportDateRange, ReportsBundle } from "@/types/reports";
import type { AnalyticsRawData } from "@/services/db/analytics.service";

export class ReportsService {
  private buildEmptyRaw(): AnalyticsRawData {
    return {
      dashboardStats: null,
      leads: [],
      calls: [],
      followups: [],
      agents: [],
    };
  }

  resolveRange(
    options: {
      preset?: ReportDatePreset;
      period?: ReportPeriod;
      customFrom?: string;
      customTo?: string;
    } = {},
  ): ReportDateRange {
    if (options.period) {
      return resolveDateRangeFromPeriod(options.period);
    }
    return resolveDateRange(options.preset ?? "this_week", options.customFrom, options.customTo);
  }

  async getReports(
    preset: ReportDatePreset = "this_week",
    customFrom?: string,
    customTo?: string,
    period?: ReportPeriod,
    agentId?: string,
  ): Promise<ReportsBundle> {
    const range = period
      ? resolveDateRangeFromPeriod(period)
      : resolveDateRange(preset, customFrom, customTo);

    requireSupabaseConfigured("reports");

    try {
      const raw = await analyticsDbServiceServer.fetchRaw(range, undefined, agentId);
      return buildReportsBundleFromRaw(range, raw);
    } catch {
      return buildReportsBundleFromRaw(range, this.buildEmptyRaw());
    }
  }

  async getLiveStats(): Promise<LiveDashboardStats | null> {
    requireSupabaseConfigured("live report stats");

    try {
      const row = await analyticsDbServiceServer.fetchLiveStats();
      if (!row) return null;

      const metrics = row.metrics ?? {};
      const refreshedAt =
        typeof metrics.refreshed_at === "string"
          ? metrics.refreshed_at
          : row.updated_at;

      return {
        totalLeads: row.total_leads,
        convertedLeads: row.converted_leads,
        pendingFollowups: row.pending_followups,
        totalCalls: row.total_calls,
        activeAgents: row.active_agents,
        conversionRate: Number(row.conversion_rate),
        refreshedAt,
      };
    } catch {
      return null;
    }
  }
}

export const reportsService = new ReportsService();
