"use client";

import { useCallback, useEffect, useState } from "react";
import { GripVertical, Loader2, Palette, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/design-system/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LeadStatusConfig } from "@/types/lead-status-config";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444",
  "#6b7280", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
];

export function LeadStatusesSettings() {
  const [statuses, setStatuses] = useState<LeadStatusConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#8b5cf6");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/lead-statuses");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setStatuses(data.statuses ?? []);
    } catch {
      toast.error("Could not load statuses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadStatuses(); }, [loadStatuses]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/lead-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim(), color: newColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Status "${newLabel}" created`);
      setNewLabel("");
      setNewColor("#8b5cf6");
      void loadStatuses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!window.confirm(`Delete status "${label}"? Existing leads with this status won't be affected.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/lead-statuses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Status deleted");
      void loadStatuses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleColorChange = async (id: string, color: string) => {
    try {
      const res = await fetch(`/api/lead-statuses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color }),
      });
      if (!res.ok) throw new Error("Update failed");
      setStatuses((prev) => prev.map((s) => s.id === id ? { ...s, color } : s));
    } catch {
      toast.error("Could not update color");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">Lead Statuses</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage the status options available for leads. System statuses cannot be deleted.
        </p>
      </div>

      {/* Existing statuses */}
      <GlassCard variant="default" padding="none">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ul className="divide-y divide-border/30">
            {statuses.map((status) => (
              <li key={status.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <span className="flex-1 text-sm font-medium">{status.label}</span>
                <span className="text-xs text-muted-foreground font-mono">{status.value}</span>
                {status.isSystem ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    System
                  </span>
                ) : (
                  <>
                    <input
                      type="color"
                      value={status.color}
                      onChange={(e) => void handleColorChange(status.id, e.target.value)}
                      className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
                      title="Change color"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => void handleDelete(status.id, status.label)}
                      disabled={deletingId === status.id}
                    >
                      {deletingId === status.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      {/* Add new status */}
      <GlassCard variant="default" padding="sm">
        <form onSubmit={(e) => void handleCreate(e)} className="space-y-3">
          <p className="text-sm font-medium">Add Custom Status</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">Label</label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Demo Scheduled"
                className="h-9"
                maxLength={30}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Color</label>
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-transform",
                      newColor === c ? "border-foreground scale-110" : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
                />
              </div>
            </div>
            <Button type="submit" size="sm" disabled={!newLabel.trim() || isCreating} className="gap-1.5">
              {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
