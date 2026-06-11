"use client";

import { Search, X } from "lucide-react";
import { FormInput } from "@/components/design-system/form-input";
import { LEAD_STATUS_OPTIONS, LEAD_FORCE_OPTIONS } from "@/lib/leads/constants";
import { useLeadStatuses } from "@/hooks/use-lead-statuses";
import { Button } from "@/components/ui/button";
import type { LeadListFilters, LeadRosterAgent } from "@/types/lead";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "h-10 rounded-lg border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]",
  "px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
);

interface LeadFiltersBarProps {
  filters: LeadListFilters;
  agents: LeadRosterAgent[];
  isAdmin?: boolean;
  onChange: (filters: LeadListFilters) => void;
  onClear: () => void;
}

export function LeadFiltersBar({ filters, agents, isAdmin = true, onChange, onClear }: LeadFiltersBarProps) {
  const { statuses: dynamicStatuses } = useLeadStatuses();
  const statusOptions = dynamicStatuses.length > 0
    ? dynamicStatuses.map((s) => ({ value: s.value, label: s.label }))
    : LEAD_STATUS_OPTIONS;

  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.status && filters.status !== "all") ||
    (filters.force && filters.force !== "all") ||
    (filters.assignedAgentId && filters.assignedAgentId !== "all");

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative min-w-0 flex-1 lg:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <FormInput
          className="pl-9"
          placeholder="Search name, email, phone, source…"
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className={selectClassName}
          value={filters.status ?? "all"}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value as LeadListFilters["status"],
            })
          }
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          className={selectClassName}
          value={filters.force ?? "all"}
          onChange={(e) =>
            onChange({
              ...filters,
              force: e.target.value as LeadListFilters["force"],
            })
          }
          aria-label="Filter by force"
        >
          <option value="all">All Forces</option>
          {LEAD_FORCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {isAdmin && (
          <select
            className={cn(selectClassName, "max-w-[180px]")}
            value={filters.assignedAgentId ?? "all"}
            onChange={(e) =>
              onChange({
                ...filters,
                assignedAgentId: e.target.value as LeadListFilters["assignedAgentId"],
              })
            }
            aria-label="Filter by agent"
          >
            <option value="all">All agents</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="gap-1" onClick={onClear}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
