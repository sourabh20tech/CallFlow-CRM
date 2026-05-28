import type {
  AgentPerformanceDataPoint,
  DailyCallsDataPoint,
  LeadConversionDataPoint,
} from "@/types/dashboard";

export type ReportDatePreset = "7d" | "30d" | "90d" | "custom";

export type ReportPeriod = "day" | "week" | "month";

export interface FollowupAnalyticsPoint {
  status: string;
  count: number;
}

export interface FollowupAnalyticsSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byStatus: FollowupAnalyticsPoint[];
}

export interface LiveDashboardStats {
  totalLeads: number;
  convertedLeads: number;
  pendingFollowups: number;
  totalCalls: number;
  activeAgents: number;
  conversionRate: number;
  refreshedAt: string;
}

export interface ReportDateRange {
  from: string;
  to: string;
  preset?: ReportDatePreset;
}

export interface ReportsKpiSummary {
  totalCalls: number;
  answeredRate: number;
  conversionRate: number;
  totalRevenue: number;
  revenueChange: number;
  avgHandleTime: number;
  avgSatisfaction: number;
  activeAgents: number;
  pendingFollowups?: number;
  totalLeads?: number;
  convertedLeads?: number;
}

export interface SalesAnalyticsPoint {
  period: string;
  revenue: number;
  deals: number;
  pipeline: number;
  avgDealSize: number;
}

export interface PerformanceAnalyticsPoint {
  period: string;
  satisfaction: number;
  handleTime: number;
  resolutionRate: number;
  firstCallResolution: number;
}

export interface HourlyVolumePoint {
  hour: string;
  inbound: number;
  outbound: number;
}

export interface ReportsBundle {
  range: ReportDateRange;
  kpis: ReportsKpiSummary;
  daily: DailyCallsDataPoint[];
  leadConversion: LeadConversionDataPoint[];
  agentPerformance: AgentPerformanceDataPoint[];
  sales: SalesAnalyticsPoint[];
  performance: PerformanceAnalyticsPoint[];
  hourlyVolume: HourlyVolumePoint[];
  followups: FollowupAnalyticsSummary;
  generatedAt: string;
  source?: "supabase" | "demo";
}
