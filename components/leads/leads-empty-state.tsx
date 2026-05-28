"use client";

import { UserPlus } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { Button } from "@/components/ui/button";

interface LeadsEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onAddLead?: () => void;
  canManage?: boolean;
}

export function LeadsEmptyState({
  hasFilters,
  onClearFilters,
  onAddLead,
  canManage,
}: LeadsEmptyStateProps) {
  return (
    <GlassCard variant="gradient" padding="lg" className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <UserPlus className="h-7 w-7 text-primary" />
      </div>
      <h3 className="ds-h3">{hasFilters ? "No leads match your filters" : "No leads yet"}</h3>
      <p className="ds-caption mx-auto mt-2 max-w-sm text-pretty">
        {hasFilters
          ? "Try adjusting search or filters, or add a new prospect to the pipeline."
          : "Start building your pipeline by adding your first lead."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {hasFilters && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
        {canManage && onAddLead && (
          <Button size="sm" onClick={onAddLead}>
            Add lead
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
