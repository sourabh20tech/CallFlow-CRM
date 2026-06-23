"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { ChartViewport } from "@/components/charts/chart-viewport";
import type { AgentPerformanceDataPoint } from "@/types/dashboard";

const ANIM_DURATION = 1200;

interface AgentPerformanceChartProps {
  data: AgentPerformanceDataPoint[];
}

export function AgentPerformanceChart({ data }: AgentPerformanceChartProps) {
  return (
    <ChartCard
      title="Agent Performance"
      description="Calls and conversions by agent"
    >
      <ChartViewport className="h-[280px] w-full min-h-[240px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
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
            <Bar
              yAxisId="left"
              dataKey="calls"
              name="Calls"
              fill="hsl(262, 83%, 58%)"
              radius={[6, 6, 0, 0]}
              isAnimationActive
              animationDuration={ANIM_DURATION}
            />
            <Bar
              yAxisId="left"
              dataKey="conversions"
              name="Conversions"
              fill="hsl(221, 83%, 53%)"
              radius={[6, 6, 0, 0]}
              isAnimationActive
              animationDuration={ANIM_DURATION}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartViewport>
    </ChartCard>
  );
}
