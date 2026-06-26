"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/design-system/modal";
import { LEAD_STATUS_OPTIONS } from "@/lib/leads/constants";
import type { LeadRosterAgent, LeadStatus } from "@/types/lead";

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      return data;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssign = (agentId: string) => {
    void (async () => {
      const data = await executeBulkAction("assign", { agentId: agentId || null });
      if (data) {
        toast.success(`${data.success} of ${data.total} leads updated`);
        onClearSelection();
        onComplete();
      }
    })();
  };

  const handleStatus = (status: LeadStatus) => {
    void (async () => {
      const data = await executeBulkAction("status", { status });
      if (data) {
        toast.success(`${data.success} of ${data.total} leads updated`);
        onClearSelection();
        onComplete();
      }
    })();
  };

  const handleDeleteConfirm = async () => {
    setDeleteError(null);
    setIsProcessing(true);
    try {
      const res = await fetch("/api/leads/bulk-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", leadIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");

      setDeleteModalOpen(false);
      toast.success(`${selectedCount} lead${selectedCount !== 1 ? "s" : ""} deleted successfully.`);
      onClearSelection();
      onComplete();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Delete failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
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
            onClick={() => { setDeleteError(null); setDeleteModalOpen(true); }}
            disabled={isProcessing}
          >
            <Trash2 className="h-3 w-3" />
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

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onOpenChange={(open) => { if (!isProcessing) setDeleteModalOpen(open); }}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Selected Leads?
            </ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-muted-foreground">
              You are about to permanently delete{" "}
              <span className="font-semibold text-foreground">{selectedCount}</span>{" "}
              selected lead{selectedCount !== 1 ? "s" : ""}. This action cannot be undone.
            </p>
            {deleteError && (
              <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {deleteError}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteConfirm()}
              disabled={isProcessing}
              className="gap-1.5"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Leads
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
