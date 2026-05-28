import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/session.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { User } from "@/types/auth";

type AuthResult = { user: User; error?: never } | { user?: never; error: NextResponse };

export async function requireAuthApi(): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      error: NextResponse.json(
        { error: "Supabase is not configured for this environment." },
        { status: 503 },
      ),
    };
  }

  const user = await getServerUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user };
}
