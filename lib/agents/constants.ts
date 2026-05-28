import type { AgentStatus } from "@/types/agent";

export const AGENT_STATUS_OPTIONS: { value: AgentStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "away", label: "Away" },
  { value: "offline", label: "Offline" },
];

export const AGENT_DEPARTMENTS = ["Support", "Sales", "Billing", "Retention", "Outbound"] as const;

export const AGENT_STATUS_VARIANT: Record<
  AgentStatus,
  "success" | "warning" | "error" | "neutral"
> = {
  available: "success",
  busy: "warning",
  away: "neutral",
  offline: "error",
};

export function formatAgentStatus(status: AgentStatus): string {
  return AGENT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}
