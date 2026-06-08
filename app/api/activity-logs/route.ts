import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { activityLogsDbServiceServer } from "@/services/db/activity-logs.service";
import type { ActivityLogFilters } from "@/types/activity-log";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);

  const filters: ActivityLogFilters = {
    role: (searchParams.get("role") as ActivityLogFilters["role"]) ?? undefined,
    actionType: (searchParams.get("actionType") as ActivityLogFilters["actionType"]) ?? undefined,
    entityType: (searchParams.get("entityType") as ActivityLogFilters["entityType"]) ?? undefined,
    entityId: searchParams.get("entityId") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  };

  // Agent isolation: agents can only see their own logs
  if (auth.user.role === "agent") {
    filters.userId = auth.user.id;
  } else if (searchParams.get("userId")) {
    filters.userId = searchParams.get("userId")!;
  }

  // Clean empty filters
  Object.keys(filters).forEach((key) => {
    if (!(filters as Record<string, unknown>)[key]) {
      delete (filters as Record<string, unknown>)[key];
    }
  });

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") ?? "30") || 30));

  try {
    const result = await activityLogsDbServiceServer.list(filters, { page, pageSize });

    return NextResponse.json({
      logs: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load activity logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
