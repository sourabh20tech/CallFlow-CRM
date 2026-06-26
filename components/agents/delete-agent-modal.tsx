"use client";

import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/design-system/modal";
import { Button } from "@/components/ui/button";
import type { Agent } from "@/types/agent";

interface DeleteAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
  onConfirm: () => Promise<void>;
  isSubmitting?: boolean;
}

export function DeleteAgentModal({
  open,
  onOpenChange,
  agent,
  onConfirm,
  isSubmitting,
}: DeleteAgentModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Delete agent?</ModalTitle>
          <ModalDescription>
            Are you sure you want to permanently delete {agent?.name ?? "this agent"}&apos;s login
            account? The agent will no longer be able to log in. Historical CRM records (leads,
            calls, notes) will remain for reporting. This action cannot be undone.
          </ModalDescription>
        </ModalHeader>
        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={isSubmitting}
          >
            Delete agent
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
