"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/design-system/form-field";
import { FormInput } from "@/components/design-system/form-input";
import { DatetimePickerField } from "@/components/followups/datetime-picker-field";
import { toDatetimeLocalValue } from "@/lib/followups/datetime";
import { formatFollowupPriority } from "@/lib/followups/constants";
import type { DialLead } from "@/lib/calls/dial-leads";
import type { FollowupPriority } from "@/types/followup";
import {
  scheduleFollowupSchema,
  type ScheduleFollowupFormValues,
} from "@/utils/validators";
import { cn } from "@/lib/utils";

interface ScheduleFollowupFormProps {
  leads: DialLead[];
  agents: { id: string; name: string }[];
  onSubmit: (values: ScheduleFollowupFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  /** When set, form pre-fills for editing an existing follow-up. */
  initialValues?: Partial<ScheduleFollowupFormValues>;
  submitLabel?: string;
}

const PRIORITIES: FollowupPriority[] = ["low", "medium", "high"];

export function ScheduleFollowupForm({
  leads,
  agents,
  onSubmit,
  onCancel,
  isSubmitting,
  initialValues,
  submitLabel = "Schedule follow-up",
}: ScheduleFollowupFormProps) {
  const defaultDue = initialValues?.dueAt
    ? toDatetimeLocalValue(initialValues.dueAt)
    : toDatetimeLocalValue(
        new Date(new Date().setHours(new Date().getHours() + 2)).toISOString(),
      );

  const [dueLocal, setDueLocal] = useState(defaultDue);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ScheduleFollowupFormValues>({
    resolver: zodResolver(scheduleFollowupSchema),
    defaultValues: {
      leadId: initialValues?.leadId ?? leads[0]?.id ?? "",
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      dueAt: initialValues?.dueAt ?? new Date(new Date().setHours(new Date().getHours() + 2)).toISOString(),
      assignedAgentId: initialValues?.assignedAgentId ?? agents[0]?.id,
      priority: initialValues?.priority ?? "medium",
    },
  });

  const submitHandler = handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      dueAt: new Date(dueLocal).toISOString(),
    });
  });

  return (
    <form onSubmit={submitHandler} className="space-y-4">
      <FormField label="Lead" htmlFor="leadId" error={errors.leadId?.message} required>
        <select
          id="leadId"
          className={cn(
            "flex h-10 w-full rounded-lg border border-[hsl(var(--ds-glass-border))]",
            "bg-[hsl(var(--ds-glass-bg))]/80 px-3 py-2 text-sm ",
            "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          )}
          {...register("leadId")}
        >
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Title" htmlFor="title" error={errors.title?.message} required>
        <FormInput id="title" placeholder="Callback — pricing discussion" {...register("title")} />
      </FormField>

      <FormField label="Description" htmlFor="description" error={errors.description?.message}>
        <textarea
          id="description"
          rows={3}
          className={cn(
            "flex w-full resize-none rounded-xl border border-[hsl(var(--ds-glass-border))]",
            "bg-[hsl(var(--ds-glass-bg))]/80 px-3 py-2 text-sm ",
            "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          )}
          placeholder="Optional details..."
          {...register("description")}
        />
      </FormField>

      <DatetimePickerField
        id="dueAt"
        value={dueLocal}
        onChange={(v) => {
          setDueLocal(v);
          setValue("dueAt", new Date(v).toISOString());
        }}
        error={errors.dueAt?.message}
        required
        min={toDatetimeLocalValue()}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Assign to" htmlFor="assignedAgentId">
          <select
            id="assignedAgentId"
            className="flex h-10 w-full rounded-lg border border-input bg-background/80 px-3 py-2 text-sm"
            {...register("assignedAgentId")}
          >
            <option value="">Auto (current agent)</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Priority" htmlFor="priority">
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <select
                id="priority"
                className="flex h-10 w-full rounded-lg border border-input bg-background/80 px-3 py-2 text-sm"
                value={field.value}
                onChange={field.onChange}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {formatFollowupPriority(p)}
                  </option>
                ))}
              </select>
            )}
          />
        </FormField>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="premium" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
