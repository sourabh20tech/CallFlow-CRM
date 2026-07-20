"use client";

import { useAuth } from "@/hooks/use-auth";
import { AdminDashboardOverview } from "@/components/dashboard/admin/admin-dashboard-overview";
import { AgentDashboard } from "@/components/dashboard/agent-dashboard";

export function DashboardHome() {
  const { role } = useAuth();

  if (role === "agent") {
    return <AgentDashboard />;
  }

  return <AdminDashboardOverview />;
}
