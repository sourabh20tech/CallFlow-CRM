"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, List, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/design-system/page-header";
import { DataTableCard } from "@/components/design-system/data-table-card";
import { SkeletonStatCard, SkeletonTable } from "@/components/design-system/skeletons";
import { CallFiltersBar, type CallAgentOption } from "@/components/calls/call-filters";
import { CallStatsCards } from "@/components/calls/call-stats-cards";
import { CallHistorySection } from "@/components/calls/call-history-section";
import { CallLogsTable } from "@/components/calls/call-logs-table";
import { CallDetailPanel } from "@/components/calls/call-detail-panel";
import { QuickDialPanel } from "@/components/calls/quick-dial-panel";
import { LogCallModal } from "@/components/calls/log-call-modal";
import { CallsEmptyState } from "@/components/calls/calls-empty-state";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/design-system/modal";
import { TablePagination } from "@/components/leads/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import type { DialLead } from "@/lib/calls/dial-leads";
import type { Call, CallFilters, CallStats, CallStatus } from "@/types/call";
import type { LogCallFormValues } from "@/utils/validators";
import { DEFAULT_PAGE_SIZE } from "@/lib/db/pagination";
import { pageSection } from "@/lib/design-system/styles";
import { cn } from "@/lib/utils";

type ViewMode = "timeline" | "table";

interface CallsManagementProps {
  initialCalls: Call[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  initialStats: CallStats;
  dialLeads: DialLead[];
  initialLoadError?: string;
}

function filtersToParams(
  filters: CallFilters,
  page: number,
  pageSize: number,
): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.direction && filters.direction !== "all") {
    params.set("direction", filters.direction);
  }
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.agentId) params.set("agentId", filters.agentId);
  if (filters.leadId) params.set("leadId", filters.leadId);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  return params.toString();
}

