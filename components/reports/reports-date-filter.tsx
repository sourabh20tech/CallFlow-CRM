"use client";

import { Calendar } from "lucide-react";
import { REPORT_PRESETS, formatRangeLabel } from "@/lib/reports/date-range";
import type { ReportDatePreset, ReportDateRange } from "@/types/reports";
import { cn } from "@/lib/utils";

interface ReportsDateFilterProps {
  preset: ReportDatePreset;
  range: ReportDateRange;
  customFrom: string;
  customTo: string;
  onPresetChange: (preset: ReportDatePreset) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  // Keep for backward compat but unused
  activePeriod?: unknown;
  onPeriodChange?: unknown;
}

export function ReportsDateFilter({
  preset,
  range,
  customFrom,
  customTo,
  onPresetChange,
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
        {REPORT_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onPresetChange(p.value)}
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
            className="h-9 rounded-lg border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/80 px-3 text-sm"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            className="h-9 rounded-lg border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/80 px-3 text-sm"
          />
        </div>
      )}
    </div>
  );
}
