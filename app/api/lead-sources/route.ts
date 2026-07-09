import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { requireAdminApi } from "@/lib/api/require-admin";

const DEFAULT_SOURCES = [
  { id: "src-1", label: "Standard", value: "standard", isSystem: true },
  { id: "src-2", label: "Premium", value: "premium", isSystem: true },
];

async function getDbClient() {
  const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
  const { createClient } = await import("@/lib/supabase/server");
  return isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();
}

/** GET /api/lead-sources — List all sources */
export async function GET() {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  try {
    const supabase = await getDbClient();

    const { data, error } = await (supabase as any)
      .from("lead_sources")
      .select("id, label, value, is_system, sort_order")
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      return NextResponse.json({ sources: DEFAULT_SOURCES });
    }

    const sources = (data as any[]).map((r) => ({
      id: r.id,
      label: r.label,
      value: r.value,
      isSystem: r.is_system ?? false,
    }));

    return NextResponse.json({ sources });
  } catch {
    return NextResponse.json({ sources: DEFAULT_SOURCES });
  }
}

/** POST /api/lead-sources — Create a new source (admin only) */
export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

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
  const value = trimmed.toLowerCase().replace(/[\s\-]+/g, "_").replace(/[^a-z0-9_]/g, "");
  if (!value) {
    return NextResponse.json({ error: "Invalid source name" }, { status: 400 });
  }

  try {
    const supabase = await getDbClient();

    // Check duplicate
    const { data: existing } = await (supabase as any)
      .from("lead_sources")
      .select("id")
      .eq("value", value)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: `Source "${trimmed}" already exists` }, { status: 400 });
    }

    // Get next sort order
    const { data: maxRow } = await (supabase as any)
      .from("lead_sources")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = ((maxRow as any)?.sort_order ?? 3) + 1;

    const { data, error } = await (supabase as any)
      .from("lead_sources")
      .insert({
        label: trimmed,
        value,
        sort_order: nextOrder,
        is_system: false,
        created_by: auth.user.id,
      })
      .select("id, label, value")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ id: data.id, label: data.label, value: data.value }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create source";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
