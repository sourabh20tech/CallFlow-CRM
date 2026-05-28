"use client";

import Link from "next/link";
import {
  CalendarClock,
  Phone,
  UserPlus,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "Add Lead",
    href: "/dashboard/leads",
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
    label: "Schedule Follow-Up",
    href: "/dashboard/follow-ups",
    icon: CalendarClock,
    color: "from-amber-500/20 to-orange-500/10",
  },
  {
    label: "Manage Agents",
    href: "/dashboard/agents",
    icon: Users,
    color: "from-emerald-500/20 to-teal-500/10",
  },
  {
    label: "View Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    color: "from-pink-500/20 to-rose-500/10",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    color: "from-slate-500/20 to-zinc-500/10",
  },
];

export function QuickActions() {
  return (
    <GlassCard variant="gradient" padding="md">
      <h3 className="ds-h3 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/50 ring-1 ring-border/50 transition-transform group-hover:scale-110">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium leading-tight">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </GlassCard>
  );
}
