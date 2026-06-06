"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formControl } from "@/lib/design-system/styles";

interface MyLeadsToolbarProps {
  value: string;
  onChange: (value: string) => void;
  totalCount: number;
  filteredCount: number;
  className?: string;
}

export function MyLeadsToolbar({
  value,
  onChange,
  totalCount,
  filteredCount,
  className,
}: MyLeadsToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-3 border-b border-border/40 px-4 py-3 sm:flex-row sm:items-center sm:px-6", className)}>
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search leads by name, company, email, phone, status…"
          className={cn(formControl, "h-10 pl-9")}
        />
      </div>
      <p className="shrink-0 text-xs text-muted-foreground sm:text-sm">
        Showing {filteredCount} of {totalCount}
      </p>
    </div>
  );
}
