"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartEmptyState } from "@/components/reports/charts/chart-empty-state";
import { ChartShell } from "@/components/reports/charts/chart-shell";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import type { AgentPerformanceDataPoint } from "@/types/dashboard";

const ANIM = 1400;

interface AgentReportChartProps {
  data: AgentPerformanceDataPoint[];
  chartKey?: string;
}

export function AgentReportChart({ data, chartKey }: AgentReportChartProps) {
  const hasData = data.some((d) => d.calls > 0 || d.conversions > 0);

  return (
    <ChartShell
      title="Agent performance"
      description="Calls handled and conversions by agent"
      chartKey={chartKey}
      className="lg:col-span-2"
    >
      {!hasData ? (
        <ChartEmptyState message="No agent activity in this period" />
      ) : (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" horizontal={false} />
          <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => (
              <ChartTooltip
                active={active}
                label={label}
                payload={payload?.map((p) => ({
                  name: p.name as string,
                  value: p.value as number,
                  color: p.color as string,
                }))}
              />
            )}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="calls" name="Calls" fill="hsl(262, 83%, 58%)" radius={[0, 4, 4, 0]} animationDuration={ANIM} />
          <Bar dataKey="conversions" name="Conversions" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} animationDuration={ANIM} />
        </BarChart>
      </ResponsiveContainer>
      )}
    </ChartShell>
  );
}
