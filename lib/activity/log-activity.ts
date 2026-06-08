import { activityLogsDbServiceServer } from "@/services/db/activity-logs.service";
import type { LogActivityInput } from "@/types/activity-log";

/**
 * Fire-and-forget activity logger. Never throws — failures are silent.
 * Use this in API route handlers after successful operations.
 */
export function logActivity(input: LogActivityInput): void {
  activityLogsDbServiceServer.log(input).catch((err) => {
    if (process.env.NODE_ENV === "development") {
      console.warn("[activity-log] Failed to log:", err);
    }
  });
}
