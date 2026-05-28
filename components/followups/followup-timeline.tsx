"use client";

import { CalendarClock } from "lucide-react";
import { FollowupCard } from "@/components/followups/followup-card";
import type { Followup, FollowupStatus } from "@/types/followup";
import { formatFollowupDue } from "@/lib/followups/datetime";

interface FollowupTimelineProps {
  followups: Followup[];
  selectedId?: string;
  onSelect: (followup: Followup) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: FollowupStatus) => void;
}

export function FollowupTimeline({
  followups,
  selectedId,
  onSelect,
  onComplete,
  onDelete,
  onStatusChange,
}: FollowupTimelineProps) {
  if (!followups.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-16 text-center">
        <CalendarClock className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="font-medium">No follow-ups in this view</p>
        <p className="text-sm text-muted-foreground">Schedule one to get started.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4 pl-6 sm:pl-8">
      <div
        className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border/60 to-transparent sm:left-[11px]"
        aria-hidden
      />

      {followups.map((followup) => (
        <div key={followup.id} className="relative">
          <div
            className={`absolute -left-6 top-5 z-10 h-4 w-4 rounded-full border-2 border-background sm:-left-8 sm:h-5 sm:w-5 ${
              selectedId === followup.id ? "bg-primary" : "bg-muted"
            }`}
            aria-hidden
          />
          <p className="mb-2 pl-2 text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
            {formatFollowupDue(followup.dueAt)}
          </p>
          <FollowupCard
            followup={followup}
            selected={selectedId === followup.id}
            onSelect={() => onSelect(followup)}
            onComplete={() => onComplete(followup.id)}
            onDelete={() => onDelete(followup.id)}
            onStatusChange={(status) => onStatusChange(followup.id, status)}
          />
        </div>
      ))}
    </div>
  );
}
