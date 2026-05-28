"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartShell } from "@/components/reports/charts/chart-shell";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import type { PerformanceAnalyticsPoint } from "@/types/reports";

const ANIM = 1400;

interface PerformanceAnalyticsChartProps {
  data: PerformanceAnalyticsPoint[];
  chartKey?: string;
}

export function PerformanceAnalyticsChart({ data, chartKey }: PerformanceAnalyticsChartProps) {
  return (
    <ChartShell
      title="Performance analytics"
      description="CSAT, resolution rate, and first-call resolution trends"
      chartKey={chartKey}
      className="lg:col-span-2"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
          <XAxis dataKey="period" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} domain={[3.5, 5]} />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[60, 100]}
            unit="%"
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
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="satisfaction"
            name="CSAT"
            stroke="hsl(262, 83%, 58%)"
            strokeWidth={2}
            dot={{ r: 3 }}
            animationDuration={ANIM}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="resolutionRate"
            name="Resolution %"
            stroke="hsl(142, 71%, 45%)"
            strokeWidth={2}
            dot={{ r: 3 }}
            animationDuration={ANIM}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="firstCallResolution"
            name="FCR %"
            stroke="hsl(38, 92%, 50%)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3 }}
            animationDuration={ANIM}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
