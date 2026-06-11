"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Plus, RefreshCw, Upload, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/design-system/page-header";
import { DataTableCard } from "@/components/design-system/data-table-card";
import { SkeletonTable } from "@/components/design-system/skeletons";
import { AddLeadModal } from "@/components/leads/add-lead-modal";
import { BulkUploadModal } from "@/components/leads/bulk-upload-modal";
import { BulkActionsBar } from "@/components/leads/bulk-actions-bar";
import { LeadStatsRow } from "@/components/leads/lead-stats-row";
import { EditLeadModal } from "@/components/leads/edit-lead-modal";
import { LeadDetailSection } from "@/components/leads/lead-detail-section";
import { LeadFiltersBar } from "@/components/leads/lead-filters";
import { LeadTable } from "@/components/leads/lead-table";
import type { LeadDetailFocus } from "@/components/leads/lead-row-actions";
import { LeadsEmptyState } from "@/components/leads/leads-empty-state";
import { DeleteLeadModal } from "@/components/leads/delete-lead-modal";
import { TablePagination } from "@/components/leads/table-pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/db/pagination";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { pageSection } from "@/lib/design-system/styles";
import type { Lead, LeadListFilters, LeadRosterAgent } from "@/types/lead";
import type { LeadFormValues } from "@/utils/validators";

const DEFAULT_FILTERS: LeadListFilters = {
  status: "all",
  force: "all",
  assignedAgentId: "all",
  search: "",
};

function filtersToParams(filters: LeadListFilters, page: number, pageSize: number): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.force && filters.force !== "all") params.set("force", filters.force);
  if (filters.assignedAgentId && filters.assignedAgentId !== "all") {
    params.set("assignedAgentId", filters.assignedAgentId);
  }
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  return params.toString();
}

function formToPayload(values: LeadFormValues) {
  return {
    fullName: values.fullName,
    email: values.email?.trim() || undefined,
    phone: values.phone?.trim() || undefined,
    company: values.company?.trim() || undefined,
    force: values.tier,
    status: values.status,
    source: values.source?.trim() || undefined,
    assignedAgentId: values.assignedAgentId || null,
    nextFollowUpAt: values.nextFollowUpAt
      ? new Date(values.nextFollowUpAt).toISOString()
      : null,
  };
}

interface LeadsManagementProps {
  initialLeads?: Lead[];
  initialAgents?: LeadRosterAgent[];
  initialTotal?: number;
  initialTotalPages?: number;
}

