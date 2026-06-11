"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { FormField } from "@/components/design-system/form-field";
import { FormInput } from "@/components/design-system/form-input";
import { AssignAgentSelect } from "@/components/leads/assign-agent-select";
import { LEAD_STATUS_OPTIONS, LEAD_FORCE_OPTIONS } from "@/lib/leads/constants";
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

      <FormField label="Company" htmlFor="company">
        <FormInput id="company" {...register("company")} placeholder="Acme Inc." />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Force" htmlFor="tier">
          <select id="tier" className={selectClassName} {...register("tier")}>
            {LEAD_FORCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Status" htmlFor="status">
          <select id="status" className={selectClassName} {...register("status")}>
            {LEAD_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Source" htmlFor="source">
        <FormInput id="source" {...register("source")} placeholder="Website, referral…" />
      </FormField>

      <FormField label="Assigned agent" htmlFor="assignedAgentId">
        <AssignAgentSelect
          agents={agents}
          value={assignedAgentId}
          onChange={(id) => setValue("assignedAgentId", id)}
        />
      </FormField>

      <FormField label="Next follow-up" htmlFor="nextFollowUpAt">
        <FormInput
          id="nextFollowUpAt"
          type="datetime-local"
          {...register("nextFollowUpAt")}
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
