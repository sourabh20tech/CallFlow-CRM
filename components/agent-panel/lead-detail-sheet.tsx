"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusChip } from "@/components/design-system/status-chip";
import { LEAD_STATUS_VARIANT, formatLeadStatus } from "@/lib/leads/constants";
import { LeadNotesPanel } from "@/components/agent-panel/lead-notes-panel";
import { LeadQuickCallButton } from "@/components/agent-panel/lead-quick-call-button";
import { LeadStatusActions } from "@/components/agent-panel/lead-status-actions";
import { WhatsAppChatButton } from "@/components/shared/whatsapp-chat-button";
import { LeadContactBlock } from "@/components/agent-panel/lead-contact-block";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import type { AgentPanelLead } from "@/types/agent-panel";
import type { Lead } from "@/types/lead";

interface LeadDetailSheetProps {
  lead: AgentPanelLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated: (lead: Lead) => void;
  onCallInitiated?: () => void;
  onNoteAdded?: () => void;
}

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
  onLeadUpdated,
  onCallInitiated,
  onNoteAdded,
}: LeadDetailSheetProps) {
  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>{lead.fullName}</SheetTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <StatusChip
              label={formatLeadStatus(lead.status)}
              variant={LEAD_STATUS_VARIANT[lead.status]}
              size="sm"
            />
            <span className="capitalize">{lead.tier} tier</span>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <LeadContactBlock company={lead.company} email={lead.email} phone={lead.phone} />

          <div className="flex gap-2">
            <LeadQuickCallButton
              leadId={lead.id}
              leadName={lead.fullName}
              phone={lead.phone}
              onCallInitiated={onCallInitiated}
              className="w-full sm:w-auto"
            />
            <WhatsAppChatButton
              phone={lead.phone}
              message={WHATSAPP_TEMPLATES.greeting}
              label={`WhatsApp ${lead.fullName}`}
              iconOnly={false}
              className="w-full sm:w-auto"
            />
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Update status</h4>
            <LeadStatusActions lead={lead} onUpdated={onLeadUpdated} compact />
          </div>

          <LeadNotesPanel leadId={lead.id} onNoteAdded={onNoteAdded} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
