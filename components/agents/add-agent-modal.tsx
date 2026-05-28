"use client";

import { UserPlus } from "lucide-react";
import { AgentForm } from "@/components/agents/agent-form";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/design-system/modal";
import type { CreateAgentFormValues } from "@/utils/validators";

interface AddAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateAgentFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddAgentModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: AddAgentModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" className="max-h-[min(92dvh,720px)] overflow-y-auto">
        <ModalHeader>
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-indigo-500/20 ring-1 ring-violet-500/25">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <ModalTitle>Add Agent</ModalTitle>
              <ModalDescription className="mt-1">
                Set up a new team member with login credentials. They can sign in at{" "}
                <strong>/login</strong> after creation.
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>
        <ModalBody showClose={false}>
          <AgentForm
            key={open ? "add-agent-open" : "add-agent-closed"}
            mode="create"
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
