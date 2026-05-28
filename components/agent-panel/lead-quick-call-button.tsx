"use client";

import { useState } from "react";
import { Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

interface LeadQuickCallButtonProps {
  leadId: string;
  leadName: string;
  phone?: string;
  onCallInitiated?: () => void;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
}

export function LeadQuickCallButton({
  leadId,
  leadName,
  phone,
  onCallInitiated,
  size = "sm",
  variant = "premium",
  className,
}: LeadQuickCallButtonProps) {
  const [isCalling, setIsCalling] = useState(false);

  const handleCall = async () => {
    setIsCalling(true);
    try {
      const res = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Call failed");

      if (phone) {
        const tel = phone.replace(/[^\d+]/g, "");
        window.open(`tel:${tel}`, "_self");
      }

      toast.success(`Calling ${leadName}`);
      onCallInitiated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start call");
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn("gap-1.5", className)}
      disabled={isCalling}
      onClick={() => void handleCall()}
    >
      {isCalling ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Phone className="h-3.5 w-3.5" />
      )}
      Call
    </Button>
  );
}
