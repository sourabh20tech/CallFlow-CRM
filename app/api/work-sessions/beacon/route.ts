import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/work-sessions/beacon — Handle sendBeacon calls on page unload.
 * Ends the active session with the final active_seconds value.
 */
export async function POST(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  let body: { action?: string; activeSeconds?: number } = {};
  try {
    body = await request.json();
  } catch {
    // Fallback — just end the session
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const now = new Date();

    // Find active session
    const { data: active } = await (supabase as any)
      .from("work_sessions")
      .select("id, login_time, active_seconds")
      .eq("user_id", auth.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!active) {
      return NextResponse.json({ message: "No active session" });
    }

    // Use the client-reported activeSeconds or fall back to stored value
    const finalActiveSeconds = typeof body.activeSeconds === "number"
      ? Math.max(0, body.activeSeconds)
      : (active.active_seconds ?? 0);

    // Fallback: if no active_seconds tracked, calculate from login time
    const elapsed = Math.floor((now.getTime() - new Date(active.login_time).getTime()) / 1000);
    const duration = finalActiveSeconds > 0 ? finalActiveSeconds : Math.max(0, elapsed);

    await (supabase as any)
      .from("work_sessions")
      .update({
        is_active: false,
        logout_time: now.toISOString(),
        duration_seconds: duration,
        active_seconds: finalActiveSeconds,
      })
      .eq("id", active.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to end session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
