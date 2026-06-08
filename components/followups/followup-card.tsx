"use client";

import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  MessageSquare,
  MoreHorizontal,
  Phone,
  MessageCircle,
  RefreshCw,
  Trash2,
  User,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface FollowupCardProps {
  followup: Followup;
  selected?: boolean;
  isAdmin?: boolean;
  onSelect?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: FollowupStatus) => void;
}

export function FollowupCard({
  followup,
  selected,
  isAdmin = false,
  onSelect,
  onComplete,
  onDelete,
  onStatusChange,
}: FollowupCardProps) {
  const overdue = isFollowupOverdue(followup);
  const isDone = followup.status === "completed";
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Use leadId to find phone — for now open tel if available in metadata
    toast.info("Opening dialer...");
    // Navigate to lead for call action
    window.location.href = `/dashboard/leads?search=${encodeURIComponent(followup.leadName ?? "")}`;
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to lead for WhatsApp
    window.location.href = `/dashboard/leads?search=${encodeURIComponent(followup.leadName ?? "")}`;
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      toast.warning("Click Delete again to confirm", { duration: 3000 });
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDelete?.();
    setConfirmDelete(false);
  };

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
            <h3 className="truncate font-semibold">{followup.title}</h3>
            <p className="truncate text-sm text-muted-foreground">
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
            <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
              {/* Communication actions */}
              <DropdownMenuItem onClick={handleCall} className="gap-2">
                <Phone className="h-4 w-4 text-blue-500" />
                Quick Call
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleWhatsApp} className="gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-500" />
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); toast.info("Open lead to add notes"); }}>
                <MessageSquare className="h-4 w-4 text-amber-500" />
                Add Note
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Status actions */}
              {!isDone && onComplete && (
                <DropdownMenuItem onClick={onComplete} className="gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              {onStatusChange && followup.status === "pending" && (
                <DropdownMenuItem onClick={() => onStatusChange("in_progress")} className="gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  Reschedule
                </DropdownMenuItem>
              )}

              {/* Admin-only actions */}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); toast.info("Use Follow-Up edit to reassign"); }}>
                    <UserCheck className="h-4 w-4 text-primary" />
                    Reassign Agent
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className={cn("gap-2", confirmDelete ? "bg-destructive/10 text-destructive" : "text-destructive")}
                    >
                      <Trash2 className="h-4 w-4" />
                      {confirmDelete ? "Confirm Delete" : "Delete Follow-Up"}
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {followup.description && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{followup.description}</p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-md border border-border/40 bg-muted/20 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lead</p>
          <p className="truncate font-medium text-foreground">{followup.leadName ?? "Lead"}</p>
        </div>
        <div className="rounded-md border border-border/40 bg-muted/20 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Priority</p>
          <p className="font-medium capitalize text-foreground">{followup.priority}</p>
        </div>
        <div className="rounded-md border border-border/40 bg-muted/20 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</p>
          <p className="font-medium capitalize text-foreground">{followup.status.replace("_", " ")}</p>
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
