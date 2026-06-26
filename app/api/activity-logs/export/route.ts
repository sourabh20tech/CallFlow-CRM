import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api/require-admin";
import { activityLogsDbServiceServer } from "@/services/db/activity-logs.service";
import type { ActivityLogFilters } from "@/types/activity-log";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "xlsx";

  // Build filters from query params
  const filters: ActivityLogFilters = {};
  if (searchParams.get("userId")) filters.userId = searchParams.get("userId")!;
  if (searchParams.get("from")) filters.from = searchParams.get("from")!;
  if (searchParams.get("to")) filters.to = searchParams.get("to")!;
  if (searchParams.get("actionType")) filters.actionType = searchParams.get("actionType") as any;

  try {
    const result = await activityLogsDbServiceServer.list(filters, { page: 1, pageSize: 2000 });
    const logs = result.data;

    const XLSX = await import("xlsx");
    const rows = logs.map((log) => ({
      "Date & Time": new Date(log.createdAt).toLocaleString(),
      Agent: log.userName,
      Role: log.role,
      Activity: log.actionType.replace(/_/g, " "),
      Description: log.actionDescription,
      Entity: log.entityType ?? "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto column widths
    const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String((r as any)[key] ?? "").length).slice(0, 50)) + 2,
    }));
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Activity Logs");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="activity-logs-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
