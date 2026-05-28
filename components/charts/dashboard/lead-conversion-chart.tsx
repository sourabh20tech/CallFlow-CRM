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
import { ChartCard } from "@/components/dashboard/chart-card";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { ChartViewport } from "@/components/charts/chart-viewport";
import type { LeadConversionDataPoint } from "@/types/dashboard";

const ANIM_DURATION = 1200;

interface LeadConversionChartProps {
  data: LeadConversionDataPoint[];
}

export function LeadConversionChart({ data }: LeadConversionChartProps) {
  return (
    <ChartCard title="Lead Conversion" description="Leads vs conversions by month">
      <ChartViewport className="h-[260px] w-full min-h-[220px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
            <XAxis
              dataKey="month"
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
            <Bar
              dataKey="leads"
              name="Leads"
              fill="hsl(221, 83%, 53%)"
              radius={[6, 6, 0, 0]}
              isAnimationActive
              animationDuration={ANIM_DURATION}
            />
            <Bar
              dataKey="converted"
              name="Converted"
              fill="hsl(262, 83%, 58%)"
              radius={[6, 6, 0, 0]}
              isAnimationActive
              animationDuration={ANIM_DURATION}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartViewport>
    </ChartCard>
  );
}
