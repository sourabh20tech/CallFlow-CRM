"use client";

import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { formatNumber } from "@/utils/format";
import { cn } from "@/lib/utils";

interface AnimatedStatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  suffix?: string;
  delay?: number;
  className?: string;
}

export function AnimatedStatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  suffix = "",
  delay = 0,
  className,
}: AnimatedStatCardProps) {
  const animatedValue = useAnimatedCounter(value);
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <GlassCard
      variant="gradient"
      padding="md"
      className={cn("group min-w-0 overflow-hidden ds-animate-in", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="ds-overline mb-2">{title}</p>
          <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-[1.75rem]">
            {formatNumber(animatedValue)}
            {suffix}
          </p>
          {trend !== undefined && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
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
                {Math.abs(trend)}%
              </span>
              {trendLabel && <span>{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 shadow-[var(--ds-shadow-sm)] ring-1 ring-violet-500/25 transition-transform duration-[var(--ds-duration-base)] ease-[var(--ds-ease-out)] group-hover:scale-105 sm:h-11 sm:w-11">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </GlassCard>
  );
}
