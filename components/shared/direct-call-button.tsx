"use client";

import { Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DirectCallButtonProps {
  phone?: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}

export function DirectCallButton({
  phone,
  label = "Call Lead",
  className,
  iconOnly = true,
}: DirectCallButtonProps) {
  if (!phone?.trim()) return null;

  const cleanPhone = phone.replace(/[^\d+]/g, "");
  if (cleanPhone.length < 7) return null;

  const handleClick = () => {
    // Try tel: protocol (works on mobile and some desktops)
    const telUrl = `tel:${cleanPhone}`;

    // Check if mobile or has tel: support
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = telUrl;
    } else {
      // Desktop fallback: try opening tel link, also copy to clipboard
      window.open(telUrl, "_self");
      navigator.clipboard.writeText(phone.trim()).then(() => {
        toast.success("Phone number copied", { description: phone.trim() });
      }).catch(() => {
        toast.info(`Call: ${phone.trim()}`);
      });
    }
  };

  return (
    <Button
      variant="outline"
      size={iconOnly ? "icon" : "sm"}
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={cn(
        "h-8 border-blue-500/35 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300",
        iconOnly ? "w-8 rounded-lg" : "rounded-lg gap-1.5 px-2.5",
        className,
      )}
    >
      <Phone className="h-4 w-4" />
      {!iconOnly && <span>Call</span>}
    </Button>
  );
}
