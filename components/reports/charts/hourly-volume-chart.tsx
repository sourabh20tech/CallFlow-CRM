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
import { ChartShell } from "@/components/reports/charts/chart-shell";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import type { HourlyVolumePoint } from "@/types/reports";

const ANIM = 1400;

interface HourlyVolumeChartProps {
  data: HourlyVolumePoint[];
  chartKey?: string;
}

export function HourlyVolumeChart({ data, chartKey }: HourlyVolumeChartProps) {
  return (
    <ChartShell
      title="Hourly call volume"
      description="Inbound vs outbound distribution (avg. business day)"
      chartKey={chartKey}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
          <XAxis dataKey="hour" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
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
          <Bar dataKey="inbound" name="Inbound" stackId="a" fill="hsl(221, 83%, 53%)" radius={[0, 0, 0, 0]} animationDuration={ANIM} />
          <Bar dataKey="outbound" name="Outbound" stackId="a" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} animationDuration={ANIM} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
