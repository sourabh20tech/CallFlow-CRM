"use client";

import { AlertTriangle, Bell, CalendarDays, Clock } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { PriorityBadge } from "@/components/followups/priority-badge";
import { formatFollowupDue } from "@/lib/followups/datetime";
import type { Followup } from "@/types/followup";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FollowupNotificationsProps {
  overdue: Followup[];
  dueToday: Followup[];
  upcoming: Followup[];
  onSelect: (followup: Followup) => void;
  onDismiss?: () => void;
}

export function FollowupNotifications({
  overdue,
  dueToday,
  upcoming,
  onSelect,
}: FollowupNotificationsProps) {
  const total = overdue.length + dueToday.length + upcoming.length;

  return (
    <GlassCard variant="gradient" padding="md" className="ds-animate-in">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold">Reminders</h3>
            <p className="text-xs text-muted-foreground">
              {total} notification{total === 1 ? "" : "s"} need attention
            </p>
          </div>
        </div>
        {total > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
            {total}
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground">You&apos;re all caught up. No pending reminders.</p>
      ) : (
        <div className="max-h-[280px] space-y-4 overflow-y-auto scrollbar-thin pr-1">
          {overdue.length > 0 && (
            <NotificationGroup
              icon={AlertTriangle}
              title="Overdue"
              variant="error"
              items={overdue}
              onSelect={onSelect}
            />
          )}
          {dueToday.length > 0 && (
            <NotificationGroup
              icon={CalendarDays}
              title="Due today"
              variant="warning"
              items={dueToday}
              onSelect={onSelect}
            />
          )}
          {upcoming.length > 0 && (
            <NotificationGroup
              icon={Clock}
              title="Next 24 hours"
              variant="info"
              items={upcoming}
              onSelect={onSelect}
            />
          )}
        </div>
      )}
    </GlassCard>
  );
}

function NotificationGroup({
  icon: Icon,
  title,
  variant,
  items,
  onSelect,
}: {
  icon: typeof Bell;
  title: string;
  variant: "error" | "warning" | "info";
  items: Followup[];
  onSelect: (f: Followup) => void;
}) {
  const colors = {
    error: "text-red-600 dark:text-red-400",
    warning: "text-amber-600 dark:text-amber-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  return (
    <div>
      <p className={cn("mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase", colors[variant])}>
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((f) => (
          <li key={f.id}>
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start gap-2 px-2 py-2 text-left"
              onClick={() => onSelect(f)}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground">
                  {f.leadName} · {formatFollowupDue(f.dueAt)}
                </p>
              </div>
              <PriorityBadge priority={f.priority} />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
