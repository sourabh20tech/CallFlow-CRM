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
import type { Lead, LeadRosterAgent } from "@/types/lead";
import type { LeadFormValues } from "@/utils/validators";

interface EditLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  agents: LeadRosterAgent[];
  onSubmit: (values: LeadFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditLeadModal({
  open,
  onOpenChange,
  lead,
  agents,
  onSubmit,
  isSubmitting,
}: EditLeadModalProps) {
  if (!lead) return null;

  const formId = `edit-lead-form-${lead.id}`;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" scrollable>
        <ModalHeader>
          <ModalTitle>Edit lead</ModalTitle>
          <ModalDescription>Update contact details, status, and follow-up schedule.</ModalDescription>
        </ModalHeader>
        <ModalBody scrollable showClose={false}>
          <LeadForm
            key={lead.id + lead.updatedAt}
            formId={formId}
            hideActions
            mode="edit"
            agents={agents}
            initialLead={lead}
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
            mode="edit"
            formId={formId}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
