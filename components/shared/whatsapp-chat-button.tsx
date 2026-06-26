"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppMessagePicker } from "@/components/shared/whatsapp-message-picker";
import { cn } from "@/lib/utils";

interface WhatsAppChatButtonProps {
  phone?: string;
  message?: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
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
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!phone) return null;

  return (
    <>
      <Button
        variant="outline"
        size={iconOnly ? "icon" : "sm"}
        className={cn(
          "h-8 border-emerald-500/35 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300",
          iconOnly ? "w-8 rounded-lg" : "rounded-lg gap-1.5 px-2.5",
          className,
        )}
        onClick={(e) => { e.stopPropagation(); setPickerOpen(true); }}
        aria-label={label}
      >
        <MessageCircle className="h-4 w-4" />
        {!iconOnly && <span>{label}</span>}
      </Button>

      <WhatsAppMessagePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        phone={phone}
        leadName={leadName}
        leadStatus={leadStatus}
        leadSource={leadSource}
      />
    </>
  );
}
