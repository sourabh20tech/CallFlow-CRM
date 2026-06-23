import type { ReportDatePreset, ReportDateRange, ReportPeriod } from "@/types/reports";
import { resolveDateRange } from "@/lib/reports/date-range";

export type { ReportPeriod };

const PERIOD_PRESET: Record<ReportPeriod, ReportDatePreset> = {
  day: "today",
  week: "this_week",
  month: "this_month",
};

/** Maps API `period` (day|week|month) to a calendar-based date range. */
export function resolveDateRangeFromPeriod(period: ReportPeriod): ReportDateRange {
  const preset = PERIOD_PRESET[period];
  return resolveDateRange(preset);
}

export function isReportPeriod(value: string | null): value is ReportPeriod {
  return value === "day" || value === "week" || value === "month";
}
