import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerUser } from "@/lib/auth/session.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  DEFAULT_MAINTENANCE_TITLE,
} from "@/lib/system/status-defaults";
import { systemSettingsDbServiceServer } from "@/services/db/system-settings.service";
import type { SystemStatus } from "@/types/system";

const updateSchema = z.object({
  crmEnabled: z.boolean(),
  maintenanceTitle: z.string().min(3).max(120).optional(),
  maintenanceMessage: z.string().min(10).max(500).optional(),
});

export async function PATCH(request: Request) {
  const user = await getServerUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!isSupabaseConfigured()) {
    const demoStatus: SystemStatus = {
      crmEnabled: parsed.data.crmEnabled,
      maintenanceTitle: parsed.data.maintenanceTitle ?? DEFAULT_MAINTENANCE_TITLE,
      maintenanceMessage: parsed.data.maintenanceMessage ?? DEFAULT_MAINTENANCE_MESSAGE,
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(demoStatus);
  }

  try {
    const status = await systemSettingsDbServiceServer.setCrmEnabled(parsed.data);
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
