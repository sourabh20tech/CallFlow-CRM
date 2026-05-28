import { NextResponse } from "next/server";
import { checkSupabaseConnection } from "@/lib/supabase/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkSupabaseConnection();

  return NextResponse.json(result, {
    status: result.ok ? 200 : result.configured ? 503 : 503,
  });
}
