"use client";

import { ScheduleFollowupForm } from "@/components/followups/schedule-followup-form";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/design-system/modal";
import type { DialLead } from "@/lib/calls/dial-leads";
import type { ScheduleFollowupFormValues } from "@/utils/validators";

interface ScheduleFollowupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: DialLead[];
  agents: { id: string; name: string }[];
  onSubmit: (values: ScheduleFollowupFormValues) => Promise<void>;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
  initialValues?: Partial<ScheduleFollowupFormValues>;
}

export function ScheduleFollowupModal({
  open,
  onOpenChange,
  leads,
  agents,
  onSubmit,
  isSubmitting,
  mode = "create",
  initialValues,
}: ScheduleFollowupModalProps) {
  const isEdit = mode === "edit";

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md">
        <ModalHeader>
          <ModalTitle>{isEdit ? "Edit follow-up" : "Schedule follow-up"}</ModalTitle>
          <ModalDescription>
            {isEdit
              ? "Update due date, priority, assignment, or details."
              : "Set date and time, priority, lead, and assigned agent for this task."}
          </ModalDescription>
        </ModalHeader>
        <ModalBody showClose={false}>
          <ScheduleFollowupForm
            key={isEdit ? initialValues?.leadId ?? "edit" : "create"}
            leads={leads}
            agents={agents}
            initialValues={initialValues}
            submitLabel={isEdit ? "Save changes" : "Schedule follow-up"}
            onSubmit={async (values) => {
              await onSubmit(values);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
