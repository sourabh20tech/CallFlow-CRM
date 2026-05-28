"use client";

import { GlassCard } from "@/components/design-system/glass-card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function ChartCard({
  title,
  description,
  children,
  className,
  action,
}: ChartCardProps) {
  return (
    <GlassCard
      variant="gradient"
      padding="none"
      className={cn("overflow-hidden ds-hover-subtle", className)}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/50 px-6 py-5">
        <div>
          <h3 className="ds-h3">{title}</h3>
          {description && <p className="ds-caption mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-4 pt-2 sm:p-6 sm:pt-4">{children}</div>
    </GlassCard>
  );
}
