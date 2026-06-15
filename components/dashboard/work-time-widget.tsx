"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, LogIn } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function WorkTimeWidget() {
  const [data, setData] = useState<{
    totalSeconds: number;
    loginCount: number;
    activeSession: { loginTime: string; durationSeconds: number } | null;
  } | null>(null);
  const [liveDuration, setLiveDuration] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/work-sessions?date=today");
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
      if (json.activeSession) {
        setLiveDuration(json.activeSession.durationSeconds);
      }
    } catch {}
  }, []);

  useEffect(() => {
    void load();
    // Start session on mount
    fetch("/api/work-sessions", { method: "POST" }).catch(() => {});

    // End session on page unload
    const handleUnload = () => {
      navigator.sendBeacon("/api/work-sessions", JSON.stringify({ action: "end" }));
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [load]);

  // Live timer
  useEffect(() => {
    if (!data?.activeSession) return;
    const timer = setInterval(() => {
      setLiveDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [data?.activeSession]);

  if (!data) return null;

  return (
    <GlassCard variant="default" padding="sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Clock className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Today&apos;s Work Time</p>
          <p className="text-lg font-semibold tabular-nums">{formatDuration(data.totalSeconds)}</p>
        </div>
        <div className="text-right">
          {data.activeSession && (
            <>
              <p className="text-[11px] text-muted-foreground">Session</p>
              <p className="text-sm font-medium tabular-nums text-primary">{formatDuration(liveDuration)}</p>
            </>
          )}
        </div>
      </div>
      {data.activeSession && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <LogIn className="h-3 w-3" />
          Login: {formatTime(data.activeSession.loginTime)}
          <span className="ml-auto">{data.loginCount} session{data.loginCount !== 1 ? "s" : ""} today</span>
        </div>
      )}
    </GlassCard>
  );
}
