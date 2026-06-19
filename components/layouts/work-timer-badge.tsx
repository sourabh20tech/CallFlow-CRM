"use client";

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
 * Shows live active session time. Only visible for agent role.
 */
export function WorkTimerBadge() {
  const { role } = useAuth();
  const { isActive, activeSeconds } = useWorkSession();

  // Only show for agents with active session
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
        {formatCompact(activeSeconds)}
      </span>
    </div>
  );
}
