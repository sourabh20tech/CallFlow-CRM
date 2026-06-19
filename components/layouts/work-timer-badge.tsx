"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkSession } from "@/hooks/use-work-session";
import { useAuth } from "@/hooks/use-auth";

function formatCompact(seconds: number): string {
  if (seconds <= 0) return "0h 00m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/**
 * Compact work timer badge shown in the header for agents.
 * Only renders for agent role, not for admin.
 */
export function WorkTimerBadge() {
  const { role } = useAuth();
  const { isActive, activeSeconds: hookSeconds } = useWorkSession();
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const isVisibleRef = useRef(!document.hidden);

  // Sync from hook and tick live
  useEffect(() => {
    if (!isActive) {
      setDisplaySeconds(0);
      return;
    }

    setDisplaySeconds(hookSeconds);

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
  }, [isActive, hookSeconds]);

  // Only show for agents
  if (role !== "agent" || !isActive) return null;

  return (
    <div
      className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 dark:border-emerald-800 dark:bg-emerald-950/40 sm:flex"
      title="Active work time this session"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-xs font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
        {formatCompact(displaySeconds)}
      </span>
    </div>
  );
}
