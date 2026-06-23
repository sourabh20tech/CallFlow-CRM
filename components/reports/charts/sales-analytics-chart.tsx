"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartShell } from "@/components/reports/charts/chart-shell";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { formatCurrency, formatCurrencyCompact } from "@/utils/format";
import type { SalesAnalyticsPoint } from "@/types/reports";

const ANIM = 1400;

interface SalesAnalyticsChartProps {
  data: SalesAnalyticsPoint[];
  chartKey?: string;
}

export function SalesAnalyticsChart({ data, chartKey }: SalesAnalyticsChartProps) {
  return (
    <ChartShell
      title="Sales analytics"
      description="Fund, pipeline value, and deal volume"
      chartKey={chartKey}
      className="lg:col-span-2"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="repRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
          <XAxis dataKey="period" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            yAxisId="left"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCurrencyCompact(Number(v))}
          />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            content={({ active, payload, label }) => (
              <ChartTooltip
                active={active}
                label={label}
                payload={payload?.map((p) => ({
                  name: p.name as string,
                  value:
                    p.dataKey === "fund" || p.dataKey === "pipeline"
                      ? formatCurrency(Number(p.value))
                      : (p.value as number),
                  color: p.color as string,
                }))}
              />
            )}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="fund"
            name="Fund"
            stroke="hsl(142, 71%, 45%)"
            fill="url(#repRevGrad)"
            strokeWidth={2}
            animationDuration={ANIM}
          />
          <Bar yAxisId="right" dataKey="deals" name="Deals" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} animationDuration={ANIM} />
          <Bar yAxisId="left" dataKey="pipeline" name="Pipeline" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} opacity={0.7} animationDuration={ANIM} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Total fund: {formatCurrency(data.reduce((s, d) => s + d.fund, 0))}
      </p>
    </ChartShell>
  );
}
