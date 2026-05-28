import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { systemSettingsDbServiceServer } from "@/services/db/system-settings.service";
import { DEFAULT_SYSTEM_STATUS } from "@/lib/system/status-defaults";
import type { SystemStatus } from "@/types/system";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(DEFAULT_SYSTEM_STATUS, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const status = await systemSettingsDbServiceServer.getStatus();
    return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(DEFAULT_SYSTEM_STATUS, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
