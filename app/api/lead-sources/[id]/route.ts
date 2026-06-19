import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api/require-admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** PATCH /api/lead-sources/[id] — Rename a source (admin only) */
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { label } = body as { label?: string };
  if (!label?.trim()) {
    return NextResponse.json({ error: "Source name is required" }, { status: 400 });
  }

  const newValue = label.trim().toLowerCase().replace(/[\s\-]+/g, "_").replace(/[^a-z0-9_]/g, "");
  if (!newValue) {
    return NextResponse.json({ error: "Invalid source name" }, { status: 400 });
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Get current source
    const { data: current, error: fetchError } = await (supabase as any)
      .from("lead_sources")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const oldValue = current.value;

    // Update the source record
    const { data, error } = await (supabase as any)
      .from("lead_sources")
      .update({ label: label.trim(), value: newValue })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
        return NextResponse.json({ error: `Source "${label}" already exists` }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Update all leads that use the old source value (tier column)
    if (oldValue !== newValue) {
      await (supabase as any)
        .from("leads")
        .update({ tier: newValue })
        .eq("tier", oldValue);
    }

    return NextResponse.json({ id: data.id, label: data.label, value: data.value });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update source";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/lead-sources/[id] — Delete a custom source (admin only) */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Get the source first
    const { data: source, error: fetchError } = await (supabase as any)
      .from("lead_sources")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // System sources cannot be deleted
    if (source.is_system) {
      return NextResponse.json(
        { error: "System sources (Standard, Premium, Enterprise) cannot be deleted" },
        { status: 403 },
      );
    }

    // Delete the source
    const { error } = await (supabase as any)
      .from("lead_sources")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Optionally: set leads using this source to 'standard' fallback
    await (supabase as any)
      .from("leads")
      .update({ tier: "standard" })
      .eq("tier", source.value);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete source";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
