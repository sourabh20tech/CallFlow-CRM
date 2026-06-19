import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";

export const dynamic = "force-dynamic";

/** GET /api/work-sessions — Get sessions for the user (or all for admin) */
export async function GET(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const dateFilter = searchParams.get("date") ?? "today";

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Date range
    const now = new Date();
    let from: string;
    const to: string = now.toISOString();

    if (dateFilter === "today") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (dateFilter === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      from = new Date(now.getFullYear(), now.getMonth(), diff).toISOString();
    } else if (dateFilter === "month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    }

    let query = (supabase as any)
      .from("work_sessions")
      .select("*")
      .gte("login_time", from)
      .lte("login_time", to)
      .order("login_time", { ascending: false });

    // Agent isolation OR admin viewing specific agent
    if (auth.user.role === "agent") {
      query = query.eq("user_id", auth.user.id);
    } else if (searchParams.get("userId")) {
      query = query.eq("user_id", searchParams.get("userId"));
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const sessions = (data ?? []) as any[];

    // Calculate totals — use only stored duration_seconds for closed sessions
    let totalSeconds = 0;
    let loginCount = 0;
    for (const s of sessions) {
      loginCount++;
      if (s.duration_seconds && s.duration_seconds > 0) {
        totalSeconds += s.duration_seconds;
      } else if (s.is_active && s.login_time) {
        // Active session — use active_seconds (tracked time) if available,
        // otherwise calculate from login_time as fallback
        if (s.active_seconds && s.active_seconds > 0) {
          totalSeconds += s.active_seconds;
        } else {
          const elapsed = Math.floor((Date.now() - new Date(s.login_time).getTime()) / 1000);
          totalSeconds += Math.max(0, elapsed);
        }
      }
    }

    // Find active session
    const activeSession = sessions.find((s: any) => s.is_active);

    return NextResponse.json({
      sessions: sessions.slice(0, 50),
      totalSeconds,
      loginCount,
      activeSession: activeSession
        ? {
            id: activeSession.id,
            loginTime: activeSession.login_time,
            activeSeconds: activeSession.active_seconds ?? 0,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load sessions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/work-sessions — Start a new session (login) */
export async function POST(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Resolve agent ID
    let agentId = "unknown";
    try {
      const { agentsDbServiceServer } = await import("@/services/db/agents.service");
      const agents = await agentsDbServiceServer.list(true);
      const match = agents.find((a) => a.profileId === auth.user.id);
      if (match) agentId = match.id;
    } catch {}

    // Check if there's already an active session
    const { data: existingActive } = await (supabase as any)
      .from("work_sessions")
      .select("id, login_time, active_seconds")
      .eq("user_id", auth.user.id)
      .eq("is_active", true)
      .maybeSingle();

    // If active session exists, close it properly with calculated duration
    if (existingActive) {
      const loginTime = new Date(existingActive.login_time).getTime();
      const elapsed = Math.floor((Date.now() - loginTime) / 1000);
      // Use active_seconds if tracked, otherwise cap at elapsed time
      const duration = existingActive.active_seconds && existingActive.active_seconds > 0
        ? existingActive.active_seconds
        : Math.min(elapsed, 28800); // Cap at 8 hours max for stale sessions

      await (supabase as any)
        .from("work_sessions")
        .update({
          is_active: false,
          logout_time: new Date().toISOString(),
          duration_seconds: Math.max(0, duration),
        })
        .eq("id", existingActive.id);
    }

    // Create new session
    const { data, error } = await (supabase as any)
      .from("work_sessions")
      .insert({
        agent_id: agentId,
        user_id: auth.user.id,
        login_time: new Date().toISOString(),
        is_active: true,
        active_seconds: 0,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ session: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH /api/work-sessions — End active session or update heartbeat */
export async function PATCH(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  let body: { action?: string; activeSeconds?: number } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is OK for simple end-session
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

    // Heartbeat — just update active_seconds
    if (body.action === "heartbeat" && typeof body.activeSeconds === "number") {
      const newActiveSeconds = Math.max(0, body.activeSeconds);
      await (supabase as any)
        .from("work_sessions")
        .update({ active_seconds: newActiveSeconds, last_heartbeat: now.toISOString() })
        .eq("id", active.id);

      return NextResponse.json({ success: true, activeSeconds: newActiveSeconds });
    }

    // End session — use tracked active_seconds as the duration
    const activeSeconds = active.active_seconds ?? 0;
    // If client sends final activeSeconds, prefer that
    const finalActiveSeconds = typeof body.activeSeconds === "number"
      ? Math.max(0, body.activeSeconds)
      : activeSeconds;

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

    return NextResponse.json({ success: true, duration });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to end session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
