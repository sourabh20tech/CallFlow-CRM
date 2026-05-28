"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface WhatsAppChatButtonProps {
  phone?: string;
  message?: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}

export function WhatsAppChatButton({
  phone,
  message,
  label = "WhatsApp",
  className,
  iconOnly = true,
}: WhatsAppChatButtonProps) {
  const url = buildWhatsAppUrl(phone, message);
  if (!url) return null;

  return (
    <Button
      asChild
      variant="outline"
      size={iconOnly ? "icon" : "sm"}
      className={cn(
        "h-8 border-emerald-500/35 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300",
        iconOnly ? "w-8 rounded-lg" : "rounded-lg gap-1.5 px-2.5",
        className,
      )}
    >
      <Link href={url} target="_blank" rel="noopener noreferrer" aria-label={label}>
        <MessageCircle className="h-4 w-4" />
        {!iconOnly && <span>{label}</span>}
      </Link>
    </Button>
  );
}
