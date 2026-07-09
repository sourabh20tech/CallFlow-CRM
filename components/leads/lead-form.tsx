"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/design-system/form-field";
import { FormInput } from "@/components/design-system/form-input";
import { AssignAgentSelect } from "@/components/leads/assign-agent-select";
import { ManageSourcesModal } from "@/components/leads/manage-sources-modal";
import { ManageStatusesModal } from "@/components/leads/manage-statuses-modal";
import { LEAD_STATUS_OPTIONS } from "@/lib/leads/constants";
import { useLeadSources } from "@/hooks/use-lead-sources";
import { useLeadStatuses } from "@/hooks/use-lead-statuses";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { leadFormSchema, type LeadFormValues } from "@/utils/validators";
import type { Lead, LeadRosterAgent } from "@/types/lead";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-[hsl(var(--ds-glass-border))]",
  "bg-[hsl(var(--ds-glass-bg))]/80 px-3 py-2 text-sm ",
  "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
);

function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function leadToDefaults(lead?: Lead): LeadFormValues {
  if (!lead) {
    return {
      fullName: "",
      email: "",
      phone: "",
      company: "",
      tier: "standard",
      status: "new",
      source: "",
      assignedAgentId: "",
      nextFollowUpAt: "",
    };
  }
  return {
    fullName: lead.fullName,
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    company: lead.company ?? "",
    tier: lead.force,
    status: lead.status,
    source: lead.source ?? "",
    assignedAgentId: lead.assignedAgentId ?? "",
    nextFollowUpAt: toDatetimeLocal(lead.nextFollowUpAt),
  };
}

interface LeadFormProps {
  mode: "create" | "edit";
  agents: LeadRosterAgent[];
  initialLead?: Lead;
  onSubmit: (values: LeadFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  /** When set, actions render outside the form (e.g. modal footer) */
  formId?: string;
  hideActions?: boolean;
}

interface LeadFormActionsProps {
  mode: "create" | "edit";
  formId: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function LeadFormActions({
  mode,
  formId,
  onCancel,
  isSubmitting,
}: LeadFormActionsProps) {
  return (
    <>
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      )}
      <Button type="submit" form={formId} disabled={isSubmitting} className="gap-1.5">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "create" ? "Create lead" : "Save changes"}
      </Button>
    </>
  );
}

export function LeadForm({
  mode,
  agents,
  initialLead,
  onSubmit,
  onCancel,
  isSubmitting,
  formId = "lead-form",
  hideActions = false,
}: LeadFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: leadToDefaults(initialLead),
  });

  const assignedAgentId = watch("assignedAgentId") ?? "";

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((values) => onSubmit(values))}
      className="space-y-4"
    >
      <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message} required>
        <FormInput id="fullName" {...register("fullName")} placeholder="Jane Smith" />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <FormInput
            id="email"
            type="email"
            {...register("email")}
            placeholder="jane@company.com"
          />
        </FormField>
        <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
          <FormInput id="phone" {...register("phone")} placeholder="+1 555 0100" />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Source" htmlFor="tier">
          <SourceSelect register={register} />
        </FormField>
        <FormField label="Status" htmlFor="status">
          <StatusSelect register={register} />
        </FormField>
      </div>

      <FormField label="Assigned agent" htmlFor="assignedAgentId">
        <AssignAgentSelect
          agents={agents}
          value={assignedAgentId}
          onChange={(id) => setValue("assignedAgentId", id)}
        />
      </FormField>

      {!hideActions && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-border/40 pt-4">
          <LeadFormActions
            mode={mode}
            formId={formId}
            onCancel={onCancel}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </form>
  );
}

/** Source dropdown with "+ Add New Source" and "Manage Sources" for admin */
function SourceSelect({ register }: { register: any }) {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const { sources, refresh } = useLeadSources();
  const [manageOpen, setManageOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newLabel.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/lead-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Source "${newLabel.trim()}" created`);
      setNewLabel("");
      setShowCreate(false);
      void refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <select id="tier" className={selectClassName} {...register("tier")}>
        {sources.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {isAdmin && (
        <div className="mt-1.5 flex items-center gap-3">
          {!showCreate && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus className="h-3 w-3" />
              Add New Source
            </button>
          )}
          <button
            type="button"
            onClick={() => setManageOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="h-3 w-3" />
            Manage Sources
          </button>
        </div>
      )}
      {isAdmin && showCreate && (
        <div className="mt-2 flex items-center gap-1.5">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Source name..."
            maxLength={30}
            className="h-7 flex-1 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); void handleCreate(); }
              if (e.key === "Escape") { setShowCreate(false); setNewLabel(""); }
            }}
          />
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={!newLabel.trim() || creating}
            className="h-7 rounded bg-primary px-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {creating ? "..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => { setShowCreate(false); setNewLabel(""); }}
            className="h-7 px-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}
      {isAdmin && (
        <ManageSourcesModal
          open={manageOpen}
          onOpenChange={setManageOpen}
          sources={sources}
          onSourcesChanged={() => void refresh()}
        />
      )}
    </div>
  );
}

/** Status dropdown with "+ Add New Status" and "Manage Statuses" for admin */
function StatusSelect({ register }: { register: any }) {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const { statuses, refresh } = useLeadStatuses();
  const [manageOpen, setManageOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);

  // Merge custom statuses with fallback system statuses
  const options = statuses.length > 0
    ? statuses.map((s) => ({ value: s.value, label: s.label }))
    : LEAD_STATUS_OPTIONS;

  const handleCreate = async () => {
    if (!newLabel.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/lead-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim(), color: "#8b5cf6" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Status "${newLabel.trim()}" created`);
      setNewLabel("");
      setShowCreate(false);
      void refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <select id="status" className={selectClassName} {...register("status")}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {isAdmin && (
        <div className="mt-1.5 flex items-center gap-3">
          {!showCreate && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus className="h-3 w-3" />
              Add New Status
            </button>
          )}
          <button
            type="button"
            onClick={() => setManageOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="h-3 w-3" />
            Manage Statuses
          </button>
        </div>
      )}
      {isAdmin && showCreate && (
        <div className="mt-2 flex items-center gap-1.5">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Status name..."
            maxLength={30}
            className="h-7 flex-1 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); void handleCreate(); }
              if (e.key === "Escape") { setShowCreate(false); setNewLabel(""); }
            }}
          />
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={!newLabel.trim() || creating}
            className="h-7 rounded bg-primary px-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {creating ? "..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => { setShowCreate(false); setNewLabel(""); }}
            className="h-7 px-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}
      {isAdmin && (
        <ManageStatusesModal
          open={manageOpen}
          onOpenChange={setManageOpen}
          statuses={statuses.map((s, i) => ({
            id: s.id,
            label: s.label,
            value: s.value,
            color: s.color ?? "#8b5cf6",
            sortOrder: i,
            isSystem: s.isSystem ?? false,
            createdAt: "",
          }))}
          onStatusesChanged={() => void refresh()}
        />
      )}
    </div>
  );
}
