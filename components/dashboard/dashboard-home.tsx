"use client";

import { Suspense, lazy } from "react";
import { AgentPanelSkeleton } from "@/components/agent-panel/agent-panel-skeleton";
import { useAuth } from "@/hooks/use-auth";

// Lazy-load dashboards — only the relevant one loads based on role
const AdminDashboard = lazy(
  () => import("@/components/dashboard/admin-dashboard").then((m) => ({ default: m.AdminDashboard })),
);
const AgentDashboard = lazy(
  () => import("@/components/dashboard/agent-dashboard").then((m) => ({ default: m.AgentDashboard })),
);

export function DashboardHome() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return <AgentPanelSkeleton />;
  }

  if (role === "agent") {
    return (
      <Suspense fallback={<AgentPanelSkeleton />}>
        <AgentDashboard />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<AgentPanelSkeleton />}>
      <AdminDashboard />
    </Suspense>
  );
}
