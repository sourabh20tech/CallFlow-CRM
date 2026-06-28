"use client";

import { useCallback, useEffect, useState } from "react";
import { IndianRupee, RefreshCw, TrendingUp, Trophy } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { StatCard } from "@/components/design-system/stat-card";

interface FundEntry {
  id: string;
  lead_id: string;
  amount: number;
  payment_type: string;
  notes: string | null;
  created_at: string;
}

interface AgentFundOverviewProps {
  agentProfileId: string;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function AgentFundOverview({ agentProfileId }: AgentFundOverviewProps) {
  const [funds, setFunds] = useState<FundEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/agent/fund-summary?profileId=${agentProfileId}`);
      if (!res.ok) return;
      const data = await res.json();
      setFunds(data.funds ?? []);
    } catch {} finally {
      setIsLoading(false);
    }
  }, [agentProfileId]);

  useEffect(() => { void load(); }, [load]);

  const totalFund = funds.reduce((s, f) => s + Number(f.amount), 0);
  const now = new Date();
  const todayStr = now.toDateString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayFund = funds
    .filter((f) => new Date(f.created_at).toDateString() === todayStr)
    .reduce((s, f) => s + Number(f.amount), 0);
  const monthFund = funds
    .filter((f) => new Date(f.created_at) >= monthStart)
    .reduce((s, f) => s + Number(f.amount), 0);
  const conversions = funds.length;
  const avgPerConversion = conversions > 0 ? Math.round(totalFund / conversions) : 0;

  if (isLoading) {
    return (
      <GlassCard variant="default" padding="md">
        <div className="flex items-center gap-2 py-4">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading fund data...</span>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-[var(--ds-stack-gap)]">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Fund" value={formatCurrency(totalFund)} icon={IndianRupee} description="Lifetime" />
        <StatCard title="This Month" value={formatCurrency(monthFund)} icon={TrendingUp} description={`Today: ${formatCurrency(todayFund)}`} />
        <StatCard title="Conversions" value={conversions} icon={Trophy} description={`Avg: ${formatCurrency(avgPerConversion)}`} />
        <StatCard title="Avg per Deal" value={formatCurrency(avgPerConversion)} icon={IndianRupee} description="Per conversion" />
      </div>

      {funds.length > 0 && (
        <GlassCard variant="default" padding="md">
          <h3 className="mb-3 text-sm font-semibold">Fund History</h3>
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {funds.slice(0, 20).map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2 text-xs">
                <div>
                  <span className="font-semibold tabular-nums">{formatCurrency(Number(f.amount))}</span>
                  <span className="ml-2 capitalize text-muted-foreground">{f.payment_type.replace("_", " ")}</span>
                  {f.notes && <p className="mt-0.5 text-muted-foreground">{f.notes}</p>}
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(f.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
