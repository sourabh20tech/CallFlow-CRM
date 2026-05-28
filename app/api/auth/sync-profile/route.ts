import { NextResponse } from "next/server";
import { z } from "zod";
import { provisionCrmUser } from "@/lib/auth/provision-profile";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  role: z.enum(["admin", "agent"]).optional(),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let preferredRole: "admin" | "agent" | undefined;
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (parsed.success) {
      preferredRole = parsed.data.role;
    }
  } catch {
    // empty body is valid
  }

  const user = await provisionCrmUser(supabase, authUser, { preferredRole });

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Could not create profile. Confirm public.profiles exists and run 005_profiles_ensure_rpc.sql if needed.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    profileEnsured: true,
    user,
  });
}
