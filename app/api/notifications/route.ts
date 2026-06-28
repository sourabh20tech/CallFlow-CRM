import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { requireAdminApi } from "@/lib/api/require-admin";

export const dynamic = "force-dynamic";

async function getDbClient() {
  const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
  const { createClient } = await import("@/lib/supabase/server");
  return isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();
}

/** GET /api/notifications — Get notifications for current user */
export async function GET(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";

  try {
    const supabase = await getDbClient();

    let query = (supabase as any)
      .from("notifications")
      .select("id, title, message, priority, is_read, created_at")
      .eq("recipient_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Get unread count
    const { count } = await (supabase as any)
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", auth.user.id)
      .eq("is_read", false);

    return NextResponse.json({ notifications: data ?? [], unreadCount: count ?? 0 });
  } catch (error) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

/** POST /api/notifications — Send announcement (admin only) */
export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, message, priority, recipientIds } = body as {
    title?: string;
    message?: string;
    priority?: string;
    recipientIds?: string[]; // profile_ids; empty = all agents
  };

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }

  try {
    const supabase = await getDbClient();

    // Resolve recipients
    let targetIds: string[] = [];
    if (recipientIds?.length) {
      targetIds = recipientIds;
    } else {
      // Send to all active agents
      const { data: agents } = await (supabase as any)
        .from("agents")
        .select("profile_id")
        .eq("is_active", true)
        .is("deleted_at", null);
      targetIds = ((agents ?? []) as { profile_id: string }[])
        .map((a) => a.profile_id)
        .filter(Boolean);
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    // Create notification for each recipient
    const rows = targetIds.map((recipientId) => ({
      recipient_id: recipientId,
      sender_id: auth.user.id,
      title: title.trim(),
      message: message.trim(),
      priority: priority ?? "medium",
      is_read: false,
    }));

    const { error } = await (supabase as any)
      .from("notifications")
      .insert(rows);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, sent: targetIds.length }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to send";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
