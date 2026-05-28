"use client";

import { CALL_QUICK_STATUSES, CALL_STATUS_VARIANT, formatCallStatus } from "@/lib/calls/constants";
import { StatusChip } from "@/components/design-system/status-chip";
import type { CallStatus } from "@/types/call";
import { cn } from "@/lib/utils";

interface CallQuickActionsProps {
  currentStatus: CallStatus;
  onStatusChange: (status: CallStatus) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function CallQuickActions({
  currentStatus,
  onStatusChange,
  disabled,
  compact,
}: CallQuickActionsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
      {CALL_QUICK_STATUSES.map((status) => {
        const active = currentStatus === status;
        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            onClick={() => onStatusChange(status)}
            className={cn(
              "transition-transform active:scale-95",
              active && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background rounded-full",
              disabled && "opacity-50",
            )}
          >
            <StatusChip
              label={formatCallStatus(status)}
              variant={CALL_STATUS_VARIANT[status]}
              size={compact ? "sm" : "md"}
              pulse={active}
            />
          </button>
        );
      })}
    </div>
  );
}
