"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Followup } from "@/types/followup";
import { cn } from "@/lib/utils";

export function NotificationsMenu() {
  const [data, setData] = useState<{
    overdue: Followup[];
    dueToday: Followup[];
    upcoming: Followup[];
    total: number;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/followups/reminders", { cache: "no-store" });
      if (!res.ok) return;
      setData(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 60_000);
    return () => clearInterval(t);
  }, [load]);

  const unreadCount = data?.total ?? 0;
  const items = [
    ...(data?.overdue ?? []).map((f) => ({ ...f, urgency: "overdue" as const })),
    ...(data?.dueToday ?? []).map((f) => ({ ...f, urgency: "today" as const })),
    ...(data?.upcoming ?? []).map((f) => ({ ...f, urgency: "upcoming" as const })),
  ].slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-xl transition-colors hover:bg-primary/10"
          aria-label={`Follow-up notifications${unreadCount ? `, ${unreadCount} pending` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <DropdownMenuLabel className="flex items-center gap-2 p-0 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-amber-500" />
            Follow-Up Reminders
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              {unreadCount} pending
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No pending follow-ups
          </div>
        ) : (
          <div className="max-h-[280px] overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5 border-b border-border/20 px-4 py-2.5 last:border-0">
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    item.urgency === "overdue" && "bg-red-500",
                    item.urgency === "today" && "bg-amber-500",
                    item.urgency === "upcoming" && "bg-emerald-500",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{item.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {item.leadName ?? ""}
                    {item.assignedAgentName ? ` · ${item.assignedAgentName}` : ""}
                  </p>
                  <p className={cn(
                    "text-[10px] font-medium",
                    item.urgency === "overdue" && "text-red-500",
                    item.urgency === "today" && "text-amber-500",
                    item.urgency === "upcoming" && "text-emerald-500",
                  )}>
                    {new Date(item.dueAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Button variant="ghost" className="w-full text-xs" asChild>
            <Link href="/dashboard/follow-ups">View all follow-ups</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
