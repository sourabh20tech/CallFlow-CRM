"use client";

import { CheckCircle2 } from "lucide-react";
import { DataTableCard } from "@/components/design-system/data-table-card";
import { FollowupCard } from "@/components/followups/followup-card";
import { FollowupsEmptyState } from "@/components/followups/followups-empty-state";
import type { FollowupSectionActions } from "@/components/followups/pending-followups-section";
import type { Followup } from "@/types/followup";
import { formatRelativeTime } from "@/utils/format";

interface CompletedFollowupsSectionProps extends FollowupSectionActions {
  followups: Followup[];
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function CompletedFollowupsSection({
  followups,
  selectedId,
  onSelect,
  onDelete,
  hasFilters,
  onClearFilters,
}: CompletedFollowupsSectionProps) {
  return (
    <DataTableCard
      title="Completed follow-ups"
      description="Closed tasks and resolved callbacks"
      toolbar={
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/25 to-green-500/20 ring-1 ring-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
      }
    >
      {followups.length === 0 ? (
        <FollowupsEmptyState
          variant="completed"
          hasFilters={hasFilters}
          onClearFilters={onClearFilters}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {followups.map((followup) => (
            <div key={followup.id} className="space-y-1">
              <FollowupCard
                followup={followup}
                selected={selectedId === followup.id}
                onSelect={() => onSelect(followup)}
                onDelete={() => onDelete(followup.id)}
              />
              {followup.completedAt && (
                <p className="px-1 text-[0.6875rem] text-muted-foreground">
                  Completed {formatRelativeTime(followup.completedAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </DataTableCard>
  );
}
