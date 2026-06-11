"use client";

import { useState } from "react";
import { ChevronRight, Trophy } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { StatusChip } from "@/components/design-system/status-chip";
import { AgentPanelSectionHeader } from "@/components/agent-panel/agent-panel-section-header";
import { AgentPanelEmptyState } from "@/components/agent-panel/agent-panel-empty-state";
import { ConvertedLeadDetailSheet } from "@/components/agent-panel/converted-lead-detail-sheet";
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

interface ConvertedLeadsSectionProps {
  leads: AgentPanelLead[];
}

export function ConvertedLeadsSection({ leads }: ConvertedLeadsSectionProps) {
  const [selected, setSelected] = useState<AgentPanelLead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openLead = (lead: AgentPanelLead) => {
    setSelected(lead);
    setSheetOpen(true);
  };

  return (
    <section id="converted" className="scroll-mt-24">
      <GlassCard variant="gradient" padding="none" className="overflow-hidden">
        <AgentPanelSectionHeader
          title="Converted Leads"
          description={`${leads.length} win${leads.length === 1 ? "" : "s"} in your pipeline`}
        />

        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Force</TableHead>
                <TableHead>Converted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length ? (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.company ?? "—"}</TableCell>
                    <TableCell className="capitalize">{lead.force}</TableCell>
                    <TableCell>
                      <StatusChip label="Converted" variant="success" size="sm" />
                      {lead.convertedAt && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {new Date(lead.convertedAt).toLocaleDateString()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openLead(lead)}>
                        View
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    No converted leads yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <ul className="divide-y divide-border/40 sm:hidden">
          {leads.length ? (
            leads.map((lead) => (
              <li key={lead.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 p-4 text-left hover:bg-muted/20"
                  onClick={() => openLead(lead)}
                >
                  <div>
                    <p className="font-medium">{lead.fullName}</p>
                    <p className="text-xs text-muted-foreground">{lead.company}</p>
                  </div>
                  <StatusChip label="Converted" variant="success" size="sm" />
                </button>
              </li>
            ))
          ) : (
            <AgentPanelEmptyState
              icon={Trophy}
              title="No conversions yet"
              description="When you convert a lead, it will appear here with full history and notes."
            />
          )}
        </ul>
      </GlassCard>

      <ConvertedLeadDetailSheet lead={selected} open={sheetOpen} onOpenChange={setSheetOpen} />
    </section>
  );
}
