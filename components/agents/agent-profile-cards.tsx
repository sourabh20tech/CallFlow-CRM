"use client";

import Link from "next/link";
import { Phone, UserPlus } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AgentAccountBadge } from "@/components/agents/agent-account-badge";
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";
import type { Agent } from "@/types/agent";
import { cn } from "@/lib/utils";
import { resolveAvatarSrc } from "@/lib/utils/avatar";

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface AgentProfileCardsProps {
  agents: Agent[];
  className?: string;
}

export function AgentProfileCards({ agents, className }: AgentProfileCardsProps) {
  const featured = agents.slice(0, 4);
  if (!featured.length) return null;

  return (
    <section aria-label="Team highlights" className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {featured.map((agent, index) => {
        const avatarSrc = resolveAvatarSrc(agent.avatarUrl);
        return (
        <Link key={agent.id} href={`/dashboard/agents/${agent.id}`} className="group block">
          <GlassCard
            variant="gradient"
            padding="md"
            interactive
            className="ds-animate-in h-full"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 border border-primary/15">
                {avatarSrc ? <AvatarImage src={avatarSrc} alt={agent.name} /> : null}
                <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-indigo-600/20 text-sm font-semibold text-primary">
                  {initials(agent.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold group-hover:text-primary">{agent.name}</p>
                <p className="truncate text-xs text-muted-foreground">{agent.phone ?? agent.email}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <AgentAccountBadge isActive={agent.isActive} />
              <AgentStatusBadge status={agent.status} />
            </div>

            <div className="mt-4 flex gap-4 border-t border-border/50 pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <UserPlus className="h-3.5 w-3.5" />
                {agent.assignedLeadsCount ?? 0} leads
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {agent.callsHandled} calls
              </span>
            </div>
          </GlassCard>
        </Link>
        );
      })}
    </section>
  );
}
