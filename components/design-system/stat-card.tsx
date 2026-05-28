import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/design-system/glass-card";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <GlassCard
      variant="gradient"
      padding="md"
      className={cn("group min-w-0 overflow-hidden", className)}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="ds-overline mb-2">{title}</p>
          <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-[1.75rem]">
            {value}
          </p>
          {(description || trend) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium",
                    isPositive
                      ? "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]"
                      : "bg-destructive/15 text-destructive",
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(trend.value)}%
                </span>
              )}
              {description && <span className="text-pretty">{description}</span>}
              {trend?.label && <span>{trend.label}</span>}
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11",
            "bg-gradient-to-br from-violet-500/20 to-indigo-500/20",
            "shadow-[var(--ds-shadow-sm)] ring-1 ring-violet-500/25",
            "transition-transform duration-[var(--ds-duration-base)] ease-[var(--ds-ease-out)]",
            "group-hover:scale-105",
          )}
        >
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </GlassCard>
  );
}
