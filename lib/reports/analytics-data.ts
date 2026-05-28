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
    { name: "Alex Morgan", calls: 142, conversions: 38, satisfaction: 4.8 },
    { name: "Jordan Lee", calls: 98, conversions: 24, satisfaction: 4.6 },
    { name: "Taylor Brooks", calls: 167, conversions: 45, satisfaction: 4.9 },
    { name: "Casey Rivera", calls: 76, conversions: 18, satisfaction: 4.4 },
    { name: "Riley Chen", calls: 112, conversions: 31, satisfaction: 4.7 },
  ].map((a, i) => {
    const scale = 0.85 + seededRandom(seed + i) * 0.3;
    return {
      name: a.name,
      calls: Math.round(a.calls * scale),
      conversions: Math.round(a.conversions * scale),
      satisfaction: Number((a.satisfaction * (0.95 + seededRandom(seed + i + 1) * 0.1)).toFixed(1)),
    };
  });

  const sales = leadConversion.map((m, i) => {
    const r = seededRandom(seed + i * 11);
    const deals = m.converted;
    const avgDealSize = Math.round(1200 + r * 2800);
    return {
      period: m.month,
      revenue: deals * avgDealSize,
      deals,
      pipeline: Math.round(m.leads * avgDealSize * (1.2 + r * 0.5)),
      avgDealSize,
    };
  });

  const performance = daily.slice(0, Math.min(daily.length, 14)).map((d, i) => {
    const r = seededRandom(seed + i * 3);
    return {
      period: d.day,
      satisfaction: Number((4.2 + r * 0.7).toFixed(1)),
      handleTime: Math.round(240 + r * 120),
      resolutionRate: Number((88 + r * 8).toFixed(1)),
      firstCallResolution: Number((72 + r * 15).toFixed(1)),
    };
  });

  const hourlyVolume = [
    "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm",
  ].map((hour, i) => {
    const r = seededRandom(seed + i * 5);
    return {
      hour,
      inbound: Math.round(20 + r * 45),
      outbound: Math.round(10 + r * 30),
    };
  });

  const totalCalls = daily.reduce((s, d) => s + d.calls, 0);
  const totalAnswered = daily.reduce((s, d) => s + d.answered, 0);
  const totalLeads = leadConversion.reduce((s, m) => s + m.leads, 0);
  const totalConverted = leadConversion.reduce((s, m) => s + m.converted, 0);
  const totalRevenue = sales.reduce((s, m) => s + m.revenue, 0);

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
      totalRevenue,
      revenueChange: Number((8 + seededRandom(seed) * 12).toFixed(1)),
      avgHandleTime: Math.round(
        performance.reduce((s, p) => s + p.handleTime, 0) / (performance.length || 1),
      ),
      avgSatisfaction: Number(
        (
          agentPerformance.reduce((s, a) => s + a.satisfaction, 0) /
          (agentPerformance.length || 1)
        ).toFixed(1),
      ),
      activeAgents: agentPerformance.length,
      pendingFollowups: followups.pending + followups.inProgress,
      totalLeads,
      convertedLeads: totalConverted,
    },
    daily,
    leadConversion,
    agentPerformance,
    sales,
    performance,
    hourlyVolume,
    followups,
    generatedAt: new Date().toISOString(),
    source: "demo",
  };
}
