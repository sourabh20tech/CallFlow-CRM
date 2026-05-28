"use client";

import { StatusChip } from "@/components/design-system/status-chip";
import { cn } from "@/lib/utils";

interface AgentAccountBadgeProps {
  isActive: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function AgentAccountBadge({ isActive, size = "sm", className }: AgentAccountBadgeProps) {
  return (
    <StatusChip
      label={isActive ? "Active" : "Inactive"}
      variant={isActive ? "success" : "neutral"}
      size={size}
      showDot={isActive}
      pulse={isActive}
      className={cn(className)}
    />
  );
}
