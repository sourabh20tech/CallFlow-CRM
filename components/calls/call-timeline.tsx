"use client";

import { CallActivityCard } from "@/components/calls/call-activity-card";
import type { Call, CallStatus } from "@/types/call";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

interface CallTimelineProps {
  calls: Call[];
  selectedId?: string;
  onSelect: (call: Call) => void;
  onStatusChange: (callId: string, status: CallStatus) => void;
  onEdit: (call: Call) => void;
  onDelete: (call: Call) => void;
  isAdmin: boolean;
  updatingId?: string;
}

function groupByDate(calls: Call[]): { label: string; calls: Call[] }[] {
  const groups = new Map<string, Call[]>();

  for (const call of calls) {
    const d = new Date(call.startedAt);
    const key = d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    const list = groups.get(key) ?? [];
    list.push(call);
    groups.set(key, list);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, calls: items }));
}

export function CallTimeline({
  calls,
  selectedId,
  onSelect,
  onStatusChange,
  onEdit,
  onDelete,
  isAdmin,
  updatingId,
}: CallTimelineProps) {
  const groups = groupByDate(calls);

  if (!calls.length) {
    return null;
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </span>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          <div className="relative space-y-4 pl-6 sm:pl-8">
            <div
              className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border/60 to-transparent sm:left-[11px]"
              aria-hidden
            />

            {group.calls.map((call, index) => (
              <div key={call.id} className="relative">
                <div
                  className={cn(
                    "absolute -left-6 top-5 z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background sm:-left-8 sm:h-5 sm:w-5",
                    selectedId === call.id
                      ? "bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                      : "bg-muted",
                  )}
                  aria-hidden
                />
                <div className="mb-1 flex items-center gap-2 pl-2">
                  <span className="text-[0.6875rem] text-muted-foreground">
                    {formatRelativeTime(call.startedAt)}
                  </span>
                </div>
                <CallActivityCard
                  call={call}
                  selected={selectedId === call.id}
                  onSelect={() => onSelect(call)}
                  onStatusChange={(status) => onStatusChange(call.id, status)}
                  onEdit={() => onEdit(call)}
                  onDelete={() => onDelete(call)}
                  isUpdating={updatingId === call.id}
                  canMessageOnWhatsApp={isAdmin || Boolean(call.agentId)}
                />
                {index < group.calls.length - 1 && (
                  <div className="h-2" aria-hidden />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
