"use client";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { AgentDashboard } from "@/components/dashboard/agent-dashboard";
import { AgentPanelSkeleton } from "@/components/agent-panel/agent-panel-skeleton";
import { useAuth } from "@/hooks/use-auth";

export function DashboardHome() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return <AgentPanelSkeleton />;
  }

  if (role === "agent") {
    return <AgentDashboard />;
  }

  return <AdminDashboard />;
}
