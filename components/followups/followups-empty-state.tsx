"use client";

import { CalendarClock } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { Button } from "@/components/ui/button";

interface FollowupsEmptyStateProps {
  variant?: "pending" | "completed" | "generic";
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onSchedule?: () => void;
}

export function FollowupsEmptyState({
  variant = "generic",
  hasFilters,
  onClearFilters,
  onSchedule,
}: FollowupsEmptyStateProps) {
  const title =
    variant === "pending"
      ? hasFilters
        ? "No pending follow-ups match your filters"
        : "No pending follow-ups"
      : variant === "completed"
        ? hasFilters
          ? "No completed follow-ups match your filters"
          : "No completed follow-ups yet"
        : hasFilters
          ? "No follow-ups match your filters"
          : "No follow-ups scheduled";

  const description =
    variant === "pending"
      ? "Schedule a callback or task to stay on top of your pipeline."
      : variant === "completed"
        ? "Completed tasks will appear here once agents close them out."
        : "Create your first follow-up with a due date, priority, and assignee.";

  return (
    <GlassCard variant="gradient" padding="lg" className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <CalendarClock className="h-7 w-7 text-primary" />
      </div>
      <h3 className="ds-h3">{title}</h3>
      <p className="ds-caption mx-auto mt-2 max-w-sm text-pretty">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {hasFilters && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
        {onSchedule && variant !== "completed" && (
          <Button size="sm" onClick={onSchedule}>
            Schedule follow-up
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
