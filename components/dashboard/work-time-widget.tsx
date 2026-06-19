"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, LogIn } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { useWorkSession } from "@/hooks/use-work-session";

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0h 00m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function WorkTimeWidget() {
  const { loginTime, activeSeconds: sessionActiveSeconds, isActive } = useWorkSession();

  const [todayData, setTodayData] = useState<{
    totalSeconds: number;
    loginCount: number;
  } | null>(null);

  // Local live display counter synced from the hook
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const isVisibleRef = useRef(!document.hidden);

  // Fetch today's summary (previous completed sessions)
  const loadToday = useCallback(async () => {
    try {
      const res = await fetch("/api/work-sessions?date=today");
      if (!res.ok) return;
      const json = await res.json();
      setTodayData({ totalSeconds: json.totalSeconds, loginCount: json.loginCount });
    } catch {}
  }, []);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  // Live counter for current session display — ticks only when visible
  useEffect(() => {
    if (!isActive) return;
    setDisplaySeconds(sessionActiveSeconds);

    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const timer = setInterval(() => {
      if (isVisibleRef.current) {
        setDisplaySeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isActive, sessionActiveSeconds]);

  if (!todayData) return null;

  // Today's total = server total (includes active session estimate from server)
  // For display, show server total minus current active from server + our live counter
  const todayTotal = todayData.totalSeconds;

  return (
    <GlassCard variant="default" padding="sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Clock className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Today&apos;s Work Time</p>
          <p className="text-lg font-semibold tabular-nums">{formatDuration(todayTotal)}</p>
        </div>
        <div className="text-right">
          {isActive && (
            <>
              <p className="text-[11px] text-muted-foreground">Session</p>
              <p className="text-sm font-medium tabular-nums text-primary">
                {formatDuration(displaySeconds)}
              </p>
            </>
          )}
        </div>
      </div>
      {isActive && loginTime && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <LogIn className="h-3 w-3" />
          Login: {formatTime(loginTime)}
          <span className="ml-auto">
            {todayData.loginCount} session{todayData.loginCount !== 1 ? "s" : ""} today
          </span>
        </div>
      )}
    </GlassCard>
  );
}
