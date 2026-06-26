import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";

interface RouteParams { params: Promise<{ id: string }> }

async function getDbClient() {
  const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
  const { createClient } = await import("@/lib/supabase/server");
  return isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();
}

/** PATCH — Update a message */
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, content } = body as { name?: string; content?: string };
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name?.trim()) patch.name = name.trim();
  if (content?.trim()) patch.content = content.trim();

  try {
    const supabase = await getDbClient();
    // Ownership check for agents
    if (auth.user.role === "agent") {
      const { data: existing } = await (supabase as any)
        .from("agent_whatsapp_messages").select("user_id").eq("id", id).single();
      if (existing?.user_id !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { data, error } = await (supabase as any)
      .from("agent_whatsapp_messages")
      .update(patch).eq("id", id)
      .select("id, name, content, created_at, updated_at").single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE — Delete a message */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const supabase = await getDbClient();
    if (auth.user.role === "agent") {
      const { data: existing } = await (supabase as any)
        .from("agent_whatsapp_messages").select("user_id").eq("id", id).single();
      if (existing?.user_id !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await (supabase as any).from("agent_whatsapp_messages").delete().eq("id", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
