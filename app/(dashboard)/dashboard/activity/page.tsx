import { ActivityLogsPage } from "@/components/activity-logs";
import { getServerUser } from "@/lib/auth/session.server";

export const metadata = {
  title: "Activity Logs",
  description: "Track all CRM actions and user activities",
};

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  // Pre-resolve user for faster client auth context
  await getServerUser();
  return <ActivityLogsPage />;
}
