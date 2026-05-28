"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { StatusChip } from "@/components/design-system/status-chip";
import { CALL_STATUS_VARIANT, formatCallStatus } from "@/lib/calls/constants";
import type { Call } from "@/types/call";
import { formatDuration, formatRelativeTime } from "@/utils/format";

export const callsColumns: ColumnDef<Call>[] = [
  {
    accessorKey: "customerName",
    header: "Lead",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("customerName")}</span>
    ),
  },
  {
    accessorKey: "direction",
    header: "Direction",
    cell: ({ row }) => {
      const direction = row.getValue("direction") as Call["direction"];
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {direction === "inbound" ? (
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          )}
          <span className="capitalize">{direction}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "agentName",
    header: "Agent",
    cell: ({ row }) => row.getValue("agentName") ?? "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Call["status"];
      return (
        <StatusChip
          label={formatCallStatus(status)}
          variant={CALL_STATUS_VARIANT[status]}
          pulse={status === "callback"}
        />
      );
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => formatDuration(row.getValue("duration")),
  },
  {
    accessorKey: "startedAt",
    header: "Started",
    cell: ({ row }) => formatRelativeTime(row.getValue("startedAt")),
  },
];
