"use client";

import { CalendarClock, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusChip } from "@/components/design-system/status-chip";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { AssignAgentSelect } from "@/components/leads/assign-agent-select";
import { LeadRowActions, type LeadDetailFocus } from "@/components/leads/lead-row-actions";
import { WhatsAppChatButton } from "@/components/shared/whatsapp-chat-button";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import { formatRelativeTime } from "@/utils/format";
import type { Lead, LeadRosterAgent } from "@/types/lead";
import { cn } from "@/lib/utils";

const tierVariant = {
  standard: "neutral" as const,
  premium: "default" as const,
  enterprise: "info" as const,
};

interface LeadTableProps {
  leads: Lead[];
  agents: LeadRosterAgent[];
  isAdmin: boolean;
  onSelect: (lead: Lead, focus?: LeadDetailFocus) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onAssign: (leadId: string, agentId: string) => void;
  assigningId?: string | null;
}

export function LeadTable({
  leads,
  agents,
  isAdmin,
  onSelect,
  onEdit,
  onDelete,
  onAssign,
  assigningId,
}: LeadTableProps) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Tier</TableHead>
              <TableHead className="hidden xl:table-cell">Agent</TableHead>
              <TableHead className="hidden lg:table-cell">Follow-up</TableHead>
              <TableHead className="hidden sm:table-cell">Updated</TableHead>
              <TableHead className="w-[52px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer transition-colors hover:bg-muted/40"
                onClick={() => onSelect(lead)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{lead.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {[lead.email, lead.company].filter(Boolean).join(" · ") || lead.phone}
                    </p>
                    {lead.phone && (isAdmin || Boolean(lead.assignedAgentId)) && (
                      <div className="mt-1.5">
                        <WhatsAppChatButton
                          phone={lead.phone}
                          message={WHATSAPP_TEMPLATES.greeting}
                          label={`WhatsApp ${lead.fullName}`}
                        />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <LeadStatusBadge status={lead.status} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <StatusChip
                    label={lead.tier}
                    variant={tierVariant[lead.tier]}
                    size="sm"
                    showDot={false}
                  />
                </TableCell>
                <TableCell className="hidden xl:table-cell" onClick={(e) => e.stopPropagation()}>
                  {isAdmin ? (
                    <AssignAgentSelect
                      agents={agents}
                      value={lead.assignedAgentId ?? ""}
                      onChange={(id) => onAssign(lead.id, id)}
                      disabled={assigningId === lead.id}
                      className="max-w-[160px]"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {lead.assignedAgentName ?? "—"}
                    </span>
                  )}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {lead.nextFollowUpAt ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatRelativeTime(lead.nextFollowUpAt)}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {formatRelativeTime(lead.updatedAt)}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <LeadRowActions
                    lead={lead}
                    agents={agents}
                    isAdmin={isAdmin}
                    onView={onSelect}
                    onEdit={isAdmin ? onEdit : undefined}
                    onDelete={isAdmin ? onDelete : undefined}
                    onAssign={isAdmin ? onAssign : undefined}
                    assigning={assigningId === lead.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 md:hidden">
        {leads.map((lead) => (
          <li key={lead.id}>
            <div
              className={cn(
                "rounded-xl border border-[hsl(var(--ds-glass-border))]",
                "bg-[hsl(var(--ds-glass-bg))]/60 p-4 backdrop-blur-sm",
              )}
            >
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(lead)}
                  className="min-w-0 flex-1 text-left transition-colors active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{lead.fullName}</p>
                      {lead.company && (
                        <p className="text-xs text-muted-foreground">{lead.company}</p>
                      )}
                    </div>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {lead.assignedAgentName && (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {lead.assignedAgentName}
                      </span>
                    )}
                    {lead.nextFollowUpAt && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {formatRelativeTime(lead.nextFollowUpAt)}
                      </span>
                    )}
                  </div>
                  {lead.phone && (isAdmin || Boolean(lead.assignedAgentId)) && (
                    <div className="mt-2">
                      <WhatsAppChatButton
                        phone={lead.phone}
                        message={WHATSAPP_TEMPLATES.greeting}
                        label={`WhatsApp ${lead.fullName}`}
                      />
                    </div>
                  )}
                </button>
                <LeadRowActions
                  variant="card"
                  lead={lead}
                  agents={agents}
                  isAdmin={isAdmin}
                  onView={onSelect}
                  onEdit={isAdmin ? onEdit : undefined}
                  onDelete={isAdmin ? onDelete : undefined}
                  onAssign={isAdmin ? onAssign : undefined}
                  assigning={assigningId === lead.id}
                />
              </div>
              {isAdmin && (
                <div
                  className="mt-3 border-t border-border/40 pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AssignAgentSelect
                    agents={agents}
                    value={lead.assignedAgentId ?? ""}
                    onChange={(id) => onAssign(lead.id, id)}
                    disabled={assigningId === lead.id}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
