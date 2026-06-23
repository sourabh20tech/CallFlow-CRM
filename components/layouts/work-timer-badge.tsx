"use client";

import { useCallback, useEffect, useState } from "react";
import { useWorkSession } from "@/hooks/use-work-session";
import { useAuth } from "@/hooks/use-auth";

function fmt(seconds: number): string {
  if (seconds <= 0) return "0h 00m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/**
 * Compact work timer badge in the header for agents.
 * Shows: 🟢 Active: session time | Today: total time
 */
export function WorkTimerBadge() {
  const { role } = useAuth();
  const { isActive, activeSeconds } = useWorkSession();
  const [todaySeconds, setTodaySeconds] = useState(0);

  const loadToday = useCallback(async () => {
    try {
      const res = await fetch("/api/work-sessions?date=today");
      if (!res.ok) return;
      const { totalSeconds } = await res.json();
      setTodaySeconds(totalSeconds ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    if (role !== "agent") return;
    void loadToday();
    const interval = setInterval(() => void loadToday(), 120_000);
    return () => clearInterval(interval);
  }, [role, loadToday]);

  // Only show for agents with active session
  if (role !== "agent" || !isActive) return null;

  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 dark:border-emerald-800 dark:bg-emerald-950/40 sm:gap-2 sm:px-2.5 sm:py-1"
      title={`Session: ${fmt(activeSeconds)} | Today: ${fmt(todaySeconds)}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-xs font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
        {fmt(activeSeconds)}
      </span>
      <span className="hidden text-[10px] text-emerald-600/60 dark:text-emerald-400/60 sm:inline">|</span>
      <span className="hidden text-[10px] tabular-nums text-emerald-600/80 dark:text-emerald-400/70 sm:inline">
        Today {fmt(todaySeconds)}
      </span>
    </div>
  );
}
