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
import type { Lead } from "@/types/lead";

interface DeleteLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onConfirm: () => Promise<void>;
  isSubmitting?: boolean;
}

export function DeleteLeadModal({
  open,
  onOpenChange,
  lead,
  onConfirm,
  isSubmitting,
}: DeleteLeadModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Delete lead?</ModalTitle>
          <ModalDescription>
            {lead?.fullName ?? "This lead"} will be removed from the pipeline. Notes and
            follow-ups remain linked in history but the lead will no longer appear in active
            lists.
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
            Delete lead
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
