import type { LeadStatus } from "@/types/lead";

export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "interested", label: "Interested" },
  { value: "follow_up", label: "Follow-Up" },
  { value: "converted", label: "Converted" },
  { value: "not_interested", label: "Not Interested" },
  { value: "closed", label: "Closed" },
];

export const LEAD_FORCE_OPTIONS = [
  { value: "standard" as const, label: "Standard" },
  { value: "premium" as const, label: "Premium" },
];

/** @deprecated Use LEAD_FORCE_OPTIONS instead */
export const LEAD_TIER_OPTIONS = LEAD_FORCE_OPTIONS;

export const LEAD_STATUS_VARIANT: Record<
  LeadStatus,
  "default" | "success" | "warning" | "info" | "neutral" | "error"
> = {
  new: "info",
  interested: "default",
  follow_up: "warning",
  converted: "success",
  not_interested: "error",
  closed: "neutral",
};

export function formatLeadStatus(status: LeadStatus): string {
  return LEAD_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}
