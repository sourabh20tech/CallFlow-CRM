"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/design-system/page-header";
import { DataTableCard } from "@/components/design-system/data-table-card";
import { SkeletonStatCard, SkeletonTable } from "@/components/design-system/skeletons";
import { AddAgentModal } from "@/components/agents/add-agent-modal";
import { AddAgentButton } from "@/components/agents/add-agent-button";
import { AgentsMobileFab } from "@/components/agents/agents-mobile-fab";
import { AgentsSetupBanner } from "@/components/agents/agents-setup-banner";
import { EditAgentModal } from "@/components/agents/edit-agent-modal";
import { ResetPasswordModal } from "@/components/agents/reset-password-modal";
import { DeleteAgentModal } from "@/components/agents/delete-agent-modal";
import { AgentFiltersBar, DEFAULT_AGENT_FILTERS, type AgentListFilters } from "@/components/agents/agent-filters";
import { AgentProfileCards } from "@/components/agents/agent-profile-cards";
import { AgentTable } from "@/components/agents/agent-table";
import { AgentsEmptyState } from "@/components/agents/agents-empty-state";
import { Button } from "@/components/ui/button";
import type { Agent } from "@/types/agent";
import type {
  CreateAgentFormValues,
  ResetAgentPasswordFormValues,
  UpdateAgentFormValues,
} from "@/utils/validators";
import { pageSection } from "@/lib/design-system/styles";

interface AgentsManagementProps {
  initialAgents: Agent[];
}

function filterAgents(agents: Agent[], filters: AgentListFilters): Agent[] {
  const q = filters.search.trim().toLowerCase();
  return agents.filter((agent) => {
    if (filters.account === "active" && !agent.isActive) return false;
    if (filters.account === "inactive" && agent.isActive) return false;
    if (q) {
      const hay = `${agent.name} ${agent.email} ${agent.phone ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function AgentsManagement({ initialAgents }: AgentsManagementProps) {
  const router = useRouter();
  const [agents, setAgents] = useState(initialAgents);
  const [filters, setFilters] = useState<AgentListFilters>(DEFAULT_AGENT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);
  const [resetAgent, setResetAgent] = useState<Agent | null>(null);
  const [canCreateAgents, setCanCreateAgents] = useState(true);
  const [createBlockedMessage, setCreateBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/agents/capabilities");
        if (res.status === 401 || res.status === 403) {
          if (!cancelled) {
            setCanCreateAgents(false);
            setCreateBlockedMessage("Admin access required to create agents.");
          }
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as { canCreate: boolean; message: string | null };
        if (!cancelled) {
          setCanCreateAgents(data.canCreate);
          setCreateBlockedMessage(data.message);
        }
      } catch {
        /* non-fatal */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openAddAgent = useCallback(() => {
    if (!canCreateAgents && createBlockedMessage) {
      toast.error("Cannot create agents", { description: createBlockedMessage });
      return;
    }
    setAddOpen(true);
  }, [canCreateAgents, createBlockedMessage]);

  const filteredAgents = useMemo(() => filterAgents(agents, filters), [agents, filters]);

  const stats = useMemo(() => {
    const active = agents.filter((a) => a.isActive).length;
    const available = agents.filter((a) => a.status === "available" && a.isActive).length;
    const leads = agents.reduce((sum, a) => sum + (a.assignedLeadsCount ?? 0), 0);
    return { total: agents.length, active, available, leads };
  }, [agents]);

  const hasActiveFilters = Boolean(
    filters.search.trim() ||
      filters.account !== "all",
  );

  const refreshAgents = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load agents");
      }
      const data = (await res.json()) as Agent[];
      setAgents(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Refresh failed");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleCreate = async (values: CreateAgentFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create agent");
      toast.success("Agent account created", {
        description: `${values.fullName} can sign in at /login with the email and password you set.`,
        action: {
          label: "Open login",
          onClick: () => router.push("/login"),
        },
      });
      setAddOpen(false);
      await refreshAgents(true);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (values: UpdateAgentFormValues) => {
    if (!editAgent) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/agents/${editAgent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update agent");
      toast.success("Agent updated");
      setEditAgent(null);
      await refreshAgents(true);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAgent) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/agents/${deleteAgent.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to delete agent");
      toast.success("Agent deleted");
      setDeleteAgent(null);
      await refreshAgents(true);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (agent: Agent) => {
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !agent.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update status");
      toast.success(agent.isActive ? "Agent deactivated" : "Agent activated");
      await refreshAgents(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  const handleResetPassword = async (values: ResetAgentPasswordFormValues) => {
    if (!resetAgent) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/agents/${resetAgent.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to reset password");
      toast.success("Password reset", {
        description: `New credentials set for ${resetAgent.name}.`,
      });
      setResetAgent(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset failed");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableActions = useMemo(
    () => ({
      onEdit: setEditAgent,
      onDelete: setDeleteAgent,
      onResetPassword: setResetAgent,
      onToggleActive: (agent: Agent) => void handleToggleActive(agent),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className={pageSection}>
      <PageHeader
        title="Agent Management"
        description="Create agents, manage access, and monitor team performance"
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <AddAgentButton onClick={openAddAgent} className="w-full shrink-0 sm:w-auto" />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="hidden items-center gap-2 rounded-xl border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))] px-3 py-2 text-sm text-muted-foreground lg:flex">
                <Users className="h-4 w-4 text-primary" />
                {stats.active} active · {stats.available} available
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => void refreshAgents(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                Refresh
              </Button>
            </div>
          </div>
        }
      />

      {!canCreateAgents && createBlockedMessage && (
        <AgentsSetupBanner message={createBlockedMessage} />
      )}

      <div className="grid gap-[var(--ds-stack-gap)] sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <MiniStat label="Total agents" value={stats.total} />
            <MiniStat label="Active accounts" value={stats.active} />
            <MiniStat label="Available now" value={stats.available} />
            <MiniStat label="Assigned leads" value={stats.leads} />
          </>
        )}
      </div>

      {!isLoading && filteredAgents.length > 0 && (
        <AgentProfileCards agents={filteredAgents} />
      )}

      <AgentFiltersBar
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(DEFAULT_AGENT_FILTERS)}
      />

      {isLoading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filteredAgents.length === 0 ? (
        <AgentsEmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={() => setFilters(DEFAULT_AGENT_FILTERS)}
          onAddAgent={openAddAgent}
        />
      ) : (
        <DataTableCard
          title="Agent roster"
          description={`${filteredAgents.length} team member${filteredAgents.length === 1 ? "" : "s"}`}
          toolbar={<AddAgentButton onClick={openAddAgent} size="sm" />}
        >
          <AgentTable agents={filteredAgents} actions={tableActions} />
        </DataTableCard>
      )}

      <AgentsMobileFab onClick={openAddAgent} />

      <AddAgentModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />

      <EditAgentModal
        open={Boolean(editAgent)}
        onOpenChange={(open) => !open && setEditAgent(null)}
        agent={editAgent}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
      />

      <ResetPasswordModal
        open={Boolean(resetAgent)}
        onOpenChange={(open) => !open && setResetAgent(null)}
        agentName={resetAgent?.name}
        onSubmit={handleResetPassword}
        isSubmitting={isSubmitting}
      />

      <DeleteAgentModal
        open={Boolean(deleteAgent)}
        onOpenChange={(open) => !open && setDeleteAgent(null)}
        agent={deleteAgent}
        onConfirm={handleDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))] px-4 py-3 transition-colors duration-[var(--ds-duration-base)] hover:border-primary/25 hover:bg-[hsl(var(--ds-glass-bg-strong))]">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}
