import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthApi } from "@/lib/api/require-auth";
import { requireAdminApi } from "@/lib/api/require-admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { systemSettingsDbServiceServer } from "@/services/db/system-settings.service";
import type { AdminAnnouncement } from "@/types/system";

const announcementSchema = z.object({
  title: z.string().max(120).optional().default(""),
  message: z.string().max(500).optional().default(""),
});

const EMPTY_ANNOUNCEMENT: AdminAnnouncement = {
  title: "",
  message: "",
  updatedAt: null,
};

export async function GET() {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(EMPTY_ANNOUNCEMENT, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const announcement = await systemSettingsDbServiceServer.getAnnouncement();
    return NextResponse.json(announcement, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(EMPTY_ANNOUNCEMENT, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      title: parsed.data.title.trim(),
      message: parsed.data.message.trim(),
      updatedAt: new Date().toISOString(),
    } satisfies AdminAnnouncement);
  }

  try {
    const updated = await systemSettingsDbServiceServer.setAnnouncement({
      title: parsed.data.title.trim(),
      message: parsed.data.message.trim(),
    });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update announcement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
