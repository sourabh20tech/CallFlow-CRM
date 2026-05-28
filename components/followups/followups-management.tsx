"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/design-system/page-header";
import { SkeletonStatCard } from "@/components/design-system/skeletons";
import { FollowupStatsCards } from "@/components/followups/followup-stats-cards";
import { FollowupFiltersBar } from "@/components/followups/followup-filters";
import { FollowupNotifications } from "@/components/followups/followup-notifications";
import { AgentFollowupTracker } from "@/components/followups/agent-followup-tracker";
import { FollowupCalendar } from "@/components/followups/followup-calendar";
import { PendingFollowupsSection } from "@/components/followups/pending-followups-section";
import { CompletedFollowupsSection } from "@/components/followups/completed-followups-section";
import { ScheduleFollowupModal } from "@/components/followups/schedule-followup-modal";
import { Button } from "@/components/ui/button";
import type { DialLead } from "@/lib/calls/dial-leads";
import { ACTIVE_STATUSES } from "@/lib/followups/constants";
import type {
  AgentFollowupSummary,
  Followup,
  FollowupFilters,
  FollowupStats,
  FollowupStatus,
} from "@/types/followup";
import type { ScheduleFollowupFormValues } from "@/utils/validators";
import { pageSection } from "@/lib/design-system/styles";

interface RemindersPayload {
  overdue: Followup[];
  dueToday: Followup[];
  upcoming: Followup[];
}

interface FollowupsManagementProps {
  initialFollowups: Followup[];
  initialStats: FollowupStats;
  initialReminders: RemindersPayload;
  initialAgents: AgentFollowupSummary[];
  dialLeads: DialLead[];
  rosterAgents: { id: string; name: string }[];
  initialLoadError?: string;
}

function isPendingFollowup(f: Followup): boolean {
  return ACTIVE_STATUSES.includes(f.status);
}

function isCompletedFollowup(f: Followup): boolean {
  return f.status === "completed" || f.status === "cancelled";
}

