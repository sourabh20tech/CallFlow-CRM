"use client";

import { Calendar } from "lucide-react";
import { REPORT_PRESETS, formatRangeLabel } from "@/lib/reports/date-range";
import type { ReportDatePreset, ReportDateRange, ReportPeriod } from "@/types/reports";
import { cn } from "@/lib/utils";

const PERIOD_QUICK: { value: ReportPeriod; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

interface ReportsDateFilterProps {
  preset: ReportDatePreset;
  range: ReportDateRange;
  customFrom: string;
  customTo: string;
  activePeriod?: ReportPeriod | null;
  onPresetChange: (preset: ReportDatePreset) => void;
  onPeriodChange?: (period: ReportPeriod | null) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
}

export function ReportsDateFilter({
  preset,
  range,
  customFrom,
  customTo,
  activePeriod,
  onPresetChange,
  onPeriodChange,
  onCustomFromChange,
  onCustomToChange,
}: ReportsDateFilterProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))] p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 shrink-0 text-primary" />
        <span>{formatRangeLabel(range)}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIOD_QUICK.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => {
              onPeriodChange?.(p.value);
              onPresetChange(p.value === "day" ? "7d" : p.value === "week" ? "7d" : "30d");
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-all",
              activePeriod === p.value
                ? "border-primary/40 bg-primary/15 text-primary shadow-[var(--ds-shadow-sm)]"
                : "border-border/60 text-muted-foreground hover:bg-muted/40",
            )}
          >
            {p.label}
          </button>
        ))}
        {REPORT_PRESETS.filter((p) => p.value !== "custom").map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => {
              onPeriodChange?.(null);
              onPresetChange(p.value);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-all",
              preset === p.value
                ? "border-primary/40 bg-primary/15 text-primary shadow-[var(--ds-shadow-sm)]"
                : "border-border/60 text-muted-foreground hover:bg-muted/40",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            className="h-9 rounded-lg border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/80 px-3 text-sm "
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            className="h-9 rounded-lg border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/80 px-3 text-sm "
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => onPresetChange("custom")}
        className={cn(
          "text-xs font-medium underline-offset-2 hover:underline",
          preset === "custom" ? "text-primary" : "text-muted-foreground",
        )}
      >
        Custom range
      </button>
    </div>
  );
}
