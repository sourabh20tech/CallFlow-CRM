"use client";

import {
  CalendarClock,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Lead, LeadRosterAgent } from "@/types/lead";

export type LeadDetailFocus = "overview" | "followups" | "notes";

interface LeadRowActionsProps {
  lead: Lead;
  agents: LeadRosterAgent[];
  isAdmin: boolean;
  onView: (lead: Lead, focus?: LeadDetailFocus) => void;
  onEdit?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  onAssign?: (leadId: string, agentId: string) => void;
  assigning?: boolean;
  /** compact trigger for mobile cards */
  variant?: "table" | "card";
}

export function LeadRowActions({
  lead,
  agents,
  isAdmin,
  onView,
  onEdit,
  onDelete,
  onAssign,
  assigning,
  variant = "table",
}: LeadRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === "card" ? "outline" : "ghost"}
          size="icon"
          className={variant === "card" ? "h-8 w-8 shrink-0" : "h-8 w-8"}
          disabled={assigning}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Lead actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => onView(lead, "overview")}>
          <Eye className="mr-2 h-4 w-4" />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onView(lead, "followups")}>
          <CalendarClock className="mr-2 h-4 w-4" />
          Follow-ups
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onView(lead, "notes")}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Notes
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(lead)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit lead
              </DropdownMenuItem>
            )}
            {onAssign && agents.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign to agent
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                  <DropdownMenuItem onClick={() => onAssign(lead.id, "")}>
                    Unassigned
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {agents.map((agent) => (
                    <DropdownMenuItem
                      key={agent.id}
                      onClick={() => onAssign(lead.id, agent.id)}
                    >
                      {agent.name}
                      {lead.assignedAgentId === agent.id && (
                        <span className="ml-auto text-xs text-muted-foreground">Current</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(lead)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete lead
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
