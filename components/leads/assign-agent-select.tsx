"use client";

import { cn } from "@/lib/utils";
import type { LeadRosterAgent } from "@/types/lead";

interface AssignAgentSelectProps {
  agents: LeadRosterAgent[];
  value: string;
  onChange: (agentId: string) => void;
  disabled?: boolean;
  includeUnassigned?: boolean;
  className?: string;
  id?: string;
}

export function AssignAgentSelect({
  agents,
  value,
  onChange,
  disabled,
  includeUnassigned = true,
  className,
  id = "assignedAgentId",
}: AssignAgentSelectProps) {
  return (
    <select
      id={id}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "flex h-10 w-full rounded-lg border border-[hsl(var(--ds-glass-border))]",
        "bg-[hsl(var(--ds-glass-bg))]/80 px-3 py-2 text-sm ",
        "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        disabled && "opacity-60",
        className,
      )}
    >
      {includeUnassigned && <option value="">Unassigned</option>}
      {agents.map((agent) => (
        <option key={agent.id} value={agent.id}>
          {agent.name}
        </option>
      ))}
    </select>
  );
}
