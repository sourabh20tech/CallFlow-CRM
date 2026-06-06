"use client";

import { useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusChip } from "@/components/design-system/status-chip";
import {
  LEAD_STATUS_OPTIONS,
  LEAD_STATUS_VARIANT,
  formatLeadStatus,
} from "@/lib/leads/constants";
import type { Lead, LeadStatus } from "@/types/lead";
import { cn } from "@/lib/utils";

interface InlineLeadStatusProps {
  lead: Lead;
  isAdmin: boolean;
  onStatusChange: (updatedLead: Lead) => void;
}

/**
 * Compact dropdown-based status selector for the leads table.
 * Shows current status as a badge with a chevron; clicking opens
 * a dropdown with all available statuses.
 */
export function InlineLeadStatus({
  lead,
  isAdmin,
  onStatusChange,
}: InlineLeadStatusProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const handleStatus = async (status: LeadStatus) => {
    if (status === lead.status || isSaving) return;
    setOpen(false);
    setIsSaving(true);

    try {
      const url = isAdmin
        ? `/api/leads/${lead.id}`
        : `/api/agent/leads/${lead.id}`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");

      onStatusChange(data as Lead);
      toast.success(`Status → ${formatLeadStatus(status)}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update status",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={isSaving}>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-full transition-all duration-150",
            "hover:ring-2 hover:ring-primary/20 hover:ring-offset-1 hover:ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isSaving && "opacity-60 cursor-not-allowed",
          )}
          aria-label={`Status: ${formatLeadStatus(lead.status)}. Click to change.`}
        >
          <StatusChip
            label={formatLeadStatus(lead.status)}
            variant={LEAD_STATUS_VARIANT[lead.status]}
            size="sm"
            showDot
          />
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[160px]">
        {LEAD_STATUS_OPTIONS.map(({ value, label }) => {
          const active = lead.status === value;
          const variant = LEAD_STATUS_VARIANT[value];

          return (
            <DropdownMenuItem
              key={value}
              onClick={() => void handleStatus(value)}
              className={cn(
                "flex items-center gap-2 px-2.5 py-2 cursor-pointer",
                active && "bg-accent",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  variant === "default" && "bg-primary",
                  variant === "success" && "bg-emerald-500",
                  variant === "warning" && "bg-amber-500",
                  variant === "error" && "bg-red-500",
                  variant === "info" && "bg-blue-500",
                  variant === "neutral" && "bg-muted-foreground",
                )}
              />
              <span className="flex-1 text-sm">{label}</span>
              {active && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
