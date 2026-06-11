import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { isReportPeriod } from "@/lib/reports/period";
import { reportsService } from "@/services/reports.service";
import type { ReportDatePreset } from "@/types/reports";

export const dynamic = "force-dynamic";

async function resolveAgentId(profileId: string): Promise<string | undefined> {
  const { isSupabaseConfigured } = await import("@/lib/supabase/config");
  if (!isSupabaseConfigured()) return "agent-1";
  const { agentsDbServiceServer } = await import("@/services/db/agents.service");
  const agents = await agentsDbServiceServer.list(true);
  const match = agents.find((a) => a.profileId === profileId);
  return match?.id;
}

export async function GET(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period");
  const period = isReportPeriod(periodParam) ? periodParam : undefined;
  const preset = (searchParams.get("preset") as ReportDatePreset) ?? "7d";
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  // Resolve agent ID for agent-scoped reports
  let agentId: string | undefined;
  if (auth.user.role === "agent") {
    agentId = await resolveAgentId(auth.user.id);
    if (!agentId) {
      return NextResponse.json({ error: "Agent profile not found" }, { status: 403 });
    }
  }

  try {
    const data = await reportsService.getReports(preset, from, to, period, agentId);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load reports";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
