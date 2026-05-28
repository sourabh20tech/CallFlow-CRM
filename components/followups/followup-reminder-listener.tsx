"use client";

import { useFollowupReminderToasts } from "@/hooks/use-followup-reminder-toasts";

/** Mount inside authenticated dashboard shell to poll follow-up reminders. */
export function FollowupReminderListener() {
  useFollowupReminderToasts(true);
  return null;
}
