"use client";

import { Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickCallButtonProps {
  leadId: string;
  leadName: string;
  phone?: string;
  onCallInitiated?: () => void;
  size?: "sm" | "default";
  variant?: "premium" | "outline" | "default";
  className?: string;
  label?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onCallStart?: () => void;
  onCallComplete?: () => void;
}

export function QuickCallButton({
  leadId,
  leadName,
  phone,
  onCallInitiated,
  size = "sm",
  variant = "premium",
  className,
  label = "Call",
  disabled,
  isLoading,
  onCallStart,
  onCallComplete,
}: QuickCallButtonProps) {
  const handleCall = async () => {
    onCallStart?.();
    try {
      const res = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Call failed");

      if (phone) {
        window.open(`tel:${phone.replace(/[^\d+]/g, "")}`, "_self");
      }

      toast.success(`Calling ${leadName}`, {
        description: "Call logged — update disposition when finished.",
      });
      onCallInitiated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start call");
    } finally {
      onCallComplete?.();
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn("gap-1.5 shrink-0", className)}
      disabled={disabled || isLoading}
      onClick={() => void handleCall()}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Phone className="h-3.5 w-3.5" />
      )}
      {label}
    </Button>
  );
}
