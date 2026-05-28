"use client";

import { Clock, Phone, Star, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/design-system/glass-card";
import { StatCard } from "@/components/design-system/stat-card";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import type { AgentPerformanceSummary } from "@/types/agent";
import { formatDuration } from "@/utils/format";

interface AgentPerformanceOverviewProps {
  agentName: string;
  performance: AgentPerformanceSummary;
}

export function AgentPerformanceOverview({
  agentName,
  performance,
}: AgentPerformanceOverviewProps) {
  const chartData = [
    { metric: "Calls", value: performance.callsHandled },
    { metric: "Leads", value: performance.assignedLeads },
    { metric: "Conv %", value: performance.conversionRate },
  ];

  return (
    <div className="space-y-[var(--ds-stack-gap)]">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Calls handled"
          value={performance.callsHandled}
          icon={Phone}
          description="Lifetime volume"
        />
        <StatCard
          title="Avg handle time"
          value={formatDuration(performance.avgHandleTime)}
          icon={Clock}
          description="Per completed call"
        />
        <StatCard
          title="CSAT score"
          value={`${performance.satisfaction}/5`}
          icon={Star}
          description="Customer rating"
        />
        <StatCard
          title="Assigned leads"
          value={performance.assignedLeads}
          icon={Users}
          description={`${performance.conversionRate}% conversion rate`}
        />
      </div>

      <GlassCard variant="default" padding="md">
        <h3 className="ds-h3 mb-1">Performance snapshot</h3>
        <p className="ds-caption mb-4 text-muted-foreground">
          Key metrics for {agentName}
        </p>
        <div className="h-[220px] w-full min-h-[200px] sm:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
              <XAxis
                dataKey="metric"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
