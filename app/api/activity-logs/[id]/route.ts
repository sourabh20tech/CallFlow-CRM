import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { activityLogsDbServiceServer } from "@/services/db/activity-logs.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** DELETE /api/activity-logs/[id] — Soft-delete a single activity log */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    await activityLogsDbServiceServer.softDelete(
      id,
      auth.user.id,
      auth.user.role === "admin",
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete";
    const status = message.includes("not found") ? 404 : message.includes("Cannot") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
