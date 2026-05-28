"use client";

import { CalendarClock, CheckCircle2, MoreHorizontal, Trash2, User } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { FollowupStatusBadge } from "@/components/followups/followup-status-badge";
import { PriorityBadge } from "@/components/followups/priority-badge";
import { isFollowupOverdue } from "@/lib/followups/constants";
import { formatFollowupDue } from "@/lib/followups/datetime";
import type { Followup, FollowupStatus } from "@/types/followup";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface FollowupCardProps {
  followup: Followup;
  selected?: boolean;
  onSelect?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: FollowupStatus) => void;
}

export function FollowupCard({
  followup,
  selected,
  onSelect,
  onComplete,
  onDelete,
  onStatusChange,
}: FollowupCardProps) {
  const overdue = isFollowupOverdue(followup);
  const isDone = followup.status === "completed";

  return (
    <GlassCard
      variant={selected ? "gradient" : "default"}
      padding="md"
      interactive={Boolean(onSelect)}
      className={cn(
        "ds-animate-in transition-all",
        selected && "ring-2 ring-primary/30",
        overdue && !isDone && "border-amber-500/30",
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              isDone ? "bg-emerald-500/15 text-emerald-600" : "bg-primary/10 text-primary",
            )}
          >
            {isDone ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <CalendarClock className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{followup.title}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {followup.leadName ?? "Lead"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <PriorityBadge priority={followup.priority} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {!isDone && onComplete && (
                <DropdownMenuItem onClick={onComplete} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Mark complete
                </DropdownMenuItem>
              )}
              {onStatusChange && followup.status === "pending" && (
                <DropdownMenuItem onClick={() => onStatusChange("in_progress")}>
                  Start progress
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {followup.description && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{followup.description}</p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-md border border-border/40 bg-muted/20 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lead</p>
          <p className="truncate font-medium text-foreground">{followup.leadName ?? "Lead"}</p>
        </div>
        <div className="rounded-md border border-border/40 bg-muted/20 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Priority</p>
          <p className="capitalize font-medium text-foreground">{followup.priority}</p>
        </div>
        <div className="rounded-md border border-border/40 bg-muted/20 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</p>
          <p className="capitalize font-medium text-foreground">{followup.status.replace("_", " ")}</p>
        </div>
        <div className="rounded-md border border-border/40 bg-muted/20 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Due</p>
          <p className="font-medium text-foreground">{formatFollowupDue(followup.dueAt)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
        <FollowupStatusBadge status={followup.status} />
        <span
          className={cn(
            "text-xs",
            overdue && !isDone ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground",
          )}
        >
          {formatFollowupDue(followup.dueAt)}
          {overdue && !isDone ? " · Overdue" : ""}
        </span>
        {followup.assignedAgentName && (
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {followup.assignedAgentName}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
