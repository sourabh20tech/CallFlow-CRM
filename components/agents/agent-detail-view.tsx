"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AgentProfileCard } from "@/components/agents/agent-profile-card";
import { AgentPerformanceOverview } from "@/components/agents/agent-performance-overview";
import { AgentFundOverview } from "@/components/agents/agent-fund-overview";
import { AgentWorkTime } from "@/components/agents/agent-work-time";
import { AssignedLeadsSection } from "@/components/agents/assigned-leads-section";
import { EditAgentModal } from "@/components/agents/edit-agent-modal";
import { ResetPasswordModal } from "@/components/agents/reset-password-modal";
import { DeleteAgentModal } from "@/components/agents/delete-agent-modal";
import { Button } from "@/components/ui/button";
import type { Agent, AgentPerformanceSummary } from "@/types/agent";
import type { Lead } from "@/types/lead";
import type { ResetAgentPasswordFormValues, UpdateAgentFormValues } from "@/utils/validators";
import { pageSection } from "@/lib/design-system/styles";

interface AgentDetailViewProps {
  agent: Agent;
  leads: Lead[];
  performance: AgentPerformanceSummary;
}

export function AgentDetailView({ agent, leads, performance }: AgentDetailViewProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (values: UpdateAgentFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      toast.success("Agent updated");
      setEditOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (values: ResetAgentPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      toast.success("Password reset");
      setResetOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset failed");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toast.success("Agent deleted");
      router.push("/dashboard/agents");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={pageSection}>
      <AgentProfileCard agent={agent} onEdit={() => setEditOpen(true)} />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setResetOpen(true)}>
          <KeyRound className="h-4 w-4" />
          Reset password
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          Delete agent
        </Button>
      </div>

      <AgentPerformanceOverview agentName={agent.name} performance={performance} />
      <AgentFundOverview agentProfileId={agent.profileId ?? ""} />
      <AgentWorkTime agentProfileId={agent.profileId ?? ""} />
      <AssignedLeadsSection leads={leads} agentName={agent.name} />

      <EditAgentModal
        open={editOpen}
        onOpenChange={setEditOpen}
        agent={agent}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
      />

      <ResetPasswordModal
        open={resetOpen}
        onOpenChange={setResetOpen}
        agentName={agent.name}
        onSubmit={handleResetPassword}
        isSubmitting={isSubmitting}
      />

      <DeleteAgentModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        agent={agent}
        onConfirm={handleDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
