"use client";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface CrmToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
  className?: string;
}

export function CrmToggleSwitch({
  checked,
  onCheckedChange,
  disabled,
  label = "CRM system",
  description,
  id = "crm-system-toggle",
  className,
}: CrmToggleSwitchProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))] p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-semibold">
          {label}
        </Label>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "text-xs font-medium uppercase tracking-wide transition-colors",
            checked ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
          )}
        >
          {checked ? "On" : "Off"}
        </span>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-label={`${label} ${checked ? "enabled" : "disabled"}`}
        />
      </div>
    </div>
  );
}