export function LeadsManagement({
  initialLeads,
  initialAgents,
  initialTotal,
  initialTotalPages,
}: LeadsManagementProps = {}) {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const canManage = isAdmin;
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";

  const hasServerData = Boolean(initialLeads?.length);
  const [leads, setLeads] = useState<Lead[]>(initialLeads ?? []);
  const [agents, setAgents] = useState<LeadRosterAgent[]>(initialAgents ?? []);
  const [filters, setFilters] = useState<LeadListFilters>({
    ...DEFAULT_FILTERS,
    search: initialSearch,
  });
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [isLoading, setIsLoading] = useState(!hasServerData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailFocus, setDetailFocus] = useState<LeadDetailFocus>("overview");
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [totalPages, setTotalPages] = useState(initialTotalPages ?? 1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(filters.search ?? "");
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.force, filters.assignedAgentId]);

  const queryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const loadLeads = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const qs = filtersToParams(queryFilters, page, pageSize);
      const res = await fetch(`/api/leads?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load leads");
      setLeads(data.leads as Lead[]);
      setAgents(data.agents as LeadRosterAgent[]);
      setTotal((data.total as number) ?? 0);
      setTotalPages((data.totalPages as number) ?? 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load leads");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [queryFilters, page, pageSize]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      (filters.status && filters.status !== "all") ||
      (filters.force && filters.force !== "all") ||
      (filters.assignedAgentId && filters.assignedAgentId !== "all"),
  );

  // Compute lead stats from current data
  const leadStats = useMemo(() => ({
    total,
    newLeads: leads.filter((l) => l.status === "new").length,
    followUpDue: leads.filter((l) => l.nextFollowUpAt && new Date(l.nextFollowUpAt) <= new Date()).length,
    converted: leads.filter((l) => l.status === "converted").length,
    unassigned: leads.filter((l) => !l.assignedAgentId).length,
  }), [leads, total]);

  // Selection handlers
  const toggleLeadSelection = useCallback((leadId: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    setSelectedLeadIds((prev) =>
      prev.size === leads.length ? new Set() : new Set(leads.map((l) => l.id)),
    );
  }, [leads]);

  const handleCreate = async (values: LeadFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(values)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create lead");
      toast.success("Lead created");
      await loadLeads(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (values: LeadFormValues) => {
    if (!editLead) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${editLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(values)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update lead");
      toast.success("Lead updated");
      setEditLead(null);
      if (detailLead?.id === editLead.id) {
        setDetailLead(data as Lead);
      }
      await loadLeads(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteLead || !canManage) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${deleteLead.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete lead");
      toast.success("Lead deleted");
      setDeleteLead(null);
      setDetailOpen(false);
      setDetailLead(null);
      await loadLeads(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDelete = (lead: Lead) => {
    if (!canManage) return;
    setDeleteLead(lead);
  };

  const handleAssign = async (leadId: string, agentId: string) => {
    if (!canManage) return;
    setAssigningId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedAgentId: agentId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Assignment failed");
      toast.success(agentId ? "Lead assigned" : "Lead unassigned");
      if (detailLead?.id === leadId) setDetailLead(data as Lead);
      await loadLeads(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Assignment failed");
    } finally {
      setAssigningId(null);
    }
  };

  const handleExport = async () => {
    try {
      const qs = filtersToParams(queryFilters, 1, 500);
      const res = await fetch(`/api/leads/export${qs ? `?${qs}` : ""}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-export-${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  };

  const openDetail = (lead: Lead, focus: LeadDetailFocus = "overview") => {
    setDetailLead(lead);
    setDetailFocus(focus);
    setDetailOpen(true);
  };

  return (
    <div className={pageSection}>
      <PageHeader
        title="Lead Management"
        description="Manage prospects, assignments, follow-ups, and conversion pipeline"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))] px-3 py-2 text-sm text-muted-foreground sm:flex">
              <UserPlus className="h-4 w-4 text-primary" />
              {total} leads
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void loadLeads(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
            {canManage && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void handleExport()}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
            {canManage && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setBulkUploadOpen(true)}>
                <Upload className="h-4 w-4" />
                Bulk Upload
              </Button>
            )}
            {canManage && (
              <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Add lead
              </Button>
            )}
          </div>
        }
      />

      <LeadStatsRow {...leadStats} />

      {canManage && selectedLeadIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedLeadIds.size}
          selectedIds={Array.from(selectedLeadIds)}
          agents={agents}
          onComplete={() => void loadLeads(true)}
          onClearSelection={() => setSelectedLeadIds(new Set())}
        />
      )}

      <LeadFiltersBar
        filters={filters}
        agents={agents}
        isAdmin={isAdmin}
        onChange={setFilters}
        onClear={() => setFilters(DEFAULT_FILTERS)}
      />

      {isLoading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : leads.length === 0 ? (
        <LeadsEmptyState
          hasFilters={hasActiveFilters}
          canManage={canManage}
          onClearFilters={() => setFilters(DEFAULT_FILTERS)}
          onAddLead={() => setAddOpen(true)}
        />
      ) : (
        <DataTableCard title="All leads" description="Click a row to view details, notes, and follow-ups">
          <LeadTable
            leads={leads}
            agents={agents}
            isAdmin={isAdmin}
            onSelect={openDetail}
            onEdit={(lead) => setEditLead(lead)}
            onDelete={requestDelete}
            onAssign={(id, agentId) => void handleAssign(id, agentId)}
            onStatusChange={(updatedLead) => {
              setLeads((prev) =>
                prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)),
              );
              if (detailLead?.id === updatedLead.id) setDetailLead(updatedLead);
              void loadLeads(true);
            }}
            assigningId={assigningId}
            selectedIds={selectedLeadIds}
            onToggleSelect={canManage ? toggleLeadSelection : undefined}
            onToggleAll={canManage ? toggleAllSelection : undefined}
          />
          <TablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            className="mt-4"
          />
        </DataTableCard>
      )}

      {canManage && (
        <>
          <AddLeadModal
            open={addOpen}
            onOpenChange={setAddOpen}
            agents={agents}
            onSubmit={handleCreate}
            isSubmitting={isSubmitting}
          />
          <BulkUploadModal
            open={bulkUploadOpen}
            onOpenChange={setBulkUploadOpen}
            agents={agents}
            onComplete={() => void loadLeads(true)}
          />
          <EditLeadModal
            open={Boolean(editLead)}
            onOpenChange={(open) => !open && setEditLead(null)}
            lead={editLead}
            agents={agents}
            onSubmit={handleUpdate}
            isSubmitting={isSubmitting}
          />
        </>
      )}

      <DeleteLeadModal
        open={Boolean(deleteLead)}
        onOpenChange={(open) => !open && setDeleteLead(null)}
        lead={deleteLead}
        onConfirm={handleDeleteConfirm}
        isSubmitting={isSubmitting}
      />

      <LeadDetailSection
        lead={detailLead}
        agents={agents}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canManage={canManage}
        isAdmin={isAdmin}
        detailFocus={detailFocus}
        onFocusSection={setDetailFocus}
        onEdit={(lead) => {
          setEditLead(lead);
          setDetailOpen(false);
        }}
        onDelete={requestDelete}
        onAssign={(id, agentId) => void handleAssign(id, agentId)}
        onLeadUpdated={(updated) => {
          setDetailLead(updated);
          setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        }}
        assigning={assigningId === detailLead?.id}
      />
    </div>
  );
}
