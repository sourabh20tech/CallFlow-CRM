"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AgentsMobileFabProps {
  onClick: () => void;
  className?: string;
}

/** Fixed Add Agent control for small screens (header actions may scroll away). */
export function AgentsMobileFab({ onClick, className }: AgentsMobileFabProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-6 right-4 z-40 md:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      <Button
        type="button"
        variant="premium"
        size="lg"
        className="pointer-events-auto h-14 gap-2 rounded-full px-5 shadow-[var(--ds-shadow-glow)]"
        onClick={onClick}
        aria-label="Add Agent"
      >
        <Plus className="h-5 w-5" />
        Add Agent
      </Button>
    </div>
  );
}
