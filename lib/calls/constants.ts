import type { CallDirection, CallStatus } from "@/types/call";

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  connected: "Connected",
  busy: "Busy",
  no_answer: "No Answer",
  callback: "Callback",
  interested: "Interested",
  not_interested: "Not Interested",
};

export const CALL_STATUS_VARIANT: Record<
  CallStatus,
  "success" | "info" | "warning" | "error" | "neutral" | "default"
> = {
  connected: "success",
  busy: "warning",
  no_answer: "neutral",
  callback: "info",
  interested: "success",
  not_interested: "error",
};

export const CALL_QUICK_STATUSES: CallStatus[] = [
  "connected",
  "busy",
  "no_answer",
  "callback",
  "interested",
  "not_interested",
];

export const CALL_DIRECTION_OPTIONS: { value: CallDirection | "all"; label: string }[] = [
  { value: "all", label: "All directions" },
  { value: "inbound", label: "Inbound" },
  { value: "outbound", label: "Outbound" },
];

export function formatCallStatus(status: CallStatus): string {
  return CALL_STATUS_LABELS[status] ?? status;
}
