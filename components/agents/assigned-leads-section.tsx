"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { StatusChip } from "@/components/design-system/status-chip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LEAD_STATUS_VARIANT, formatLeadStatus } from "@/lib/leads/constants";
import type { Lead } from "@/types/lead";

interface AssignedLeadsSectionProps {
  leads: Lead[];
  agentName: string;
}

export function AssignedLeadsSection({ leads, agentName }: AssignedLeadsSectionProps) {
  return (
    <GlassCard variant="default" padding="none" className="overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="ds-h3">Assigned leads</h3>
          <p className="ds-caption text-muted-foreground">
            {leads.length} lead{leads.length === 1 ? "" : "s"} assigned to {agentName}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/dashboard/leads">
            View all leads
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length ? (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{lead.fullName}</p>
                      {lead.email && (
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{lead.force}</TableCell>
                  <TableCell>
                    <StatusChip
                      label={formatLeadStatus(lead.status)}
                      variant={LEAD_STATUS_VARIANT[lead.status]}
                      size="sm"
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No leads assigned yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  );
}
