"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { CallNotesSection } from "@/components/calls/call-notes-section";
import { CallStatusActions } from "@/components/calls/call-status-actions";
import { CallStatusBadge } from "@/components/calls/call-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCallStatus } from "@/lib/calls/constants";
import type { Call, CallStatus } from "@/types/call";
import { formatDuration, formatRelativeTime } from "@/utils/format";

interface CallDetailPanelProps {
  call: Call | null;
  onStatusChange: (callId: string, status: CallStatus) => void;
  onEditCall: (callId: string, input: { direction: Call["direction"]; durationSeconds: number; summary?: string }) => Promise<void>;
  onDeleteCall: (callId: string) => Promise<void>;
  editRequestSeq?: number;
  editRequestCallId?: string | null;
  onNoteAdded: () => void;
  isUpdating?: boolean;
}

export function CallDetailPanel({
  call,
  onStatusChange,
  onEditCall,
  onDeleteCall,
  editRequestSeq,
  editRequestCallId,
  onNoteAdded,
  isUpdating,
}: CallDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [direction, setDirection] = useState<Call["direction"]>("outbound");
  const [durationSeconds, setDurationSeconds] = useState("0");
  const [summary, setSummary] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!call) return;
    setDirection(call.direction);
    setDurationSeconds(String(call.duration ?? 0));
    setSummary(call.summary ?? "");
    setIsEditing(false);
  }, [call]);

  useEffect(() => {
    if (!call) return;
    if (!editRequestSeq) return;
    if (editRequestCallId === call.id) {
      setIsEditing(true);
    }
  }, [call, editRequestSeq, editRequestCallId]);

  if (!call) {
    return (
      <GlassCard
        variant="subtle"
        padding="lg"
        className="flex h-full min-h-[280px] items-center justify-center lg:sticky lg:top-24"
      >
        <p className="px-4 text-center text-sm text-muted-foreground">
          Select a call from the log or timeline to view details, update status, and add notes.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="strong" padding="md" className="ds-animate-in h-fit lg:sticky lg:top-24">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
        <h3 className="ds-h3">{call.customerName}</h3>
        <CallStatusBadge status={call.status} size="md" />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsEditing((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 hover:bg-muted/50"
            aria-label="Edit call log"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => void onDeleteCall(call.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10"
            aria-label="Delete call log"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatCallStatus(call.status)} · {formatDuration(call.duration)} ·{" "}
        {formatRelativeTime(call.startedAt)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Lead:{" "}
        <Link href="/dashboard/leads" className="text-primary hover:underline">
          {call.customerName}
        </Link>
      </p>
      {call.leadPhone && (
        <p className="mt-1 text-sm text-muted-foreground">{call.leadPhone}</p>
      )}
      {call.agentName && (
        <p className="text-xs text-muted-foreground">Agent: {call.agentName}</p>
      )}

      {call.summary && (
        <p className="mt-4 rounded-xl border border-border/40 bg-muted/30 p-3 text-sm">
          {call.summary}
        </p>
      )}

      {isEditing && (
        <div className="mt-4 space-y-3 rounded-xl border border-border/50 bg-muted/20 p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">
              Direction
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as Call["direction"])}
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="inbound">inbound</option>
                <option value="outbound">outbound</option>
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Duration (seconds)
              <Input
                type="number"
                min={0}
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                className="mt-1 h-9"
              />
            </label>
          </div>
          <label className="text-xs text-muted-foreground">
            Call summary
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/80 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true);
                try {
                  await onEditCall(call.id, {
                    direction,
                    durationSeconds: Math.max(0, Number(durationSeconds) || 0),
                    summary: summary.trim() || undefined,
                  });
                  setIsEditing(false);
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-border/50 pt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Update status
        </p>
        <CallStatusActions
          currentStatus={call.status}
          onStatusChange={(status) => onStatusChange(call.id, status)}
          disabled={isUpdating}
        />
      </div>

      <div className="mt-6 border-t border-border/50 pt-5">
        <CallNotesSection callId={call.id} onNoteAdded={onNoteAdded} />
      </div>
    </GlassCard>
  );
}
