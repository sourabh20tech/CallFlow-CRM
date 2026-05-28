"use client";

import { StatusChip } from "@/components/design-system/status-chip";
import { CALL_STATUS_VARIANT, formatCallStatus } from "@/lib/calls/constants";
import type { CallStatus } from "@/types/call";
import { cn } from "@/lib/utils";

interface CallStatusBadgeProps {
  status: CallStatus;
  size?: "sm" | "md";
  pulse?: boolean;
  className?: string;
}

export function CallStatusBadge({ status, size = "sm", pulse, className }: CallStatusBadgeProps) {
  return (
    <StatusChip
      label={formatCallStatus(status)}
      variant={CALL_STATUS_VARIANT[status]}
      size={size}
      pulse={pulse ?? status === "callback"}
      showDot
      className={cn(className)}
    />
  );
}
