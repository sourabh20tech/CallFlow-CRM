"use client";

import { useState } from "react";
import { CalendarClock, Check, Loader2 } from "lucide-react";
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
import type { Lead } from "@/types/lead";
import { cn } from "@/lib/utils";

interface FollowUpLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  isAdmin: boolean;
  onFollowUpCreated: (lead: Lead) => void;
}

const FOLLOWUP_TYPES = [
  { value: "call", label: "Call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Other" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

function getDefaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getDefaultTime(): string {
  return "10:00";
}

export function FollowUpLeadModal({
  open,
  onOpenChange,
  lead,
  isAdmin,
  onFollowUpCreated,
}: FollowUpLeadModalProps) {
  const [date, setDate] = useState(getDefaultDate);
  const [time, setTime] = useState(getDefaultTime);
  const [type, setType] = useState("call");
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setDate(getDefaultDate());
    setTime(getDefaultTime());
    setType("call");
    setPriority("medium");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !date || !time || isSaving) return;

    setIsSaving(true);
    try {
      // Combine date + time into ISO string
      const dueAt = new Date(`${date}T${time}:00`).toISOString();
      const title = `${FOLLOWUP_TYPES.find((t) => t.value === type)?.label ?? "Follow-Up"} - ${lead.fullName}`;

      // 1. Create the follow-up
      const followupRes = await fetch(`/api/leads/${lead.id}/followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: notes.trim() || undefined,
          dueAt,
          priority,
        }),
      });

      if (!followupRes.ok) {
        const data = await followupRes.json();
        throw new Error(data.error ?? "Failed to create follow-up");
      }

      // 2. Update lead status to follow_up AND set next_follow_up_at
      const statusUrl = isAdmin
        ? `/api/leads/${lead.id}`
        : `/api/agent/leads/${lead.id}`;

      const statusRes = await fetch(statusUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "follow_up", nextFollowUpAt: dueAt }),
      });

      const updatedLead = await statusRes.json();
      if (!statusRes.ok) throw new Error(updatedLead.error ?? "Failed to update status");

      toast.success("Follow-up scheduled successfully");
      onFollowUpCreated(updatedLead as Lead);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule follow-up");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Schedule Follow-Up</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <form id="followup-lead-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {lead && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/20">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {lead.fullName}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {lead.email || lead.phone || "No contact"}
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Follow-Up Date" htmlFor="followupDate" required>
                <FormInput
                  id="followupDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </FormField>
              <FormField label="Time" htmlFor="followupTime" required>
                <FormInput
                  id="followupTime"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Follow-Up Type" htmlFor="followupType" required>
              <div className="flex flex-wrap gap-2">
                {FOLLOWUP_TYPES.map((ft) => (
                  <button
                    key={ft.value}
                    type="button"
                    onClick={() => setType(ft.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      type === ft.value
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {ft.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Priority" htmlFor="followupPriority" required>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      priority === p.value
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Notes" htmlFor="followupNotes">
              <textarea
                id="followupNotes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes about this follow-up..."
                className={cn(
                  "w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm",
                  "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                )}
              />
            </FormField>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="followup-lead-form"
            disabled={!date || !time || isSaving}
            className="gap-1.5 bg-amber-600 hover:bg-amber-700"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
            Save Follow-Up
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
