"use client";

import { useEffect, useState } from "react";
import { FormField } from "@/components/design-system/form-field";
import { cn } from "@/lib/utils";

interface DatetimePickerFieldProps {
  id: string;
  label?: string;
  value: string; // datetime-local format: YYYY-MM-DDTHH:MM
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  min?: string;
}

function parseValue(val: string) {
  if (!val) {
    const now = new Date();
    return {
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
      hour: 12, minute: 0, period: "PM" as "AM" | "PM",
    };
  }
  const [datePart, timePart] = val.split("T");
  const [hStr, mStr] = (timePart ?? "12:00").split(":");
  let h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return { date: datePart || "", hour: h, minute: m, period };
}

function buildValue(date: string, hour: number, minute: number, period: "AM" | "PM"): string {
  let h24 = hour;
  if (period === "AM" && hour === 12) h24 = 0;
  else if (period === "PM" && hour !== 12) h24 = hour + 12;
  return `${date}T${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function DatetimePickerField({
  id,
  label = "Due date & time",
  value,
  onChange,
  error,
  required,
  min,
}: DatetimePickerFieldProps) {
  const parsed = parseValue(value);
  const [date, setDate] = useState(parsed.date);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed.period);

  // Sync if external value changes
  useEffect(() => {
    const p = parseValue(value);
    setDate(p.date);
    setHour(p.hour);
    setMinute(p.minute);
    setPeriod(p.period);
  }, [value]);

  const emitChange = (d: string, h: number, m: number, p: "AM" | "PM") => {
    onChange(buildValue(d, h, m, p));
  };

  const selectClass = cn(
    "h-10 rounded-lg border border-input bg-background/80 px-2 text-sm",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  );

  return (
    <FormField label={label} htmlFor={id} error={error} required={required}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Date */}
        <input
          id={id}
          type="date"
          value={date}
          min={min?.split("T")[0]}
          onChange={(e) => { setDate(e.target.value); emitChange(e.target.value, hour, minute, period); }}
          className={cn(selectClass, "flex-1 min-w-[140px]")}
        />

        {/* Hour */}
        <select
          value={hour}
          onChange={(e) => { const h = Number(e.target.value); setHour(h); emitChange(date, h, minute, period); }}
          className={cn(selectClass, "w-[60px]")}
          aria-label="Hour"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
          ))}
        </select>

        <span className="text-sm font-medium text-muted-foreground">:</span>

        {/* Minute */}
        <select
          value={minute}
          onChange={(e) => { const m = Number(e.target.value); setMinute(m); emitChange(date, hour, m, period); }}
          className={cn(selectClass, "w-[60px]")}
          aria-label="Minute"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
          ))}
        </select>

        {/* AM/PM */}
        <div className="flex overflow-hidden rounded-lg border border-input">
          <button
            type="button"
            onClick={() => { setPeriod("AM"); emitChange(date, hour, minute, "AM"); }}
            className={cn(
              "px-3 py-2 text-xs font-semibold transition-colors",
              period === "AM"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => { setPeriod("PM"); emitChange(date, hour, minute, "PM"); }}
            className={cn(
              "px-3 py-2 text-xs font-semibold transition-colors",
              period === "PM"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            PM
          </button>
        </div>
      </div>
    </FormField>
  );
}
