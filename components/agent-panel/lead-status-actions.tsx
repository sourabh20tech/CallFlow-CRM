"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LEAD_STATUS_OPTIONS, LEAD_STATUS_VARIANT, formatLeadStatus } from "@/lib/leads/constants";
import { StatusChip } from "@/components/design-system/status-chip";
import type { Lead, LeadStatus } from "@/types/lead";
import { cn } from "@/lib/utils";

interface LeadStatusActionsProps {
  lead: Lead;
  onUpdated: (lead: Lead) => void;
  compact?: boolean;
}

export function LeadStatusActions({ lead, onUpdated, compact }: LeadStatusActionsProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleStatus = async (status: LeadStatus) => {
    if (status === lead.status || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/agent/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      onUpdated(data as Lead);
      toast.success(`Status → ${formatLeadStatus(status)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update status");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
      {LEAD_STATUS_OPTIONS.map(({ value }) => {
        const active = lead.status === value;
        return (
          <button
            key={value}
            type="button"
            disabled={isSaving}
            onClick={() => void handleStatus(value)}
            className={cn(
              "transition-transform active:scale-95",
              active && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background rounded-full",
              isSaving && "opacity-60",
            )}
          >
            <StatusChip
              label={formatLeadStatus(value)}
              variant={LEAD_STATUS_VARIANT[value]}
              size={compact ? "sm" : "md"}
              pulse={active}
            />
          </button>
        );
      })}
    </div>
  );
}
