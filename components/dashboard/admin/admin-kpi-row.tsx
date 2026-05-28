"use client";

import {
  CalendarClock,
  Phone,
  UserCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AnimatedStatCard } from "@/components/dashboard/animated-stat-card";
import { statsGrid } from "@/lib/design-system/styles";
import type { AdminDashboardStats } from "@/types/dashboard";

interface KpiConfig {
  title: string;
  icon: LucideIcon;
  valueKey: keyof Pick<
    AdminDashboardStats,
    "totalLeads" | "convertedLeads" | "pendingFollowUps" | "totalCalls" | "activeAgents"
  >;
  trendKey: keyof AdminDashboardStats["trends"];
  trendLabel: string;
  delay: number;
  className?: string;
  suffix?: string;
}

const KPI_CONFIG: KpiConfig[] = [
  {
    title: "Total Leads",
    icon: UserPlus,
    valueKey: "totalLeads",
    trendKey: "totalLeads",
    trendLabel: "vs last month",
    delay: 0,
  },
  {
    title: "Converted Leads",
    icon: UserCheck,
    valueKey: "convertedLeads",
    trendKey: "convertedLeads",
    trendLabel: "vs last month",
    delay: 80,
  },
  {
    title: "Pending Follow-Ups",
    icon: CalendarClock,
    valueKey: "pendingFollowUps",
    trendKey: "pendingFollowUps",
    trendLabel: "open tasks",
    delay: 160,
  },
  {
    title: "Total Calls",
    icon: Phone,
    valueKey: "totalCalls",
    trendKey: "totalCalls",
    trendLabel: "this month",
    delay: 240,
  },
  {
    title: "Active Agents",
    icon: Users,
    valueKey: "activeAgents",
    trendKey: "activeAgents",
    trendLabel: "available now",
    delay: 320,
    className: "sm:col-span-2 lg:col-span-1",
  },
];

interface AdminKpiRowProps {
  stats: AdminDashboardStats;
}

export function AdminKpiRow({ stats }: AdminKpiRowProps) {
  return (
    <section aria-label="Key metrics" className={statsGrid}>
      {KPI_CONFIG.map((kpi) => (
        <AnimatedStatCard
          key={kpi.title}
          title={kpi.title}
          value={stats[kpi.valueKey]}
          icon={kpi.icon}
          trend={stats.trends[kpi.trendKey]}
          trendLabel={kpi.trendLabel}
          delay={kpi.delay}
          className={kpi.className}
          suffix={kpi.suffix}
        />
      ))}
    </section>
  );
}

/** Optional summary chip row below KPIs */
export function AdminKpiSummary({ stats }: AdminKpiRowProps) {
  return (
    <p className="ds-caption text-center sm:text-left">
      Pipeline conversion rate:{" "}
      <span className="font-semibold text-foreground">{stats.conversionRate}%</span>
    </p>
  );
}
