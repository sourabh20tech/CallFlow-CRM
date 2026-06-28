import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";

export const dynamic = "force-dynamic";

async function getDbClient() {
  const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
  const { createClient } = await import("@/lib/supabase/server");
  return isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();
}

/** GET /api/agent/fund-summary — Get fund records for a specific agent by profile_id */
export async function GET(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);

  // Admin can view any agent's fund; agent can only view their own
  const profileId = auth.user.role === "admin" && searchParams.get("profileId")
    ? searchParams.get("profileId")!
    : auth.user.id;

  try {
    const supabase = await getDbClient();

    // Fund records where agent_id = profileId (the user who created the fund)
    const { data, error } = await (supabase as any)
      .from("lead_funds")
      .select("id, lead_id, amount, payment_type, notes, created_at")
      .eq("agent_id", profileId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ funds: data ?? [] });
  } catch {
    return NextResponse.json({ funds: [] });
  }
}
