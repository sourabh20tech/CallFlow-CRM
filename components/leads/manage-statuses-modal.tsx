"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/design-system/modal";
import type { LeadStatusConfig } from "@/types/lead-status-config";
import { cn } from "@/lib/utils";

interface ManageStatusesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statuses: LeadStatusConfig[];
  onStatusesChanged: () => void;
}

const PRESET_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6b7280", "#ec4899", "#14b8a6", "#f97316", "#6366f1"];

export function ManageStatusesModal({
  open,
  onOpenChange,
  statuses,
  onStatusesChanged,
}: ManageStatusesModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#8b5cf6");
  const [isCreating, setIsCreating] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) setTimeout(() => editInputRef.current?.focus(), 50);
  }, [editingId]);

  useEffect(() => {
    if (showCreate) setTimeout(() => createInputRef.current?.focus(), 50);
  }, [showCreate]);

  const handleEdit = (status: LeadStatusConfig) => {
    setEditingId(status.id);
    setEditLabel(status.label);
    setEditColor(status.color);
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = async () => {
    if (!editLabel.trim() || !editingId || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/lead-statuses/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel.trim(), color: editColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      toast.success(`Status renamed to "${editLabel.trim()}"`);
      setEditingId(null);
      setEditLabel("");
      onStatusesChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/lead-statuses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toast.success("Status deleted");
      setConfirmDeleteId(null);
      onStatusesChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async () => {
    if (!newLabel.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/lead-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim(), color: newColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      toast.success(`Status "${newLabel.trim()}" created`);
      setNewLabel("");
      setNewColor("#8b5cf6");
      setShowCreate(false);
      onStatusesChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Manage Statuses</ModalTitle>
        </ModalHeader>

        <div className="space-y-1.5 max-h-[360px] overflow-y-auto px-1">
          {statuses.map((status) => {
            const isEditing = editingId === status.id;
            const isConfirmingDelete = confirmDeleteId === status.id;

            return (
              <div
                key={status.id}
                className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2"
              >
                {isEditing ? (
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        maxLength={30}
                        className="h-7 flex-1 rounded border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleSaveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => void handleSaveEdit()}
                        disabled={!editLabel.trim() || isSaving}
                        className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      {PRESET_COLORS.slice(0, 8).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={cn(
                            "h-4 w-4 rounded-full border-2 transition-transform",
                            editColor === c ? "border-foreground scale-110" : "border-transparent",
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                ) : isConfirmingDelete ? (
                  <div className="flex flex-1 items-center gap-2">
                    <span className="flex-1 text-sm text-destructive">Delete &ldquo;{status.label}&rdquo;?</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-2 text-xs"
                      disabled={deletingId === status.id}
                      onClick={() => void handleDelete(status.id)}
                    >
                      {deletingId === status.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="flex-1 text-sm font-medium">{status.label}</span>
                    {status.isSystem ? (
                      <span className="flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        <Lock className="h-2.5 w-2.5" />
                        System
                      </span>
                    ) : (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(status)}
                          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Edit status"
                          aria-label={`Edit ${status.label}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setConfirmDeleteId(status.id); setEditingId(null); }}
                          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Delete status"
                          aria-label={`Delete ${status.label}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Status */}
        <div className="pt-2 border-t border-border/40">
          {showCreate ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <input
                  ref={createInputRef}
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="New status name..."
                  maxLength={30}
                  className="h-8 flex-1 rounded border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCreate();
                    if (e.key === "Escape") { setShowCreate(false); setNewLabel(""); }
                  }}
                />
                <Button
                  size="sm"
                  className="h-8 gap-1"
                  disabled={!newLabel.trim() || isCreating}
                  onClick={() => void handleCreate()}
                >
                  {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={() => { setShowCreate(false); setNewLabel(""); }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "h-5 w-5 rounded-full border-2 transition-transform",
                      newColor === c ? "border-foreground scale-110" : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add New Status
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
