"use client";

import { StatusChip } from "@/components/design-system/status-chip";
import { FOLLOWUP_STATUS_VARIANT, formatFollowupStatus } from "@/lib/followups/constants";
import type { FollowupStatus } from "@/types/followup";
import { cn } from "@/lib/utils";

interface FollowupStatusBadgeProps {
  status: FollowupStatus;
  size?: "sm" | "md";
  pulse?: boolean;
  className?: string;
}

export function FollowupStatusBadge({
  status,
  size = "sm",
  pulse,
  className,
}: FollowupStatusBadgeProps) {
  return (
    <StatusChip
      label={formatFollowupStatus(status)}
      variant={FOLLOWUP_STATUS_VARIANT[status]}
      size={size}
      pulse={pulse ?? status === "in_progress"}
      showDot
      className={cn(className)}
    />
  );
}
