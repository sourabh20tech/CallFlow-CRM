"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { PriorityBadge } from "@/components/followups/priority-badge";
import type { Followup } from "@/types/followup";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FollowupCalendarProps {
  followups: Followup[];
  onSelectFollowup: (followup: Followup) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function FollowupCalendar({ followups, onSelectFollowup }: FollowupCalendarProps) {
  const [cursor, setCursor] = useState(() => new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const byDay = useMemo(() => {
    const map = new Map<string, Followup[]>();
    for (const f of followups) {
      const d = new Date(f.dueAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, [...(map.get(key) ?? []), f]);
    }
    return map;
  }, [followups]);

  const firstDay = startOfMonth(cursor).getDay();
  const totalDays = daysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });
  const today = new Date();

  return (
    <GlassCard variant="default" padding="md" className="ds-animate-in">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="ds-h3">{monthLabel}</h3>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCursor(new Date())}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="min-h-[72px] rounded-lg bg-muted/10" />;
          }

          const key = `${year}-${month}-${day}`;
          const dayItems = byDay.get(key) ?? [];
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;

          return (
            <div
              key={key}
              className={cn(
                "min-h-[72px] rounded-lg border border-border/40 bg-muted/20 p-1.5 text-left transition-colors",
                isToday && "border-primary/40 bg-primary/5",
                dayItems.length > 0 && "hover:bg-muted/40",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {day}
              </span>
              <ul className="mt-1 space-y-0.5">
                {dayItems.slice(0, 2).map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => onSelectFollowup(f)}
                      className="w-full truncate rounded px-1 py-0.5 text-left text-[0.625rem] hover:bg-background/80"
                    >
                      {f.title}
                    </button>
                  </li>
                ))}
                {dayItems.length > 2 && (
                  <li className="px-1 text-[0.625rem] text-muted-foreground">
                    +{dayItems.length - 2} more
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {followups.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
          {followups.slice(0, 6).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelectFollowup(f)}
              className="flex items-center gap-2 rounded-lg border border-border/40 px-2 py-1 text-xs hover:bg-muted/40"
            >
              <span className="max-w-[120px] truncate">{f.title}</span>
              <PriorityBadge priority={f.priority} />
            </button>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
