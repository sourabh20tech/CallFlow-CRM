"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarClock, ExternalLink, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { Button } from "@/components/ui/button";
import type { Followup } from "@/types/followup";
import { cn } from "@/lib/utils";

interface FollowupCenterData {
  overdue: Followup[];
  dueToday: Followup[];
  upcoming: Followup[];
  total: number;
}

const POLL_MS = 120_000; // 2 minutes — reduced from 60s for lower network load

export function FollowupCenterWidget() {
  const [data, setData] = useState<FollowupCenterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/followups/reminders", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json() as FollowupCenterData;
      setData(json);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const allItems = [
    ...(data?.overdue ?? []).map((f) => ({ ...f, urgency: "overdue" as const })),
    ...(data?.dueToday ?? []).map((f) => ({ ...f, urgency: "today" as const })),
    ...(data?.upcoming ?? []).map((f) => ({ ...f, urgency: "upcoming" as const })),
  ];

  const totalCount = data?.total ?? 0;

  return (
    <GlassCard variant="default" padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
            <CalendarClock className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Follow-Up Center</h3>
            <p className="text-[11px] text-muted-foreground">{totalCount} pending</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
              {totalCount}
            </span>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/dashboard/follow-ups">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[320px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : allItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No pending follow-ups
          </div>
        ) : (
          <ul className="divide-y divide-border/30">
            {allItems.slice(0, 10).map((item) => (
              <li key={item.id} className="px-4 py-3 sm:px-5">
                <div className="flex items-start gap-3">
                  {/* Urgency indicator */}
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      item.urgency === "overdue" && "bg-red-500",
                      item.urgency === "today" && "bg-amber-500",
                      item.urgency === "upcoming" && "bg-emerald-500",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      {item.leadName && <span>{item.leadName}</span>}
                      {item.assignedAgentName && (
                        <>
                          <span>·</span>
                          <span>{item.assignedAgentName}</span>
                        </>
                      )}
                      <span>·</span>
                      <span
                        className={cn(
                          "font-medium",
                          item.urgency === "overdue" && "text-red-500",
                          item.urgency === "today" && "text-amber-600 dark:text-amber-400",
                          item.urgency === "upcoming" && "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {item.urgency === "overdue" && "Overdue"}
                        {item.urgency === "today" && "Due Today"}
                        {item.urgency === "upcoming" && "Upcoming"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                      {new Date(item.dueAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  {/* Open lead */}
                  {item.leadId && (
                    <Link
                      href={`/dashboard/leads?search=${encodeURIComponent(item.leadName ?? "")}`}
                      className="mt-1 shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10"
                    >
                      Open
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {allItems.length > 10 && (
        <div className="border-t border-border/40 px-4 py-2 text-center">
          <Link href="/dashboard/follow-ups" className="text-xs font-medium text-primary hover:underline">
            View all {totalCount} follow-ups →
          </Link>
        </div>
      )}
    </GlassCard>
  );
}