export function CallsManagement({
  initialCalls,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialStats,
  dialLeads,
  initialLoadError,
}: CallsManagementProps) {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [calls, setCalls] = useState(initialCalls);
  const [stats, setStats] = useState(initialStats);
  const [agents, setAgents] = useState<CallAgentOption[]>([]);
  const [filters, setFilters] = useState<CallFilters>({
    status: "all",
    direction: "all",
    search: "",
  });
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const pageSize = DEFAULT_PAGE_SIZE;

  const [view, setView] = useState<ViewMode>("timeline");
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [editRequestSeq, setEditRequestSeq] = useState(0);
  const [editRequestCallId, setEditRequestCallId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editDirection, setEditDirection] = useState<Call["direction"]>("outbound");
  const [editDuration, setEditDuration] = useState("0");
  const [editSummary, setEditSummary] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialLoadError) {
      toast.error(initialLoadError);
    }
  }, [initialLoadError]);

  const hasActiveFilters = Boolean(
    filters.search?.trim() ||
      (filters.status && filters.status !== "all") ||
      (filters.direction && filters.direction !== "all") ||
      filters.agentId ||
      filters.leadId ||
      filters.dateFrom ||
      filters.dateTo,
  );

  const refreshCalls = useCallback(
    async (silent = false, pageOverride?: number) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      const targetPage = pageOverride ?? page;

      try {
        const qs = filtersToParams(filters, targetPage, pageSize);
        const res = await fetch(`/api/calls?${qs}`);
        const data = (await res.json()) as {
          calls?: Call[];
          stats?: CallStats;
          agents?: CallAgentOption[];
          total?: number;
          totalPages?: number;
          page?: number;
          error?: string;
        };

        if (!res.ok) throw new Error(data.error ?? "Failed to load calls");

        setCalls(data.calls ?? []);
        setStats(
          data.stats ?? {
            total: 0,
            connected: 0,
            callback: 0,
            interested: 0,
            noAnswer: 0,
          },
        );
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        if (data.page) setPage(data.page);
        if (data.agents) setAgents(data.agents);

        if (selectedCall) {
          const updated = (data.calls ?? []).find((c) => c.id === selectedCall.id);
          setSelectedCall(updated ?? null);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Refresh failed");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, page, pageSize],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      void refreshCalls(true, 1);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.status,
    filters.direction,
    filters.search,
    filters.agentId,
    filters.leadId,
    filters.dateFrom,
    filters.dateTo,
  ]);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    void refreshCalls(true, nextPage);
  };

  const handleStatusChange = async (callId: string, status: CallStatus) => {
    setUpdatingId(callId);
    try {
      const res = await fetch(`/api/calls/${callId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      toast.success("Status updated");
      await refreshCalls(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditCall = async (
    callId: string,
    input: { direction: Call["direction"]; durationSeconds: number; summary?: string },
  ) => {
    setUpdatingId(callId);
    try {
      const res = await fetch(`/api/calls/${callId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update call");
      toast.success("Call updated");
      await refreshCalls(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update call");
      throw error;
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenEdit = (call: Call) => {
    setSelectedCall(call);
    setEditRequestCallId(call.id);
    setEditRequestSeq((v) => v + 1);
    setEditDirection(call.direction);
    setEditDuration(String(call.duration ?? 0));
    setEditSummary(call.summary ?? "");
    setEditOpen(true);
  };

  const handleDeleteCall = async (call: Call) => {
    const ok = window.confirm(`Soft delete call for ${call.customerName}?`);
    if (!ok) return;

    setUpdatingId(call.id);
    try {
      const res = await fetch(`/api/calls/${call.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to delete call");
      }
      toast.success("Call moved to trash");
      if (selectedCall?.id === call.id) {
        setSelectedCall(null);
      }
      await refreshCalls(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete call");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogCall = async (values: LogCallFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        agentId: values.agentId || undefined,
      };
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to log call");
      toast.success("Call logged");
      setPage(1);
      await refreshCalls(true, 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log call");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayCalls = calls;

  const clearFilters = () => {
    setFilters({ status: "all", direction: "all", search: "" });
    setPage(1);
  };

  return (
    <div className={pageSection}>
      <PageHeader
        title="Call Management"
        description="One-click dialing, manual logs, notes, disposition updates, and full call history"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))] p-0.5">
              <ViewToggle
                active={view === "timeline"}
                onClick={() => setView("timeline")}
                icon={LayoutGrid}
                label="Timeline"
              />
              <ViewToggle
                active={view === "table"}
                onClick={() => setView("table")}
                icon={List}
                label="Logs"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void refreshCalls(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setLogOpen(true)}>
              <Plus className="h-4 w-4" />
              Log call
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
        <CallStatsCards stats={stats} />
      )}

      <CallFiltersBar
        filters={filters}
        onChange={setFilters}
        leads={dialLeads}
        agents={agents}
        isAdmin={isAdmin}
      />

      <div className="grid gap-[var(--ds-stack-gap)] xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-[var(--ds-stack-gap)] lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
          {isLoading ? (
            <SkeletonTable rows={6} cols={5} />
          ) : displayCalls.length === 0 ? (
            <CallsEmptyState
              hasFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              onLogCall={() => setLogOpen(true)}
            />
          ) : view === "timeline" ? (
            <div className="space-y-4">
              <CallHistorySection
                calls={displayCalls}
                selectedId={selectedCall?.id}
                onSelect={setSelectedCall}
                onStatusChange={handleStatusChange}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteCall}
                isAdmin={isAdmin}
                updatingId={updatingId ?? undefined}
                onLogCall={() => setLogOpen(true)}
              />
              <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            </div>
          ) : (
            <DataTableCard
              title="Call logs"
              description="Tabular view of all call records"
            >
              <CallLogsTable
                calls={displayCalls}
                selectedId={selectedCall?.id}
                onSelect={setSelectedCall}
                onStatusChange={handleStatusChange}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteCall}
                isAdmin={isAdmin}
                updatingId={updatingId ?? undefined}
              />
              <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                className="mt-4"
              />
            </DataTableCard>
          )}

          <CallDetailPanel
            call={selectedCall}
            onStatusChange={handleStatusChange}
            onEditCall={handleEditCall}
            onDeleteCall={async (callId) => {
              const call = calls.find((c) => c.id === callId);
              if (!call) return;
              await handleDeleteCall(call);
            }}
            editRequestSeq={editRequestSeq}
            editRequestCallId={editRequestCallId}
            onNoteAdded={() => void refreshCalls(true)}
            isUpdating={updatingId === selectedCall?.id}
          />
        </div>

        <QuickDialPanel leads={dialLeads} onCallInitiated={() => void refreshCalls(true)} />
      </div>

      <LogCallModal
        open={logOpen}
        onOpenChange={setLogOpen}
        leads={dialLeads}
        agents={agents}
        isAdmin={isAdmin}
        onSubmit={handleLogCall}
        isSubmitting={isSubmitting}
      />

      <Modal open={editOpen} onOpenChange={setEditOpen}>
        <ModalContent size="md">
          <ModalHeader>
            <ModalTitle>Edit call log</ModalTitle>
            <ModalDescription>
              Update direction, duration, and summary for this call.
            </ModalDescription>
          </ModalHeader>
          <ModalBody showClose={false}>
            {!selectedCall ? null : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-muted-foreground">
                    Direction
                    <select
                      value={editDirection}
                      onChange={(e) => setEditDirection(e.target.value as Call["direction"])}
                      className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    >
                      <option value="inbound">inbound</option>
                      <option value="outbound">outbound</option>
                    </select>
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Duration (seconds)
                    <Input
                      type="number"
                      min={0}
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      className="mt-1"
                    />
                  </label>
                </div>
                <label className="text-xs text-muted-foreground">
                  Summary
                  <textarea
                    rows={4}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/80 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!selectedCall) return;
                await handleEditCall(selectedCall.id, {
                  direction: editDirection,
                  durationSeconds: Math.max(0, Number(editDuration) || 0),
                  summary: editSummary.trim() || undefined,
                });
                setEditOpen(false);
              }}
              disabled={updatingId === selectedCall?.id}
            >
              Save changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof LayoutGrid;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
