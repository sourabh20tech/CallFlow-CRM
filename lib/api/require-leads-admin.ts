import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api/require-admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { User } from "@/types/auth";

type LeadsAdminResult =
  | { user: User; error?: never }
  | { user?: never; error: NextResponse };

/** Admin-only lead mutations. */
export async function requireLeadsAdminApi(): Promise<LeadsAdminResult> {
  if (!isSupabaseConfigured()) {
    return {
      error: NextResponse.json(
        { error: "Supabase is not configured for this environment." },
        { status: 503 },
      ),
    };
  }
  return requireAdminApi();
}
