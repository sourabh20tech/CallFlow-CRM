"use client";

import { Pencil } from "lucide-react";
import { AgentForm } from "@/components/agents/agent-form";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/design-system/modal";
import type { Agent } from "@/types/agent";
import type { UpdateAgentFormValues } from "@/utils/validators";

interface EditAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
  onSubmit: (values: UpdateAgentFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditAgentModal({
  open,
  onOpenChange,
  agent,
  onSubmit,
  isSubmitting,
}: EditAgentModalProps) {
  if (!agent) return null;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" className="max-h-[min(92dvh,720px)] overflow-y-auto">
        <ModalHeader>
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-indigo-500/20 ring-1 ring-violet-500/25">
              <Pencil className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <ModalTitle>Edit agent</ModalTitle>
              <ModalDescription className="mt-1">
                Update profile details and active/inactive account status for {agent.name}.
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>
        <ModalBody showClose={false}>
          <AgentForm
            key={agent.id + String(agent.updatedAt)}
            mode="edit"
            defaultValues={agent}
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
