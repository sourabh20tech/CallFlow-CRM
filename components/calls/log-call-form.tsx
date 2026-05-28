"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/design-system/form-field";
import { FormInput } from "@/components/design-system/form-input";
import { CALL_QUICK_STATUSES, formatCallStatus } from "@/lib/calls/constants";
import type { DialLead } from "@/lib/calls/dial-leads";
import type { CallAgentOption } from "@/components/calls/call-filters";
import { logCallSchema, type LogCallFormValues } from "@/utils/validators";
import { cn } from "@/lib/utils";

interface LogCallFormProps {
  leads: DialLead[];
  agents?: CallAgentOption[];
  isAdmin?: boolean;
  onSubmit: (values: LogCallFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function LogCallForm({
  leads,
  agents = [],
  isAdmin = false,
  onSubmit,
  onCancel,
  isSubmitting,
}: LogCallFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LogCallFormValues>({
    resolver: zodResolver(logCallSchema),
    defaultValues: {
      leadId: leads[0]?.id ?? "",
      direction: "outbound",
      status: "callback",
      durationSeconds: 0,
      summary: "",
      agentId: undefined,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Lead" htmlFor="leadId" error={errors.leadId?.message} required>
        <select
          id="leadId"
          className={cn(
            "flex h-10 w-full rounded-lg border border-[hsl(var(--ds-glass-border))]",
            "bg-[hsl(var(--ds-glass-bg))]/80 px-3 py-2 text-sm backdrop-blur-sm",
            "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          )}
          {...register("leadId")}
        >
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.name}
              {lead.company ? ` — ${lead.company}` : ""}
            </option>
          ))}
        </select>
      </FormField>

      {isAdmin && agents.length > 0 && (
        <FormField label="Agent" htmlFor="agentId" error={errors.agentId?.message}>
          <select
            id="agentId"
            className={cn(
              "flex h-10 w-full rounded-lg border border-input bg-background/80 px-3 py-2 text-sm",
            )}
            {...register("agentId", {
              setValueAs: (value) => (value === "" ? undefined : value),
            })}
          >
            <option value="">Current user / auto</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Direction" htmlFor="direction">
          <select
            id="direction"
            className={cn(
              "flex h-10 w-full rounded-lg border border-input bg-background/80 px-3 py-2 text-sm",
            )}
            {...register("direction")}
          >
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
          </select>
        </FormField>

        <FormField label="Status" htmlFor="status">
          <select
            id="status"
            className={cn(
              "flex h-10 w-full rounded-lg border border-input bg-background/80 px-3 py-2 text-sm",
            )}
            {...register("status")}
          >
            {CALL_QUICK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatCallStatus(s)}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField
        label="Duration (seconds)"
        htmlFor="durationSeconds"
        error={errors.durationSeconds?.message}
      >
        <FormInput
          id="durationSeconds"
          type="number"
          min={0}
          {...register("durationSeconds", { valueAsNumber: true })}
        />
      </FormField>

      <FormField label="Call summary" htmlFor="summary" error={errors.summary?.message}>
        <textarea
          id="summary"
          rows={3}
          className={cn(
            "flex w-full rounded-lg border border-input bg-background/80 px-3 py-2 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          placeholder="Brief notes about the conversation..."
          {...register("summary")}
        />
      </FormField>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="premium" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Log call
        </Button>
      </div>
    </form>
  );
}
