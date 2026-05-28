"use client";

import { AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";

interface AgentsSetupBannerProps {
  message: string;
}

export function AgentsSetupBanner({ message }: AgentsSetupBannerProps) {
  return (
    <GlassCard
      variant="subtle"
      padding="sm"
      className="border-amber-500/30 bg-amber-500/10 ds-animate-in"
    >
      <div className="flex gap-3 text-sm text-amber-900 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">Agent creation requires server configuration</p>
          <p className="mt-1 text-pretty text-amber-800/90 dark:text-amber-300/90">{message}</p>
        </div>
      </div>
    </GlassCard>
  );
}
