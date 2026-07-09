"use client";

import { memo } from "react";
import { CalendarClock, CheckCircle2, Plus, UserX, Users } from "lucide-react";

interface LeadStatsRowProps {
  total: number;
  newLeads: number;
  followUpDue: number;
  converted: number;
  unassigned: number;
  isAdmin?: boolean;
}

export const LeadStatsRow = memo(function LeadStatsRow({
  total,
  newLeads,
  followUpDue,
  converted,
  unassigned,
  isAdmin = false,
}: LeadStatsRowProps) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${isAdmin ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
      <StatMini icon={Users} label={isAdmin ? "Total Leads" : "My Leads"} value={total} />
      <StatMini icon={Plus} label="New" value={newLeads} color="text-blue-500" />
      <StatMini icon={CalendarClock} label="Follow-Up Due" value={followUpDue} color="text-amber-500" />
      <StatMini icon={CheckCircle2} label="Converted" value={converted} color="text-emerald-500" />
      {isAdmin && (
        <StatMini icon={UserX} label="Unassigned" value={unassigned} color="text-red-500" />
      )}
    </div>
  );
});

function StatMini({
  icon: Icon,
  label,
  value,
  color = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-[hsl(var(--ds-glass-bg))] px-4 py-3">
      <Icon className={`h-4 w-4 shrink-0 ${color}`} />
      <div>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
