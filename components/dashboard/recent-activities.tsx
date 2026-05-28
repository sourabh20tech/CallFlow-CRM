"use client";

import { CalendarClock, Headphones, Phone, UserPlus } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { formatRelativeTime } from "@/utils/format";
import { useIsClient } from "@/hooks/use-is-client";
import type { DashboardActivity } from "@/types/dashboard";
import { cn } from "@/lib/utils";

const activityConfig = {
  call: { icon: Phone, color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  lead: { icon: UserPlus, color: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  "follow-up": {
    icon: CalendarClock,
    color: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  agent: {
    icon: Headphones,
    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
};

interface RecentActivitiesProps {
  activities: DashboardActivity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const isClient = useIsClient();

  return (
    <GlassCard variant="gradient" padding="md" className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="ds-h3">Recent Activity</h3>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      </div>
      <ul className="space-y-3">
        {activities.map((activity, index) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;
          return (
            <li
              key={activity.id}
              className={cn(
                "flex gap-3 rounded-xl border border-transparent p-2 transition-colors",
                "hover:border-border/50 hover:bg-muted/30",
                "ds-animate-in",
              )}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  config.color,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">{activity.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {activity.description}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground/80">
                  {isClient ? formatRelativeTime(activity.timestamp) : "\u00a0"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
