import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api/require-admin";
import { activityLogsDbServiceServer } from "@/services/db/activity-logs.service";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";

  try {
    const result = await activityLogsDbServiceServer.list(undefined, { page: 1, pageSize: 500 });
    const logs = result.data;

    if (format === "xlsx") {
      const XLSX = await import("xlsx");
      const rows = logs.map((log) => ({
        "Date & Time": new Date(log.createdAt).toLocaleString(),
        User: log.userName,
        Role: log.role,
        Action: log.actionType.replace(/_/g, " "),
        Description: log.actionDescription,
        Entity: log.entityType ?? "",
        "Entity ID": log.entityId ?? "",
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Activity Logs");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="activity-logs-${Date.now()}.xlsx"`,
        },
      });
    }

    // CSV format
    const csvRows = [
      "Date & Time,User,Role,Action,Description,Entity,Entity ID",
      ...logs.map((log) =>
        [
          new Date(log.createdAt).toLocaleString(),
          `"${log.userName}"`,
          log.role,
          log.actionType.replace(/_/g, " "),
          `"${log.actionDescription.replace(/"/g, '""')}"`,
          log.entityType ?? "",
          log.entityId ?? "",
        ].join(","),
      ),
    ].join("\n");

    return new NextResponse(csvRows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="activity-logs-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
