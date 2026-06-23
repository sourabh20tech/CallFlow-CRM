import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";

export const dynamic = "force-dynamic";

const DEFAULT_TEMPLATE = "Hello {name},\nThank you for your interest.\nRegards, {agent_name}";

/** GET /api/agent/whatsapp-template — Get agent's WhatsApp template */
export async function GET(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  // Admin can view any agent's template by passing userId
  const targetUserId = auth.user.role === "admin" && searchParams.get("userId")
    ? searchParams.get("userId")!
    : auth.user.id;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data } = await (supabase as any)
      .from("agent_whatsapp_templates")
      .select("id, template, updated_at")
      .eq("user_id", targetUserId)
      .maybeSingle();

    return NextResponse.json({
      template: data?.template ?? DEFAULT_TEMPLATE,
      isDefault: !data,
      updatedAt: data?.updated_at ?? null,
    });
  } catch {
    // Table might not exist — return default
    return NextResponse.json({ template: DEFAULT_TEMPLATE, isDefault: true, updatedAt: null });
  }
}

/** PUT /api/agent/whatsapp-template — Save agent's WhatsApp template */
export async function PUT(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { template, userId } = body as { template?: string; userId?: string };
  if (!template?.trim()) {
    return NextResponse.json({ error: "Template is required" }, { status: 400 });
  }

  // Admin can edit any agent's template, agent can only edit own
  const targetUserId = auth.user.role === "admin" && userId ? userId : auth.user.id;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Upsert — create or update
    const { data, error } = await (supabase as any)
      .from("agent_whatsapp_templates")
      .upsert(
        { user_id: targetUserId, template: template.trim(), updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      )
      .select("id, template, updated_at")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ template: data.template, updatedAt: data.updated_at });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/agent/whatsapp-template — Reset to default */
export async function DELETE(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const targetUserId = auth.user.id;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    await (supabase as any)
      .from("agent_whatsapp_templates")
      .delete()
      .eq("user_id", targetUserId);

    return NextResponse.json({ template: DEFAULT_TEMPLATE, isDefault: true });
  } catch {
    return NextResponse.json({ template: DEFAULT_TEMPLATE, isDefault: true });
  }
}
