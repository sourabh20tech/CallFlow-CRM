import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";

export const dynamic = "force-dynamic";

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes — if heartbeat older, session is stale

/** GET /api/work-sessions — Get sessions for the user (or all for admin) */
export async function GET(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const dateFilter = searchParams.get("date") ?? "today";

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

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

    if (auth.user.role === "agent") {
      query = query.eq("user_id", auth.user.id);
    } else if (searchParams.get("userId")) {
      query = query.eq("user_id", searchParams.get("userId"));
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const sessions = (data ?? []) as any[];

    // Calculate totals from database values only
    let totalSeconds = 0;
    let loginCount = 0;
    for (const s of sessions) {
      loginCount++;
      if (!s.is_active && s.duration_seconds > 0) {
        // Closed session — use stored duration
        totalSeconds += s.duration_seconds;
      } else if (s.is_active) {
        // Active session — use active_seconds from DB (last heartbeat value)
        totalSeconds += Math.max(0, s.active_seconds ?? 0);
      }
    }

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

/**
 * POST /api/work-sessions — Start or resume a session.
 * 
 * Key behavior:
 * - If an active session exists AND its last heartbeat is recent (< 5 min), RESUME it.
 * - If an active session exists but is stale (> 5 min), CLOSE it and create new.
 * - If no active session, create new.
 * 
 * This prevents page refresh from creating duplicate sessions or losing time.
 */
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

    // Check for existing active session
    const { data: existingActive } = await (supabase as any)
      .from("work_sessions")
      .select("id, login_time, active_seconds, last_heartbeat")
      .eq("user_id", auth.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (existingActive) {
      const lastBeat = existingActive.last_heartbeat
        ? new Date(existingActive.last_heartbeat).getTime()
        : new Date(existingActive.login_time).getTime();
      const sinceLastBeat = Date.now() - lastBeat;

      if (sinceLastBeat < STALE_THRESHOLD_MS) {
        // Session is still fresh — RESUME it (don't create new)
        return NextResponse.json({
          session: {
            id: existingActive.id,
            login_time: existingActive.login_time,
            active_seconds: existingActive.active_seconds ?? 0,
            is_active: true,
            resumed: true,
          },
        }, { status: 200 });
      }

      // Session is stale — close it with its tracked active_seconds
      const duration = existingActive.active_seconds > 0
        ? existingActive.active_seconds
        : Math.min(
            Math.floor((Date.now() - new Date(existingActive.login_time).getTime()) / 1000),
            28800,
          );

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

    // Heartbeat — update active_seconds in DB
    if (body.action === "heartbeat" && typeof body.activeSeconds === "number") {
      const newActiveSeconds = Math.max(0, body.activeSeconds);
      // Sanity check: active_seconds should never decrease
      const safeSeconds = Math.max(newActiveSeconds, active.active_seconds ?? 0);
      await (supabase as any)
        .from("work_sessions")
        .update({ active_seconds: safeSeconds, last_heartbeat: now.toISOString() })
        .eq("id", active.id);

      return NextResponse.json({ success: true, activeSeconds: safeSeconds });
    }

    // End session
    const dbActiveSeconds = active.active_seconds ?? 0;
    const clientActiveSeconds = typeof body.activeSeconds === "number"
      ? Math.max(0, body.activeSeconds)
      : 0;

    // Use the HIGHER of client-reported vs DB-stored (prevents data loss)
    const finalSeconds = Math.max(dbActiveSeconds, clientActiveSeconds);

    await (supabase as any)
      .from("work_sessions")
      .update({
        is_active: false,
        logout_time: now.toISOString(),
        duration_seconds: finalSeconds,
        active_seconds: finalSeconds,
      })
      .eq("id", active.id);

    return NextResponse.json({ success: true, duration: finalSeconds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to end session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
