import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/work-sessions/beacon — Handle sendBeacon on page unload/close.
 * Closes the active session using the higher of client vs DB active_seconds.
 */
export async function POST(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  let body: { action?: string; activeSeconds?: number } = {};
  try {
    body = await request.json();
  } catch {
    // Fallback — just end with DB value
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const now = new Date();

    const { data: active } = await (supabase as any)
      .from("work_sessions")
      .select("id, login_time, active_seconds")
      .eq("user_id", auth.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!active) {
      return NextResponse.json({ message: "No active session" });
    }

    const dbSeconds = active.active_seconds ?? 0;
    const clientSeconds = typeof body.activeSeconds === "number"
      ? Math.max(0, body.activeSeconds)
      : 0;

    // Use the HIGHER value — prevents data loss from race conditions
    const finalSeconds = Math.max(dbSeconds, clientSeconds);

    await (supabase as any)
      .from("work_sessions")
      .update({
        is_active: false,
        logout_time: now.toISOString(),
        duration_seconds: finalSeconds,
        active_seconds: finalSeconds,
      })
      .eq("id", active.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to end session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
