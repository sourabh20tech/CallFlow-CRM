"use client";

import { useMemo, useState } from "react";
import { ChevronRight, StickyNote, Users } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { StatusChip } from "@/components/design-system/status-chip";
import { AgentPanelSectionHeader } from "@/components/agent-panel/agent-panel-section-header";
import { AgentPanelEmptyState } from "@/components/agent-panel/agent-panel-empty-state";
import { MyLeadsToolbar } from "@/components/agent-panel/my-leads-toolbar";
import { LeadDetailSheet } from "@/components/agent-panel/lead-detail-sheet";
import { LeadQuickCallButton } from "@/components/agent-panel/lead-quick-call-button";
import { WhatsAppChatButton } from "@/components/shared/whatsapp-chat-button";
import { LEAD_STATUS_VARIANT, formatLeadStatus } from "@/lib/leads/constants";
import { filterAgentLeads } from "@/lib/agent-panel/lead-lookup";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { AgentPanelLead } from "@/types/agent-panel";
import type { Lead } from "@/types/lead";

interface MyLeadsSectionProps {
  leads: AgentPanelLead[];
  onLeadsChange: (leads: AgentPanelLead[]) => void;
  onRefresh: () => void;
  showToolbar?: boolean;
}

export function MyLeadsSection({
  leads,
  onLeadsChange,
  onRefresh,
  showToolbar = true,
}: MyLeadsSectionProps) {
  const [selected, setSelected] = useState<AgentPanelLead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredLeads = useMemo(() => filterAgentLeads(leads, search), [leads, search]);

  const openLead = (lead: AgentPanelLead) => {
    setSelected(lead);
    setSheetOpen(true);
  };

  const handleLeadUpdated = (updated: Lead) => {
    const next = leads.map((l) =>
      l.id === updated.id ? { ...updated, noteCount: l.noteCount } : l,
    );
    const filtered =
      ["converted", "not_interested", "closed"].includes(updated.status)
        ? next.filter((l) => l.id !== updated.id)
        : next;
    onLeadsChange(filtered);
    setSelected((prev) =>
      prev?.id === updated.id ? { ...updated, noteCount: prev.noteCount } : prev,
    );
    if (["converted", "not_interested", "closed"].includes(updated.status)) {
      setSheetOpen(false);
      onRefresh();
    }
  };

  const handleNoteAdded = () => {
    if (!selected) return;
    const bump = (list: AgentPanelLead[]) =>
      list.map((l) => (l.id === selected.id ? { ...l, noteCount: l.noteCount + 1 } : l));
    onLeadsChange(bump(leads));
    setSelected((prev) => (prev ? { ...prev, noteCount: prev.noteCount + 1 } : prev));
  };

  return (
    <section id="leads" className="scroll-mt-24">
      <GlassCard variant="default" padding="none" className="overflow-hidden">
        <AgentPanelSectionHeader
          title="My Leads"
          description={`${leads.length} active lead${leads.length === 1 ? "" : "s"} assigned to you`}
        />

        {showToolbar && leads.length > 0 && (
          <MyLeadsToolbar
            value={search}
            onChange={setSearch}
            totalCount={leads.length}
            filteredCount={filteredLeads.length}
          />
        )}

        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length ? (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="group">
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => openLead(lead)}
                        className="text-left hover:text-primary"
                      >
                        <p className="font-medium">{lead.fullName}</p>
                        {lead.email && (
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{lead.company ?? "—"}</TableCell>
                    <TableCell className="capitalize">{lead.tier}</TableCell>
                    <TableCell>
                      <StatusChip
                        label={formatLeadStatus(lead.status)}
                        variant={LEAD_STATUS_VARIANT[lead.status]}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {lead.noteCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <StickyNote className="h-3.5 w-3.5" />
                            {lead.noteCount}
                          </span>
                        )}
                        <LeadQuickCallButton
                          leadId={lead.id}
                          leadName={lead.fullName}
                          phone={lead.phone}
                          onCallInitiated={onRefresh}
                        />
                        <WhatsAppChatButton
                          phone={lead.phone}
                          message={WHATSAPP_TEMPLATES.greeting}
                          label={`WhatsApp ${lead.fullName}`}
                        />
                        <Button variant="ghost" size="sm" onClick={() => openLead(lead)}>
                          Details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {search ? "No leads match your search." : "No active leads assigned."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <ul className="divide-y divide-border/40 md:hidden">
          {filteredLeads.length ? (
            filteredLeads.map((lead) => (
              <li key={lead.id} className="flex flex-col gap-3 p-4">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-2 text-left"
                  onClick={() => openLead(lead)}
                >
                  <div>
                    <p className="font-medium">{lead.fullName}</p>
                    <p className="text-xs text-muted-foreground">{lead.company ?? lead.email}</p>
                  </div>
                  <StatusChip
                    label={formatLeadStatus(lead.status)}
                    variant={LEAD_STATUS_VARIANT[lead.status]}
                    size="sm"
                  />
                </button>
                <div className="flex gap-2">
                  <LeadQuickCallButton
                    leadId={lead.id}
                    leadName={lead.fullName}
                    phone={lead.phone}
                    onCallInitiated={onRefresh}
                    className="flex-1"
                  />
                  <WhatsAppChatButton
                    phone={lead.phone}
                    message={WHATSAPP_TEMPLATES.greeting}
                    label={`WhatsApp ${lead.fullName}`}
                    className="flex-1"
                    iconOnly={false}
                  />
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openLead(lead)}>
                    Notes & status
                  </Button>
                </div>
              </li>
            ))
          ) : leads.length === 0 ? (
            <AgentPanelEmptyState
              icon={Users}
              title="No active leads"
              description="New assignments will appear here. Check back after your manager assigns leads."
            />
          ) : (
            <li className="py-8 text-center text-sm text-muted-foreground">No leads match your search.</li>
          )}
        </ul>
      </GlassCard>

      <LeadDetailSheet
        lead={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onLeadUpdated={handleLeadUpdated}
        onCallInitiated={onRefresh}
        onNoteAdded={handleNoteAdded}
      />
    </section>
  );
}