export function FollowupsManagement({
  initialFollowups,
  initialStats,
  initialReminders,
  initialAgents,
  dialLeads,
  rosterAgents,
  initialLoadError,
}: FollowupsManagementProps) {
  const [followups, setFollowups] = useState(initialFollowups);
  const [stats, setStats] = useState(initialStats);
  const [reminders, setReminders] = useState(initialReminders);
  const [agentSummaries, setAgentSummaries] = useState(initialAgents);
  const [filters, setFilters] = useState<FollowupFilters>({
    view: "pending",
    priority: "all",
    search: "",
  });
  const [selected, setSelected] = useState<Followup | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editFollowup, setEditFollowup] = useState<Followup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialLoadError) {
      toast.error(initialLoadError);
    }
  }, [initialLoadError]);

  const hasActiveFilters = Boolean(
    filters.search?.trim() ||
      filters.agentId ||
      filters.from ||
      filters.to ||
      (filters.priority && filters.priority !== "all"),
  );

  const refresh = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      try {
        const params = new URLSearchParams();
        params.set("view", filters.view ?? "pending");
        if (filters.agentId) params.set("agentId", filters.agentId);
        if (filters.priority && filters.priority !== "all") {
          params.set("priority", filters.priority);
        }
        if (filters.search) params.set("search", filters.search);
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);

        const res = await fetch(`/api/followups?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = (await res.json()) as {
          followups: Followup[];
          stats: FollowupStats;
          reminders: RemindersPayload;
          agents: AgentFollowupSummary[];
        };
        setFollowups(data.followups);
        setStats(data.stats);
        setReminders(data.reminders);
        setAgentSummaries(data.agents);
        setSelected((prev) =>
          prev ? (data.followups.find((f) => f.id === prev.id) ?? null) : null,
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Refresh failed");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    const t = setTimeout(() => void refresh(true), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.view, filters.agentId, filters.priority, filters.search, filters.from, filters.to]);

  const pendingList = useMemo(() => {
    if (filters.view === "completed") return [];
    if (filters.view === "pending") return followups;
    return followups.filter(isPendingFollowup);
  }, [followups, filters.view]);

  const completedList = useMemo(() => {
    if (filters.view === "pending") return [];
    if (filters.view === "completed") return followups;
    return followups.filter(isCompletedFollowup);
  }, [followups, filters.view]);

  const handleSchedule = async (values: ScheduleFollowupFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule");
      toast.success("Follow-up scheduled");
      await refresh(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not schedule");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (values: ScheduleFollowupFormValues) => {
    if (!editFollowup) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/followups/${editFollowup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      toast.success("Follow-up updated");
      setEditFollowup(null);
      await refresh(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/followups/${id}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Marked complete");
      await refresh(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }, [refresh]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/followups/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete");
        toast.success("Follow-up deleted");
        setSelected((prev) => (prev?.id === id ? null : prev));
        await refresh(true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Delete failed");
      }
    },
    [refresh],
  );

  const handleStatusChange = useCallback(
    async (id: string, status: FollowupStatus) => {
      try {
        const res = await fetch(`/api/followups/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        await refresh(true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Update failed");
      }
    },
    [refresh],
  );

  const clearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      priority: "all",
      search: "",
      agentId: undefined,
      from: undefined,
      to: undefined,
    }));
  };

  const showPending = filters.view === "pending" || filters.view === "all";
  const showCompleted = filters.view === "completed" || filters.view === "all";

  return (
    <div className={pageSection}>
      <PageHeader
        title="Follow-Up Management"
        description="Schedule callbacks, track pending tasks, and review completed follow-ups"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void refresh(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
            {selected && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditFollowup(selected)}
              >
                Edit selected
              </Button>
            )}
            <Button size="sm" className="gap-1.5" onClick={() => setScheduleOpen(true)}>
              <Plus className="h-4 w-4" />
              Schedule
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      ) : (
        <FollowupStatsCards stats={stats} />
      )}

      <div className="grid gap-[var(--ds-stack-gap)] xl:grid-cols-[1fr_300px]">
        <div className="space-y-[var(--ds-stack-gap)]">
          <FollowupFiltersBar
            filters={filters}
            onChange={setFilters}
            agents={rosterAgents}
          />
          <AgentFollowupTracker
            agents={agentSummaries}
            selectedAgentId={filters.agentId}
            onSelectAgent={(agentId) => setFilters({ ...filters, agentId })}
          />

          {filters.view === "calendar" ? (
            <FollowupCalendar followups={followups} onSelectFollowup={setSelected} />
          ) : (
            <div className="space-y-[var(--ds-stack-gap)]">
              {showPending && (
                <PendingFollowupsSection
                  followups={pendingList}
                  selectedId={selected?.id}
                  onSelect={setSelected}
                  onComplete={(id) => void handleComplete(id)}
                  onDelete={(id) => void handleDelete(id)}
                  onStatusChange={(id, status) => void handleStatusChange(id, status)}
                  hasFilters={hasActiveFilters}
                  onClearFilters={clearFilters}
                  onSchedule={() => setScheduleOpen(true)}
                />
              )}
              {showCompleted && (
                <CompletedFollowupsSection
                  followups={completedList}
                  selectedId={selected?.id}
                  onSelect={setSelected}
                  onComplete={(id) => void handleComplete(id)}
                  onDelete={(id) => void handleDelete(id)}
                  onStatusChange={(id, status) => void handleStatusChange(id, status)}
                  hasFilters={hasActiveFilters}
                  onClearFilters={clearFilters}
                />
              )}
            </div>
          )}
        </div>

        <FollowupNotifications
          overdue={reminders.overdue}
          dueToday={reminders.dueToday}
          upcoming={reminders.upcoming}
          onSelect={(f) => {
            setSelected(f);
            if (filters.view === "calendar") {
              setFilters((prev) => ({ ...prev, view: "pending" }));
            }
          }}
        />
      </div>

      <ScheduleFollowupModal
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        leads={dialLeads}
        agents={rosterAgents}
        onSubmit={handleSchedule}
        isSubmitting={isSubmitting}
        mode="create"
      />

      <ScheduleFollowupModal
        open={Boolean(editFollowup)}
        onOpenChange={(open) => {
          if (!open) setEditFollowup(null);
        }}
        leads={dialLeads}
        agents={rosterAgents}
        mode="edit"
        initialValues={
          editFollowup
            ? {
                leadId: editFollowup.leadId,
                title: editFollowup.title,
                description: editFollowup.description,
                dueAt: editFollowup.dueAt,
                assignedAgentId: editFollowup.assignedAgentId,
                priority: editFollowup.priority,
              }
            : undefined
        }
        onSubmit={handleEdit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
