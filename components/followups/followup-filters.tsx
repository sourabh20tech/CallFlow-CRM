"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatFollowupPriority } from "@/lib/followups/constants";
import type { FollowupFilters, FollowupPriority, FollowupView } from "@/types/followup";
import { cn } from "@/lib/utils";

const VIEWS: { value: FollowupView; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "calendar", label: "Calendar" },
  { value: "all", label: "All" },
];

const PRIORITIES: (FollowupPriority | "all")[] = ["all", "high", "medium", "low"];

interface FollowupFiltersBarProps {
  filters: FollowupFilters;
  onChange: (filters: FollowupFilters) => void;
  agents: { id: string; name: string }[];
}

export function FollowupFiltersBar({ filters, onChange, agents }: FollowupFiltersBarProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => onChange({ ...filters, view: v.value })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                filters.view === v.value
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted/40",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search follow-ups..."
            value={filters.search ?? ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <select
          value={filters.agentId ?? ""}
          onChange={(e) =>
            onChange({ ...filters, agentId: e.target.value || undefined })
          }
          className="h-9 rounded-lg border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/80 px-3 text-sm "
        >
          <option value="">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-muted-foreground">Due from</label>
          <input
            type="date"
            value={filters.from ? filters.from.slice(0, 10) : ""}
            onChange={(e) =>
              onChange({
                ...filters,
                from: e.target.value
                  ? new Date(`${e.target.value}T00:00:00`).toISOString()
                  : undefined,
              })
            }
            className="h-9 rounded-lg border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/80 px-3 text-sm "
          />
          <label className="text-xs text-muted-foreground">to</label>
          <input
            type="date"
            value={filters.to ? filters.to.slice(0, 10) : ""}
            onChange={(e) =>
              onChange({
                ...filters,
                to: e.target.value
                  ? new Date(`${e.target.value}T23:59:59`).toISOString()
                  : undefined,
              })
            }
            className="h-9 rounded-lg border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/80 px-3 text-sm "
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ ...filters, priority: p })}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                (filters.priority ?? "all") === p
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground",
              )}
            >
              {p === "all" ? "All priorities" : formatFollowupPriority(p)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
