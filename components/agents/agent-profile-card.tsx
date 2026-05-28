"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Phone, Pencil } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { AgentAccountBadge } from "@/components/agents/agent-account-badge";
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Agent } from "@/types/agent";
import { resolveAvatarSrc } from "@/lib/utils/avatar";

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface AgentProfileCardProps {
  agent: Agent;
  onEdit?: () => void;
}

export function AgentProfileCard({ agent, onEdit }: AgentProfileCardProps) {
  const avatarSrc = resolveAvatarSrc(agent.avatarUrl);

  return (
    <GlassCard variant="gradient" padding="md" className="ds-animate-in">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link href="/dashboard/agents">
            <ArrowLeft className="h-4 w-4" />
            Agents
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-[var(--ds-shadow-md)]">
          {avatarSrc ? <AvatarImage src={avatarSrc} alt={agent.name} /> : null}
          <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-indigo-600/20 text-lg font-semibold text-primary">
            {initials(agent.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="ds-h2">{agent.name}</h2>
            <AgentAccountBadge isActive={agent.isActive} size="md" />
            <AgentStatusBadge status={agent.status} size="md" />
          </div>

          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4 shrink-0" />
              {agent.email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-4 w-4 shrink-0" />
              {agent.phone ?? "No phone on file"}
            </span>
            {agent.createdAt && (
              <span className="text-xs text-muted-foreground">
                Joined {new Date(agent.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {onEdit && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
              Edit profile
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
