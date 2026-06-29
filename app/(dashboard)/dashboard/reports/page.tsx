import { ReportsDashboard } from "@/components/reports";
import { reportsService } from "@/services/reports.service";
import { getServerUser } from "@/lib/auth/session.server";

export const metadata = {
  title: "Reports & Analytics",
  description: "Daily, conversion, agent, sales, and performance analytics with Excel export",
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getServerUser();

  // Resolve agentId for non-admin users to ensure correct fund isolation in SSR
  let agentId: string | undefined;
  if (user?.role === "agent") {
    try {
      const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
      const { createClient } = await import("@/lib/supabase/server");
      const client = isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();
      const { data } = await (client as any)
        .from("agents")
        .select("id")
        .eq("profile_id", user.id)
        .is("deleted_at", null)
        .maybeSingle();
      agentId = (data as any)?.id ?? undefined;
    } catch {}
  }

  const data = await reportsService.getReports("this_week", undefined, undefined, undefined, agentId);

  return <ReportsDashboard initialData={data} />;
}
