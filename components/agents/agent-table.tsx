"use client";

import Link from "next/link";
import {
  Eye,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AgentAccountBadge } from "@/components/agents/agent-account-badge";
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";
import { formatDuration } from "@/utils/format";
import type { Agent } from "@/types/agent";
import { cn } from "@/lib/utils";

export interface AgentTableActions {
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
  onResetPassword: (agent: Agent) => void;
  onToggleActive: (agent: Agent) => void;
}

interface AgentTableProps {
  agents: Agent[];
  actions: AgentTableActions;
}

export function AgentTable({ agents, actions }: AgentTableProps) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Presence</TableHead>
              <TableHead>Leads</TableHead>
              <TableHead className="hidden lg:table-cell">Calls</TableHead>
              <TableHead className="hidden xl:table-cell">AHT</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow
                key={agent.id}
                className="transition-colors hover:bg-muted/40"
              >
                <TableCell>
                  <Link
                    href={`/dashboard/agents/${agent.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {agent.name}
                  </Link>
                  <p className="text-xs text-muted-foreground lg:hidden">{agent.email}</p>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {agent.email}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {agent.phone ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={agent.isActive}
                      onCheckedChange={() => actions.onToggleActive(agent)}
                      aria-label={agent.isActive ? "Deactivate agent" : "Activate agent"}
                    />
                    <AgentAccountBadge isActive={agent.isActive} className="hidden xl:inline-flex" />
                  </div>
                </TableCell>
                <TableCell>
                  <AgentStatusBadge status={agent.status} />
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-sm font-medium tabular-nums">
                    <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                    {agent.assignedLeadsCount ?? 0}
                  </span>
                </TableCell>
                <TableCell className="hidden tabular-nums lg:table-cell">
                  {agent.callsHandled}
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  {formatDuration(agent.avgHandleTime)}
                </TableCell>
                <TableCell>
                  <AgentRowActions agent={agent} actions={actions} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 md:hidden">
        {agents.map((agent) => (
          <li key={agent.id}>
            <div
              className={cn(
                "rounded-xl border border-[hsl(var(--ds-glass-border))]",
                "bg-[hsl(var(--ds-glass-bg))]/60 p-4 backdrop-blur-sm",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/dashboard/agents/${agent.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {agent.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{agent.email}</p>
                </div>
                <AgentRowActions agent={agent} actions={actions} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <AgentAccountBadge isActive={agent.isActive} />
                  <AgentStatusBadge status={agent.status} />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Active</span>
                  <Switch
                    checked={agent.isActive}
                    onCheckedChange={() => actions.onToggleActive(agent)}
                    aria-label={agent.isActive ? "Deactivate agent" : "Activate agent"}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>{agent.phone ?? "No phone"}</span>
                <span>{agent.assignedLeadsCount ?? 0} leads</span>
                <span>{agent.callsHandled} calls</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function AgentRowActions({
  agent,
  actions,
}: {
  agent: Agent;
  actions: AgentTableActions;
}) {
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
            View profile
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
}
