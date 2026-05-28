"use client";

import { Trophy } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusChip } from "@/components/design-system/status-chip";
import { LeadNotesPanel } from "@/components/agent-panel/lead-notes-panel";
import { LeadContactBlock } from "@/components/agent-panel/lead-contact-block";
import { WhatsAppChatButton } from "@/components/shared/whatsapp-chat-button";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import type { AgentPanelLead } from "@/types/agent-panel";

interface ConvertedLeadDetailSheetProps {
  lead: AgentPanelLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvertedLeadDetailSheet({
  lead,
  open,
  onOpenChange,
}: ConvertedLeadDetailSheetProps) {
  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-500" />
            {lead.fullName}
          </SheetTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <StatusChip label="Converted" variant="success" size="sm" />
            {lead.convertedAt && (
              <span>
                {new Date(lead.convertedAt).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <LeadContactBlock
            company={lead.company}
            email={lead.email}
            phone={lead.phone}
            phoneAction={
              <WhatsAppChatButton
                phone={lead.phone}
                message={WHATSAPP_TEMPLATES.inquiryFollowup}
                label={`WhatsApp ${lead.fullName}`}
              />
            }
          />

          <LeadNotesPanel leadId={lead.id} readOnly />
        </div>
      </SheetContent>
    </Sheet>
  );
}
