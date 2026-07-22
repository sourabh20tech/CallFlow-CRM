import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Lightweight dashboard stats endpoint.
 * Returns ONLY KPI numbers from dashboard_stats cache or refresh_dashboard_stats RPC.
 * Much faster than /api/dashboard/admin which fetches all chart data.
 */
export async function GET() {
  if (isSupabaseConfigured()) {
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = await createClient();

    // Try RPC first (refreshes and returns latest)
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "refresh_dashboard_stats",
      { p_stat_date: new Date().toISOString().slice(0, 10) },
    );

    if (!rpcError && rpcResult) {
      const row = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
      if (row) {
        return NextResponse.json({
          totalLeads: row.total_leads ?? 0,
          convertedLeads: row.converted_leads ?? 0,
          pendingFollowUps: row.pending_followups ?? 0,
          totalCalls: row.total_calls ?? 0,
          activeAgents: row.active_agents ?? 0,
          conversionRate: Number(row.conversion_rate ?? 0),
        }, {
          headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" },
        });
      }
    }

    // Fallback: read from dashboard_stats table
    const { data: cached } = await supabase
      .from("dashboard_stats")
      .select("total_leads, converted_leads, pending_followups, total_calls, active_agents, conversion_rate")
      .eq("scope", "global")
      .is("agent_id", null)
      .order("stat_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      return NextResponse.json({
        totalLeads: cached.total_leads ?? 0,
        convertedLeads: cached.converted_leads ?? 0,
        pendingFollowUps: cached.pending_followups ?? 0,
        totalCalls: cached.total_calls ?? 0,
        activeAgents: cached.active_agents ?? 0,
        conversionRate: Number(cached.conversion_rate ?? 0),
      }, {
        headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" },
      });
    }

    return NextResponse.json({
      totalLeads: 0, convertedLeads: 0, pendingFollowUps: 0,
      totalCalls: 0, activeAgents: 0, conversionRate: 0,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
