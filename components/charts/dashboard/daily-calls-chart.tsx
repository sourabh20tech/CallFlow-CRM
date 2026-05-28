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
import { ChartCard } from "@/components/dashboard/chart-card";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { ChartViewport } from "@/components/charts/chart-viewport";
import type { DailyCallsDataPoint } from "@/types/dashboard";

const ANIM_DURATION = 1200;

interface DailyCallsChartProps {
  data: DailyCallsDataPoint[];
  gradientId?: string;
}

export function DailyCallsChart({ data, gradientId = "daily-calls" }: DailyCallsChartProps) {
  const callsGrad = `${gradientId}-calls`;
  const answeredGrad = `${gradientId}-answered`;

  return (
    <ChartCard title="Daily Calls" description="Total vs answered — last 7 days">
      <ChartViewport className="h-[260px] w-full min-h-[220px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id={callsGrad} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={answeredGrad} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
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
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Area
              type="monotone"
              dataKey="calls"
              name="Total"
              stroke="hsl(262, 83%, 58%)"
              fill={`url(#${callsGrad})`}
              strokeWidth={2}
              isAnimationActive
              animationDuration={ANIM_DURATION}
            />
            <Area
              type="monotone"
              dataKey="answered"
              name="Answered"
              stroke="hsl(142, 71%, 45%)"
              fill={`url(#${answeredGrad})`}
              strokeWidth={2}
              isAnimationActive
              animationDuration={ANIM_DURATION}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartViewport>
    </ChartCard>
  );
}
