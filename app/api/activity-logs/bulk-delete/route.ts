import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api/require-admin";
import { activityLogsDbServiceServer } from "@/services/db/activity-logs.service";

/**
 * POST /api/activity-logs/bulk-delete — Bulk soft-delete activity logs (admin only).
 * Body: { ids?: string[], olderThanDays?: number }
 */
export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ids, olderThanDays } = body as { ids?: string[]; olderThanDays?: number };

  try {
    let deleted = 0;

    if (ids?.length) {
      deleted = await activityLogsDbServiceServer.bulkSoftDelete(ids);
    } else if (olderThanDays && olderThanDays > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - olderThanDays);
      deleted = await activityLogsDbServiceServer.softDeleteOlderThan(cutoff.toISOString());
    } else {
      return NextResponse.json({ error: "Provide ids[] or olderThanDays" }, { status: 400 });
    }

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
