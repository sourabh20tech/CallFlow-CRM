"use client";

import {
  Area,
  AreaChart,
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
import type { DailyCallsDataPoint } from "@/types/dashboard";

const ANIM = 1400;

interface DailyReportChartProps {
  data: DailyCallsDataPoint[];
  chartKey?: string;
}

export function DailyReportChart({ data, chartKey }: DailyReportChartProps) {
  const suffix = chartKey ? `-${chartKey}` : "";
  const callsGrad = `repCallsGrad${suffix}`;
  const ansGrad = `repAnsGrad${suffix}`;
  const hasData = data.some((d) => d.calls > 0);

  return (
    <ChartShell
      title="Daily report"
      description="Call volume and answer rate over the selected period"
      chartKey={chartKey}
      className="lg:col-span-2"
    >
      {!hasData ? (
        <ChartEmptyState message="No calls logged in this period" />
      ) : (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={callsGrad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={ansGrad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
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
          <Area
            type="monotone"
            dataKey="calls"
            name="Total calls"
            stroke="hsl(262, 83%, 58%)"
            fill={`url(#${callsGrad})`}
            strokeWidth={2}
            animationDuration={ANIM}
            isAnimationActive
          />
          <Area
            type="monotone"
            dataKey="answered"
            name="Answered"
            stroke="hsl(142, 71%, 45%)"
            fill={`url(#${ansGrad})`}
            strokeWidth={2}
            animationDuration={ANIM}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
      )}
    </ChartShell>
  );
}
