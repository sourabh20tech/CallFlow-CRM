import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { isReportPeriod } from "@/lib/reports/period";
import { reportsService } from "@/services/reports.service";
import type { ReportDatePreset } from "@/types/reports";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period");
  const period = isReportPeriod(periodParam) ? periodParam : undefined;
  const preset = (searchParams.get("preset") as ReportDatePreset) ?? "7d";
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  try {
    const data = await reportsService.getReports(preset, from, to, period);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load reports";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
