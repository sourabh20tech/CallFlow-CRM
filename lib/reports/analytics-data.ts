import type { ReportDateRange, ReportsBundle } from "@/types/reports";
import { daysInRange } from "@/lib/reports/date-range";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMonthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short" });
}

export function buildReportsBundle(range: ReportDateRange): ReportsBundle {
  const days = daysInRange(range);
  const seed = new Date(range.from).getDate() + days;

  const daily = Array.from({ length: Math.min(days, 31) }, (_, i) => {
    const d = new Date(range.from);
    d.setDate(d.getDate() + i);
    const r = seededRandom(seed + i);
    const calls = Math.round(180 + r * 180);
    const answered = Math.round(calls * (0.88 + r * 0.08));
    return {
      day: days <= 7 ? DAY_NAMES[d.getDay()]! : formatDayLabel(d),
      calls,
      answered,
    };
  });

  const monthCount = Math.min(6, Math.max(3, Math.ceil(days / 30)));
  const leadConversion = Array.from({ length: monthCount }, (_, i) => {
    const d = new Date(range.to);
    d.setMonth(d.getMonth() - (monthCount - 1 - i));
    const r = seededRandom(seed + i * 7);
    const leads = Math.round(160 + r * 100);
    const converted = Math.round(leads * (0.22 + r * 0.12));
    return { month: formatMonthLabel(d), leads, converted };
  });

  const agentPerformance = [
    { name: "Alex Morgan", calls: 142, conversions: 38 },
    { name: "Jordan Lee", calls: 98, conversions: 24 },
    { name: "Taylor Brooks", calls: 167, conversions: 45 },
    { name: "Casey Rivera", calls: 76, conversions: 18 },
    { name: "Riley Chen", calls: 112, conversions: 31 },
  ].map((a, i) => {
    const scale = 0.85 + seededRandom(seed + i) * 0.3;
    return {
      name: a.name,
      calls: Math.round(a.calls * scale),
      conversions: Math.round(a.conversions * scale),
    };
  });

  const performance = daily.slice(0, Math.min(daily.length, 14)).map((d, i) => {
    const r = seededRandom(seed + i * 3);
    return {
      period: d.day,
      handleTime: Math.round(240 + r * 120),
      resolutionRate: Number((88 + r * 8).toFixed(1)),
      firstCallResolution: Number((72 + r * 15).toFixed(1)),
    };
  });

  const totalCalls = daily.reduce((s, d) => s + d.calls, 0);
  const totalAnswered = daily.reduce((s, d) => s + d.answered, 0);
  const totalLeads = leadConversion.reduce((s, m) => s + m.leads, 0);
  const totalConverted = leadConversion.reduce((s, m) => s + m.converted, 0);
  const totalFund = 0;

  const followups = {
    total: Math.round(24 + seededRandom(seed) * 40),
    pending: Math.round(8 + seededRandom(seed + 1) * 12),
    inProgress: Math.round(4 + seededRandom(seed + 2) * 8),
    completed: Math.round(10 + seededRandom(seed + 3) * 20),
    overdue: Math.round(2 + seededRandom(seed + 4) * 6),
    byStatus: [
      { status: "pending", count: Math.round(8 + seededRandom(seed) * 10) },
      { status: "in_progress", count: Math.round(4 + seededRandom(seed + 1) * 6) },
      { status: "completed", count: Math.round(12 + seededRandom(seed + 2) * 15) },
      { status: "cancelled", count: Math.round(1 + seededRandom(seed + 3) * 3) },
    ],
  };

  return {
    range,
    kpis: {
      totalCalls,
      answeredRate: totalCalls ? Math.round((totalAnswered / totalCalls) * 1000) / 10 : 0,
      conversionRate: totalLeads
        ? Math.round((totalConverted / totalLeads) * 1000) / 10
        : 0,
      totalFund,
      fundChange: 0,
      avgHandleTime: Math.round(
        performance.reduce((s, p) => s + p.handleTime, 0) / (performance.length || 1),
      ),
      activeAgents: agentPerformance.length,
      pendingFollowups: followups.pending + followups.inProgress,
      totalLeads,
      convertedLeads: totalConverted,
    },
    daily,
    leadConversion,
    agentPerformance,
    performance,
    followups,
    generatedAt: new Date().toISOString(),
    source: "demo",
  };
}
