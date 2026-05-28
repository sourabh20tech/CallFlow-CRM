"use client";

import { Phone } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { Button } from "@/components/ui/button";

interface CallsEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onLogCall?: () => void;
}

export function CallsEmptyState({
  hasFilters,
  onClearFilters,
  onLogCall,
}: CallsEmptyStateProps) {
  return (
    <GlassCard variant="gradient" padding="lg" className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <Phone className="h-7 w-7 text-primary" />
      </div>
      <h3 className="ds-h3">
        {hasFilters ? "No calls match your filters" : "No call activity yet"}
      </h3>
      <p className="ds-caption mx-auto mt-2 max-w-sm text-pretty">
        {hasFilters
          ? "Try different filters or log a manual call."
          : "Use quick dial for one-click outbound calls or log a completed conversation."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {hasFilters && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
        {onLogCall && (
          <Button size="sm" onClick={onLogCall}>
            Log call
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
