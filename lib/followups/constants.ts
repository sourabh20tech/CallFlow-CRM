import type { FollowupPriority, FollowupStatus } from "@/types/followup";

// Canonical naming map across routing/API/database layers.
export const FOLLOWUPS_ROUTE_SEGMENT = "follow-ups";
export const FOLLOWUPS_API_SEGMENT = "followups";
export const FOLLOWUPS_TABLE_NAME = "follow_ups";

export const FOLLOWUP_STATUS_LABELS: Record<FollowupStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const FOLLOWUP_PRIORITY_LABELS: Record<FollowupPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const FOLLOWUP_PRIORITY_VARIANT: Record<
  FollowupPriority,
  "secondary" | "warning" | "destructive"
> = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
};

export const FOLLOWUP_STATUS_VARIANT: Record<
  FollowupStatus,
  "default" | "info" | "success" | "neutral" | "error"
> = {
  pending: "info",
  in_progress: "default",
  completed: "success",
  cancelled: "neutral",
};

export const ACTIVE_STATUSES: FollowupStatus[] = ["pending", "in_progress"];

export function formatFollowupStatus(status: FollowupStatus): string {
  return FOLLOWUP_STATUS_LABELS[status] ?? status;
}

export function formatFollowupPriority(priority: FollowupPriority): string {
  return FOLLOWUP_PRIORITY_LABELS[priority] ?? priority;
}

export function isFollowupOverdue(followup: { dueAt: string; status: FollowupStatus }): boolean {
  if (followup.status === "completed" || followup.status === "cancelled") return false;
  return new Date(followup.dueAt).getTime() < Date.now();
}

export function isFollowupDueToday(followup: { dueAt: string; status: FollowupStatus }): boolean {
  if (followup.status === "completed" || followup.status === "cancelled") return false;
  const due = new Date(followup.dueAt);
  // Use IST calendar day for consistency
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dueDate = formatter.format(due);
  const todayDate = formatter.format(new Date());
  return dueDate === todayDate;
}
