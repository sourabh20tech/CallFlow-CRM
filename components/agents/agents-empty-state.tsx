"use client";

import { Users } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { AddAgentButton } from "@/components/agents/add-agent-button";
import { Button } from "@/components/ui/button";

interface AgentsEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onAddAgent?: () => void;
}

export function AgentsEmptyState({
  hasFilters,
  onClearFilters,
  onAddAgent,
}: AgentsEmptyStateProps) {
  return (
    <GlassCard variant="gradient" padding="lg" className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <Users className="h-7 w-7 text-primary" />
      </div>
      <h3 className="ds-h3">{hasFilters ? "No agents match your filters" : "No agents on the roster"}</h3>
      <p className="ds-caption mx-auto mt-2 max-w-sm text-pretty">
        {hasFilters
          ? "Adjust search or filters, or invite a new team member."
          : "Add your first call center agent to manage leads and calls."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {hasFilters && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
        {onAddAgent && <AddAgentButton onClick={onAddAgent} size="sm" />}
      </div>
    </GlassCard>
  );
}
