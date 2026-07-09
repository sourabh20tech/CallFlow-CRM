"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Plus, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { ConvertLeadModal } from "@/components/leads/convert-lead-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ManageStatusesModal } from "@/components/leads/manage-statuses-modal";
import {
  LEAD_STATUS_VARIANT,
  formatLeadStatus,
} from "@/lib/leads/constants";
import type { Lead, LeadStatus } from "@/types/lead";
import type { LeadStatusConfig } from "@/types/lead-status-config";
import { cn } from "@/lib/utils";

interface InlineLeadStatusProps {
  lead: Lead;
  isAdmin: boolean;
  onStatusChange: (updatedLead: Lead) => void;
}

// Cache statuses across component instances
let cachedStatuses: LeadStatusConfig[] | null = null;
let cachePromise: Promise<LeadStatusConfig[]> | null = null;

const FALLBACK_STATUSES: LeadStatusConfig[] = [
  { id: "s1", label: "New", value: "new", color: "#3b82f6", sortOrder: 1, isSystem: true, createdAt: "" },
  { id: "s2", label: "Interested", value: "interested", color: "#8b5cf6", sortOrder: 2, isSystem: true, createdAt: "" },
  { id: "s3", label: "Follow-Up", value: "follow_up", color: "#f59e0b", sortOrder: 3, isSystem: true, createdAt: "" },
  { id: "s4", label: "Converted", value: "converted", color: "#10b981", sortOrder: 4, isSystem: true, createdAt: "" },
  { id: "s5", label: "Not Interested", value: "not_interested", color: "#ef4444", sortOrder: 5, isSystem: true, createdAt: "" },
  { id: "s6", label: "Closed", value: "closed", color: "#6b7280", sortOrder: 6, isSystem: true, createdAt: "" },
];

const PRESET_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6b7280", "#ec4899", "#14b8a6", "#f97316", "#6366f1"];

function fetchStatuses(): Promise<LeadStatusConfig[]> {
  if (cachedStatuses) return Promise.resolve(cachedStatuses);
  if (cachePromise) return cachePromise;

  cachePromise = fetch("/api/lead-statuses")
    .then((res) => res.json())
    .then((data) => {
      const list = data.statuses ?? [];
      cachedStatuses = list.length > 0 ? list : FALLBACK_STATUSES;
      return cachedStatuses!;
    })
    .catch(() => {
      cachePromise = null;
      cachedStatuses = FALLBACK_STATUSES;
      return FALLBACK_STATUSES;
    });

  return cachePromise;
}

/** Invalidate cache so next render fetches fresh statuses */
function invalidateStatusCache() {
  cachedStatuses = null;
  cachePromise = null;
}

/**
 * Compact dropdown-based status selector for the leads table.
 * Includes "Add New Status" option for admins at the bottom.
 */
export function InlineLeadStatus({
  lead,
  isAdmin,
  onStatusChange,
}: InlineLeadStatusProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [statuses, setStatuses] = useState<LeadStatusConfig[]>(cachedStatuses ?? FALLBACK_STATUSES);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#8b5cf6");
  const [isCreating, setIsCreating] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchStatuses().then(setStatuses);
  }, []);

  useEffect(() => {
    if (showCreateForm) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showCreateForm]);

  const handleStatus = async (statusValue: string) => {
    if (statusValue === lead.status || isSaving) return;

    // Intercept "converted" — show fund modal instead of direct update
    if (statusValue === "converted") {
      setOpen(false);
      setConvertOpen(true);
      return;
    }

    setOpen(false);
    setShowCreateForm(false);
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

      onStatusChange(data as Lead);
      const label = statuses.find((s) => s.value === statusValue)?.label ?? statusValue;
      toast.success(`Status → ${label}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update status",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newLabel.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/lead-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim(), color: newColor }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");

      toast.success(`Status "${newLabel.trim()}" created`);
      setNewLabel("");
      setNewColor("#8b5cf6");
      setShowCreateForm(false);

      // Refresh statuses
      invalidateStatusCache();
      const fresh = await fetchStatuses();
      setStatuses(fresh);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    } finally {
      setIsCreating(false);
    }
  };

  // Find current status config
  const currentConfig = statuses.find((s) => s.value === lead.status);
  const currentLabel = currentConfig?.label ?? formatLeadStatus(lead.status as LeadStatus);
  const currentColor = currentConfig?.color ?? "#8b5cf6";

  return (
    <>
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowCreateForm(false); }}>
      <DropdownMenuTrigger asChild disabled={isSaving}>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-full transition-all duration-150",
            "hover:ring-2 hover:ring-primary/20 hover:ring-offset-1 hover:ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isSaving && "opacity-60 cursor-not-allowed",
          )}
          aria-label={`Status: ${currentLabel}. Click to change.`}
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0 text-[0.6875rem] font-medium"
            style={{
              borderColor: `${currentColor}40`,
              backgroundColor: `${currentColor}18`,
              color: currentColor,
            }}
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: currentColor }}
            />
            {currentLabel}
          </span>
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[180px] scrollbar-dropdown">
        {statuses.map((status) => {
          const active = lead.status === status.value;
          return (
            <DropdownMenuItem
              key={status.id}
              onClick={() => void handleStatus(status.value)}
              className={cn(
                "flex items-center gap-2 px-2.5 py-2 cursor-pointer",
                active && "bg-accent",
              )}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <span className="flex-1 text-sm">{status.label}</span>
              {active && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}

        {/* Add New Status — Admin only */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            {!showCreateForm ? (
              <>
                <DropdownMenuItem
                  onClick={(e) => { e.preventDefault(); setShowCreateForm(true); }}
                  className="flex items-center gap-2 px-2.5 py-2 cursor-pointer text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium">Add New Status</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.preventDefault(); setOpen(false); setManageOpen(true); }}
                  className="flex items-center gap-2 px-2.5 py-2 cursor-pointer text-muted-foreground"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span className="text-sm">Manage Statuses</span>
                </DropdownMenuItem>
              </>
            ) : (
              <div className="px-2.5 py-2" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={(e) => void handleCreateStatus(e)} className="space-y-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Status name..."
                    maxLength={30}
                    className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex items-center gap-1">
                    {PRESET_COLORS.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={cn(
                          "h-5 w-5 rounded-full border-2 transition-transform",
                          newColor === c ? "border-foreground scale-110" : "border-transparent",
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="submit"
                      disabled={!newLabel.trim() || isCreating}
                      className="flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCreateForm(false); setNewLabel(""); }}
                      className="flex h-7 items-center rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>

    {isAdmin && (
      <ManageStatusesModal
        open={manageOpen}
        onOpenChange={setManageOpen}
        statuses={statuses}
        onStatusesChanged={() => {
          invalidateStatusCache();
          void fetchStatuses().then(setStatuses);
        }}
      />
    )}

    <ConvertLeadModal
      open={convertOpen}
      onOpenChange={setConvertOpen}
      lead={lead}
      isAdmin={isAdmin}
      onConverted={onStatusChange}
    />
    </>
  );
}
