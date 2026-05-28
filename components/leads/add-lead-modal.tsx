"use client";

import { LeadForm, LeadFormActions } from "@/components/leads/lead-form";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/design-system/modal";
import type { LeadRosterAgent } from "@/types/lead";
import type { LeadFormValues } from "@/utils/validators";

interface AddLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: LeadRosterAgent[];
  onSubmit: (values: LeadFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddLeadModal({
  open,
  onOpenChange,
  agents,
  onSubmit,
  isSubmitting,
}: AddLeadModalProps) {
  const formId = "add-lead-form";

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" scrollable>
        <ModalHeader>
          <ModalTitle>Add new lead</ModalTitle>
          <ModalDescription>
            Capture prospect details and assign an agent to start outreach.
          </ModalDescription>
        </ModalHeader>
        <ModalBody scrollable showClose={false}>
          <LeadForm
            formId={formId}
            hideActions
            mode="create"
            agents={agents}
            onSubmit={async (values) => {
              await onSubmit(values);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </ModalBody>
        <ModalFooter>
          <LeadFormActions
            mode="create"
            formId={formId}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
