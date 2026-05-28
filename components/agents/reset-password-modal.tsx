"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/design-system/modal";
import { FormField } from "@/components/design-system/form-field";
import { FormInput } from "@/components/design-system/form-input";
import { Button } from "@/components/ui/button";
import { passwordSchema } from "@/utils/validators";
import type { ResetAgentPasswordFormValues } from "@/utils/validators";

const resetSchema = z.object({ password: passwordSchema });

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName?: string;
  onSubmit: (values: ResetAgentPasswordFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function ResetPasswordModal({
  open,
  onOpenChange,
  agentName,
  onSubmit,
  isSubmitting,
}: ResetPasswordModalProps) {
  const form = useForm<ResetAgentPasswordFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "" },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Reset password</ModalTitle>
          <ModalDescription>
            Set a new password for {agentName ?? "this agent"}. They will use it on next sign-in.
          </ModalDescription>
        </ModalHeader>
        <ModalBody showClose={false}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmit(values);
              form.reset();
              onOpenChange(false);
            })}
            className="space-y-4"
          >
            <FormField
              label="New password"
              htmlFor="newPassword"
              error={form.formState.errors.password?.message}
              required
              hint="Min 8 chars, uppercase letter and number"
            >
              <FormInput
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...form.register("password")}
              />
            </FormField>
            <ModalFooter className="border-0 px-0 pb-0">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-1.5">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Reset password
              </Button>
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
