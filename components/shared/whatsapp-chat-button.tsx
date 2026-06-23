"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useWhatsAppTemplate, resolveTemplate } from "@/hooks/use-whatsapp-template";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface WhatsAppChatButtonProps {
  phone?: string;
  /** Fallback message if no agent template is set */
  message?: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
  /** Lead data for template variable substitution */
  leadName?: string;
  leadStatus?: string;
  leadSource?: string;
}

export function WhatsAppChatButton({
  phone,
  message,
  label = "WhatsApp",
  className,
  iconOnly = true,
  leadName,
  leadStatus,
  leadSource,
}: WhatsAppChatButtonProps) {
  const { user } = useAuth();
  const { template } = useWhatsAppTemplate();

  // Resolve template with lead variables
  const resolvedMessage = resolveTemplate(template, {
    name: leadName ?? "",
    phone: phone ?? "",
    status: leadStatus ?? "",
    source: leadSource ?? "",
    agentName: user?.fullName ?? "",
  });

  // Use resolved template, or fallback to passed message
  const finalMessage = resolvedMessage || message;
  const url = buildWhatsAppUrl(phone, finalMessage);
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
