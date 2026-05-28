"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddAgentButtonProps {
  onClick: () => void;
  className?: string;
  size?: "sm" | "default";
}

export function AddAgentButton({ onClick, className, size = "default" }: AddAgentButtonProps) {
  return (
    <Button
      type="button"
      variant="premium"
      size={size}
      className={cn("gap-2 shadow-[var(--ds-shadow-glow)]", className)}
      onClick={onClick}
      aria-label="Add Agent"
    >
      <Plus className="h-4 w-4" />
      Add Agent
    </Button>
  );
}
