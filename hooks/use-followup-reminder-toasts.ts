"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { formatFollowupDue } from "@/lib/followups/datetime";
import type { Followup } from "@/types/followup";

const STORAGE_KEY = "crm-followup-reminder-toasts";
const POLL_MS = 60_000;

function loadSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    /* ignore quota */
  }
}

function notifyNew(items: Followup[], seen: Set<string>, variant: "warning" | "info") {
  for (const f of items) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    const label = f.leadName ? `${f.title} · ${f.leadName}` : f.title;
    if (variant === "warning") {
      toast.warning("Follow-up overdue", {
        description: `${label} — ${formatFollowupDue(f.dueAt)}`,
        action: {
          label: "View",
          onClick: () => {
            window.location.href = "/dashboard/follow-ups";
          },
        },
      });
    } else {
      toast.info("Follow-up due soon", {
        description: `${label} — ${formatFollowupDue(f.dueAt)}`,
        action: {
          label: "View",
          onClick: () => {
            window.location.href = "/dashboard/follow-ups";
          },
        },
      });
    }
  }
  saveSeenIds(seen);
}

/**
 * Polls due follow-ups and surfaces sonner toasts once per session per task.
 */
export function useFollowupReminderToasts(enabled = true) {
  const seenRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    seenRef.current = loadSeenIds();

    const poll = async () => {
      try {
        const res = await fetch("/api/followups/reminders", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          overdue: Followup[];
          dueToday: Followup[];
          upcoming: Followup[];
        };
        const seen = seenRef.current ?? loadSeenIds();
        notifyNew(data.overdue, seen, "warning");
        notifyNew(data.dueToday, seen, "warning");
        notifyNew(data.upcoming, seen, "info");
        seenRef.current = seen;
      } catch {
        /* silent — next poll retries */
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [enabled]);
}
