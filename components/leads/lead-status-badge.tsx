"use client";

import { StatusChip } from "@/components/design-system/status-chip";
import { LEAD_STATUS_VARIANT, formatLeadStatus } from "@/lib/leads/constants";
import type { LeadStatus } from "@/types/lead";
import { cn } from "@/lib/utils";

interface LeadStatusBadgeProps {
  status: LeadStatus;
  size?: "sm" | "md";
  className?: string;
}

export function LeadStatusBadge({ status, size = "sm", className }: LeadStatusBadgeProps) {
  return (
    <StatusChip
      label={formatLeadStatus(status)}
      variant={LEAD_STATUS_VARIANT[status]}
      size={size}
      className={cn(className)}
      showDot
    />
  );
}
