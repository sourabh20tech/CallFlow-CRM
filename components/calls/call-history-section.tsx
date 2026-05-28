"use client";

import { History } from "lucide-react";
import { DataTableCard } from "@/components/design-system/data-table-card";
import { CallTimeline } from "@/components/calls/call-timeline";
import { CallsEmptyState } from "@/components/calls/calls-empty-state";
import type { Call, CallStatus } from "@/types/call";

interface CallHistorySectionProps {
  calls: Call[];
  selectedId?: string;
  onSelect: (call: Call) => void;
  onStatusChange: (callId: string, status: CallStatus) => void;
  onEdit: (call: Call) => void;
  onDelete: (call: Call) => void;
  isAdmin: boolean;
  updatingId?: string;
  onLogCall?: () => void;
}

export function CallHistorySection({
  calls,
  selectedId,
  onSelect,
  onStatusChange,
  onEdit,
  onDelete,
  isAdmin,
  updatingId,
  onLogCall,
}: CallHistorySectionProps) {
  return (
    <DataTableCard
      title="Call history"
      description="Activity timeline grouped by day"
      toolbar={
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/25 to-indigo-500/20 ring-1 ring-violet-500/20">
          <History className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
      }
    >
      {calls.length === 0 ? (
        <CallsEmptyState onLogCall={onLogCall} />
      ) : (
        <CallTimeline
          calls={calls}
          selectedId={selectedId}
          onSelect={onSelect}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
          isAdmin={isAdmin}
          updatingId={updatingId}
        />
      )}
    </DataTableCard>
  );
}
