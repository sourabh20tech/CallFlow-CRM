"use client";

import { LogCallForm } from "@/components/calls/log-call-form";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/design-system/modal";
import type { DialLead } from "@/lib/calls/dial-leads";
import type { CallAgentOption } from "@/components/calls/call-filters";
import type { LogCallFormValues } from "@/utils/validators";

interface LogCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: DialLead[];
  agents?: CallAgentOption[];
  isAdmin?: boolean;
  onSubmit: (values: LogCallFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function LogCallModal({
  open,
  onOpenChange,
  leads,
  agents,
  isAdmin,
  onSubmit,
  isSubmitting,
}: LogCallModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md">
        <ModalHeader>
          <ModalTitle>Log manual call</ModalTitle>
          <ModalDescription>
            Record a completed or attempted conversation with disposition and duration.
          </ModalDescription>
        </ModalHeader>
        <ModalBody showClose={false}>
          <LogCallForm
            leads={leads}
            agents={agents}
            isAdmin={isAdmin}
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
