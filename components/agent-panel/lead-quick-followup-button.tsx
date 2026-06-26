"use client";

import { useState } from "react";
import { CalendarPlus, Check, Loader2 } from "lucide-react";
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
import { FormField } from "@/components/design-system/form-field";
import { FormInput } from "@/components/design-system/form-input";
import { DatetimePickerField } from "@/components/followups/datetime-picker-field";
import { cn } from "@/lib/utils";

interface LeadQuickFollowupButtonProps {
  leadId: string;
  leadName: string;
  onFollowupCreated?: () => void;
  className?: string;
}

const PRIORITIES = ["low", "medium", "high"] as const;
type Priority = (typeof PRIORITIES)[number];

function defaultDueAt(): string {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LeadQuickFollowupButton({
  leadId,
  leadName,
  onFollowupCreated,
  className,
}: LeadQuickFollowupButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState(defaultDueAt);
  const [priority, setPriority] = useState<Priority>("medium");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDueAt(defaultDueAt());
    setPriority("medium");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          title: title.trim(),
          description: notes.trim() || undefined,
          dueAt: new Date(dueAt).toISOString(),
          priority,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create follow-up");

      toast.success(`Follow-up scheduled for "${leadName}"`);
      setOpen(false);
      resetForm();
      onFollowupCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create follow-up");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={cn("gap-1", className)}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title={`Schedule follow-up for ${leadName}`}
      >
        <CalendarPlus className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Follow-Up</span>
      </Button>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>Schedule Follow-Up</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <form id="quick-followup-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {/* Lead (read-only) */}
              <FormField label="Lead" htmlFor="qf-lead">
                <div className="flex h-10 items-center rounded-lg border border-border/60 bg-muted/30 px-3 text-sm font-medium">
                  {leadName}
                </div>
              </FormField>

              {/* Title */}
              <FormField label="Title" htmlFor="qf-title" required>
                <FormInput
                  id="qf-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Callback, Send proposal, etc."
                  maxLength={100}
                />
              </FormField>

              {/* Date & Time */}
              <DatetimePickerField
                id="qf-due"
                label="Due Date & Time"
                value={dueAt}
                onChange={setDueAt}
                required
                min={defaultDueAt()}
              />

              {/* Priority */}
              <FormField label="Priority" htmlFor="qf-priority">
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                        priority === p
                          ? p === "high"
                            ? "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                            : p === "medium"
                              ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              : "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                          : "border-border bg-background text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </FormField>

              {/* Notes */}
              <FormField label="Notes" htmlFor="qf-notes">
                <textarea
                  id="qf-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional details..."
                  className={cn(
                    "flex w-full resize-none rounded-lg border border-border",
                    "bg-background px-3 py-2 text-sm",
                    "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  )}
                />
              </FormField>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="quick-followup-form"
              disabled={!title.trim() || isSaving}
              className="gap-1.5"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Schedule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
