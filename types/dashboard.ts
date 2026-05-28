import type { LucideIcon } from "lucide-react";

export interface AdminDashboardStats {
  totalLeads: number;
  convertedLeads: number;
  pendingFollowUps: number;
  totalCalls: number;
  activeAgents: number;
  conversionRate: number;
  trends: {
    totalLeads: number;
    convertedLeads: number;
    pendingFollowUps: number;
    totalCalls: number;
    activeAgents: number;
  };
}

export interface DailyCallsDataPoint {
  day: string;
  calls: number;
  answered: number;
}

export interface LeadConversionDataPoint {
  month: string;
  leads: number;
  converted: number;
}

export interface AgentPerformanceDataPoint {
  name: string;
  calls: number;
  conversions: number;
  satisfaction: number;
}

export interface DashboardActivity {
  id: string;
  type: "call" | "lead" | "follow-up" | "agent";
  title: string;
  description: string;
  timestamp: string;
}

export interface DashboardLeadRow {
  id: string;
  name: string;
  company?: string;
  email: string;
  tier: "standard" | "premium" | "enterprise";
  status: import("@/types/database").LeadStatus;
  lastContactAt: string;
}

export interface StatCardConfig {
  key: keyof AdminDashboardStats;
  title: string;
  icon: string;
  trendKey: keyof AdminDashboardStats["trends"];
  format?: "number" | "percent";
}
