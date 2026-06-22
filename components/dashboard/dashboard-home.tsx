"use client";

import dynamic from "next/dynamic";
import { AgentPanelSkeleton } from "@/components/agent-panel/agent-panel-skeleton";
import { useAuth } from "@/hooks/use-auth";

// Lazy-load dashboards — only the relevant one loads based on role
const AdminDashboard = dynamic(
  () => import("@/components/dashboard/admin-dashboard").then((m) => m.AdminDashboard),
  { ssr: false, loading: () => <AgentPanelSkeleton /> },
);
const AgentDashboard = dynamic(
  () => import("@/components/dashboard/agent-dashboard").then((m) => m.AgentDashboard),
  { ssr: false, loading: () => <AgentPanelSkeleton /> },
);

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
