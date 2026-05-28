import { redirect } from "next/navigation";
import { AgentPanelDashboard } from "@/components/agent-panel";
import { AgentWorkspaceError } from "@/components/agent-panel/agent-workspace-error";
import { getServerUser } from "@/lib/auth/session.server";
import { agentPanelService } from "@/services/agent-panel.service";

export const metadata = {
  title: "My Workspace | Agent Panel",
  description: "Manage your leads, calls, follow-ups, and conversions",
};

export default async function AgentWorkspacePage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "admin") {
    redirect("/dashboard");
  }

  try {
    const panel = await agentPanelService.getPanel(user);
    return <AgentPanelDashboard initialData={panel} />;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load agent workspace data";
    return <AgentWorkspaceError message={message} />;
  }
}
