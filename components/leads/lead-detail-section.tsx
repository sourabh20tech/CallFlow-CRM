"use client";

import { useEffect, useRef } from "react";
import {
  Building2,
  CalendarClock,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/design-system/status-chip";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { LeadNotesPanel } from "@/components/leads/lead-notes-panel";
import { LeadFollowupsPanel } from "@/components/leads/lead-followups-panel";
import { AssignAgentSelect } from "@/components/leads/assign-agent-select";
import { LeadStatusActions } from "@/components/agent-panel/lead-status-actions";
import { WhatsAppChatButton } from "@/components/shared/whatsapp-chat-button";
import type { LeadDetailFocus } from "@/components/leads/lead-row-actions";
import { formatLeadStatus } from "@/lib/leads/constants";
import { LEAD_TIER_OPTIONS } from "@/lib/leads/constants";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import { formatRelativeTime } from "@/utils/format";
import type { Lead, LeadRosterAgent } from "@/types/lead";

interface LeadDetailSectionProps {
  lead: Lead | null;
  agents: LeadRosterAgent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  isAdmin: boolean;
  detailFocus?: LeadDetailFocus;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onAssign: (leadId: string, agentId: string) => void;
  onLeadUpdated?: (lead: Lead) => void;
  onFocusSection?: (focus: LeadDetailFocus) => void;
  assigning?: boolean;
}

export function LeadDetailSection({
  lead,
  agents,
  open,
  onOpenChange,
  canManage,
  isAdmin,
  detailFocus = "overview",
  onEdit,
  onDelete,
  onAssign,
  onLeadUpdated,
  onFocusSection,
  assigning,
}: LeadDetailSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !lead || detailFocus === "overview") return;

    const id =
      detailFocus === "followups" ? "lead-detail-followups" : "lead-detail-notes";
    const timer = window.setTimeout(() => {
      const el = scrollRef.current?.querySelector(`#${id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [open, lead?.id, detailFocus]);

  if (!lead) return null;

  const tierLabel = LEAD_TIER_OPTIONS.find((t) => t.value === lead.tier)?.label ?? lead.tier;
  const canMessageOnWhatsApp = Boolean(lead.phone) && (isAdmin || Boolean(lead.assignedAgentId));

  const jumpTo = (focus: LeadDetailFocus) => {
    onFocusSection?.(focus);
    const id = focus === "followups" ? "lead-detail-followups" : "lead-detail-notes";
    if (focus === "overview") {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = scrollRef.current?.querySelector(`#${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-5 text-left">
          <SheetTitle>{lead.fullName}</SheetTitle>
          <div className="flex flex-wrap items-center gap-2">
            <LeadStatusBadge status={lead.status} size="md" />
            <StatusChip label={tierLabel} variant="neutral" size="sm" showDot={false} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => jumpTo("followups")}>
              <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
              Follow-ups
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => jumpTo("notes")}>
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Notes
            </Button>
            {canManage && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => onEdit(lead)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onDelete(lead)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </SheetHeader>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          <div className="space-y-6">
            <section className="space-y-2 text-sm">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contact
              </h4>
              {lead.company && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" />
                  {lead.company}
                </p>
              )}
              {lead.email && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  {lead.email}
                </p>
              )}
              {lead.phone && (
                <div className="flex items-center justify-between gap-2 text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    {lead.phone}
                  </p>
                  {canMessageOnWhatsApp && (
                    <WhatsAppChatButton
                      phone={lead.phone}
                      message={WHATSAPP_TEMPLATES.greeting}
                      label="Chat on WhatsApp"
                    />
                  )}
                </div>
              )}
              {lead.source && (
                <p className="text-muted-foreground">
                  Source: <span className="text-foreground">{lead.source}</span>
                </p>
              )}
            </section>

            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Assignment
              </h4>
              {canManage ? (
                <AssignAgentSelect
                  agents={agents}
                  value={lead.assignedAgentId ?? ""}
                  onChange={(id) => onAssign(lead.id, id)}
                  disabled={assigning}
                />
              ) : (
                <p className="text-sm">{lead.assignedAgentName ?? "Unassigned"}</p>
              )}
            </section>

            {!canManage && onLeadUpdated && (
              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Update status
                </h4>
                <LeadStatusActions lead={lead} onUpdated={onLeadUpdated} compact />
              </section>
            )}

            <section className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Next follow-up</p>
                <p className="mt-1 flex items-center gap-1 font-medium">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  {lead.nextFollowUpAt
                    ? formatRelativeTime(lead.nextFollowUpAt)
                    : "Not scheduled"}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Last updated</p>
                <p className="mt-1 font-medium">{formatRelativeTime(lead.updatedAt)}</p>
              </div>
            </section>

            {lead.status === "converted" && (
              <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
                <p className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                  Converted
                </p>
                <p className="mt-1 text-muted-foreground">
                  {lead.convertedAt
                    ? `Converted ${formatRelativeTime(lead.convertedAt)}`
                    : `Status: ${formatLeadStatus(lead.status)}`}
                </p>
              </section>
            )}

            <LeadFollowupsPanel leadId={lead.id} />
            <LeadNotesPanel leadId={lead.id} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
