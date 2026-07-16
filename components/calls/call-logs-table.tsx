"use client";

import { ArrowDownLeft, ArrowUpRight, MessageSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CallStatusBadge } from "@/components/calls/call-status-badge";
import { CallStatusActions } from "@/components/calls/call-status-actions";
import { WhatsAppChatButton } from "@/components/shared/whatsapp-chat-button";
import type { Call, CallStatus } from "@/types/call";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import { formatDuration, formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

interface CallLogsTableProps {
  calls: Call[];
  selectedId?: string;
  onSelect: (call: Call) => void;
  onStatusChange: (callId: string, status: CallStatus) => void;
  onEdit: (call: Call) => void;
  onDelete: (call: Call) => void;
  isAdmin: boolean;
  updatingId?: string;
}

export function CallLogsTable({
  calls,
  selectedId,
  onSelect,
  onStatusChange,
  onEdit,
  onDelete,
  isAdmin,
  updatingId,
}: CallLogsTableProps) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead / contact</TableHead>
              <TableHead className="hidden xl:table-cell">Agent</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Duration</TableHead>
              <TableHead className="hidden sm:table-cell">When</TableHead>
              <TableHead className="w-8" />
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((call) => (
              <TableRow
                key={call.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/40",
                  selectedId === call.id && "bg-primary/5",
                )}
                onClick={() => onSelect(call)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{call.customerName}</p>
                    <p className="text-xs text-muted-foreground">{call.leadPhone ?? "—"}</p>
                    {call.leadPhone && (isAdmin || Boolean(call.agentId)) && (
                      <div className="mt-1.5">
                        <WhatsAppChatButton
                          phone={call.leadPhone}
                          message={WHATSAPP_TEMPLATES.inquiryFollowup}
                          label={`WhatsApp ${call.customerName}`}
                        />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  {call.agentName ?? "—"}
                </TableCell>
                <TableCell>
                  <DirectionBadge direction={call.direction} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <CallStatusBadge status={call.status} />
                </TableCell>
                <TableCell className="hidden tabular-nums md:table-cell">
                  {formatDuration(call.duration)}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {formatRelativeTime(call.startedAt)}
                </TableCell>
                <TableCell>
                  {(call.noteCount ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {call.noteCount}
                    </span>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Call actions"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted/60"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(call)} className="gap-2">
                        <Pencil className="h-4 w-4" />
                        Edit call
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(call)}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete call
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 md:hidden">
        {calls.map((call) => (
          <li key={call.id}>
            <button
              type="button"
              onClick={() => onSelect(call)}
              className={cn(
                "w-full rounded-xl border border-[hsl(var(--ds-glass-border))]",
                "bg-[hsl(var(--ds-glass-bg))]/60 p-4 text-left backdrop-blur-sm",
                "transition-colors hover:bg-muted/30",
                selectedId === call.id && "ring-2 ring-primary/30",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{call.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {call.agentName ?? "Unassigned"} · {formatRelativeTime(call.startedAt)}
                  </p>
                </div>
                <CallStatusBadge status={call.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <DirectionBadge direction={call.direction} />
                <span>{formatDuration(call.duration)}</span>
                {(call.noteCount ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {call.noteCount} notes
                  </span>
                )}
              </div>
              {call.leadPhone && (isAdmin || Boolean(call.agentId)) && (
                <div className="mt-2">
                  <WhatsAppChatButton
                    phone={call.leadPhone}
                    message={WHATSAPP_TEMPLATES.inquiryFollowup}
                    label={`WhatsApp ${call.customerName}`}
                  />
                </div>
              )}
              {selectedId === call.id && (
                <div
                  className="mt-4 border-t border-border/50 pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-2 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(call)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 hover:bg-muted/60"
                      aria-label="Edit call"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(call)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10"
                      aria-label="Delete call"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <CallStatusActions
                    currentStatus={call.status}
                    onStatusChange={(status) => onStatusChange(call.id, status)}
                    disabled={updatingId === call.id}
                    compact
                  />
                </div>
              )}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function DirectionBadge({ direction }: { direction: Call["direction"] }) {
  const inbound = direction === "inbound";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        inbound
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          : "bg-blue-500/15 text-blue-700 dark:text-blue-400",
      )}
    >
      {inbound ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
      {direction}
    </span>
  );
}
