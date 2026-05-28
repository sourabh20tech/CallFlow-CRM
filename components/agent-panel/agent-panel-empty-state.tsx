"use client";

import type { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { Button } from "@/components/ui/button";

interface AgentPanelEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AgentPanelEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: AgentPanelEmptyStateProps) {
  return (
    <div className="px-4 py-10 sm:px-6">
      <GlassCard variant="subtle" padding="lg" className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">{description}</p>
        {actionLabel && onAction && (
          <Button type="button" size="sm" variant="outline" className="mt-4" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </GlassCard>
    </div>
  );
}
