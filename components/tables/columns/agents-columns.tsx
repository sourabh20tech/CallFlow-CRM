"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Power, Trash2, KeyRound } from "lucide-react";
import { StatusChip } from "@/components/design-system/status-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Agent } from "@/types/agent";
import { formatDuration } from "@/utils/format";

const statusVariant: Record<Agent["status"], "success" | "warning" | "error" | "neutral"> = {
  available: "success",
  busy: "warning",
  away: "neutral",
  offline: "error",
};

export interface AgentTableActions {
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
  onResetPassword: (agent: Agent) => void;
  onToggleActive: (agent: Agent) => void;
}

export function createAgentsColumns(actions: AgentTableActions): ColumnDef<Agent>[] {
  return [
    {
      accessorKey: "name",
      header: "Agent",
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <div className="min-w-[140px]">
            <Link
              href={`/dashboard/agents/${agent.id}`}
              className="font-medium text-primary hover:underline"
            >
              {agent.name}
            </Link>
            <p className="text-xs text-muted-foreground sm:hidden">{agent.email}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      meta: { className: "hidden md:table-cell" },
      cell: ({ row }) => (
        <span className="hidden md:inline">{row.getValue("email")}</span>
      ),
    },
    {
      accessorKey: "department",
      header: "Dept",
    },
    {
      id: "account",
      header: "Account",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as Agent["status"];
        return (
          <StatusChip
            label={status}
            variant={statusVariant[status]}
            pulse={status === "available" || status === "busy"}
          />
        );
      },
    },
    {
      accessorKey: "assignedLeadsCount",
      header: "Leads",
      cell: ({ row }) => row.original.assignedLeadsCount ?? 0,
    },
    {
      accessorKey: "callsHandled",
      header: "Calls",
      meta: { className: "hidden lg:table-cell" },
      cell: ({ row }) => (
        <span className="hidden lg:inline">{row.getValue("callsHandled")}</span>
      ),
    },
    {
      accessorKey: "avgHandleTime",
      header: "AHT",
      meta: { className: "hidden xl:table-cell" },
      cell: ({ row }) => (
        <span className="hidden xl:inline">
          {formatDuration(row.getValue("avgHandleTime"))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/agents/${agent.id}`} className="gap-2">
                  <Eye className="h-4 w-4" />
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(agent)} className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onResetPassword(agent)} className="gap-2">
                <KeyRound className="h-4 w-4" />
                Reset password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => actions.onToggleActive(agent)} className="gap-2">
                <Power className="h-4 w-4" />
                {agent.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => actions.onDelete(agent)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
