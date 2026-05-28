"use client";

import { Phone, PhoneCall, PhoneMissed, Sparkles } from "lucide-react";
import { StatCard } from "@/components/design-system/stat-card";

interface CallStatsCardsProps {
  stats: {
    total: number;
    connected: number;
    callback: number;
    interested: number;
    noAnswer: number;
  };
}

export function CallStatsCards({ stats }: CallStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total calls" value={stats.total} icon={Phone} description="In current view" />
      <StatCard
        title="Connected"
        value={stats.connected}
        icon={PhoneCall}
        description="Successful conversations"
      />
      <StatCard
        title="Callbacks"
        value={stats.callback}
        icon={PhoneMissed}
        description="Follow-up required"
      />
      <StatCard
        title="Interested"
        value={stats.interested}
        icon={Sparkles}
        description="Positive outcomes"
      />
    </div>
  );
}
