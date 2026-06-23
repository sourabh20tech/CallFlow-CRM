import type { ReportDatePreset, ReportDateRange } from "@/types/reports";

export const REPORT_PRESETS: { value: ReportDatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

/**
 * Resolve a preset to an exact date range.
 * Uses proper calendar logic:
 * - Today: current day 00:00 → 23:59
 * - Yesterday: previous day 00:00 → 23:59
 * - This Week: Monday 00:00 → Sunday 23:59 (ISO week)
 * - This Month: 1st of month 00:00 → last day 23:59
 * - Custom: user-provided dates
 */
export function resolveDateRange(
  preset: ReportDatePreset,
  customFrom?: string,
  customTo?: string,
): ReportDateRange {
  const now = new Date();

  if (preset === "custom" && customFrom && customTo) {
    const from = new Date(customFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(customTo);
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString(), preset };
  }

  if (preset === "today") {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString(), preset };
  }

  if (preset === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const from = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
    const to = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString(), preset };
  }

  if (preset === "this_week") {
    // ISO week: Monday → Sunday
    const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { from: monday.toISOString(), to: sunday.toISOString(), preset };
  }

  if (preset === "this_month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    // Last day of month: day 0 of next month
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString(), preset };
  }

  // Fallback: today
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString(), preset: "today" };
}

export function formatRangeLabel(range: ReportDateRange): string {
  const from = new Date(range.from).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const to = new Date(range.to).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${from} – ${to}`;
}

export function daysInRange(range: ReportDateRange): number {
  const ms = new Date(range.to).getTime() - new Date(range.from).getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
