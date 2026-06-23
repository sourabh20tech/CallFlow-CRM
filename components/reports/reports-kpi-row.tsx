"use client";

import { CalendarClock, Headphones, IndianRupee, Percent, Users } from "lucide-react";
import { StatCard } from "@/components/design-system/stat-card";
import { statsGrid } from "@/lib/design-system/styles";
import { formatCurrency, formatNumber } from "@/utils/format";
import type { ReportsKpiSummary } from "@/types/reports";

interface ReportsKpiRowProps {
  kpis: ReportsKpiSummary;
}

export function ReportsKpiRow({ kpis }: ReportsKpiRowProps) {
  return (
    <div className={statsGrid}>
      <StatCard
        title="Total calls"
        value={formatNumber(kpis.totalCalls)}
        icon={Headphones}
        description={`${kpis.answeredRate}% answered`}
      />
      <StatCard
        title="Conversion rate"
        value={`${kpis.conversionRate}%`}
        icon={Percent}
        description="Leads to won deals"
      />
      <StatCard
        title="Fund"
        value={formatCurrency(kpis.totalFund)}
        icon={IndianRupee}
        trend={{ value: kpis.fundChange, label: "vs prior period" }}
      />
      <StatCard
        title="Avg handle time"
        value={`${Math.floor(kpis.avgHandleTime / 60)}:${String(kpis.avgHandleTime % 60).padStart(2, "0")}`}
        icon={Headphones}
        description="Per completed call"
      />
      {kpis.pendingFollowups !== undefined && (
        <StatCard
          title="Pending follow-ups"
          value={kpis.pendingFollowups}
          icon={CalendarClock}
          description={
            kpis.totalLeads !== undefined
              ? `${kpis.totalLeads} leads · ${kpis.convertedLeads ?? 0} converted`
              : "Active tasks"
          }
        />
      )}
    </div>
  );
}
