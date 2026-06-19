"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, Clock, LogIn, LogOut, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { Button } from "@/components/ui/button";

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0h 0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

interface AgentWorkTimeProps {
  agentProfileId: string;
}

export function AgentWorkTime({ agentProfileId }: AgentWorkTimeProps) {
  const [filter, setFilter] = useState<"today" | "week" | "month">("today");
  const [data, setData] = useState<{
    totalSeconds: number;
    loginCount: number;
    activeSession: { loginTime: string; activeSeconds: number } | null;
    sessions: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/work-sessions?date=${filter}&userId=${agentProfileId}`);
      if (!res.ok) return;
      setData(await res.json());
    } catch {} finally {
      setIsLoading(false);
    }
  }, [filter, agentProfileId]);

  useEffect(() => { void load(); }, [load]);

  // Derive stats
  const lastSession = data?.sessions?.[0];
  const isOnline = Boolean(data?.activeSession);

  return (
    <GlassCard variant="default" padding="md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Work Time Analytics</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {(["today", "week", "month"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {f === "today" ? "Today" : f === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status + Time */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
              <p className="text-[10px] uppercase text-muted-foreground">Status</p>
              <p className={`text-sm font-semibold ${isOnline ? "text-emerald-500" : "text-muted-foreground"}`}>
                {isOnline ? "● Online" : "○ Offline"}
              </p>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
              <p className="text-[10px] uppercase text-muted-foreground">Total Time</p>
              <p className="text-sm font-semibold">{formatDuration(data?.totalSeconds ?? 0)}</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
              <p className="text-[10px] uppercase text-muted-foreground">Login Count</p>
              <p className="text-sm font-semibold">{data?.loginCount ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
              <p className="text-[10px] uppercase text-muted-foreground">Avg/Day</p>
              <p className="text-sm font-semibold">
                {formatDuration(
                  Math.round((data?.totalSeconds ?? 0) / (filter === "today" ? 1 : filter === "week" ? 7 : 30))
                )}
              </p>
            </div>
          </div>

          {/* Last Activity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LogIn className="h-3.5 w-3.5" />
              <div>
                <p className="text-[10px] uppercase">Last Login</p>
                <p className="font-medium text-foreground">{formatDateTime(lastSession?.login_time)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LogOut className="h-3.5 w-3.5" />
              <div>
                <p className="text-[10px] uppercase">Last Logout</p>
                <p className="font-medium text-foreground">{formatDateTime(lastSession?.logout_time)}</p>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          {data?.sessions && data.sessions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Recent Sessions</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {data.sessions.slice(0, 5).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between rounded border border-border/30 px-2.5 py-1.5 text-xs">
                    <span>{formatDateTime(s.login_time)}</span>
                    <span className="font-medium">{formatDuration(s.duration_seconds ?? 0)}</span>
                    <span className={s.is_active ? "text-emerald-500" : "text-muted-foreground"}>
                      {s.is_active ? "Active" : "Ended"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
