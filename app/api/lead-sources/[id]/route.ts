import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api/require-admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getDbClient() {
  const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
  const { createClient } = await import("@/lib/supabase/server");
  return isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();
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

  const trimmed = label.trim();
  const newValue = trimmed.toLowerCase().replace(/[\s\-]+/g, "_").replace(/[^a-z0-9_]/g, "");
  if (!newValue) {
    return NextResponse.json({ error: "Invalid source name" }, { status: 400 });
  }

  try {
    const supabase = await getDbClient();

    // Get current source
    const { data: current, error: fetchError } = await (supabase as any)
      .from("lead_sources")
      .select("id, label, value, is_system")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const oldValue = current.value;

    // Check for duplicates
    if (newValue !== oldValue) {
      const { data: dup } = await (supabase as any)
        .from("lead_sources")
        .select("id")
        .eq("value", newValue)
        .neq("id", id)
        .maybeSingle();

      if (dup) {
        return NextResponse.json({ error: `Source "${trimmed}" already exists` }, { status: 400 });
      }
    }

    // Update the source record
    const { data, error } = await (supabase as any)
      .from("lead_sources")
      .update({ label: trimmed, value: newValue })
      .eq("id", id)
      .select("id, label, value")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Update all leads that use the old source value
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
    const supabase = await getDbClient();

    // Get the source first
    const { data: source, error: fetchError } = await (supabase as any)
      .from("lead_sources")
      .select("id, label, value, is_system")
      .eq("id", id)
      .maybeSingle();

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

    // Check how many leads use this source
    const { count } = await (supabase as any)
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("tier", source.value)
      .is("deleted_at", null);

    // Delete the source
    const { error } = await (supabase as any)
      .from("lead_sources")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Set leads using this source to 'standard' fallback
    if (count && count > 0) {
      await (supabase as any)
        .from("leads")
        .update({ tier: "standard" })
        .eq("tier", source.value);
    }

    return NextResponse.json({ success: true, affectedLeads: count ?? 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete source";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
