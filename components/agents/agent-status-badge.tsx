"use client";

import { StatusChip } from "@/components/design-system/status-chip";
import { AGENT_STATUS_VARIANT, formatAgentStatus } from "@/lib/agents/constants";
import type { AgentStatus } from "@/types/agent";
import { cn } from "@/lib/utils";

interface AgentStatusBadgeProps {
  status: AgentStatus;
  size?: "sm" | "md";
  pulse?: boolean;
  className?: string;
}

export function AgentStatusBadge({
  status,
  size = "sm",
  pulse,
  className,
}: AgentStatusBadgeProps) {
  const shouldPulse = pulse ?? (status === "available" || status === "busy");

  return (
    <StatusChip
      label={formatAgentStatus(status)}
      variant={AGENT_STATUS_VARIANT[status]}
      size={size}
      pulse={shouldPulse}
      className={cn(className)}
      showDot
    />
  );
}
