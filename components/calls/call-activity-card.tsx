"use client";

import { ArrowDownLeft, ArrowUpRight, MessageSquare, Pencil, Phone, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { CallStatusActions } from "@/components/calls/call-status-actions";
import { CallStatusBadge } from "@/components/calls/call-status-badge";
import { WhatsAppChatButton } from "@/components/shared/whatsapp-chat-button";
import type { Call, CallStatus } from "@/types/call";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import { formatDuration, formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

interface CallActivityCardProps {
  call: Call;
  selected?: boolean;
  onSelect?: () => void;
  onStatusChange: (status: CallStatus) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isUpdating?: boolean;
  canMessageOnWhatsApp?: boolean;
}

export function CallActivityCard({
  call,
  selected,
  onSelect,
  onStatusChange,
  onEdit,
  onDelete,
  isUpdating,
  canMessageOnWhatsApp,
}: CallActivityCardProps) {
  return (
    <GlassCard
      variant={selected ? "gradient" : "default"}
      padding="md"
      interactive={Boolean(onSelect)}
      className={cn(
        "ds-animate-in cursor-pointer transition-all",
        selected && "ring-2 ring-primary/30",
      )}
      onClick={onSelect}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3 min-w-0">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              call.direction === "inbound"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-blue-500/15 text-blue-600 dark:text-blue-400",
            )}
          >
            {call.direction === "inbound" ? (
              <ArrowDownLeft className="h-5 w-5" />
            ) : (
              <ArrowUpRight className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{call.customerName}</p>
            <p className="text-sm text-muted-foreground">
              {call.agentName ?? "Unassigned"} · {formatRelativeTime(call.startedAt)}
            </p>
            {call.leadPhone && (
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {call.leadPhone}
                </p>
                {canMessageOnWhatsApp && (
                  <WhatsAppChatButton
                    phone={call.leadPhone}
                    message={WHATSAPP_TEMPLATES.inquiryFollowup}
                    label={`WhatsApp ${call.customerName}`}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          <CallStatusBadge status={call.status} />
          <span className="text-xs text-muted-foreground">
            {formatDuration(call.duration)}
          </span>
          {(call.noteCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {call.noteCount} note{call.noteCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {call.summary && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2 border-t border-border/40 pt-3">
          {call.summary}
        </p>
      )}

      {selected && (
        <div
          className="mt-4 border-t border-border/40 pt-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 hover:bg-muted/60"
              aria-label="Edit call"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10"
              aria-label="Delete call"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Update status
          </p>
          <CallStatusActions
            currentStatus={call.status}
            onStatusChange={onStatusChange}
            disabled={isUpdating}
            compact
          />
        </div>
      )}
    </GlassCard>
  );
}
