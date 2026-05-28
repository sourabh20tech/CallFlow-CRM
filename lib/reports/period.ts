import type { ReportDatePreset, ReportDateRange, ReportPeriod } from "@/types/reports";

export type { ReportPeriod };

const PERIOD_DAYS: Record<ReportPeriod, number> = {
  day: 1,
  week: 7,
  month: 30,
};

const PERIOD_PRESET: Record<ReportPeriod, ReportDatePreset> = {
  day: "7d",
  week: "7d",
  month: "30d",
};

/** Maps API `period` (day|week|month) to an inclusive UTC date range. */
export function resolveDateRangeFromPeriod(period: ReportPeriod): ReportDateRange {
  const days = PERIOD_DAYS[period];
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  const from = new Date(to);
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    preset: PERIOD_PRESET[period],
  };
}

export function isReportPeriod(value: string | null): value is ReportPeriod {
  return value === "day" || value === "week" || value === "month";
}
