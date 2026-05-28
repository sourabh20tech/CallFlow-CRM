"use client";

import { ChartCard } from "@/components/dashboard/chart-card";
import { cn } from "@/lib/utils";

const CHART_HEIGHT = "h-[260px] w-full min-h-[220px] sm:h-[300px]";

interface ChartShellProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  chartKey?: string;
}

export function ChartShell({
  title,
  description,
  action,
  children,
  className,
  chartKey,
}: ChartShellProps) {
  return (
    <ChartCard title={title} description={description} action={action} className={className}>
      <div key={chartKey} className={cn(CHART_HEIGHT, "reports-chart-animate")}>
        {children}
      </div>
    </ChartCard>
  );
}

export { CHART_HEIGHT };
