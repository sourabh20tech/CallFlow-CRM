"use client";

import Link from "next/link";
import { CalendarClock, LayoutDashboard, Phone, UserPlus } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "My Leads",
    href: "/dashboard/workspace#leads",
    icon: UserPlus,
    color: "from-violet-500/20 to-indigo-500/10",
  },
  {
    label: "Log Call",
    href: "/dashboard/calls",
    icon: Phone,
    color: "from-blue-500/20 to-cyan-500/10",
  },
  {
    label: "Follow-Ups",
    href: "/dashboard/workspace#followups",
    icon: CalendarClock,
    color: "from-amber-500/20 to-orange-500/10",
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "from-emerald-500/20 to-teal-500/10",
  },
];

export function AgentPanelQuickActions() {
  return (
    <GlassCard variant="gradient" padding="md" className="h-fit lg:sticky lg:top-24">
      <h3 className="ds-h3 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-xl border border-border/40 p-3 text-center",
                "bg-gradient-to-br transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--ds-shadow-md)]",
                action.color,
              )}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/50 ring-1 ring-border/50 transition-transform group-hover:scale-110">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium leading-tight">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </GlassCard>
  );
}
