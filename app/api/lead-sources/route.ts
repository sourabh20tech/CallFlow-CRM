import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { requireAdminApi } from "@/lib/api/require-admin";

// In-memory fallback when DB table doesn't exist
const DEFAULT_SOURCES = [
  { id: "src-1", label: "Standard", value: "standard" },
  { id: "src-2", label: "Premium", value: "premium" },
  { id: "src-3", label: "Enterprise", value: "enterprise" },
];

/** GET /api/lead-sources — List all sources */
export async function GET() {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("lead_sources")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      return NextResponse.json({ sources: DEFAULT_SOURCES }, {
        headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" },
      });
    }

    const sources = (data as any[]).map((r) => ({
      id: r.id,
      label: r.label,
      value: r.value,
    }));

    return NextResponse.json({ sources }, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" },
    });
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

  const value = label.trim().toLowerCase().replace(/[\s\-]+/g, "_").replace(/[^a-z0-9_]/g, "");
  if (!value) {
    return NextResponse.json({ error: "Invalid source name" }, { status: 400 });
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

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
        label: label.trim(),
        value,
        sort_order: nextOrder,
        is_system: false,
        created_by: auth.user.id,
      })
      .select("*")
      .single();

    if (error) {
      if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
        return NextResponse.json({ error: `Source "${label}" already exists` }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ id: data.id, label: data.label, value: data.value }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create source";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
