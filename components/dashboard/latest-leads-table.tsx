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
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last contact</TableHead>
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
                <TableCell>
                  <span className="text-sm capitalize">{lead.force}</span>
                </TableCell>
                <TableCell>
                  <StatusChip
                    label={formatLeadStatus(lead.status)}
                    variant={LEAD_STATUS_VARIANT[lead.status]}
                    showDot={lead.status === "new"}
                    pulse={lead.status === "new"}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatRelativeTime(lead.lastContactAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List */}
      <ul className="divide-y divide-border/30 md:hidden">
        {leads.map((lead) => (
          <li key={lead.id} className="px-3 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{lead.name}</p>
                <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
              </div>
              <StatusChip
                label={formatLeadStatus(lead.status)}
                variant={LEAD_STATUS_VARIANT[lead.status]}
                showDot={lead.status === "new"}
                pulse={lead.status === "new"}
                size="sm"
              />
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="capitalize">{lead.force}</span>
              <span>·</span>
              <span>{formatRelativeTime(lead.lastContactAt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </DataTableCard>
  );
}
