"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

function fetchStatuses(): Promise<LeadStatusConfig[]> {
  if (cachedStatuses) return Promise.resolve(cachedStatuses);
  if (cachePromise) return cachePromise;

  cachePromise = fetch("/api/lead-statuses")
    .then((res) => res.json())
    .then((data) => {
      cachedStatuses = data.statuses ?? [];
      return cachedStatuses!;
    })
    .catch(() => {
      cachePromise = null;
      return [];
    });

  return cachePromise;
}

/**
 * Compact dropdown-based status selector for the leads table.
 * Supports both system and custom statuses fetched from the API.
 */
export function InlineLeadStatus({
  lead,
  isAdmin,
  onStatusChange,
}: InlineLeadStatusProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [statuses, setStatuses] = useState<LeadStatusConfig[]>(cachedStatuses ?? []);

  useEffect(() => {
    void fetchStatuses().then(setStatuses);
  }, []);

  const handleStatus = async (statusValue: string) => {
    if (statusValue === lead.status || isSaving) return;
    setOpen(false);
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

  // Find current status config
  const currentConfig = statuses.find((s) => s.value === lead.status);
  const currentLabel = currentConfig?.label ?? formatLeadStatus(lead.status as LeadStatus);
  const currentColor = currentConfig?.color ?? "#8b5cf6";

  // Determine badge variant from color or system mapping
  const variant = LEAD_STATUS_VARIANT[lead.status as LeadStatus] ?? "default";

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

      <DropdownMenuContent align="start" className="min-w-[170px]">
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
