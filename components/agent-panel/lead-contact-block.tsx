"use client";

import { Mail, Phone } from "lucide-react";

interface LeadContactBlockProps {
  email?: string;
  phone?: string;
  phoneAction?: React.ReactNode;
}

export function LeadContactBlock({ email, phone, phoneAction }: LeadContactBlockProps) {
  return (
    <div className="space-y-2 text-sm">
      {email && (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0" />
          {email}
        </p>
      )}
      {phone && (
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0" />
            {phone}
          </p>
          {phoneAction}
        </div>
      )}
    </div>
  );
}
