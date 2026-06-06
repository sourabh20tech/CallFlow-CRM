import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { reportsService } from "@/services/reports.service";

export const dynamic = "force-dynamic";

/** Lightweight live counters from dashboard_stats + refresh_dashboard_stats RPC */
export async function GET() {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  // Only admins can see global live stats; agents should not access org-wide data
  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { stats: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const stats = await reportsService.getLiveStats();
    return NextResponse.json(
      { stats },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
