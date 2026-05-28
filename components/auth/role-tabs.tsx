"use client";

import { Shield, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

interface RoleTabsProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
  /** Disable agent portal (e.g. maintenance mode) */
  agentDisabled?: boolean;
}

const tabs: { role: UserRole; label: string; description: string; icon: typeof Shield }[] = [
  {
    role: "admin",
    label: "Admin",
    description: "Full platform access",
    icon: Shield,
  },
  {
    role: "agent",
    label: "Agent",
    description: "Calls & customers",
    icon: Headphones,
  },
];

export function RoleTabs({ value, onChange, disabled, agentDisabled }: RoleTabsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {tabs.map(({ role, label, description, icon: Icon }) => {
        const active = value === role;
        const isRoleDisabled = disabled || (role === "agent" && agentDisabled);
        return (
          <button
            key={role}
            type="button"
            disabled={isRoleDisabled}
            onClick={() => onChange(role)}
            className={cn(
              "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200",
              "backdrop-blur-sm",
              active
                ? "border-primary/40 bg-primary/10 shadow-[var(--ds-shadow-md)] ring-1 ring-primary/30"
                : "border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/50 hover:border-primary/20 hover:bg-primary/5",
              isRoleDisabled && "pointer-events-none opacity-60",
            )}
          >
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                active
                  ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[var(--ds-shadow-sm)]"
                  : "bg-muted/60 text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
