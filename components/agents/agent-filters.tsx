"use client";

import { Search, X } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { FormInput } from "@/components/design-system/form-input";
import { AGENT_DEPARTMENTS } from "@/lib/agents/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AgentListFilters {
  search: string;
  department: string;
  account: "all" | "active" | "inactive";
}

export const DEFAULT_AGENT_FILTERS: AgentListFilters = {
  search: "",
  department: "all",
  account: "all",
};

const selectClassName = cn(
  "h-10 rounded-lg border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/80",
  "px-3 text-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
);

interface AgentFiltersBarProps {
  filters: AgentListFilters;
  onChange: (filters: AgentListFilters) => void;
  onClear: () => void;
}

export function AgentFiltersBar({ filters, onChange, onClear }: AgentFiltersBarProps) {
  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    filters.department !== "all" ||
    filters.account !== "all";

  return (
    <GlassCard variant="default" padding="md" className="ds-animate-in">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <FormInput
            className="pl-9"
            placeholder="Search agents by name, email, or phone…"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            aria-label="Search agents"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className={selectClassName}
            value={filters.department}
            onChange={(e) => onChange({ ...filters, department: e.target.value })}
            aria-label="Filter by department"
          >
            <option value="all">All departments</option>
            {AGENT_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            className={selectClassName}
            value={filters.account}
            onChange={(e) =>
              onChange({
                ...filters,
                account: e.target.value as AgentListFilters["account"],
              })
            }
            aria-label="Filter by account status"
          >
            <option value="all">All accounts</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="gap-1" onClick={onClear}>
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
