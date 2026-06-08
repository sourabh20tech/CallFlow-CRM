"use client";

import { useState } from "react";
import { Loader2, Trash2, UserCheck, Activity } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LEAD_STATUS_OPTIONS } from "@/lib/leads/constants";
import type { LeadRosterAgent, LeadStatus } from "@/types/lead";
import { cn } from "@/lib/utils";

interface BulkActionsBarProps {
  selectedCount: number;
  selectedIds: string[];
  agents: LeadRosterAgent[];
  onComplete: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  selectedIds,
  agents,
  onComplete,
  onClearSelection,
}: BulkActionsBarProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const executeBulkAction = async (action: string, extra: Record<string, unknown> = {}) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/leads/bulk-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, leadIds: selectedIds, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      toast.success(`${data.success} of ${data.total} leads updated`);
      onClearSelection();
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk action failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssign = (agentId: string) => {
    void executeBulkAction("assign", { agentId: agentId || null });
  };

  const handleStatus = (status: LeadStatus) => {
    void executeBulkAction("status", { status });
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete ${selectedCount} leads? This cannot be undone.`)) return;
    void executeBulkAction("delete");
  };

  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
      <span className="text-sm font-medium text-primary">
        {selectedCount} selected
      </span>

      <div className="ml-2 flex flex-wrap items-center gap-2">
        {/* Bulk Assign */}
        <select
          disabled={isProcessing}
          onChange={(e) => { if (e.target.value) handleAssign(e.target.value); e.target.value = ""; }}
          className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
          defaultValue=""
        >
          <option value="" disabled>Assign Agent...</option>
          <option value="">Unassign</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {/* Bulk Status */}
        <select
          disabled={isProcessing}
          onChange={(e) => { if (e.target.value) handleStatus(e.target.value as LeadStatus); e.target.value = ""; }}
          className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
          defaultValue=""
        >
          <option value="" disabled>Change Status...</option>
          {LEAD_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Bulk Delete */}
        <Button
          variant="destructive"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={handleDelete}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          Delete
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={onClearSelection}
          disabled={isProcessing}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
