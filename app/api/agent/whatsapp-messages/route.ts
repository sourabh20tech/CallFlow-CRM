import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";

export const dynamic = "force-dynamic";

async function getDbClient() {
  const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
  const { createClient } = await import("@/lib/supabase/server");
  return isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();
}

/** GET — List agent's WhatsApp messages */
export async function GET(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const targetUserId = auth.user.role === "admin" && searchParams.get("userId")
    ? searchParams.get("userId")!
    : auth.user.id;

  try {
    const supabase = await getDbClient();
    const { data, error } = await (supabase as any)
      .from("agent_whatsapp_messages")
      .select("id, name, content, created_at, updated_at")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return NextResponse.json({ messages: data ?? [] });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

/** POST — Create a new message */
export async function POST(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, content } = body as { name?: string; content?: string };
  if (!name?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Name and content are required" }, { status: 400 });
  }

  try {
    const supabase = await getDbClient();
    const { data, error } = await (supabase as any)
      .from("agent_whatsapp_messages")
      .insert({
        user_id: auth.user.id,
        name: name.trim(),
        content: content.trim(),
      })
      .select("id, name, content, created_at, updated_at")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
