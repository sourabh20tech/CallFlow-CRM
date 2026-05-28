"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartEmptyState } from "@/components/reports/charts/chart-empty-state";
import { ChartShell } from "@/components/reports/charts/chart-shell";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import type { LeadConversionDataPoint } from "@/types/dashboard";

const ANIM = 1400;

interface ConversionReportChartProps {
  data: LeadConversionDataPoint[];
  chartKey?: string;
}

export function ConversionReportChart({ data, chartKey }: ConversionReportChartProps) {
  const enriched = data.map((d) => ({
    ...d,
    rate: d.leads ? Math.round((d.converted / d.leads) * 100) : 0,
  }));
  const hasData = enriched.some((d) => d.leads > 0);

  return (
    <ChartShell
      title="Lead conversion"
      description="Pipeline intake vs closed-won conversions"
      chartKey={chartKey}
    >
      {!hasData ? (
        <ChartEmptyState message="No leads created in this period" />
      ) : (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={enriched} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
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
          <Bar yAxisId="left" dataKey="leads" name="Leads" fill="hsl(221, 83%, 53%)" radius={[6, 6, 0, 0]} animationDuration={ANIM} />
          <Bar yAxisId="left" dataKey="converted" name="Converted" fill="hsl(262, 83%, 58%)" radius={[6, 6, 0, 0]} animationDuration={ANIM} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="rate"
            name="Rate %"
            stroke="hsl(38, 92%, 50%)"
            strokeWidth={2}
            dot={{ r: 4 }}
            animationDuration={ANIM}
          />
        </ComposedChart>
      </ResponsiveContainer>
      )}
    </ChartShell>
  );
}
