"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { formatLeadStatus } from "@/lib/leads/constants";
import { ManageStatusesModal } from "@/components/leads/manage-statuses-modal";
import { useAuth } from "@/hooks/use-auth";
import type { Lead, LeadStatus } from "@/types/lead";
import type { LeadStatusConfig } from "@/types/lead-status-config";
import { cn } from "@/lib/utils";

const FALLBACK_STATUSES: LeadStatusConfig[] = [
  { id: "s1", label: "New", value: "new", color: "#3b82f6", sortOrder: 1, isSystem: true, createdAt: "" },
  { id: "s2", label: "Interested", value: "interested", color: "#8b5cf6", sortOrder: 2, isSystem: true, createdAt: "" },
  { id: "s3", label: "Follow-Up", value: "follow_up", color: "#f59e0b", sortOrder: 3, isSystem: true, createdAt: "" },
  { id: "s4", label: "Converted", value: "converted", color: "#10b981", sortOrder: 4, isSystem: true, createdAt: "" },
  { id: "s5", label: "Not Interested", value: "not_interested", color: "#ef4444", sortOrder: 5, isSystem: true, createdAt: "" },
  { id: "s6", label: "Closed", value: "closed", color: "#6b7280", sortOrder: 6, isSystem: true, createdAt: "" },
];

const PRESET_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6b7280", "#ec4899", "#14b8a6"];

interface LeadStatusActionsProps {
  lead: Lead;
  onUpdated: (lead: Lead) => void;
  compact?: boolean;
}

export function LeadStatusActions({ lead, onUpdated, compact }: LeadStatusActionsProps) {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [isSaving, setIsSaving] = useState(false);
  const [statuses, setStatuses] = useState<LeadStatusConfig[]>(FALLBACK_STATUSES);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#8b5cf6");
  const [isCreating, setIsCreating] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/lead-statuses")
      .then((res) => res.json())
      .then((data) => {
        if (data.statuses?.length) setStatuses(data.statuses);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (showCreate) setTimeout(() => inputRef.current?.focus(), 50);
  }, [showCreate]);

  const handleStatus = async (statusValue: string) => {
    if (statusValue === lead.status || isSaving) return;
    setIsSaving(true);
    try {
      const url = isAdmin
        ? `/api/leads/${lead.id}`
        : `/api/agent/leads/${lead.id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      onUpdated(data as Lead);
      const label = statuses.find((s) => s.value === statusValue)?.label ?? statusValue;
      toast.success(`Status → ${label}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update status");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/lead-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim(), color: newColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Status "${newLabel.trim()}" created`);
      setStatuses((prev) => [...prev, data]);
      setNewLabel("");
      setShowCreate(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
        {statuses.map((status) => {
          const active = lead.status === status.value;
          return (
            <button
              key={status.id}
              type="button"
              disabled={isSaving}
              onClick={() => void handleStatus(status.value)}
              className={cn(
                "transition-transform active:scale-95",
                active && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background rounded-full",
                isSaving && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium",
                  compact ? "text-[0.6875rem]" : "text-xs",
                )}
                style={{
                  borderColor: `${status.color}40`,
                  backgroundColor: `${status.color}18`,
                  color: status.color,
                }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                {status.label}
              </span>
            </button>
          );
        })}

        {/* Add New Status button — Admin only */}
        {isAdmin && !showCreate && (
          <>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-3 w-3" />
              Add Status
            </button>
            <button
              type="button"
              onClick={() => setManageOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
            >
              <Settings2 className="h-3 w-3" />
              Manage
            </button>
          </>
        )}
      </div>

      {/* Inline create form */}
      {isAdmin && showCreate && (
        <form onSubmit={(e) => void handleCreate(e)} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
          <input
            ref={inputRef}
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Status name..."
            maxLength={30}
            className="h-7 w-32 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-0.5">
            {PRESET_COLORS.slice(0, 5).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={cn("h-5 w-5 rounded-full border-2", newColor === c ? "border-foreground" : "border-transparent")}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={!newLabel.trim() || isCreating}
            className="flex h-7 items-center gap-1 rounded bg-primary px-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Create
          </button>
          <button
            type="button"
            onClick={() => { setShowCreate(false); setNewLabel(""); }}
            className="flex h-7 items-center rounded px-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      )}

      {isAdmin && (
        <ManageStatusesModal
          open={manageOpen}
          onOpenChange={setManageOpen}
          statuses={statuses}
          onStatusesChanged={() => {
            fetch("/api/lead-statuses")
              .then((res) => res.json())
              .then((data) => { if (data.statuses?.length) setStatuses(data.statuses); })
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}
