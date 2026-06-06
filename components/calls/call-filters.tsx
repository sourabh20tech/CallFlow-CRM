"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CALL_DIRECTION_OPTIONS, CALL_QUICK_STATUSES, formatCallStatus } from "@/lib/calls/constants";
import type { CallFilters } from "@/types/call";
import type { DialLead } from "@/lib/calls/dial-leads";
import { cn } from "@/lib/utils";

export interface CallAgentOption {
  id: string;
  name: string;
}

interface CallFiltersBarProps {
  filters: CallFilters;
  onChange: (filters: CallFilters) => void;
  leads?: DialLead[];
  agents?: CallAgentOption[];
  isAdmin?: boolean;
}

export function CallFiltersBar({
  filters,
  onChange,
  leads = [],
  agents = [],
  isAdmin = false,
}: CallFiltersBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))] p-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search calls, leads, notes..."
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {leads.length > 0 && (
          <FilterSelect
            label="Lead"
            value={filters.leadId ?? "all"}
            onChange={(leadId) =>
              onChange({
                ...filters,
                leadId: leadId === "all" ? undefined : leadId,
              })
            }
            options={[
              { value: "all", label: "All leads" },
              ...leads.map((l) => ({
                value: l.id,
                label: l.company ? `${l.name} — ${l.company}` : l.name,
              })),
            ]}
          />
        )}

        {isAdmin && agents.length > 0 && (
          <FilterSelect
            label="Agent"
            value={filters.agentId ?? "all"}
            onChange={(agentId) =>
              onChange({
                ...filters,
                agentId: agentId === "all" ? undefined : agentId,
              })
            }
            options={[
              { value: "all", label: "All agents" },
              ...agents.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
        )}

        <FilterSelect
          label="Direction"
          value={filters.direction ?? "all"}
          onChange={(direction) =>
            onChange({
              ...filters,
              direction: direction as CallFilters["direction"],
            })
          }
          options={CALL_DIRECTION_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              From
            </label>
            <Input
              type="date"
              value={filters.dateFrom?.slice(0, 10) ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  dateFrom: e.target.value
                    ? new Date(`${e.target.value}T00:00:00`).toISOString()
                    : undefined,
                })
              }
              className="h-9"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
            <Input
              type="date"
              value={filters.dateTo?.slice(0, 10) ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  dateTo: e.target.value
                    ? new Date(`${e.target.value}T23:59:59`).toISOString()
                    : undefined,
                })
              }
              className="h-9"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All statuses"
          active={!filters.status || filters.status === "all"}
          onClick={() => onChange({ ...filters, status: "all" })}
        />
        {CALL_QUICK_STATUSES.map((status) => (
          <FilterChip
            key={status}
            label={formatCallStatus(status)}
            active={filters.status === status}
            onClick={() => onChange({ ...filters, status })}
          />
        ))}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full rounded-lg border border-input bg-background/80 px-3 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-all",
        active
          ? "border-primary/40 bg-primary/15 text-primary shadow-[var(--ds-shadow-sm)]"
          : "border-border/60 bg-muted/40 text-muted-foreground hover:border-primary/25 hover:bg-primary/5",
      )}
    >
      {label}
    </button>
  );
}
