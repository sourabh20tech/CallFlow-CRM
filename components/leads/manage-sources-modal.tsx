"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/design-system/modal";
import type { LeadSource } from "@/hooks/use-lead-sources";

interface ManageSourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: LeadSource[];
  onSourcesChanged: () => void;
}

const SYSTEM_VALUES = ["standard", "premium"];

export function ManageSourcesModal({
  open,
  onOpenChange,
  sources,
  onSourcesChanged,
}: ManageSourcesModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) setTimeout(() => editInputRef.current?.focus(), 50);
  }, [editingId]);

  useEffect(() => {
    if (showCreate) setTimeout(() => createInputRef.current?.focus(), 50);
  }, [showCreate]);

  const handleEdit = (source: LeadSource) => {
    setEditingId(source.id);
    setEditLabel(source.label);
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = async () => {
    if (!editLabel.trim() || !editingId || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/lead-sources/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      toast.success(`Source renamed to "${editLabel.trim()}"`);
      setEditingId(null);
      setEditLabel("");
      onSourcesChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/lead-sources/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toast.success("Source deleted");
      setConfirmDeleteId(null);
      onSourcesChanged();
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
      const res = await fetch("/api/lead-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      toast.success(`Source "${newLabel.trim()}" created`);
      setNewLabel("");
      setShowCreate(false);
      onSourcesChanged();
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
          <ModalTitle>Manage Sources</ModalTitle>
        </ModalHeader>

        <div className="space-y-1.5 max-h-[320px] overflow-y-auto px-1">
          {sources.map((source) => {
            const isSystem = source.isSystem || SYSTEM_VALUES.includes(source.value);
            const isEditing = editingId === source.id;
            const isConfirmingDelete = confirmDeleteId === source.id;

            return (
              <div
                key={source.id}
                className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2"
              >
                {isEditing ? (
                  <div className="flex flex-1 items-center gap-1.5">
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
                ) : isConfirmingDelete ? (
                  <div className="flex flex-1 items-center gap-2">
                    <span className="flex-1 text-sm text-destructive">Delete &ldquo;{source.label}&rdquo;?</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-2 text-xs"
                      disabled={deletingId === source.id}
                      onClick={() => void handleDelete(source.id)}
                    >
                      {deletingId === source.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete"}
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
                    <span className="flex-1 text-sm font-medium">{source.label}</span>
                    {isSystem && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        System
                      </span>
                    )}
                    {!isSystem && (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(source)}
                          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Edit source"
                          aria-label={`Edit ${source.label}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setConfirmDeleteId(source.id); setEditingId(null); }}
                          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Delete source"
                          aria-label={`Delete ${source.label}`}
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

        {/* Add New Source */}
        <div className="pt-2 border-t border-border/40">
          {showCreate ? (
            <div className="flex items-center gap-1.5">
              <input
                ref={createInputRef}
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="New source name..."
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
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add New Source
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
