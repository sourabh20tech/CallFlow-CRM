"use client";

import { memo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartShell } from "@/components/reports/charts/chart-shell";
import { ChartEmptyState } from "@/components/reports/charts/chart-empty-state";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import type { FollowupAnalyticsPoint } from "@/types/reports";

const ANIM = 1200;

interface FollowupAnalyticsChartProps {
  data: FollowupAnalyticsPoint[];
  chartKey?: string;
}

function FollowupAnalyticsChartInner({ data, chartKey }: FollowupAnalyticsChartProps) {
  const hasData = data.some((d) => d.count > 0);

  return (
    <ChartShell
      title="Follow-up status"
      description="Tasks by status in the selected period"
      chartKey={chartKey}
    >
      {!hasData ? (
        <ChartEmptyState message="No follow-ups in this period" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
            <XAxis
              dataKey="status"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
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
                    name: "Count",
                    value: p.value as number,
                    color: p.color as string,
                  }))}
                />
              )}
            />
            <Bar
              dataKey="count"
              name="Follow-ups"
              fill="hsl(221, 83%, 53%)"
              radius={[6, 6, 0, 0]}
              animationDuration={ANIM}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

export const FollowupAnalyticsChart = memo(FollowupAnalyticsChartInner);
