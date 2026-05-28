"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/design-system/form-field";
import { FormInput } from "@/components/design-system/form-input";
import type { Agent } from "@/types/agent";
import {
  createAgentSchema,
  updateAgentSchema,
  type CreateAgentFormValues,
  type UpdateAgentFormValues,
} from "@/utils/validators";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-[hsl(var(--ds-glass-border))]",
  "bg-[hsl(var(--ds-glass-bg))]/80 px-3 py-2 text-sm backdrop-blur-sm",
  "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
);

type AgentFormProps =
  | {
      mode: "create";
      defaultValues?: Partial<Agent>;
      onSubmit: (values: CreateAgentFormValues) => Promise<void>;
      onCancel?: () => void;
      isSubmitting?: boolean;
    }
  | {
      mode: "edit";
      defaultValues?: Partial<Agent>;
      onSubmit: (values: UpdateAgentFormValues) => Promise<void>;
      onCancel?: () => void;
      isSubmitting?: boolean;
    };

export function AgentForm(props: AgentFormProps) {
  const { mode, defaultValues, onCancel, isSubmitting = false } = props;
  const isCreate = mode === "create";

  const form = useForm<CreateAgentFormValues | UpdateAgentFormValues>({
    resolver: zodResolver(isCreate ? createAgentSchema : updateAgentSchema),
    defaultValues: isCreate
      ? {
          fullName: "",
          email: "",
          password: "",
          phone: "",
          isActive: true,
        }
      : {
          fullName: defaultValues?.name ?? "",
          email: defaultValues?.email ?? "",
          phone: defaultValues?.phone ?? "",
          isActive: defaultValues?.isActive ?? true,
        },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  const submitHandler = isCreate
    ? (values: CreateAgentFormValues | UpdateAgentFormValues) =>
        (props as Extract<AgentFormProps, { mode: "create" }>).onSubmit(
          values as CreateAgentFormValues,
        )
    : (values: CreateAgentFormValues | UpdateAgentFormValues) =>
        (props as Extract<AgentFormProps, { mode: "edit" }>).onSubmit(
          values as UpdateAgentFormValues,
        );

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <FormField label="Full Name" htmlFor="fullName" error={errors.fullName?.message} required>
        <FormInput id="fullName" placeholder="Alex Morgan" {...register("fullName")} />
      </FormField>

      <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
        <FormInput
          id="email"
          type="email"
          placeholder="agent@company.com"
          disabled={!isCreate}
          {...register("email")}
        />
      </FormField>

      {isCreate && (
        <FormField
          label="Password"
          htmlFor="password"
          error={"password" in errors ? errors.password?.message : undefined}
          required
          hint="Min 8 chars, uppercase letter and number"
        >
          <FormInput id="password" type="password" autoComplete="new-password" {...register("password")} />
        </FormField>
      )}

      <FormField
        label="Phone Number"
        htmlFor="phone"
        error={errors.phone?.message}
        required={isCreate}
      >
        <FormInput id="phone" type="tel" placeholder="+1 (555) 123-4567" {...register("phone")} />
      </FormField>

      <FormField
        label="Status"
        htmlFor="isActive"
        error={errors.isActive?.message}
        hint={
          isCreate
            ? "Inactive agents are created but cannot sign in until activated"
            : "Inactive agents cannot sign in or receive assignments"
        }
      >
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <select
              id="isActive"
              className={selectClassName}
              value={field.value ? "active" : "inactive"}
              onChange={(event) => field.onChange(event.target.value === "active")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          )}
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
          {isCreate ? "Create agent account" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
