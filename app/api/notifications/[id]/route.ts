import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";

interface RouteParams { params: Promise<{ id: string }> }

async function getDbClient() {
  const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
  const { createClient } = await import("@/lib/supabase/server");
  return isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();
}

/** PATCH /api/notifications/[id] — Mark as read */
export async function PATCH(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const supabase = await getDbClient();

    if (id === "read-all") {
      await (supabase as any)
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("recipient_id", auth.user.id)
        .eq("is_read", false);
      return NextResponse.json({ success: true });
    }

    await (supabase as any)
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("recipient_id", auth.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** DELETE /api/notifications/[id] — Delete notification */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const supabase = await getDbClient();
    await (supabase as any)
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("recipient_id", auth.user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
