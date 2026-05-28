"use client";

import { Building2, Mail, Phone } from "lucide-react";

interface LeadContactBlockProps {
  company?: string;
  email?: string;
  phone?: string;
  phoneAction?: React.ReactNode;
}

export function LeadContactBlock({ company, email, phone, phoneAction }: LeadContactBlockProps) {
  return (
    <div className="space-y-2 text-sm">
      {company && (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="h-4 w-4 shrink-0" />
          {company}
        </p>
      )}
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
