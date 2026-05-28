import type { ReportDatePreset, ReportDateRange } from "@/types/reports";

export const REPORT_PRESETS: { value: ReportDatePreset; label: string; days: number }[] = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "custom", label: "Custom", days: 0 },
];

export function resolveDateRange(
  preset: ReportDatePreset,
  customFrom?: string,
  customTo?: string,
): ReportDateRange {
  const to = customTo ? new Date(customTo) : new Date();
  to.setHours(23, 59, 59, 999);

  if (preset === "custom" && customFrom && customTo) {
    return {
      from: new Date(customFrom).toISOString(),
      to: to.toISOString(),
      preset,
    };
  }

  const days = REPORT_PRESETS.find((p) => p.value === preset)?.days ?? 7;
  const from = new Date(to);
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    preset,
  };
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
