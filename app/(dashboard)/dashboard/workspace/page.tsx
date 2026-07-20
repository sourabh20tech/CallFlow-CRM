import { AgentPanelDashboard } from "@/components/agent-panel";

export const metadata = {
  title: "My Workspace | Agent Panel",
  description: "Manage your leads, calls, follow-ups, and conversions",
};

export default function AgentWorkspacePage() {
  return <AgentPanelDashboard />;
}
