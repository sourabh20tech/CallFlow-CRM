"use client";

import { Clock } from "lucide-react";
import { DataTableCard } from "@/components/design-system/data-table-card";
import { FollowupCard } from "@/components/followups/followup-card";
import { FollowupsEmptyState } from "@/components/followups/followups-empty-state";
import type { Followup, FollowupStatus } from "@/types/followup";

export interface FollowupSectionActions {
  selectedId?: string;
  isAdmin?: boolean;
  onSelect: (followup: Followup) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: FollowupStatus) => void;
}

interface PendingFollowupsSectionProps extends FollowupSectionActions {
  followups: Followup[];
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onSchedule?: () => void;
}

export function PendingFollowupsSection({
  followups,
  selectedId,
  isAdmin = false,
  onSelect,
  onComplete,
  onDelete,
  onStatusChange,
  hasFilters,
  onClearFilters,
  onSchedule,
}: PendingFollowupsSectionProps) {
  return (
    <DataTableCard
      title="Pending follow-ups"
      description="Open tasks and callbacks awaiting action"
      toolbar={
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/25 to-orange-500/20 ring-1 ring-amber-500/20">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
      }
    >
      {followups.length === 0 ? (
        <FollowupsEmptyState
          variant="pending"
          hasFilters={hasFilters}
          onClearFilters={onClearFilters}
          onSchedule={onSchedule}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {followups.map((followup) => (
            <FollowupCard
              key={followup.id}
              followup={followup}
              selected={selectedId === followup.id}
              isAdmin={isAdmin}
              onSelect={() => onSelect(followup)}
              onComplete={() => onComplete(followup.id)}
              onDelete={() => onDelete(followup.id)}
              onStatusChange={(status) => onStatusChange(followup.id, status)}
            />
          ))}
        </div>
      )}
    </DataTableCard>
  );
}
