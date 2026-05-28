import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { toDbError } from "@/lib/db/errors";
import { followupsService } from "@/services/followups.service";

/** Lightweight poll endpoint for due/overdue follow-up reminders. */
export async function GET() {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  try {
    const all = await followupsService.list({ view: "all" });
    const reminders = followupsService.getReminders(all);
    const total =
      reminders.overdue.length + reminders.dueToday.length + reminders.upcoming.length;

    return NextResponse.json({ ...reminders, total });
  } catch (error) {
    const message = toDbError(error, "Failed to load reminders").message;
    console.error("[api/followups/reminders] GET failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
