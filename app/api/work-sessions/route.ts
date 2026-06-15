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
    let to: string = now.toISOString();

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

    // Agent isolation
    if (auth.user.role === "agent") {
      query = query.eq("user_id", auth.user.id);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const sessions = (data ?? []) as any[];

    // Calculate totals
    let totalSeconds = 0;
    let loginCount = 0;
    for (const s of sessions) {
      loginCount++;
      if (s.duration_seconds) {
        totalSeconds += s.duration_seconds;
      } else if (s.is_active && s.login_time) {
        // Active session — calculate live duration
        totalSeconds += Math.floor((Date.now() - new Date(s.login_time).getTime()) / 1000);
      }
    }

    // Find active session
    const activeSession = sessions.find((s: any) => s.is_active);

    return NextResponse.json({
      sessions: sessions.slice(0, 50),
      totalSeconds,
      loginCount,
      activeSession: activeSession ? {
        id: activeSession.id,
        loginTime: activeSession.login_time,
        durationSeconds: Math.floor((Date.now() - new Date(activeSession.login_time).getTime()) / 1000),
      } : null,
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

    // Close any existing active sessions for this user
    await (supabase as any)
      .from("work_sessions")
      .update({
        is_active: false,
        logout_time: new Date().toISOString(),
        duration_seconds: 0, // Will be recalculated
      })
      .eq("user_id", auth.user.id)
      .eq("is_active", true);

    // Create new session
    const { data, error } = await (supabase as any)
      .from("work_sessions")
      .insert({
        agent_id: agentId,
        user_id: auth.user.id,
        login_time: new Date().toISOString(),
        is_active: true,
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

/** PATCH /api/work-sessions — End active session (logout) */
export async function PATCH(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const now = new Date();

    // Find active session
    const { data: active } = await (supabase as any)
      .from("work_sessions")
      .select("id, login_time")
      .eq("user_id", auth.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!active) {
      return NextResponse.json({ message: "No active session" });
    }

    const duration = Math.floor((now.getTime() - new Date(active.login_time).getTime()) / 1000);

    await (supabase as any)
      .from("work_sessions")
      .update({
        is_active: false,
        logout_time: now.toISOString(),
        duration_seconds: duration,
      })
      .eq("id", active.id);

    return NextResponse.json({ success: true, duration });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to end session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
