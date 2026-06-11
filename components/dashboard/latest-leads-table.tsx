"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/design-system/status-chip";
import { DataTableCard } from "@/components/design-system/data-table-card";
import { formatRelativeTime } from "@/utils/format";
import { LEAD_STATUS_VARIANT, formatLeadStatus } from "@/lib/leads/constants";
import type { DashboardLeadRow } from "@/types/dashboard";

interface LatestLeadsTableProps {
  leads: DashboardLeadRow[];
}

export function LatestLeadsTable({ leads }: LatestLeadsTableProps) {
  return (
    <DataTableCard
      title="Latest Leads"
      description="Recently added and updated prospects"
      toolbar={
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/leads">View all</Link>
        </Button>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead</TableHead>
            <TableHead className="hidden sm:table-cell">Company</TableHead>
            <TableHead>Force</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Last contact</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.email}</p>
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {lead.company ?? "—"}
              </TableCell>
              <TableCell>
                <span className="capitalize text-sm">{lead.force}</span>
              </TableCell>
              <TableCell>
                <StatusChip
                  label={formatLeadStatus(lead.status)}
                  variant={LEAD_STATUS_VARIANT[lead.status]}
                  showDot={lead.status === "new"}
                  pulse={lead.status === "new"}
                />
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatRelativeTime(lead.lastContactAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableCard>
  );
}
